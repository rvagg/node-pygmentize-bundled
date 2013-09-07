# -*- coding: utf-8 -*-
"""
    Pygments HTML formatter tests
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: Copyright 2006-2012 by the Pygments team, see AUTHORS.
    :license: BSD, see LICENSE for details.
"""

import os
import re
import unittest
import io
import tempfile
from os.path import join, dirname, isfile

from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter, NullFormatter
from pygments.formatters.html import escape_html
from pygments.util import uni_open

import support

TESTFILE, TESTDIR = support.location(__file__)

fp = uni_open(TESTFILE, encoding='utf-8')
try:
    tokensource = list(PythonLexer().get_tokens(fp.read()))
finally:
    fp.close()


class HtmlFormatterTest(unittest.TestCase):
    def test_correct_output(self):
        hfmt = HtmlFormatter(nowrap=True)
        houtfile = io.StringIO()
        hfmt.format(tokensource, houtfile)

        nfmt = NullFormatter()
        noutfile = io.StringIO()
        nfmt.format(tokensource, noutfile)

        stripped_html = re.sub('<.*?>', '', houtfile.getvalue())
        escaped_text = escape_html(noutfile.getvalue())
        self.assertEqual(stripped_html, escaped_text)

    def test_external_css(self):
        # test correct behavior
        # CSS should be in /tmp directory
        fmt1 = HtmlFormatter(full=True, cssfile='fmt1.css', outencoding='utf-8')
        # CSS should be in TESTDIR (TESTDIR is absolute)
        fmt2 = HtmlFormatter(full=True, cssfile=join(TESTDIR, 'fmt2.css'),
                             outencoding='utf-8')
        tfile = tempfile.NamedTemporaryFile(suffix='.html')
        fmt1.format(tokensource, tfile)
        try:
            fmt2.format(tokensource, tfile)
            self.assertTrue(isfile(join(TESTDIR, 'fmt2.css')))
        except IOError:
            # test directory not writable
            pass
        tfile.close()

        self.assertTrue(isfile(join(dirname(tfile.name), 'fmt1.css')))
        os.unlink(join(dirname(tfile.name), 'fmt1.css'))
        try:
            os.unlink(join(TESTDIR, 'fmt2.css'))
        except OSError:
            pass

    def test_all_options(self):
        for optdict in [dict(nowrap=True),
                        dict(linenos=True),
                        dict(linenos=True, full=True),
                        dict(linenos=True, full=True, noclasses=True)]:

            outfile = io.StringIO()
            fmt = HtmlFormatter(**optdict)
            fmt.format(tokensource, outfile)

    def test_linenos(self):
        optdict = dict(linenos=True)
        outfile = io.StringIO()
        fmt = HtmlFormatter(**optdict)
        fmt.format(tokensource, outfile)
        html = outfile.getvalue()
        self.assertTrue(re.search("<pre>\s+1\s+2\s+3", html))

    def test_linenos_with_startnum(self):
        optdict = dict(linenos=True, linenostart=5)
        outfile = io.StringIO()
        fmt = HtmlFormatter(**optdict)
        fmt.format(tokensource, outfile)
        html = outfile.getvalue()
        self.assertTrue(re.search("<pre>\s+5\s+6\s+7", html))

    def test_lineanchors(self):
        optdict = dict(lineanchors="foo")
        outfile = io.StringIO()
        fmt = HtmlFormatter(**optdict)
        fmt.format(tokensource, outfile)
        html = outfile.getvalue()
        self.assertTrue(re.search("<pre><a name=\"foo-1\">", html))

    def test_lineanchors_with_startnum(self):
        optdict = dict(lineanchors="foo", linenostart=5)
        outfile = io.StringIO()
        fmt = HtmlFormatter(**optdict)
        fmt.format(tokensource, outfile)
        html = outfile.getvalue()
        self.assertTrue(re.search("<pre><a name=\"foo-5\">", html))

    def test_valid_output(self):
        # test all available wrappers
        fmt = HtmlFormatter(full=True, linenos=True, noclasses=True,
                            outencoding='utf-8')

        handle, pathname = tempfile.mkstemp('.html')
        tfile = os.fdopen(handle, 'w+b')
        fmt.format(tokensource, tfile)
        tfile.close()
        catname = os.path.join(TESTDIR, 'dtds', 'HTML4.soc')
        try:
            import subprocess
            po = subprocess.Popen(['nsgmls', '-s', '-c', catname, pathname],
                                  stdout=subprocess.PIPE)
            ret = po.wait()
            output = po.stdout.read()
            po.stdout.close()
        except OSError:
            # nsgmls not available
            pass
        else:
            if ret:
                print(output)
            self.assertFalse(ret, 'nsgmls run reported errors')

        os.unlink(pathname)

    def test_get_style_defs(self):
        fmt = HtmlFormatter()
        sd = fmt.get_style_defs()
        self.assertTrue(sd.startswith('.'))

        fmt = HtmlFormatter(cssclass='foo')
        sd = fmt.get_style_defs()
        self.assertTrue(sd.startswith('.foo'))
        sd = fmt.get_style_defs('.bar')
        self.assertTrue(sd.startswith('.bar'))
        sd = fmt.get_style_defs(['.bar', '.baz'])
        fl = sd.splitlines()[0]
        self.assertTrue('.bar' in fl and '.baz' in fl)

    def test_unicode_options(self):
        fmt = HtmlFormatter(title='Föö',
                            cssclass='bär',
                            cssstyles='div:before { content: \'bäz\' }',
                            encoding='utf-8')
        handle, pathname = tempfile.mkstemp('.html')
        tfile = os.fdopen(handle, 'w+b')
        fmt.format(tokensource, tfile)
        tfile.close()
