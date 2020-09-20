var express = require('express')
var router = express.Router()
const { request, gql } = require('graphql-request')

const { Pool, Client } = require('pg')
const { queryForData } = require('./queryGraphQL')
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

const APP_VERSION = 'v1.1'

/* Gets the schema from a GraphQL*/
async function getGraphQLTableSchema(resource_id) {
  console.log("ResourceID: " + resource_id)

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
    const schemaPrep = await request(
      `${process.env.HASURA_URL}/v1/graphql`,
      queryForSchema
    )
    //    console.log(JSON.stringify(schemaPrep, null, 2))  // TODO erase log
    schema = schemaPrep.__type
  } catch (e) {
    console.error(e)
    throw e
  }

  return schema
}

function getFieldTypesFromGQLSchema(gqlSchema) {
  //  console.log("GQL Schema Types : " + JSON.stringify(gqlSchema))
  //  console.log("GQL Schema FIELDS: "+ JSON.stringify(gqlSchema.fields))
  function gqlType2jsType(typeName) {
    let jsType = typeName
    const dtype = typeName.toLowerCase()
    // include boolean
    if (dtype.includes('float') || dtype.includes('int')) {
      jsType = 'numeric'
    } else if (dtype.includes('bool')) {
      jsType = 'boolean'
    }

    // else if ...
    // TODO other types that might be a problem ...
    return jsType
  }

  // Lookup table:
  let fieldTypeMap = Object.fromEntries(
    gqlSchema.fields.map((e) => [e.name, gqlType2jsType(e.type.name)])
  )

  //  console.log("Field Type Map: " + JSON.stringify(fieldTypeMap))
  return fieldTypeMap
}

/* Creates a nice json from the GraphQL schema to return with the response to the end user */
function getFieldsFromGQLSchema(gqlSchema) {
  //  console.log("GQL Schema : "+ JSON.stringify(gqlSchema))
  //  console.log("GQL Schema FIELDS: "+ JSON.stringify(gqlSchema.fields))
  return gqlSchema.fields.map((e) => e.name)
}

/* Creates a nice json from the GraphQL schema to return with the response to the end user */
function beautifyGQLSchema(gqlSchema) {
  return {
    name: gqlSchema.name,
    fields: gqlSchema.fields.map((f) => {
      return {
        name: f.name,
        type: f.type.name,
      }
    }),
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
function q2gql(q, schema, table, fieldNames, limit) {
  // console.log("Input Q = " + q, schema, table, fieldNames, limit)

  // console.log("Schema2 input: " + JSON.stringify(schema))
  const schemaTypes = getFieldTypesFromGQLSchema(schema)
  // console.log("Schema2 fields: " + schemaTypes)

  /*Selects correct double-quote syntax for query filter values depending on the valueType*/
  function colEq(column, value, valueType) {
    switch (valueType) {
      case 'numeric':
        eqStatement = `${value}`
        break
      default:
        eqStatement = `"${value}"`
    }

    return `${column}: { _eq: ${eqStatement}}`
  }
  // parse q
  const qp = JSON.parse(q)
  // console.log("Parsed Q = " + JSON.stringify(qp))
  const whereClauses = Object.keys(qp).map((k) =>
    colEq(k, qp[k], schemaTypes[k])
  )
  const whereStatement = `where: {${whereClauses.join(',')}}`
  const columns = fieldNames.join('\n')

  let query = gql`
    {
      ${table}(${whereStatement}, limit: ${limit || process.env.DEFAULT_ROW_LIMIT || 10
    } ){
        ${columns}
      }
    }
    `
  // console.log("Generated Query = " + query)
  return query
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('Home Page!!')
})

router.get(`/${APP_VERSION}/datastore_search/help`, function (req, res, next) {
  res.send('TODO this is the API help') //TODO help
})

/* GET . */
router.get(`/${APP_VERSION}/datastore_search`, async function (req, res, next) {
  try {

    if (!('resource_id' in req.query)) {
      res.redirect(`/${APP_VERSION}/datastore_search/help`)
    }
    // console.log("Request: " + JSON.stringify(req))
    // console.log("Query: " + JSON.stringify(req.query))
    // console.log("Params: " + JSON.stringify(req.params))
    // console.log("Headers: " + JSON.stringify(req.headers))
    const table = req.query.resource_id
    // query for schema  -> TODO this should be already in Frictionless format
    // const schema = await queryForSchema()
    const schema = await getGraphQLTableSchema(table)

    // query for data -> basically the call to queryGraphQL
    const data = await queryForData(schema, req.query)

    /*TODO*/
    /* Auth handling  ... maybe JWT? */
    // Mandatory GET parameters check

    // response
    res.send({
      schema: beautifyGQLSchema(schema),
      data: data[table],
    })
  } catch (e) {
    console.error(e)
  }
})


// /* GET . */
// router.get(`/${APP_VERSION}/datastore_search`, async function (req, res, next) {
//   try {
//     // query for schema  -> TODO this should be already in Frictionless format
//     const schema = await queryForSchema()

//     // query for data -> basically the call to queryGraphQL
//     const data = await queryForData(schema, params)

//     //

//     /*TODO*/
//     /* Auth handling  ... maybe JWT? */
//     // Mandatory GET parameters check
//     if (!('resource_id' in req.query)) {
//       res.redirect(`/${APP_VERSION}/datastore_search/help`)
//     }
//     const table = req.query.resource_id

//     let gqlSchema = await getGraphQLTableSchema(table)
//     // console.log("GQL Schema : " + JSON.stringify(gqlSchema))
//     let tableFields = getFieldsFromGQLSchema(gqlSchema)
//     // console.log("Table Fields: "+tableFields)
//     // console.log("BeautyFields: " + JSON.stringify(beautifyGQLSchema(gqlSchema)))
//     //Query generation
//     let queryForData = createQuery(table, tableFields)
//     // console.log("Constructed query if NOT q = " + queryForData)
//     if ('q' in req.query) {
//       // console.log("entering q ... ")
//       queryForData = q2gql(
//         req.query.q,
//         schema,
//         table,
//         tableFields,
//         process.env.DEFAULT_ROW_LIMIT
//       )
//     }
//     //    console.log("Constructed query = " + queryForData)
//     // call HASURA service
//     const resData = await request(
//       `${process.env.HASURA_URL}/v1/graphql`,
//       queryForData
//     )
//     // const resData = await request(`${process.env.HASURA_URL}/v1/graphql`, queryForData, {table: table})
//     //    console.log(JSON.stringify(resData))
//     // response
//     res.send({
//       schema: beautifyGQLSchema(gqlSchema),
//       data: resData[table],
//     })
//   } catch (e) {
//     console.error(e)
//   }
// })

module.exports = router
