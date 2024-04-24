import MarkdownIt from "markdown-it"

import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascript);

import typescript from 'highlight.js/lib/languages/typescript';
hljs.registerLanguage('typescript', typescript);

import json from 'highlight.js/lib/languages/json';
hljs.registerLanguage('json', json);

import xml from 'highlight.js/lib/languages/xml';
hljs.registerLanguage('xml', xml);
hljs.registerAliases('html', { languageName: 'xml' })

import css from 'highlight.js/lib/languages/css';
hljs.registerLanguage('css', css);

import scss from 'highlight.js/lib/languages/scss';
hljs.registerLanguage('scss', scss);

import "@/styles/highlight.scss"
import 'highlight.js/styles/atom-one-dark.css'

const markdown: any = ref(new MarkdownIt({
    highlight (code, language) {
        if (language && hljs.getLanguage(language)) {
            const copyHtml: string = `<button class="highlight-copy-btn" type="button">copy</button>`
            try {
                return '<pre class="hljs highlight-pre">' + copyHtml + '<code class="highlight-code">' +
                    hljs.highlight(code, { language, ignoreIllegals: true }).value +
                    '</code></pre>';
            } catch (__) { }
        }
        return '<pre class="hljs highlight-pre"><code class="highlight-code">' + markdown.value.utils.escapeHtml(code) + '</code></pre>';
    }
}))
export default markdown
