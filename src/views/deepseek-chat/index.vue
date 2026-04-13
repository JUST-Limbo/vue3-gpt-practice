<script setup lang="ts">
import { postDeepseekChatCompletions } from '@/api/deepseekRaw'
import type { DeepseekChatMessage } from '@/api/deepseekRaw'
import CitysWeather from '@/views/deepseek-chat/cmp/citysWeather.vue'
import MarkdownIt from 'markdown-it'

/** 与后端 mock SSE 正文一致 */
const WEATHER_EMBED_MARK = '[[CITY_WEATHER_EMBED]]'

type ToolAccEntry = { name: string; args: string }
type ToolAccMap = Record<number, ToolAccEntry>

type ToolCallDeltaItem = {
    index?: number
    id?: string
    type?: string
    function?: { name?: string; arguments?: string }
}

function splitAssistantContent(content: string): { hasEmbed: boolean; before: string; after: string } {
    const idx = content.indexOf(WEATHER_EMBED_MARK)
    if (idx === -1) {
        return { hasEmbed: false, before: content, after: '' }
    }
    return {
        hasEmbed: true,
        before: content.slice(0, idx),
        after: content.slice(idx + WEATHER_EMBED_MARK.length)
    }
}

function applyToolCallDelta(acc: ToolAccMap, deltaList: ToolCallDeltaItem[]): void {
    for (let i = 0; i < deltaList.length; i += 1) {
        const tc = deltaList[i]
        const idx = typeof tc.index === 'number' ? tc.index : 0
        let slot = acc[idx]
        if (!slot) {
            slot = { name: '', args: '' }
            acc[idx] = slot
        }
        const fn = tc.function
        if (fn) {
            if (typeof fn.name === 'string' && fn.name.length > 0) {
                slot.name = fn.name
            }
            if (typeof fn.arguments === 'string' && fn.arguments.length > 0) {
                slot.args = slot.args + fn.arguments
            }
        }
    }
}

function tryParseWeatherCitiesFromToolAcc(acc: ToolAccMap): any[] {
    const t = acc[0]
    if (!t) {
        return []
    }
    if (t.name !== 'get_cities_weather') {
        return []
    }
    if (!t.args) {
        return []
    }
    try {
        const obj = JSON.parse(t.args) as { cities?: any[] }
        console.log(obj)
        if (obj && Array.isArray(obj.cities)) {
            return obj.cities
        }
    } catch (_e) {
        /* 流式拼接未完成或非 JSON */
    }
    return []
}

function assistantParts(m: DeepseekChatMessage): { hasEmbed: boolean; before: string; after: string } {
    return splitAssistantContent(typeof m.content === 'string' ? m.content : '')
}

function shouldShowWeatherEmbed(m: DeepseekChatMessage): boolean {
    const data = m.weatherTableData
    if (!data || data.length === 0) {
        return false
    }
    return splitAssistantContent(typeof m.content === 'string' ? m.content : '').hasEmbed
}

const model = ref('deepseek-chat')
const inputText = ref('')
const messages = ref<DeepseekChatMessage[]>([])
const streamingText = ref('')
const streamingWeatherTable = ref<any[]>([])
const errorText = ref('')
const loading = ref(false)
type RenderMode = 'text' | 'markdown' | 'markdownHtml'
const renderMode = ref<RenderMode>('markdown')

const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const markdownParser = new MarkdownIt({
    html: false,
    breaks: true,
    linkify: true
})
const markdownHtmlParser = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true
})

const allowedTags: Record<string, boolean> = {
    a: true,
    p: true,
    br: true,
    b: true,
    strong: true,
    i: true,
    em: true,
    code: true,
    pre: true,
    ul: true,
    ol: true,
    li: true,
    blockquote: true,
    h1: true,
    h2: true,
    h3: true,
    h4: true,
    h5: true,
    h6: true
}

