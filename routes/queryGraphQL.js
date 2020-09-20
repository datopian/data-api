const { request, gql } = require('graphql-request')
const { app } = require('../app')

async function queryForData(schema, params) {

  // parameters parsing -> order_by, distinct
  //distinct supports either a boolean value (default false) or a list of fields to compare
  // console.log()
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
    // limit: params.limit,
    // offset: params.offset,
  }

  // fields conditition parsing e.g. cond_int_column: 3
  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      variables[`cond_${key}`] = value
    }
  }
  // console.log("Call schema buildParametrableQuery " + JSON.stringify(schema))
  // console.log("Call queryParams buildParametrableQuery " + JSON.stringify(queryParams))
  console.log("Variables = "+ JSON.stringify(variables))
  const query = buildParametrableQuery(schema, queryParams)
  console.log("QUERY: "+ JSON.stringify(query))
  //are variables different to the params? Maybe
  return request(process.env.HASURA_URL + '/v1/graphql', query, variables).then(resp => resp[params.resource_id])
}

/**
 *
 * @param {*} schema table schema in frictionless format
 * @param {*} params query parameters, e.g. resource_id, fields, limit
 * @returns String GraphQL query with optional params for fields being equal
 */
function buildQueryForData(schema, params) {
  // $text_column: String
  let variablesDeclaration = schema.fields
    .map((f) => `$${f.name}: ${f.type.name}`)
    .join(' ')
    // declare the other variables distinct, offset, sort_by .... 

  // text_column: { _eq: $text_column }
  const whereFields = schema.fields.map((f) => `${f.name}: { _eq: $${f.name} }`)

  const whereClause = `where: {
    ${whereFields.join(' ')}
  }`
  /*
  query MyQuery {
    test_table(
      distinct_on: float_column, 
      limit: 10, 
      offset: 10, 
      order_by: {float_column: asc, int_column: asc, text_column: asc, time_column: asc}, 
      where: {float_column: {_eq: "2.2"}, 
      int_column: {_eq: 6}, 
      text_column: {_eq: "asd"}})
  }
  */

  return gql`query ${params.resource_id}_query (${variablesDeclaration}) { 
    ${params.resource_id}(
      limit: ${params.limit},
      ${whereClause}
    ) {
      ${params.fields.join(' ')}
    }
  }`
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
    // "$offset: Int",
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
      ${extraFields}
      ) {
        ${selectFields.join(' ')}
      }
    }`

//  return gql`query ${params.resource_id}_query (${variablesDeclaration}) { 
//   ${params.resource_id}(
//     # limit: $limit,
//     limit: ${limit},
//     where: {
//       ${whereFields.join(' ')}
//     }, 
//     # offset: $offset,  # FUTURE
//     ${extraFields}
//     ) {
//       ${selectFields.join(' ')}
//     }
//   }`
}

module.exports = {
  queryForData,
  buildQueryForData,
  buildParametrableQuery
}
