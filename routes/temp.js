var express = require('express')
var router = express.Router()
const { request, gql } = require('graphql-request')


const { Pool, Client } = require('pg')
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

const APP_VERSION = 'v1.1'

/* Gets the schema from a GraphQL*/
async function getGraphQLTableSchema(resource_id) {
  console.log(resource_id)

  const queryForSchema = gql`
  {
    __type(name: "${resource_id}") {
      name
      fields {
        name
        type {
          name
        }
      }
    }
  }
`
  // return request(`${process.env.HASURA_URL}/v1/graphql`, queryForSchema)
  try {
    const schemaPrep = await request(`${process.env.HASURA_URL}/v1/graphql`, queryForSchema)
    //    console.log(JSON.stringify(schemaPrep, null, 2))  // TODO erase log
    schema = schemaPrep.__type
  } catch (e) {
    console.error(e)
    throw e
  }

  return schema
}

/* Creates a nice json from the GraphQL schema to return with the response to the end user */
function getFieldsFromGQLSchema(gqlSchema) {
  //  console.log("GQL Schema : "+ JSON.stringify(gqlSchema))
  //  console.log("GQL Schema FIELDS: "+ JSON.stringify(gqlSchema.fields))
  return gqlSchema.fields.map(e => e.name)
}

/* Creates a nice json from the GraphQL schema to return with the response to the end user */
function beautifyGQLSchema(gqlSchema) {
  return {
    name: gqlSchema.name,
    fields: gqlSchema.fields.map(f => {
      return {
        name: f.name,
        type: f.type.name
      }
    })
  }
}

function createQuery(table, fieldNames, limit) {

  const columns = fieldNames.join('\n\t\t\t')

  let query = gql`
    {
      ${table}(limit: ${limit || process.env.DEFAULT_ROW_LIMIT || 10}) {
        ${columns}
      }
    }
    `
  return query
}

/* convert input q parameter into grqphql syntax*/
function q2gql(q, table, fieldNames, limit, schema) {

  console.log("Input Q = " + q)
  function colEq(column, value, valueType) {

    switch (valueType) {
      case "Int":
        eqStatement = `${value}`;
        break;
      case "Float":
        eqStatement = `${value}`;
        break;
      case "Boolean":
        eqStatement = `${value}`;
        break;
      default:
        eqStatement = `"${value}"`;
    }
    // const eqStatement = isNaN(value)  ?  `"${value}"`  : `${value}`
    // const eqStatement = typeof(value) == "number"  ?  `"${value}"`  : `${value}`

    return `${column}: { _eq: ${eqStatement}}`

  }

  // parse q 
  const qp = JSON.parse(q)
  console.log("Parsed Q = " + JSON.stringify(qp))
  // const whereClauses =  Object.entries(qp).forEach( ([k,v]) => colEq( k, v ))
  // TODO here  use the schema parse the input schema to get the valueType
  const whereClauses = Object.keys(qp).map((k) => colEq(k, qp[k]))
  const whereStatement = `where: {${whereClauses.join(',')}}`
  const columns = fieldNames.join('\n')
  // const limit = 100
  // let query = gql`
  //   {
  //     ${table}(${whereStatement}, limit: ${limit || process.env.DEFAULT_ROW_LIMIT || 10} ){
  //       ${columns}
  //     }
  //   }
  //   `
  let query = gql`
  {
    $table(where { text_column: { _eq: "11111111111111111111111111111111"},
                   float_column: { _eq: 0.1111111111111111},
                   int_column: { _eq: 111111}}
  }, limit: 100 } ){
      int_column
      text_column
      float_column
      time_column
    }
  }
  `

  // let query = gql`
  //   {
  //     $table($whereStatement, limit: 100 } ){
  //       $columns
  //     }
  //   }
  //   `

  // const query = gql`
  // query getMovie($title: String!) {
  //   Movie(title: $title) {
  //     releaseDate
  //     actors {
  //       name
  //     }
  //   }
  // }
  // `

  const variables = {
    table: table,
    whereStatement: whereStatement,
    limit: limit
  }

  console.log("Generated Query = " + query)

  return query
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('Hello world!')
})

/*

/datastore_search/?resource_id -> redirect 
/datastore_search/resource_id
/datastore_search/help -> by default if the query is not valid
/datastore_search/list_resources
/datastore_search_sql
/datastore_search_graphql


*/

router.get(`/ ${APP_VERSION}/datastore_search/help`, function (req, res, next) {
  res.send('TODO this is the API help')
})

/* GET . */
router.get(`/ ${APP_VERSION} /datastore_search`, async function (req, res, next) {
  /*TODO*/
  /* Auth handling  ... maybe JWT? */
  /* query DB */
  /* */
  /* form result JSON */

  /* parse req */

  try {

    if (!('resource_id' in req.query)) {
      res.redirect(`/${APP_VERSION}/datastore_search/help`)
    }

    const table = req.query.resource_id

    let gqlSchema = await getGraphQLTableSchema(table)
    // console.log("GQL Schema : "+ JSON.stringify(gqlSchema))

    let tableFields = getFieldsFromGQLSchema(gqlSchema)
    console.log("Table Fields: " + tableFields)

    console.log("BeautyFields: " + beautifyGQLSchema(gqlSchema))

    let queryForData = createQuery(table, tableFields)
    if ('q' in req.query) {
      queryForData = q2gql(req.query.q, table, tableFields)
    }

    console.log("Constructed query = " + queryForData)

    // const resData = await request(`${process.env.HASURA_URL}/v1/graphql`, queryForData, [table])

    // console.log("RESDATA: " + JSON.stringify(resData))
    res.send({
      schema: beautifyGQLSchema(gqlSchema),
      data: resData
    })
  } catch (e) {
    console.error(e)
  }

})

module.exports = router