function escapeHtml(raw: string): string {
    return raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function sanitizeHtml(rawHtml: string): string {
    if (typeof window === 'undefined') {
        return rawHtml
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(rawHtml, 'text/html')

    function cleanNode(node: Node): void {
        const children: Node[] = []
        for (let i = 0; i < node.childNodes.length; i += 1) {
            const child = node.childNodes[i]
            if (child) {
                children.push(child)
            }
        }

        for (let i = 0; i < children.length; i += 1) {
            const child = children[i]
            if (child.nodeType === Node.ELEMENT_NODE) {
                const el = child as HTMLElement
                const tag = el.tagName.toLowerCase()
                if (!allowedTags[tag]) {
                    const text = doc.createTextNode(el.textContent || '')
                    node.replaceChild(text, el)
                    continue
                }

                const attrs: string[] = []
                for (let j = 0; j < el.attributes.length; j += 1) {
                    const attr = el.attributes[j]
                    if (attr) {
                        attrs.push(attr.name)
                    }
                }

                for (let j = 0; j < attrs.length; j += 1) {
                    const attrName = attrs[j]
                    if (tag === 'a' && (attrName === 'href' || attrName === 'title')) {
                        continue
                    }
                    el.removeAttribute(attrName)
                }

                if (tag === 'a') {
                    const href = el.getAttribute('href') || ''
                    const isHttp = href.startsWith('http://')
                    const isHttps = href.startsWith('https://')
                    const isMailto = href.startsWith('mailto:')
                    if (!isHttp && !isHttps && !isMailto) {
                        el.removeAttribute('href')
                    } else {
                        el.setAttribute('target', '_blank')
                        el.setAttribute('rel', 'noopener noreferrer')
                    }
                }

                cleanNode(el)
            }
        }
    }

    cleanNode(doc.body)
    return doc.body.innerHTML
}

function renderContent(content: string): string {
    if (renderMode.value === 'text') {
        return escapeHtml(content).replace(/\n/g, '<br />')
    }
    if (renderMode.value === 'markdown') {
        return markdownParser.render(content)
    }
    return sanitizeHtml(markdownHtmlParser.render(content))
}

function syncNetworkStatus() {
    if (typeof navigator === 'undefined') {
        return
    }
    isOnline.value = navigator.onLine
}

onMounted(() => {
    syncNetworkStatus()
    window.addEventListener('online', syncNetworkStatus)
    window.addEventListener('offline', syncNetworkStatus)
})

onBeforeUnmount(() => {
    window.removeEventListener('online', syncNetworkStatus)
    window.removeEventListener('offline', syncNetworkStatus)
})

watch(isOnline, (online) => {
    if (online === false && loading.value) {
        errorText.value = '网络已断开，当前回复可能无法继续完成，请恢复网络后重试'
    }
})

const requestPreview = computed(() => {
    return JSON.stringify(
        {
            model: model.value,
            messages: messages.value,
            stream: true
        },
        null,
        2
    )
})

const streamingParts = computed(() => splitAssistantContent(streamingText.value))

function shouldShowStreamingWeatherEmbed(): boolean {
    if (!streamingText.value) {
        return false
    }
    if (!streamingParts.value.hasEmbed) {
        return false
    }
    if (streamingWeatherTable.value.length === 0) {
        return false
    }
    return true
}

// 解析SSE块
/**
 * use exapmle:
 * data: {"choices":[{"delta":{"content":"hello"},"index":0,"finish_reason":null}]}
 * data: {"choices":[{"delta":{"content":"world"},"index":0,"finish_reason":null}]}
 * data: [DONE]
 * @param block
 */
function parseSseBlock(block: string): string[] {
    const lines = block.split('\n')
    const out: string[] = []
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i].trim()
        if (line.startsWith('data:')) {
            out.push(line.substring(5).trim())
        }
    }
    return out
}

