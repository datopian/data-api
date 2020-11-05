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
    const table = req.query.resource_id
    // query for schema  -> this should be already in Frictionless format
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
      data: data,
    })
  } catch (e) {
    console.error(e)
  }
})

//TODO finish this test function to manually check downloads
// router.get(`/test/download`, async function (req, res, next) {
//   // res.sendFile('./test-download.html')
//   const ppath = __dirname.split(path.sep).slice(0, -1).join(path.sep)
//   res.sendFile(path.join(ppath + '/test/test-download.html'))
// })
/**
 *
 */

DOWNLOAD_FORMATS_SUPPORTED = ['json', 'csv', 'xlsx', 'ods']

router.post(`/${APP_VERSION}/download`, async function (req, res, next) {
  console.log(' Download CALLED')
  // get the graphql query from body
  const query = req.body.query ? req.body.query : req.body
  // call GraphQL
  try {
    // TODO check graphql syntax BEFORE sending it
    const gqlRes = await request(`${process.env.HASURA_URL}/v1/graphql`, query)

    // // capture graphql response
    const ext = (req.params.format || req.query.format || 'json')
      .toLowerCase()
      .trim()
    if (!DOWNLOAD_FORMATS_SUPPORTED.includes(ext)) {
      res
        .status(400)
        .send(
          'Bad format. Supported Formats: ' +
            JSON.stringify(DOWNLOAD_FORMATS_SUPPORTED)
        )
    }
    const colSep = (req.query.field_separator || ',').trim()
    res.set(
      'Content-Disposition',
      'attachment; filename="download.' + ext + '";'
    )
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
        // only send the first sheet
        const sname = wb.SheetNames[0]
        const ws = wb.Sheets[sname]
        // TODO deal with record separator
        // const recSep = (req.query.record_separator || undefined).trim() // req.params.field_separator ||
        // const csv = XLSX.utils.sheet_to_csv(ws, { FS: colSep, RS: recSep })
        const csv = XLSX.utils.sheet_to_csv(ws, { FS: colSep })
        const readable = Readable.from(csv, { encoding: 'utf8' })
        for await (const chunk of readable) {
          if (!res.write(chunk)) {
            // Handle backpressure
            await once(res, 'drain')
          }
        }
        res.end()
      } else {
        if (ext === 'csv') {
          res.set('Content-Type', 'text/csv')
        } else {
          res.set(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          )
        }
        res.end(XLSX.write(wb, { type: 'buffer', bookType: ext }))
      }
    } else {
      // pure JSON, GraphQL already returns us that
      // Examples and docs here: https://nodesource.com/blog/understanding-streams-in-nodejs/
      // is json format, need to convert it to stream type it and stream it back to the client
      res.set('Content-Type', 'application/json')
      const readable = Readable.from(JSON.stringify(gqlRes), {
        encoding: 'utf8',
      })
      for await (const chunk of readable) {
        if (!res.write(chunk)) {
          await once(res, 'drain')
        }
      }
      res.end()
    }
  } catch (e) {
    console.error('Error during graphql call', e)
    res.status(500).end()
  }
})

module.exports = router
