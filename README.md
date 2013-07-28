# Pygmentize (Bundled)

A simple wrapper around Python's Pygments code formatter, with Pygments bundled.

Available as a simple *String-in, Buffer-out* interface and also as a *read/write-Stream* interface.


## API

**pygmentize(options, code, callback)**

Pygmentize a given `code` string and return it as a Buffer to the `callback` Function.

* `options` contains options to be passed to Pygments (see [Options](#options)).
* `code` is a String to be formatted.
* `callback` is a Function, called when complete. The first argument will be an `error` object/string if there was a problem and the second argument will be a Buffer containing your formatted code.

**pygmentize(options)**

When you only supply the `options` argument, it will return a read/write Stream that you can pipe to and from to format your code.

* `options` contains options to be passed to Pygments (see [Options](#options)).


## Options

Language/lexer, formatter, and their options are currently supported. Filters are not supported yet.

* `lang`: source language/lexer name - `string`
* `format`: output formatter name - `string`
* `options`: lexer and formatter options - `object`


## Examples

The string interface is very simple:

```js
var pygmentize = require('pygmentize-bundled')

pygmentize({ lang: 'js', format: 'html' }, 'var a = "b";', function (err, result) {
  console.log(result.toString())
})
```

Results in:

```html
<div class="highlight"><pre>
  <span class="kd">var</span>
  <span class="nx">a</span>
  <span class="o">=</span>
  <span class="s2">&quot;b&quot;</span>
  <span class="p">;</span>
</pre></div>
```

Example with extra options:

```js
var pygmentize = require('pygmentize-bundled')

pygmentize({ lang: 'php', format: 'html', options: { startinline: 1 } }, 'var a = true;', function (err, result) {
  console.log(result.toString())
})
```

A streaming API is also available. Simply omit the `code` and `callback` arguments:

```js
var pygmentize = require('pygmentize-bundled')

process.stdin.pipe(
  pygmentize({ lang: 'js', format: 'html' })
).pipe(process.stdout);
```

Refer to the [Pygments documentation](http://pygments.org/docs/). For supported languages, see the list of [lexers](http://pygments.org/docs/lexers/), for supported formatted, see the list of [formatters](http://pygments.org/docs/formatters/).


## Contributors

* [Rod Vagg](https://github.com/rvagg)
* [Cyril Rohr](https://github.com/crohr)
* [Ahmed Fasih](https://github.com/fasiha)
* [Scott Walkinshaw](https://github.com/swalkinshaw)

## Licence & copyright

Pygments (Bundled) is Copyright (c) 2012 Rod Vagg <@rvagg> and licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.

Pygments is licenced under the BSD licence.
