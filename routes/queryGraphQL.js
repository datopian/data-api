const { request, gql } = require('graphql-request')
const { app } = require('../app')

async function queryForData(schema, params) {

  // parameters parsing -> order_by, distinct
  //distinct supports either a boolean value (default false) or a list of fields to compare
  let queryParams = JSON.parse(JSON.stringify(params))
  if (params.distinct_on){
    if (typeof(params.distinct_on) === "boolean"){
      // get all the fields from the schema  
      queryParams.distinct_on = schema.fields.map((f) => `${f.name}`)
    }
    else if (Array.isArray(params.distinct_on)){
      queryParams.distinct_on = params.distinct_on
    }
    //else there is no value and should be no variable there
  }

  // list of all variables that we can filter on directly
  let variables = {
    limit: params.limit,
    offset: params.offset,
  }

  if (params.q) {
    const qp = JSON.parse(params.q)
    for (const k of Object.keys(qp)) {
      variables[`cond_${k}`] = qp[k]
    }
  }
  console.log("Variables = "+ JSON.stringify(variables))
  const query = buildParametrableQuery(schema, queryParams)
  return request(process.env.HASURA_URL + '/v1/graphql', query, variables).then(resp => resp[params.resource_id])
}

/**
 *
 * @param {*} schema table schema in frictionless format
 * @param {*} params query parameters, e.g. resource_id, fields, limit
 * @returns String GraphQL query with optional params for fields being equal
 */
function buildParametrableQuery(schema, params) {
  // $text_column: String
  let variablesDeclaration = schema.fields
    // .map((f) => `$${f.name}: ${f.type}`)
    .map((f) => `$cond_${f.name}: ${f.type.name}`)
  
  variablesDeclaration = variablesDeclaration.concat([ 
    // "$limit: Int!",
    "$offset: Int",
    // "$distinct_on: String",
    // "$sort_by"
  ]).join(' ')
  // console.log('variablesDeclaration: ' + variablesDeclaration)
  const whereFields = schema.fields.map((f) => `${f.name}: { _eq: $cond_${f.name} }`)
  // console.log('whereFields: ' + whereFields)
  const selectFields = schema.fields.map((f) => `${f.name}`)
  const distinctField = params.distinct_on? `distinct_on: [${params.distinct_on.map( (el) => `${el}`).join(', ')}]` : undefined 

  const limit = params.limit || process.env.DEFAULT_ROW_LIMIT || 10
  // {${params.order_by.map( (k) => `${k}: ${params.order_by[k]}`).join(', ')}}
  // const orderByJson = 
  // const orderField = params.order_by? `order_by: ${JSON.stringify(params.order_by)}` : undefined
  // console.log('orderField: ' + orderField)
  // needed because some variables are mandatory if added to the general query and are NOT ignored by grapqhl
  // const extraFields = [distinctField, orderField].filter(el => el === 0 || Boolean(el)).join(', ')
  const extraFields = [distinctField].filter(el => el === 0 || Boolean(el)).join(', ')
  // console.log('extraFields: ' + extraFields)

  return gql`query ${params.resource_id}_query (${variablesDeclaration}) { 
    ${params.resource_id}(
      limit: ${limit},
      where: {
        ${whereFields.join(' ')}
      }, 
      offset: $offset,
      ${extraFields}
      ) {
        ${selectFields.join(' ')}
      }
    }`

}

module.exports = {
  queryForData,
  buildParametrableQuery
}
