/* eslint-env node */
import { Readable } from 'node:stream'

/** 与前端约定一致：正文里用占位符插入 citysWeather 区块 */
const EMBED_MARKER = '[[CITY_WEATHER_EMBED]]'

/** 硬编码模拟「北上广」天气结构化数据（供 tool_calls arguments 使用） */
const HARDCODED_CITIES = [
    { id: 1, name: '北京', weather: '晴', temperature: '18℃' },
    { id: 2, name: '上海', weather: '多云', temperature: '20℃' },
    { id: 3, name: '广州', weather: '小雨', temperature: '24℃' }
]

/**
 * 最后一条用户消息是否像「查询北上广天气」类请求。
 * @param {unknown[]} messages
 * @returns {boolean}
 */
export function shouldUseBsgWeatherMock(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
        return false
    }
    let lastUser = ''
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const m = messages[i]
        if (m && typeof m === 'object' && !Array.isArray(m) && m.role === 'user' && typeof m.content === 'string') {
            lastUser = m.content
            break
        }
    }
    if (!lastUser) {
        return false
    }
    const hasBsg = lastUser.indexOf('北上广') !== -1
    const hasWeather = lastUser.indexOf('天气') !== -1
    return hasBsg && hasWeather
}

function sseLine(dataObj) {
    return 'data: ' + JSON.stringify(dataObj) + '\n\n'
}

/**
 * 模拟 OpenAI 兼容 Chat Completions 流式 SSE：含 tool_calls 分片 + content 分片。
 * @returns {import('node:stream').Readable}
 */
export function createBsgWeatherMockSseStream() {
    const argsFull = JSON.stringify({ cities: HARDCODED_CITIES })
    const cut = Math.floor(argsFull.length / 2)
    const argsA = argsFull.slice(0, cut)
    const argsB = argsFull.slice(cut)

    const parts = []
    parts.push(
        sseLine({
            choices: [
                {
                    index: 0,
                    delta: { role: 'assistant' },
                    finish_reason: null
                }
            ]
        })
    )
    parts.push(
        sseLine({
            choices: [
                {
                    index: 0,
                    delta: {
                        tool_calls: [
                            {
                                index: 0,
                                id: 'call_bsg_weather_mock',
                                type: 'function',
                                function: { name: 'get_cities_weather', arguments: argsA }
                            }
                        ]
                    },
                    finish_reason: null
                }
            ]
        })
    )
    parts.push(
        sseLine({
            choices: [
                {
                    index: 0,
                    delta: {
                        tool_calls: [
                            {
                                index: 0,
                                function: { arguments: argsB }
                            }
                        ]
                    },
                    finish_reason: null
                }
            ]
        })
    )
    parts.push(
        sseLine({
            choices: [
                {
                    index: 0,
                    delta: {},
                    finish_reason: 'tool_calls'
                }
            ]
        })
    )

    const bodyText = '北上广天气如下：\n' + EMBED_MARKER + '\n请查收'
    const step = 6
    for (let i = 0; i < bodyText.length; i += step) {
        const slice = bodyText.slice(i, i + step)
        parts.push(
            sseLine({
                choices: [
                    {
                        index: 0,
                        delta: { content: slice },
                        finish_reason: null
                    }
                ]
            })
        )
    }

    parts.push(
        sseLine({
            choices: [
                {
                    index: 0,
                    delta: {},
                    finish_reason: 'stop'
                }
            ]
        })
    )
    parts.push('data: [DONE]\n\n')

    const text = parts.join('')
    return new Readable({
        read() {
            this.push(text, 'utf8')
            this.push(null)
        }
    })
}