async function sendMessage() {
    const text = inputText.value.trim()
    if (!text || loading.value) {
        return
    }
    if (!isOnline.value) {
        errorText.value = '当前无网络连接，请恢复网络后再试'
        return
    }
    errorText.value = ''
    streamingText.value = ''
    streamingWeatherTable.value = []
    loading.value = true

    const toolAcc: ToolAccMap = {}

    const userMsg: DeepseekChatMessage = { role: 'user', content: text }
    messages.value = messages.value.concat([userMsg])
    inputText.value = ''

    let res: Awaited<ReturnType<typeof postDeepseekChatCompletions>>
    try {
        res = await postDeepseekChatCompletions({
            model: model.value,
            messages: messages.value,
            stream: true
        })
    } catch (e) {
        const err = e instanceof Error ? e.message : '网络错误'
        errorText.value = err
        loading.value = false
        return
    }

    if (!res.ok) {
        const t = await res.text()
        errorText.value = t || '请求失败 ' + String(res.status)
        loading.value = false
        return
    }

    const reader = res.body ? res.body.getReader() : null
    if (!reader) {
        errorText.value = '响应不支持流式读取'
        loading.value = false
        return
    }

    const decoder = new TextDecoder('utf-8')
    let pending = ''
    let full = ''

    try {
        let finished = false
        while (!finished) {
            const result = await reader.read()
            if (result.done) {
                finished = true
                break
            }
            const chunk = result.value
            pending += decoder.decode(chunk, { stream: true })
            const blocks = pending.split('\n\n')
            pending = blocks.pop() || ''

            for (let b = 0; b < blocks.length; b += 1) {
                const dataList = parseSseBlock(blocks[b])
                for (let d = 0; d < dataList.length; d += 1) {
                    const payload = dataList[d]
                    if (payload === '[DONE]') {
                        continue
                    }
                    try {
                        const json = JSON.parse(payload) as {
                            choices?: Array<{
                                delta?: {
                                    content?: string
                                    role?: string
                                    tool_calls?: ToolCallDeltaItem[]
                                }
                            }>
                        }
                        const choices = json.choices
                        if (!choices || choices.length === 0) {
                            continue
                        }
                        const first = choices[0]
                        if (!first) {
                            continue
                        }
                        const delta = first.delta
                        if (!delta) {
                            continue
                        }
                        const toolCalls = delta.tool_calls
                        if (toolCalls && toolCalls.length > 0) {
                            applyToolCallDelta(toolAcc, toolCalls)
                            streamingWeatherTable.value = tryParseWeatherCitiesFromToolAcc(toolAcc)
                            console.log(tryParseWeatherCitiesFromToolAcc(toolAcc))
                        }
                        const c = delta.content
                        if (typeof c === 'string' && c.length > 0) {
                            full += c
                            streamingText.value = full
                        }
                    } catch (_parseErr) {
                        /* 忽略单行解析失败 */
                    }
                }
            }
        }
    } finally {
        reader.releaseLock()
    }

    const finalCities = tryParseWeatherCitiesFromToolAcc(toolAcc)
    const assistantMsg: DeepseekChatMessage = { role: 'assistant', content: full }
    if (finalCities.length > 0) {
        assistantMsg.weatherTableData = finalCities
    }
    messages.value = messages.value.concat([assistantMsg])
    streamingText.value = ''
    streamingWeatherTable.value = []
    loading.value = false
}

function clearChat() {
    messages.value = []
    streamingText.value = ''
    streamingWeatherTable.value = []
    errorText.value = ''
}
</script>

<template>
    <div class="ds-page">
        <header class="ds-header">
            <h1 class="ds-title">DeepSeek 对话（HTTP 接口格式）</h1>
            <p class="ds-desc">
                请求体为 OpenAI
                兼容格式：<code>model</code>、<code>messages</code>、<code>stream</code>；密钥只在服务端。
            </p>
            <RouterLink class="ds-link" to="/">返回首页</RouterLink>
        </header>

        <div v-if="!isOnline" class="ds-offline-banner" role="status">
            当前处于离线状态，无法发送请求；请检查网络连接。
        </div>

        <div class="ds-row">
            <label class="ds-label">model</label>
            <input v-model="model" class="ds-input" type="text" :disabled="loading || !isOnline" />
        </div>
        <div class="ds-row">
            <label class="ds-label">渲染</label>
            <select v-model="renderMode" class="ds-select">
                <option value="text">纯文本</option>
                <option value="markdown">Markdown（禁用 HTML）</option>
                <option value="markdownHtml">Markdown + HTML（白名单清洗）</option>
            </select>
        </div>

        <div class="ds-chat">
            <div
                v-for="(m, idx) in messages"
                :key="idx"
                class="ds-msg"
                :class="'ds-msg--' + m.role"
            >
                <span class="ds-role">{{ m.role }}</span>
                <template v-if="m.role === 'assistant' && shouldShowWeatherEmbed(m)">
                    <div
                        v-if="renderMode === 'text'"
                        class="ds-content"
                    >
                        {{ assistantParts(m).before }}
                    </div>
                    <div
                        v-else
                        class="ds-content ds-content--rich"
                        v-html="renderContent(assistantParts(m).before)"
                    />
                    <CitysWeather :table-data="m.weatherTableData || []" />
                    <div
                        v-if="renderMode === 'text'"
                        class="ds-content"
                    >
                        {{ assistantParts(m).after }}
                    </div>
                    <div
                        v-else
                        class="ds-content ds-content--rich"
                        v-html="renderContent(assistantParts(m).after)"
                    />
                </template>
                <template v-else>
                    <div v-if="renderMode === 'text'" class="ds-content">{{ m.content }}</div>
                    <div v-else class="ds-content ds-content--rich" v-html="renderContent(m.content)" />
                </template>
            </div>
            <div v-if="streamingText" class="ds-msg ds-msg--assistant">
                <span class="ds-role">assistant</span>
                <template v-if="shouldShowStreamingWeatherEmbed()">
                    <div
                        v-if="renderMode === 'text'"
                        class="ds-content"
                    >
                        {{ streamingParts.before }}
                    </div>
                    <div
                        v-else
                        class="ds-content ds-content--rich"
                        v-html="renderContent(streamingParts.before)"
                    />
                    <CitysWeather :table-data="streamingWeatherTable" />
                    <div
                        v-if="renderMode === 'text'"
                        class="ds-content"
                    >
                        {{ streamingParts.after }}
                    </div>
                    <div
                        v-else
                        class="ds-content ds-content--rich"
                        v-html="renderContent(streamingParts.after)"
                    />
                </template>
                <template v-else>
                    <div v-if="renderMode === 'text'" class="ds-content">{{ streamingText }}</div>
                    <div v-else class="ds-content ds-content--rich" v-html="renderContent(streamingText)" />
                </template>
            </div>
        </div>

        <div class="ds-compose">
            <textarea
                v-model="inputText"
                class="ds-textarea"
                rows="3"
                placeholder="输入用户消息…"
                :disabled="loading || !isOnline"
                @keydown.enter.exact.prevent="sendMessage"
            />
            <div class="ds-actions">
                <button type="button" class="ds-btn" :disabled="loading || !isOnline" @click="sendMessage">
                    发送（stream: true）
                </button>
                <button
                    type="button"
                    class="ds-btn ds-btn--ghost"
                    :disabled="loading"
                    @click="clearChat"
                >
                    清空对话
                </button>
            </div>
        </div>

        <p v-if="errorText" class="ds-error">{{ errorText }}</p>

        <details class="ds-details">
            <summary>当前请求 JSON（与发往 /api/deepseek/chat/completions 一致）</summary>
            <pre class="ds-pre">{{ requestPreview }}</pre>
        </details>
    </div>
