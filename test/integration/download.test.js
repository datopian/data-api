const request = require('supertest')
const app = require('../../app')
const assert = require('assert')

const QUERY = `
query MyQuery {
  test_table(limit: 100) {
    float_column
    int_column
    text_column
    time_column
  }
}
`

// const HEADER = `[float_column, int_column, text_column, time_column]`
const HEADER = ['int_column', 'float_column', 'time_column', 'text_column']

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
        // Check headers
        // console.log(res.header)
        assert(
          res.header['content-disposition'] ==
            'attachment; filename="download.json";'
        )
        assert(res.header['content-type'] == 'application/json; charset=utf-8')
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
        assert(
          res.header['content-disposition'] ==
            'attachment; filename="download.json";'
        )
        assert(res.header['content-type'] == 'application/json; charset=utf-8')
        // check that is a JSON
        JSON.parse(res.text)
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
        console.log(res.header)
        assert(
          res.header['content-disposition'] ==
            'attachment; filename="download.csv";'
        )
        assert(res.header['content-type'] == 'text/csv; charset=utf-8')
        // check that is a CSV
        const pipeSeparated = res.text
          .split('\n')
          .filter((line) => line.length > 0)
          .every((line) => line.includes(','))
        // console.log('pipe Separated = ', pipeSeparated)
        assert(pipeSeparated)
        done()
      })
  })

  it('should return pipe-separated-CSV when format=CSV and field_separator=|', function (done) {
    request(app)
      .post('/v1/download?format=csv&field_separator=|')
      .send({
        query: QUERY,
      })
      .expect(200)
      .end(function (err, res) {
        console.log('ERROR = ', err)
        // console.log('response TEXT: ', res.text)
        // console.log('response BODY: ', res.body)
        console.log(res.header)
        assert(
          res.header['content-disposition'] ==
            'attachment; filename="download.csv";'
        )
        assert(res.header['content-type'] == 'text/csv; charset=utf-8')
        // check that is a pipe-separated-CSV
        const pipeSeparated = res.text
          .split('\n')
          .filter((line) => line.length > 0)
          .every((line) => line.includes('|'))
        // console.log('pipe Separated = ', pipeSeparated)
        assert(pipeSeparated)

        done()
      })
  })

  it('should return columns in specified ORDER when adding headers to the call', function (done) {
    request(app)
      .post('/v1/download?format=csv')
      .send({
        query: QUERY,
        header: HEADER,
      })
      .expect(200)
      .end(function (err, res) {
        console.log('ERROR = ', err)
        // console.log('response TEXT: ', res.text)
        // console.log('response BODY: ', res.body)
        console.log(res.header)
        assert(
          res.header['content-disposition'] ==
            'attachment; filename="download.csv";'
        )
        assert(res.header['content-type'] == 'text/csv; charset=utf-8')
        // check that the header is ordered
        const headerLine = res.text.split('\n')[0].split(',')
        // console.log('header line = ', headerLine, HEADER)
        assert(headerLine.length === HEADER.length)
        const matchingHeader = headerLine
          .map(function (e, i) {
            // console.log(
            //   'matching header',
            //   e.trim() == HEADER[i].trim(),
            //   e,
            //   HEADER[i]
            // )
            return e.trim() == HEADER[i].trim()
          })
          .every((e) => e == true)

        assert(matchingHeader)

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
        console.log(res.header)
        assert(
          res.header['content-disposition'] ==
            'attachment; filename="download.xlsx";'
        )
        assert(
          res.header['content-type'] ==
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        // check that is an Excel file
        done()
      })
  })

  it('should return 400 when asked format is not supported', function (done) {
    request(app)
      .post('/v1/download?format=not_supported')
      .send({
        query: QUERY,
      })
      .expect(400)
      .end(function (err, res) {
        console.log('ERROR = ', err)
        assert(res.statusCode === 400)
        console.log(res.statusCode)
        console.log(
          res.text ===
            'Bad format. Supported Formats: ["json","csv","xlsx","ods"]'
        )
        done()
      })
  })
})
