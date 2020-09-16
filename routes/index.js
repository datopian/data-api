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
function getFieldsFromGQLSchema(gqlSchema){
//  console.log("GQL Schema : "+ JSON.stringify(gqlSchema))
//  console.log("GQL Schema FIELDS: "+ JSON.stringify(gqlSchema.fields))
  return gqlSchema.fields.map(e => e.name)
}

/* Creates a nice json from the GraphQL schema to return with the response to the end user */ 
function beautifyGQLSchema(gqlSchema){
  return {
    name: gqlSchema.name,
    fields: gqlSchema.fields.map(f => { 
      return{
        name: f.name,
        type: f.type.name
      }
    })
  }
}

function createQuery(table, fieldNames, limit){

  const columns = fieldNames.join('\n')

  let query = gql`
    {
      ${table}(limit: ${limit || process.env.DEFAULT_ROW_LIMIT || 10}) {
        ${columns}
      }
    }
    `
  return query
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('Hello world!')
})


/* GET . */
router.get(`/${APP_VERSION}/datastore_search`, async function (req, res, next) {
  /*TODO*/
  /* Auth handling  ... maybe JWT? */
  /* query DB */
  /* */
  /* form result JSON */

  /* parse req */

  try {

    if(!('resource_id' in req.query)){
      res.send({
          status:200,
          help:"HERE THE DOCUMENTATION, you have a missing parameter"
        })  // TODO return a meaningful response, maybe the documentation
      }
    const table = req.query.resource_id

    let gqlSchema = await getGraphQLTableSchema(table)
    // console.log("GQL Schema : "+ JSON.stringify(gqlSchema))
  
    let tableFields = getFieldsFromGQLSchema(gqlSchema)
    // console.log("Table Fields: "+tableFields)
    
    // console.log("BeautyFields: "+beautifyGQLSchema(gqlSchema))

    const queryForData = createQuery(table, tableFields)

    console.log(queryForData)
  
    const resData = await request(`${process.env.HASURA_URL}/v1/graphql`, queryForData)
  
    // console.log(JSON.stringify(resData))
    res.send({
      schema: beautifyGQLSchema(gqlSchema),
      data: resData
    })
  } catch (e) {
    console.error(e)
  }

})

module.exports = router
