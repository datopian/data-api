require('dotenv').config()

var createError = require('http-errors')
var express = require('express')
var cors = require('cors')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var proxy = require('express-http-proxy')
const url = require('url')

var indexRouter = require('./routes/index')

var app = express()
app.use(cors())

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/', indexRouter)

app.use(
  '/v1/graphql',
  proxy(process.env.HASURA_URL, {
    proxyReqPathResolver: (req) => url.parse(req.baseUrl).path,
  })
)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // send error
  const status = err.status || 500
  res.status(status)
  res.send('error: ' + status)
})

module.exports = app
