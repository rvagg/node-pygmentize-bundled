var spawn           = require('child_process').spawn
  , path            = require('path')
  , Stream          = require('stream').Stream

  , defaultFormat   = 'html'
  , defaultLang     = 'js'
  , defaultEncoding = 'utf8'

  , fromString = function(exec, code, callback) {
      var stdout = []
        , stderr = ''
        , ec     = 0
        , exitClose = function () {
            if (++ec < 2) return

            var buf = new Buffer(stdout.reduce(function (p, c) { return p + c.length }, 0))
              , i = 0

            stdout.forEach(function(s) {
              s.copy(buf, i, 0, s.length)
              i += s.length
            })

            callback(null, buf)
          }

      exec.stdout.on('data', function(data) {
        stdout.push(data)
      })

      exec.stderr.on('data', function (data) {
        stderr += data.toString()
      })

      exec.on('exit', function (code) {
        if (code !== 0) {
          ec = -1
          return callback('Error: ' + stderr)
        }
        exitClose()
      })
      exec.on('close', exitClose)

      exec.stdin.write(code)
      exec.stdin.end()
    }

  , fromStream = function(exec) {
      var stream = new Stream()
        , stderr = ''

      stream.writable = true
      stream.readable = true

      exec.stdout.on('data', function(data) {
        stream.emit('data', data)
      })

      exec.stderr.on('data', function (data) {
        stderr += data.toString()
      })

      exec.on('exit', function (code) {
        if (code !== 0) {
          stream.emit('error', stderr)
        } else {
          stream.emit('end')
        }
      })

      stream.write = function(data) {
        exec.stdin.write(data)
      }

      stream.end = function() {
        exec.stdin.end()
      }

      stream.destroy = function() {
        stream.emit("close")
      }

      return stream
    }

  , pygmentize = function (options, code, callback) {
      options = options || {}

      var execArgs = [
              '-f', options.format || defaultFormat
            , '-l', options.lang || defaultLang
            , '-P', 'encoding=' + (options.encoding || defaultEncoding)
          ]

      if (options.options) {
        for (var option in options.options) {
          execArgs.push('-P', option + '=' + options.options[option])
        }
      }

      var exec = spawn("python", [path.join(__dirname, 'vendor/pygments/pygmentize')].concat(execArgs))

      return typeof code == 'string' && typeof callback == 'function'
        ? fromString(exec, code, callback)
        : fromStream(exec)
    }

module.exports = pygmentize
