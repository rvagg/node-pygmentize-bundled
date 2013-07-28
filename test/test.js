var assert = require('assert')
  , pygments = require('../')
  , fs = require('fs')
  , streamEqual = require('stream-equal')
  , timeout

  , cases = [
        {
            lang: 'js'
          , format: 'html'
          , input: 'var a = "b";'
          , output: '<div class="highlight"><pre><span class="kd">var</span> <span class="nx">a</span> <span class="o">=</span> <span class="s2">&quot;b&quot;</span><span class="p">;</span></pre></div>'
        }
      , {
            lang: 'c++'
          , format: 'console'
          , input: 'bool a = true;'
          , output: '\u001b[36mbool\u001b[39;49;00m \u001b[39;49;00ma\u001b[39;49;00m \u001b[39;49;00m=\u001b[39;49;00m \u001b[39;49;00m\u001b[34mtrue\u001b[39;49;00m;\u001b[39;49;00m'
        }
      , {
            lang: 'php'
          , format: 'html'
          , input: 'var a = true;'
          , output: '<div class="highlight"><pre><span class="x">var a = true;</span></pre></div>'
        }
      , {
            lang: 'php'
          , format: 'html'
          , options: { startinline: 1 }
          , input: 'var a = true;'
          , output: '<div class="highlight"><pre><span class="k">var</span> <span class="nx">a</span> <span class="o">=</span> <span class="k">true</span><span class="p">;</span></pre></div>'
        }
    ]

cases.forEach(function (c) {
  pygments({ lang: c.lang, format: c.format, options: c.options || {} }, c.input, function (err, result) {
    assert.equal(err, null)
    result = result.toString().replace(/\n/g, '')
    assert.equal(result, c.output)
    clearTimeout(timeout)
  })
})

var fileIn = fs.createReadStream(__dirname + '/fixtures/active_model.rb')
var fileOut = fs.createWriteStream(__dirname + '/fixtures/active_model.tmp', { flags: 'w+', encoding: null, mode: 0666 })

fileIn.pipe(pygments({ lang: 'rb', format: 'html' })).pipe(fileOut)

fileOut.on("close", function() {
  var expectedResult = fs.createReadStream(__dirname + '/fixtures/active_model.html')
  var result = fs.createReadStream(__dirname + '/fixtures/active_model.tmp')

  streamEqual(expectedResult, result, function(err, equal) {
    if(err) throw err
    assert.equal(equal, true)
  })
})

timeout = setTimeout(function () {
  assert(false, 'Callback not called!')
}, 500)
