const request = require('supertest')
const app = require('../../app')

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
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        console.log('ERROR = ', err)
        console.log('response: ', res.text)
        done()
      })
  })

  // it('should return JSON when format=JSON', function (done) {
  //     const resp = await request(app).get('/download?format=json')
  // })

  // it('should return CSV when format=CSV', function (done) {
  //     const resp = await request(app).get('/download?format=csv')
  // })

  // it('should return Excel when format=xlsx', function (done) {
  //     const resp = await request(app).get('/download?format=xlsx')
  // })
})
