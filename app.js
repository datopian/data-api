require('dotenv').config()

var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var proxy = require('express-http-proxy')
const url = require('url')

var indexRouter = require('./routes/index')

var app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
// No need for static dir for now as we're building an API only app
// app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter)

// TODO: maybe moving redirection out of nodejs
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
