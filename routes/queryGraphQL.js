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
  const variablesDeclaration = schema.fields
    .map((f) => `$${f.name}: ${f.type}`)
    .join(' ')

  // text_column: { _eq: $text_column }
  const whereFields = schema.fields.map((f) => `${f.name}: { _eq: $${f.name} }`)

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

module.exports = {
  queryForData,
  buildQueryForData,
}
