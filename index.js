var prettyBytes = require('prettier-bytes')
var jsonParse = require('fast-json-parse')
var prettyMs = require('pretty-ms')
var padLeft = require('pad-left')
var chalk = require('chalk')
var nl = '\n'

var emojiLog = {
  warn: '⚠️',
  info: '✨',
  error: '🚨',
  debug: '🐛',
  fatal: '💀',
  trace: '🔍'
}

function isWideEmoji (character) {
  return character !== '⚠️'
}

function isObject (input) {
  return Object.prototype.toString.apply(input) === '[object Object]'
}

function isPinoLog (log) {
  return log && (log.hasOwnProperty('v') && log.v === 1)
}

module.exports = PinoColada

function PinoColada () {
  return parse

  function parse (inputData) {
    var obj
    if (typeof inputData === 'string') {
      var parsedData = jsonParse(inputData)
      if (!parsedData.value || parsedData.err || !isPinoLog(parsedData.value)) {
        return inputData + nl
      }
      obj = parsedData.value
    } else if (isObject(inputData) && isPinoLog(inputData)) {
      obj = inputData
    } else {
      return inputData + nl
    }

    if (!obj.level) return inputData + nl
    if (!obj.message) obj.message = obj.msg
    if (typeof obj.level === 'number') convertLogNumber(obj)

    return output(obj) + nl
  }

  function convertLogNumber (obj) {
    if (obj.level === 10) obj.level = 'trace'
    if (obj.level === 20) obj.level = 'debug'
    if (obj.level === 30) obj.level = 'info'
    if (obj.level === 40) obj.level = 'warn'
    if (obj.level === 50) obj.level = 'error'
    if (obj.level === 60) obj.level = 'fatal'
  }

  function output (obj) {
    var output = []

    if (!obj.level) obj.level = 'userlvl'
    if (!obj.name) obj.name = ''
    if (!obj.ns) obj.ns = ''

    output.push(formatDate())
    output.push(formatLevel(obj.level))
    output.push(formatNs(obj.ns))
    output.push(formatName(obj.name))
    output.push(formatMessage(obj))

    var req = obj.req
    var res = obj.res
    var statusCode = (res) ? res.statusCode : obj.statusCode
    var responseTime = obj.responseTime || obj.elapsed
    var method = (req) ? req.method : obj.method
    var contentLength = obj.contentLength
    var url = (req) ? req.url : obj.url

    if (method != null) {
      output.push(formatMethod(method))
      output.push(formatStatusCode(statusCode))
    }
    if (url != null) output.push(formatUrl(url))
    if (contentLength != null) output.push(formatBundleSize(contentLength))
    if (responseTime != null) output.push(formatLoadTime(responseTime))

    return output.filter(noEmpty).join(' ')
  }

  function formatDate () {
    var date = new Date()
    var hours = padLeft(date.getHours().toString(), 2, '0')
    var minutes = padLeft(date.getMinutes().toString(), 2, '0')
    var seconds = padLeft(date.getSeconds().toString(), 2, '0')
    var prettyDate = hours + ':' + minutes + ':' + seconds
    return chalk.gray(prettyDate)
  }

  function formatLevel (level) {
    const emoji = emojiLog[level]
    const padding = isWideEmoji(emoji) ? '' : ' '
    return emoji + padding
  }

  function formatNs (name) {
    return chalk.cyan(name)
  }

  function formatName (name) {
    return chalk.blue(name)
  }

  function formatMessage (obj) {
    var msg = formatMessageName(obj.message)
    if (obj.level === 'error') return chalk.red(msg)
    if (obj.level === 'trace') return chalk.white(msg)
    if (obj.level === 'warn') return chalk.magenta(msg)
    if (obj.level === 'debug') return chalk.yellow(msg)
    if (obj.level === 'info' || obj.level === 'userlvl') return chalk.green(msg)
    if (obj.level === 'fatal') {
      var pretty = chalk.white.bgRed(msg)
      return obj.stack
        ? pretty + nl + obj.stack
        : pretty
    }
  }

  function formatUrl (url) {
    return chalk.white(url)
  }

  function formatMethod (method) {
    return chalk.white(method)
  }

  function formatStatusCode (statusCode) {
    statusCode = statusCode || 'xxx'
    return chalk.white(statusCode)
  }

  function formatLoadTime (elapsedTime) {
    var elapsed = parseInt(elapsedTime, 10)
    var time = prettyMs(elapsed)
    return chalk.gray(time)
  }

  function formatBundleSize (bundle) {
    var bytes = parseInt(bundle, 10)
    var size = prettyBytes(bytes).replace(/ /, '')
    return chalk.gray(size)
  }

  function formatMessageName (message) {
    if (message === 'request') return '<--'
    if (message === 'response') return '-->'
    return message
  }

  function noEmpty (val) {
    return !!val
  }
}
