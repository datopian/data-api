const { request, gql } = require('graphql-request')

async function queryForData(params) {}

/**
 *
 * @param {*} schema table schema in frictionless format
 * @param {*} params query parameters, e.g. resource_id, fields, limit
 * @returns String GraphQL query with optional params for fields being equal
 */
function buildQueryForData(schema, params) {
  // $text_column: String
  let variablesDeclaration = schema.fields
    .map((f) => `$${f.name}: ${f.type}`)
    .join(' ')

  // text_column: { _eq: $text_column }
  const whereFields = schema.fields.map((f) => `${f.name}: { _eq: $${f.name} }`)

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
      where: {
        ${whereFields.join(' ')}
      }
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
    .map((f) => `$${f.name}: ${f.type}`)
    .join(' ')

  // text_column: { _eq: $text_column }


  const whereFieldsList = schema.fields.map((f) => `${f.name}: { _eq: $${f.name} }`)
  // console.log('whereFieldsList: ' + whereFieldsList)

  const limitField = `limit: ${params.limit}`
  // console.log('limitField: ' + limitField)
  const whereField = `where: {
      ${whereFieldsList.join(' ')}
    }`
    // console.log('whereField' + whereField)

  const offsetField = params.offset ? `offset: ${params.offset}` : undefined
  // console.log('offsetField: ' + offsetField)
  const distinctField = params.distinct_on? `distinct_on:[${params.distinct_on}]` : undefined 
  // console.log('disticntField: ' + distinctField)

  const fields = [limitField, whereField, offsetField, distinctField].filter(el => el === 0 || Boolean(el))
  console.log('fields' + fields)
  // const orderField = schema.order_by? schema.order_by.map((f) => `${f.name}: { _eq: $${f.name} }`): ''
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
    ${params.resource_id}( ${fields}
    ) {
      ${params.fields.join(', ')}
    }
  }`
}

module.exports = {
  queryForData,
  buildQueryForData,
  buildParametrableQuery
}
