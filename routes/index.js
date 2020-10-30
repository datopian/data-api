var express = require('express')
var router = express.Router()
const { Readable, finished } = require('stream')
const { once } = require('events')

const { request, gql } = require('graphql-request')

const { queryForData } = require('./queryGraphQL')
const XLSX = require('xlsx')

const APP_VERSION = 'v1'

/* Gets the schema from a GraphQL*/
async function getGraphQLTableSchema(resource_id) {
  // console.log("ResourceID: " + resource_id)

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

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('DATA-API Home Page!!')
})

router.get(`/${APP_VERSION}/datastore_search/help`, function (req, res, next) {
  helpTxt = `<h2 id="parameters">Parameters</h2>
  <ul>
  <li><strong>resource_id</strong> (string) – <em>MANDATORY</em> id or alias of the resource to be searched against</li>
  <li><strong>q</strong> (string or dictionary) – JSON format query restrictions {“key1”: “a”, “key2”: “b”}, it’ll search on each specific field (optional)</li>
  <li><strong>distinct_on</strong> [bool || list of field names] – If True: return only distinct rows, if list of fields will return only </li>
  <li><strong>limit (int)</strong> – Maximum number of rows to return (optional, default: 100)</li>
  <li><strong>offset (int)</strong> – offset this number of rows (optional)</li>
  <li><strong>fields (list of strings)</strong> – fields to return (optional, default: all fields)</li>
  </ul>
  <h2 id="results-">Results:</h2>
  <p>The result is a JSON  document containing:</p>
  <ul>
  <li>schema (JSON) – The data schema </li>
  <li>data (JSON)  – matching results in JSON format</li>
  </ul>
  `
  res.send(helpTxt)
})

/* GET . */
router.get(`/${APP_VERSION}/datastore_search`, async function (req, res, next) {
  try {
    if (!('resource_id' in req.query)) {
      return res.redirect(303, `/${APP_VERSION}/datastore_search/help`)
    }
    // console.log("Request: " + JSON.stringify(req))
    // console.log('Query: ' + JSON.stringify(req.query))
    // console.log('Params: ' + JSON.stringify(req.params))
    // console.log("Headers: " + JSON.stringify(req.headers))
    const table = req.query.resource_id
    // query for schema  -> this should be already in Frictionless format
    // const schema = await queryForSchema()
    const schema = await getGraphQLTableSchema(table)
    // console.log('SCHEMA: ' + JSON.stringify(schema))
    // query for data -> basically the call to queryGraphQL
    const data = await queryForData(schema, req.query)

    // console.log('RESPONSE: ' + JSON.stringify(data))
    /*TODO*/
    /* Auth handling  ... maybe JWT? */
    // Mandatory GET parameters check

    // response
    res.send({
      schema: beautifyGQLSchema(schema),
      data: data,
    })
  } catch (e) {
    console.error(e)
  }
})

// router.get(`/${APP_VERSION}/download`, async function (req, res, next) {
//   console.log(' Download CALLED')

//   res.send('THIS IS A RESPONSE')
// })
/**
 *
 */

router.post(`/${APP_VERSION}/download`, async function (req, res, next) {
  // console.log(' Download CALLED')
  // res.send('THIS IS A RESPONSE')
  // get the graphql query from body
  // we might need to support maybe different formats: pure graphql or a json with fields detailing
  // AND a query field
  // console.log('body: ', req.body)
  // console.log('query: ', req.query)
  // console.log('route: ', req.route)
  // console.log(req)
  const query = req.body.query ? req.body.query : req.body
  // console.log('QUERY: ', query)
  // call GraphQL
  try {
    // TODO check graphql syntax
    const gqlRes = await request(`${process.env.HASURA_URL}/v1/graphql`, query)
    // console.log('Response type: ', typeof gqlRes, typeof JSON.stringify(gqlRes))
    // console.log('GraphQL response: ', gqlRes)

    // // capture graphql response
    // // get query format type, default JSON
    // result = gqlRes // default response -> JSON, the same as graphql
    const ext = (req.params.format || 'json').toLowerCase()
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="download.' + ext + '";'
    )
    if (ext != 'json') {
      // any spreadsheet supported by [js-xlsx](https://github.com/SheetJS/sheetjs)
      let wb = XLSX.utils.book_new()
      //iterate over the result sets and create a work sheet to append to the book
      Object.keys(gqlRes).map((k) => {
        const ws = XLSX.utils.json_to_sheet(gqlRes[k])
        XLSX.utils.book_append_sheet(wb, ws, k)
      })
      // console.log('workbook created from json: ', wb)
      res.end(XLSX.write(wb, { type: 'buffer', bookType: ext }))
    } else {
      // pure JSON
      // Examples and docs here: https://nodesource.com/blog/understanding-streams-in-nodejs/
      // is json format, need to convert it to stream type it and stream it back to the client
      const readable = Readable.from(JSON.stringify(gqlRes), {
        encoding: 'utf8',
      })
      for await (const chunk of readable) {
        if (!res.write(chunk)) {
          // Handle backpressure
          await once(res, 'drain')
        }
      }
      res.end()
    }
    // res.send(result)
  } catch (e) {
    console.error('Error during graphql call', e)
    res.status(500).end()
  }
})

module.exports = router
