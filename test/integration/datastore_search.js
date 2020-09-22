const request = require('supertest')
const app = require('../../app')
var assert = require('assert')

const APP_VERSION = 'v1'
const TEST_TABLE_NAME = 'test_table'

describe('datastore_search endpoint', function () {
  it('returns 200 in a basic case', function (done) {
    request(app)
      .get(`/${APP_VERSION}/datastore_search?resource_id=${TEST_TABLE_NAME}`)
      .expect(200)
      .end(() => done())
  })

  it('returns help page in a basic case', function (done) {
    request(app)
      .get(`/${APP_VERSION}/datastore_search/help`)
      .expect(200)
      .end(() => done())
  })

  it('redirects to help if no resource_id', function (done) {
    request(app)
      .get(`/${APP_VERSION}/datastore_search`)
      .expect(303)
      .expect('Location', `/${APP_VERSION}/datastore_search/help`)
      .end(done)
  })

  it('respond with default number of rows when requesting by resource_id on a table with more than the default rows', function (done) {
    request(app)
      .get(`/${APP_VERSION}/datastore_search?resource_id=${TEST_TABLE_NAME}`)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        // console.log("Response: " + JSON.stringify(res))
        const jsonResp = JSON.parse(res.text)
        // console.log("JSON response: " + JSON.stringify(jsonResp))
        // console.log("JSON response: " + JSON.stringify(jsonResp.data)
        // jsonResp.data[`${TEST_TABLE_NAME}`]
        // console.log("JSON response: " + JSON.stringify(jsonResp.data[`${TEST_TABLE_NAME}`]))
        // console.log("JSON response: " + JSON.stringify(jsonResp.data[`${TEST_TABLE_NAME}`]))
        // console.log("JSON data response length: " + jsonResp.data[`${TEST_TABLE_NAME}`].length)

        if (!(jsonResp.data.length == process.env.DEFAULT_ROW_LIMIT)) {
          return done('response length is not correct')
        }
        return done()
      })
  })

  describe('q parameter', function () {
    it('filters resultset by values equal when passing {"columnname": "value"}', function (done) {
      const q = {
        time_column: '2020-09-09 00:00:00',
        text_column: '11111111111111111111111111111111',
        float_column: 0.1111111111111111,
        int_column: 111111,
      }

      request(app)
        .get(
          `/${APP_VERSION}/datastore_search?resource_id=${TEST_TABLE_NAME}&q=${JSON.stringify(
            q
          )}`
        )
        .expect(200)
        .end((err, res) => {
          // console.log('Responponse Body ' + JSON.stringify(res.body, null, 2))
          assert.deepStrictEqual(res.body.data.length, 1)
          // assert.deepStrictEqual(res.body.data.test_data.length, 1) ??
          done()
        })
    })
  })

  // it('return 404 when no such resource_id exist', function (done) {
  //   request(app)
  //     .get(`/${APP_VERSION}/datastore_search?resource_id=nonexsting_id`)
  //     .expect(404, done)
  // })

  // it('should return a valid JSON by default', function (done) {
  //   request(app)
  //     .get(`/${APP_VERSION}/datastore_search?resource_id=${TEST_TABLE_NAME}`)
  //     .expect('Content-Type', /json/)
  //     .expect(200)
  //     .end((err, res) => {
  //       if (err) {
  //         return done(err)
  //       }
  //       JSON.parse(res.text)
  //       return done()
  //     })
  // })

  // it('should return all table fields by default', function (done) {
  //   request(app)
  //     .get(`/${APP_VERSION}/datastore_search?resource_id=${TEST_TABLE_NAME}`)
  //     .end((err, res) => {
  //       const jsonResp = JSON.parse(res.text)

  //       const resultFieldNames = jsonResp.schema.fields.map((f) => f.name)

  //       assert.deepStrictEqual(resultFieldNames, TEST_TABLE_FIELDS)
  //       return done()
  //     })
  // })

  // it('should return only different records when asking for disctinct in the request', function(done) {

  //   return done();
  // })

  // it('should not include the total matching record count by default', function(done) {

  //   return done();
  // })

  // it('', function(done) {

  // })
})
