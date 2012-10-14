var spawn = require('child_process').spawn
  , path  = require('path')
  , Stream = require('stream').Stream

module.exports = function (lang, format, opts) {
  var exec = spawn(path.join(__dirname, 'vendor/pygments/pygmentize'), [ '-f', format, '-l', lang, '-P', 'encoding=utf8' ])
    , stdout = []
    , stderr = ''

  return {
    fromString: function(code, callback) {
      exec.stdout.on('data', function(data) {
        stdout.push(data);
      })
      exec.stderr.on('data', function (data) {
        stderr += data.toString();
      })
      exec.on('exit', function (code) {
        if (code !== 0) return callback('Error: ' + stderr)

        var buf = new Buffer(stdout.reduce(function (p, c) { return p + c.length }, 0))
          , i = 0

        stdout.forEach(function(s) {
          s.copy(buf, i, 0, s.length);
          i += s.length;
        })

        callback(null, buf);
      })
      exec.stdin.write(code);
      exec.stdin.end();
    },

    fromStream: function() {
      var stream = new Stream();

      stream.writable = true;
      stream.readable = true;

      exec.stdout.on('data', function(data) {
        stream.emit('data', data);
      })

      exec.stderr.on('data', function (data) {
        stderr += data.toString();
      })

      exec.on('exit', function (code) {
        if (code !== 0) {
          stream.emit('error', stderr);
        } else {
          stream.emit('end');
        }
      })

      stream.write = function(data) {
        exec.stdin.write(data);
      }

      stream.end = function() {
        exec.stdin.end();
      }

      stream.destroy = function() {
        stream.emit("close");
      }

      return stream;
    }
  }
}
