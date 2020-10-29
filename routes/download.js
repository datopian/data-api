const { request, gql } = require('graphql-request')
const { app } = require('../app')
// For json to csv conversion:
//   https://www.npmjs.com/package/json2csv
//   https://github.com/zemirco/json2csv
//
// For json to XLSX conversion (it can also support csv and other tabular formats)
//   https://www.npmjs.com/package/xlsx
//   https://github.com/SheetJS/sheetjs

function json2csv(jsn) {
  // TODO this is a dummy function for the moment
  return jsn
}

function json2xlsx(jsn) {
  // TODO this is a dummy function for the moment
  return jsn
}

module.exports = {
  json2csv,
  json2xlsx,
}
