# Pygmentize (Bundled)

A simple wrapper around Python's Pygments code formatter, with Pygments
bundled.

This fork of [rvagg's original code](https://github.com/rvagg/node-pygmentize-bundled) implements a streaming API so that you can syntax highlight from a stream.

Similar to [pksunkara's pygments.js](https://github.com/pksunkara/pygments.js) but this comes bundled with Pygments so it doesn't need to be installed on your system, you just need to have Python.

The string interface is very simple:

```js
var pygmentize = require('pygmentize-bundled')

pygmentize('js', 'html').fromString('var a = "b";', function (err, result) {
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

A streaming API is also available:

```js
var pygmentize = require('pygmentize-bundled')

process.stdin.pipe(
  pygmentize('js', 'html').fromStream()
).pipe(process.stdout);
```

## API

**pygmentize(lang, format).fromString(code, callback)**

**pygmentize(lang, format).fromStream()**

Refer to the [Pygments documentation](http://pygments.org/docs/). For supported languages, see the list of [lexers](http://pygments.org/docs/lexers/), for supported formatted, see the list of [formatters](http://pygments.org/docs/formatters/).

Licence & copyright
-------------------

Pygments (Bundled) is Copyright (c) 2012 Rod Vagg <@rvagg> and licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.

Pygments is licenced under the BSD licence.