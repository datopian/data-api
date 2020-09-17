/*
This is an example snippet - you should consider tailoring it
to your service.
*/
/*
Add these to your `package.json`:
  "node-fetch": "^2.5.0"
*/

// Node doesn't implement fetch so we have to import it
// import fetch from "node-fetch";
const fetch = require('node-fetch')

// const { request, gql } = require('graphql-request')

async function fetchGraphQL(operationsDoc, operationName, variables) {
  const result = await fetch(
    "http://localhost:8080/v1/graphql",
    {
      method: "POST",
      body: JSON.stringify({
        query: operationsDoc,
        // variables: variables,
        operationName: operationName
      })
    }
  );

  return await result.json();
}

const operationsDoc = `
  query MyQuery {
    test_table(limit: 10, where: {int_column: {_eq: 11111}}) {
      int_column
      text_column
      float_column
      time_column
    }
  }
`;

function fetchMyQuery() {
  return fetchGraphQL(
    operationsDoc,
    "MyQuery",
    {table: 'test_table'}
  );
}

async function startFetchMyQuery() {
  const { errors, data } = await fetchMyQuery();

  if (errors) {
    // handle those errors like a pro
    console.error(errors);
  }

  // do something great with this precious data
  console.log(data);
}

startFetchMyQuery();