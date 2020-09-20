const request = require('supertest')
// const app = require('../../app')
const { buildQueryForData, queryForData, buildParametrableQuery } = require('../../routes/queryGraphQL')
var assert = require('assert')
const { gql } = require('graphql-request')
const expect = require('chai').expect


const mockFrictionlessTableSchema = {
  fields: [
    {
      name: 'float_column',
      type: {name:'float8'},
    },
    {
      name: 'int_column',
      type: {name:'Int'},
    },
    {
      name: 'text_column',
      type: {name:'String'},
    },
    {
      name: 'time_column',
      type: {name:'timestamp'},
    },
  ],
}

describe('graphqlQueryBuilder', function () {

  // describe('function queryForData', function () {
  //   it('should return 404 for non existing resouce id', async function () {
  //     params = {
  //       resource_id: 'non_existing_table',
  //       fields: ['int_column', 'text_column', 'float_column', 'time_column'],
  //       limit: 10
  //     }
  //     assert.throw(function() { (await queryForData(mockFrictionlessTableSchema, params))}, Error, /Error thrown/)
  //   })

  //   it('should execute simple query without filters', async function () {

  //     const limit = 10
  //     params = {
  //       resource_id: 'test_table',
  //       fields: ['int_column', 'text_column', 'float_column', 'time_column'],
  //       limit: limit
  //     }

  //     const result = await queryForData(mockFrictionlessTableSchema, params)
  //     console.log(JSON.stringify(result))
  //     expect(result).to.be.a('array')
  //     expect(result.length).to.be.equal(limit)
  //   })
  // })
  describe('function buildParametrableQuery', function () {
  
    it('builds a result query with all possible query params', function () {
  
      const result = buildParametrableQuery(mockFrictionlessTableSchema, {
        resource_id: 'test_table',
        fields: ['int_column', 'text_column', 'float_column', 'time_column'],
        limit: 11,
        // order_by: {'int_column':'asc', 'text_column':'desc'}, // not implemented yet
        distinct_on: ['int_column', 'float_column'],
        offset: 5
      })
      // console.log("Parametrable query built: " + JSON.stringify(result))
      expect(result).to.be.a('string')
      expect(result).to.include('float_column: { _eq: $cond_float_column }')
      expect(result).to.include('int_column: { _eq: $cond_int_column }')
      expect(result).to.include('text_column: { _eq: $cond_text_column }')
      expect(result).to.include('time_column: { _eq: $cond_time_column }')
      // limit
      expect(result).to.include('limit: 11')
      // expect(result).to.include('limit: $limit')  // FUTURE
      expect(result).to.include('offset: $offset')  
      expect(result).to.include('distinct_on: [int_column, float_column]')
      // expect(result).to.include(`order_by: {'int_column':'asc','text_column':'desc'}`)  // FUTURE
      // TODO more conditions
    })
  
  })
  

})



