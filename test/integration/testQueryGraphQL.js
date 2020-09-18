const request = require('supertest')
const { buildQueryForData, queryForData, buildParametrableQuery } = require('../../routes/queryGraphQL')
var assert = require('assert')
const { gql } = require('graphql-request')
const expect = require('chai').expect


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

describe('graphqlQueryBuilder', function () {
  describe('queryForData', function () {
    it('should return 404 for non existing resouce id', async function () {
      params = {
        resource_id: 'non_existing_table',
        fields: ['int_column', 'text_column', 'float_column', 'time_column'],
        limit: 10
      }
      assert.throw(function() { (await queryForData(mockFrictionlessTableSchema, params))}, Error, /Error thrown/)
    })

    it('should execute simple query without filters', async function () {

      const limit = 10
      params = {
        resource_id: 'test_table',
        fields: ['int_column', 'text_column', 'float_column', 'time_column'],
        limit: limit
      }

      const result = await queryForData(mockFrictionlessTableSchema, params)
      console.log(JSON.stringify(result))
      expect(result).to.be.a('array')
      expect(result.length).to.be.equal(limit)
    })
  })

  describe('function buildQueryForData', function () {
    it('builds a result query with all possible q params', function () {

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


  describe('function buildParametrableQuery', function () {
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
  
    it('builds a result query with all possible query params', function () {
  
      const result = buildParametrableQuery(mockFrictionlessTableSchema, {
        resource_id: 'test_table',
        fields: ['int_column', 'text_column', 'float_column', 'time_column'],
        limit: 11,
        order_by: {'int_column':'asc', 'text_column':'desc'},
        distinct_on: ['int_column', 'float_column'],
        offset: 5
      })
      console.log("Parametrable query built: " + JSON.stringify(result))
      expect(result).to.be.a('string')
      expect(result).to.include('float_column: { _eq: $cond_float_column }')
      expect(result).to.include('int_column: { _eq: $cond_int_column }')
      expect(result).to.include('text_column: { _eq: $cond_text_column }')
      expect(result).to.include('time_column: { _eq: $cond_time_column }')
      // limit
      expect(result).to.include('limit: $limit')
      expect(result).to.include('offset: $offset')
      expect(result).to.include('distinct_on: [int_column, float_column]')
      // expect(result).to.include(`order_by: {'int_column':'asc','text_column':'desc'}`)
      // TODO more conditions
    })
  
  })
  

})



