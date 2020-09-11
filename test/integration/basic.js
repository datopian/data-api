const request = require('supertest')
const app = require('../../app')

describe('GraphQL endpoint', function () {
  it('returns graphql schema', function (done) {
    request(app)
      .post('/v1/graphql')
      .send({
        query: '{\n\t__schema{\n queryType {\n fields{\n name\n }\n }\n }\n}',
      })
      .set('Accept', 'application/json')
      // TODO: fix redirection
      .expect(302)
      .end(function (err, res) {
        if (err) return done(err)
        console.log(res)
        done()
      })
  })

  it('should fail', function (done) {
    const query = `
      query MyQuery {
        test_table_aggregate {
          aggregate {
            absent_column
          }
        }
      }
    `

    request(app).post('/v1/graphql').send({ query }).expect(200, done)
  })
})
