const { request, gql } = require('graphql-request')

async function main() {
  const endpoint = 'http://localhost:8080/v1/graphql'

  const query = gql`
    query ($string_value: String!) {
        test_table(limit: 10, where: {text_column: {_eq: $string_value}}) {
          int_column
          text_column
          float_column
          time_columns
        }
    }
  `

  const variables = {
    // table: 'test_table',
    // column: 'int_column'
    text_column: '11111'
  }

  const data = await request(endpoint, query, variables)
  console.log(JSON.stringify(data, undefined, 2))
}

main().catch((error) => console.error(error))