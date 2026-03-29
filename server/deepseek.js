/* eslint-env node */
function parseSseChunk(chunk) {
    const lines = chunk.split('\n')
    const dataList = []
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i].trim()
        if (line.startsWith('data:')) {
            dataList.push(line.substring(5).trim())
        }
    }
    return dataList
}

/**
 * @param {Array<{ role: string, content: string }>} messages OpenAI 格式多轮对话，须含当前用户最后一条
 */
export async function streamDeepSeekAnswer(messages, onDelta, onDone, onError) {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
        onError('DEEPSEEK_API_KEY 未配置')
        return
    }
    if (!messages || messages.length === 0) {
        onError('对话消息不能为空')
        return
    }

    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
                stream: true,
                messages
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            onError(`DeepSeek 请求失败: ${response.status} ${errorText}`)
            return
        }

        const body = response.body
        if (!body) {
            onError('DeepSeek 返回空响应体')
            return
        }

        const reader = body.getReader()
        const decoder = new TextDecoder('utf-8')
        let pending = ''

        let finished = false
        while (!finished) {
            const result = await reader.read()
            if (result.done) {
                finished = true
                break
            }

            pending += decoder.decode(result.value, { stream: true })
            const blocks = pending.split('\n\n')
            pending = blocks.pop() || ''

            for (let i = 0; i < blocks.length; i += 1) {
                const dataList = parseSseChunk(blocks[i])
                for (let j = 0; j < dataList.length; j += 1) {
                    const payload = dataList[j]
                    if (payload === '[DONE]') {
                        onDone()
                        return
                    }

                    const json = JSON.parse(payload)
                    const choices = json.choices
                    if (!choices || !choices.length) continue
                    const delta = choices[0].delta
                    if (!delta) continue
                    const content = delta.content
                    if (!content) continue
                    onDelta(content)
                }
            }
        }

        onDone()
    } catch (error) {
        const err = error
        if (err instanceof Error) {
            onError(err.message)
            return
        }
        onError('DeepSeek 请求发生未知错误')
    }
}
