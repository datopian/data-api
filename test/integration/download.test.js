const request = require('supertest')
const app = require('../../app')

const QUERY = `
query MyQuery {
  test_table(limit: 10) {
    float_column
    int_column
    text_column
    time_column
  }
}
`

describe('data-api-download', function () {
  it('should return JSON when no format parameter is passed', function (done) {
    request(app)
      .post('/v1/download')
      .send({
        query: `{
        __type(name: "test_table") {
          name
          fields {
            name
            type {
              name
            }
          }
        }
      }
      `,
      })
      .expect(200)
      .end(function (err, res) {
        // console.log('ERROR = ', err)
        // console.log('response Text: ', res.text)
        // console.log('Response Body: ', res.body)
        // check that is a JSON
        JSON.parse(res.text)
        done()
      })
  })

  it('should return JSON when format=JSON', function (done) {
    request(app)
      .post('/v1/download?format=json')
      .send({
        query: QUERY,
      })
      .expect(200)
      .end(function (err, res) {
        // console.log('ERROR = ', err)
        // console.log('response: ', res.text)
        // check that is a JSON
        JSON.parse(res.text)
        // TODO check that is attachment
        // TODO check attachment name
        done()
      })
  })

  it('should return CSV when format=CSV', function (done) {
    request(app)
      .post('/v1/download?format=csv')
      .send({
        query: QUERY,
      })
      .expect(200)
      .end(function (err, res) {
        console.log('ERROR = ', err)
        // console.log('response TEXT: ', res.text)
        // console.log('response BODY: ', res.body)
        // check that is a JSON
        // JSON.parse(res.text)
        done()
      })
  })

  it('should return Excel when format=xlsx', function (done) {
    request(app)
      .post('/v1/download?format=xlsx')
      .send({
        query: QUERY,
      })
      .expect(200)
      .end(function (err, res) {
        console.log('ERROR = ', err)
        // console.log('response TEXT: ', res.text)
        // console.log('response BODY: ', res.body)
        // check that is a JSON
        // JSON.parse(res.text)
        done()
      })
  })
})
