var express = require('express')
var router = express.Router()
const { Readable, finished } = require('stream')
const { once } = require('events')

const { request, gql } = require('graphql-request')

const { queryForData } = require('./queryGraphQL')
const XLSX = require('xlsx')
const path = require('path')

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

//test function to manually check downloads
router.get(`/test/download`, async function (req, res, next) {
  // res.sendFile('./test-download.html')
  const ppath = __dirname.split(path.sep).slice(0, -1).join(path.sep)
  res.sendFile(path.join(ppath + '/test/test-download.html'))
})
/**
 *
 */

router.post(`/${APP_VERSION}/download`, async function (req, res, next) {
  console.log(' Download CALLED')
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
    const ext = (req.params.format || req.query.format || 'json')
      .toLowerCase()
      .trim()
    const colSep = (req.query.field_separator || ',').trim() // req.params.field_separator ||
    // console.log('format: ', ext, req.params)
    // console.log('response headers BEFORE: ', res.getHeaders())
    res.set(
      'Content-Disposition',
      'attachment; filename="download.' + ext + '";'
    )
    // res.append(
    //   'Content-Disposition',
    //   'attachment; filename="download.' + ext + '";'
    // )
    // res.setHeader(
    //   'Content-Disposition',
    //   'attachment; filename="download.' + ext + '";'
    // )
    // console.log('response headers AFTER: ', res.getHeaders())
    if (ext != 'json') {
      // any spreadsheet supported by [js-xlsx](https://github.com/SheetJS/sheetjs)
      let wb = XLSX.utils.book_new()
      // TODO control the column/field order:
      // https://stackoverflow.com/questions/56854160/sort-and-filter-columns-with-xlsx-js-after-json-to-sheet
      // https://github.com/SheetJS/sheetjs/issues/738
      // it needs to receive the header parameter with the desired column order

      //iterate over the result sets and create a work sheet to append to the book
      Object.keys(gqlRes).map((k) => {
        const ws = XLSX.utils.json_to_sheet(gqlRes[k])
        XLSX.utils.book_append_sheet(wb, ws, k)
      })
      if (ext === 'csv' && colSep != ',') {
        res.set('Content-Type', 'text/csv')
        // console.log('response headers AFTER: ', res.getHeaders())
        //deal with column and record different separators, include tab, pipe, semicolon, etc
        // const recSep = (req.query.record_separator || undefined).trim() // req.params.field_separator ||
        // console.log('writing csv stream with field_separator ', colSep)
        // only send the first sheet
        const sname = wb.SheetNames[0]
        // console.log('sheet: ', sname)
        const ws = wb.Sheets[sname]
        // console.log('worksheet: ', ws)
        // TODO record separator
        // const csv = XLSX.utils.sheet_to_csv(ws, { FS: colSep, RS: recSep })
        const csv = XLSX.utils.sheet_to_csv(ws, { FS: colSep })
        // console.log('csv: ', csv)
        const readable = Readable.from(csv, { encoding: 'utf8' })
        // console.log('writing output ')
        for await (const chunk of readable) {
          // console.log('writing chunk: ', chunk)
          if (!res.write(chunk)) {
            // Handle backpressure
            await once(res, 'drain')
          }
        }
        res.end()
      } else {
        // console.log('workbook created from json: ', wb)
        // console.log('sending all workbook: ')
        if (ext === 'csv') {
          res.set('Content-Type', 'text/csv')
        } else {
          res.set(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          )
        }
        // console.log('response headers AFTER: ', res.getHeaders())
        res.end(XLSX.write(wb, { type: 'buffer', bookType: ext }))
      }
    } else {
      // console.log('Sending JSON response')
      // pure JSON, GraphQL already returns us that
      // Examples and docs here: https://nodesource.com/blog/understanding-streams-in-nodejs/
      // is json format, need to convert it to stream type it and stream it back to the client
      res.set('Content-Type', 'application/json')
      // console.log('response headers AFTER: ', res.getHeaders())
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