</template>

<style scoped>
:global(body) {
    background-color: #fafafa;
    color: #303030;
    margin: 0;
    padding: 0;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: auto;
}
.ds-page {
    box-sizing: border-box;
    max-width: 720px;
    width: 100%;
    margin: 0 auto;
    padding: 24px 16px 48px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    color: #1a1a1a;
}

.ds-offline-banner {
    margin: 0 0 16px;
    padding: 10px 14px;
    border-radius: 8px;
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    color: #92400e;
    font-size: 13px;
    line-height: 1.45;
}

.ds-header {
    margin-bottom: 20px;
}

.ds-title {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 700;
}

.ds-desc {
    margin: 0 0 12px;
    line-height: 1.5;
    color: #555;
    font-size: 13px;
}

.ds-link {
    color: #2563eb;
    text-decoration: none;
    font-size: 13px;
}

.ds-link:hover {
    text-decoration: underline;
}

.ds-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.ds-label {
    flex-shrink: 0;
    width: 48px;
    font-weight: 600;
}

.ds-input {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
}

.ds-select {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #fff;
}

.ds-chat {
    min-height: 120px;
    max-height: 360px;
    overflow: auto;
    padding: 12px;
    background: #f4f4f5;
    border-radius: 10px;
    margin-bottom: 16px;
}

.ds-msg {
    margin-bottom: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #fff;
    border: 1px solid #e5e5e5;
}

.ds-msg--user {
    border-left: 3px solid #2563eb;
}

.ds-msg--assistant {
    border-left: 3px solid #16a34a;
}

.ds-role {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 6px;
}

.ds-content {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
}

.ds-content--rich {
    white-space: normal;
}

.ds-content--rich :deep(p) {
    margin: 0 0 8px;
}

.ds-content--rich :deep(pre) {
    margin: 8px 0;
    padding: 10px;
    border-radius: 6px;
    background: #111827;
    color: #e5e7eb;
    overflow: auto;
}

.ds-content--rich :deep(code) {
    background: #f3f4f6;
    border-radius: 4px;
    padding: 1px 4px;
    font-size: 12px;
}

.ds-content--rich :deep(pre code) {
    background: transparent;
    padding: 0;
}

.ds-content--rich :deep(a) {
    color: #2563eb;
    text-decoration: underline;
}

.ds-textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid #ccc;
    border-radius: 8px;
    resize: vertical;
    font-family: inherit;
    font-size: 14px;
}

.ds-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
}

.ds-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: #2563eb;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
}

.ds-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.ds-btn--ghost {
    background: #e5e5e5;
    color: #333;
}

.ds-error {
    color: #b91c1c;
    font-size: 13px;
    margin-top: 12px;
}

.ds-details {
    margin-top: 20px;
    font-size: 13px;
}

.ds-pre {
    margin: 8px 0 0;
    padding: 12px;
    background: #1e1e1e;
    color: #e4e4e7;
    border-radius: 8px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.45;
}
</style>
