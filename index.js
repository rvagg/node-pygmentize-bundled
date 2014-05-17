const spawn           = require('child_process').spawn
    , exec            = require('child_process').exec
    , path            = require('path')
    , fs              = require('fs')
    , os              = require('os')
    , PassThrough     = require('readable-stream/passthrough')
    , mkdirp          = require('mkdirp')
    , bl              = require('bl')
    , through2        = require('through2')

    , defaultFormat   = 'html'
    , defaultLang     = 'js'
    , defaultEncoding = 'utf8'
    // This will create a RegExp for OS specific EOL character(s)
    , osEolRegExp = new RegExp( os.EOL.toString(), 'g' )

var pythonVersions = {}

function fromString (child, code, options, callback) {
  var stdout = bl()
    , stderr = bl()
    , ec     = 0
    , exitClose = function () {
        if (++ec < 2)
          return
        
        var ret = stdout.slice()
        // If particular EOL are expected, we need to replace all of
        // the OS specific EOL and change them to the desired ones
        if (options.eol && options.eol !== os.EOL) {
          ret = ret.toString().replace(osEolRegExp, options.eol)
          // Cast back to the Buffer type
          ret = new Buffer(ret, options.encoding || defaultEncoding)
        }
        
        return callback(null, ret)
      }

  child.stdout.pipe(stdout)
  child.stderr.pipe(stderr)

  child.on('exit', function (code) {
    if (code !== 0) {
      ec = -1
      return callback(new Error('Error calling `pygmentize`: ' + stderr.toString()))
    }
    exitClose()
  })
  child.on('close', exitClose)

  child.stdin.write(code)
  child.stdin.end()
}

function fromStream (retStream, intStream, options, child) {
  var stderr    = bl()
    , outStream = through2(function (chunk, enc, callback) {
        // If particular EOL are expected, we need to replace all of
        // the OS specific EOL and change them to the desired ones
        if (options.eol && options.eol !== os.EOL) {
          chunk = chunk.toString().replace(osEolRegExp, options.eol)
          chunk = new Buffer(chunk, options.encoding || defaultEncoding)
        }
        
        retStream.__write(chunk, enc, callback)
      })

  intStream.pipe(child.stdin)
  child.stdout.pipe(outStream)
  child.stderr.pipe(stderr)

  child.on('exit', function (code) {
    if (code !== 0)
      retStream.emit('error', stderr.toString())
    retStream.__end()
  })
}

function pygmentize (options, code, callback) {
  options = options || {}

  var execArgs = [
          '-f', options.format || defaultFormat
        , '-l', options.lang || defaultLang
        , '-P', 'encoding=' + (options.encoding || defaultEncoding)
      ]
    , toString  = typeof code == 'string' && typeof callback == 'function'
    , retStream = !toString && through2()
    , intStream = !toString && through2()

  if (typeof options.options == 'object') {
    Object.keys(options.options).forEach(function (key) {
      execArgs.push('-P', key + '=' + options.options[key])
    })
  }

  spawnPygmentize(options, execArgs, function (err, child) {
    if (err)
      return callback(err)
    if (toString)
      return fromString(child, code, options, callback)
    fromStream(retStream, intStream, options, child)
  })

  if (retStream) {
    retStream.__write = retStream.write
    retStream.write = intStream.write.bind(intStream)
    retStream.__end = retStream.end
    retStream.end = intStream.end.bind(intStream)
  }

  return retStream
}

function spawnPygmentize (options, execArgs, callback) {
  var python = typeof options.python == 'string' ? options.python : 'python'

  pythonVersion(python, function (err, version) {
    if (err)
      return callback(err)
    if (version != 2 && version != 3)
      return callback(new Error('Unsupported Python version: ' + version))

    var pyg = path.join(
        __dirname
      , 'vendor/pygments'
      , version == 2 ? 'build-2.7' : 'build-3.3'
      , 'pygmentize'
    )

    callback(null, spawn(python, [ pyg ].concat(execArgs)))
  })
}

function pythonVersion (python, callback) {
  if (pythonVersions[python])
    return callback(null, pythonVersions[python])

  exec(python + ' -V', function (err, stdout, stderr) {
    if (err)
      return callback(err)

    var m = stderr.toString().match(/^Python (\d)[.\d]+/i)
    if (!m)
      m = stdout.toString().match(/^Python (\d)[.\d]+/i)
    if (!m)
      return callback(new Error('Cannot determine Python version: [' + stderr.toString() + ']'))

    pythonVersions[python] = +m[1]

    return callback(null, +m[1])
  })
}

module.exports = pygmentize
