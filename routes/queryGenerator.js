const { request, gql }  = require('graphql-request')

async function main() {
  const endpoint = 'http://localhost:8080/v1/graphql'

  const query = gql`
    query MyQuery {
        $table(limit: 10, where: {int_column: {_eq: 11111}}) {
        int_column
        text_column
        float_column
        time_column
        }
    }
  `

  const variables = {
    table: 'test_table',
  }

  const data = await request(endpoint, query, variables)
  console.log(JSON.stringify(data, undefined, 2))
}

main().catch((error) => console.error(error))