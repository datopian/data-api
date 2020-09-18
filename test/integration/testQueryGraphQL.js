const request = require('supertest')
const { buildQueryForData, queryForData } = require('../../routes/queryGraphQL')
var assert = require('assert')
const { gql } = require('graphql-request')
const expect = require('chai').expect

describe('graphqlQueryBuilder', function () {
  describe('function queryForData', function () {
    it('should return 404 for non existing page', function (done) {
      console.log(process.env.HASURA_URL)
      done()

      // console.log('some')
    })
  })

  describe('function buildQueryForData', function () {
    it('builds a result query with all possible q params', function () {
      const mockFrictionlessTableSchema = {
        fields: [
          {
            name: 'float_column',
            type: 'float8',
          },
          {
            name: 'int_column',
            type: 'Int',
          },
          {
            name: 'text_column',
            type: 'String',
          },
          {
            name: 'time_column',
            type: 'timestamp',
          },
        ],
      }

      const result = buildQueryForData(mockFrictionlessTableSchema, {
        resource_id: 'test_table',
        fields: ['int_column', 'text_column', 'float_column', 'time_column'],
        limit: 10,
      })
      console.log(result)
      expect(result).to.be.a('string')
      expect(result).to.include('float_column: { _eq: $float_column }')
      expect(result).to.include('int_column: { _eq: $int_column }')
      expect(result).to.include('text_column: { _eq: $text_column }')
      expect(result).to.include('time_column: { _eq: $time_column }')
    })
  })
})
