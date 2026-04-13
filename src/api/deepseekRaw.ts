/**
 * DeepSeek OpenAI 兼容聊天请求体（与官方 /chat/completions 一致，不含 apiKey）。
 */
export type DeepseekChatMessage = {
    role: string
    content: string
    /** 由 tool_calls（如 get_cities_weather）解析得到的列表，供 citysWeather 等组件渲染 */
    weatherTableData?: any[]
}

export type DeepseekChatCompletionsBody = {
    model?: string
    messages: DeepseekChatMessage[]
    stream?: boolean
}

/**
 * 调用本地代理 POST /api/deepseek/chat/completions，返回原生 Response（可流式读 body）。
 */
export function postDeepseekChatCompletions(body: DeepseekChatCompletionsBody) {
    const base = import.meta.env.VITE_SERVER
    return fetch(base + '/api/deepseek/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
}
