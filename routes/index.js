var express = require('express')
var router = express.Router()


const { Pool, Client } = require('pg')
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

const APP_VERSION = 'v1.1'


/* GET home page. */
router.get('/', function (req, res, next) {
  res.send('Hello world!')
})


/* GET . */
router.get(`/${APP_VERSION}/datastore_search`, function (req, res, next) {
  /*TODO*/
  /* Auth handling  ... maybe JWT? */
  /* query DB */
  /* */
  /* form result JSON */

  /* parse req */
  const resource_id = req.query.resource_id
  // TODO react on no resource_id

  console.log(req)
  console.log('query: ' + req.query)
  pool
    .query('SELECT * FROM $1 LIMIT 100', [resource_id])
    .then(result => {
      // Convert pg.Result to JSON

      // TODO: prep schema


      console.log('pg result: ', result)

      res.send({
        data: result
      })
    })  
    .catch(err => console.error('Error executing query', err.stack))

  // client.release()
  // res.send(result)
  res.send(200)
})

module.exports = router
