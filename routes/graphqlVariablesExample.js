const { request, gql } = require('graphql-request')

async function main() {
  const endpoint = 'http://localhost:8080/v1/graphql'

  // const query = gql`
  //   query MyQuery($title: String!) {
  //     test_table(limit: 10, where: { text_column: { _eq: $title } }) {
  //       int_column
  //       text_column
  //       float_column
  //       time_column
  //     }
  //   }
  // `

  const columnNames = [
    'int_column',
    'text_column',
    'float_column',
    'time_column',
  ]

  // notice `!` they denote must-have values, but the ones without `!`
  // can be omitted
  const query = gql`
    query MyQuery(
      $text_column: String!, 
      $int_column: Int,
      $floatColumnValue: float8,
      $timeColumnValue: timestamp,
    ) {
      test_table(
        limit: 10, 
        where: { 
          text_column: { _eq: $text_column }, 
          int_column: { _eq: $int_column },
          float_column: { _eq: $floatColumnValue },
          time_column: { _eq: $timeColumnValue}
        }
      ) 
      {
        ${columnNames.join(' ')}
      }
    }
  `

  console.log(query)

  const variables = {
    text_column: '11111111111111111111111111111111',
    intColumnValue: 111111,
    // floatColumnValue: 0.1111111111111111,
    // timeColumnValue: '2020-09-09 00:00:00',
  }

  const data = await request(endpoint, query, variables)
  console.log(JSON.stringify(data, undefined, 2))
}

main().catch((error) => console.error(error))
