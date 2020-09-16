const request = require('supertest')
const app = require('../../app')
var assert = require('assert')

const APP_VERSION = 'v1.1'
const TEST_TABLE_NAME = 'test_table'
const TEST_TABLE_FIELDS = [
  {
    name: 'time_column',
    type: 'timestamp',
  },
  {
    name: 'text_column',
    type: 'String',
  },
  {
    name: 'float_column',
    type: 'float8',
  },
  {
    name: 'int_column',
    type: 'Int',
  },
]

describe('datastore_search endpoint', function () {

  it('returns 200 in a basic case', function(done) {
    request(app)
      .get(`/${APP_VERSION}/datastore_search`)
      .expect(200)
      .end(() => done())
  })


  it('respond with default number of rows when requesting by resource_id on a table with more than the default rows', function (done) {
    request(app)
      .get(`/${APP_VERSION}/datastore_search?resource_id=${TEST_TABLE_NAME}`)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        const jsonResp = JSON.parse(res.text)
        if (!(jsonResp.data.length === process.env.DEFAULT_ROW_LIMIT)) {
          done('response length is not correct')
        }
        return done()
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
