# 使用 Koa 实现 DeepSeek 聊天服务

本文说明如何用 [Koa](https://koajs.com/) 搭建 HTTP 服务，并调用 **DeepSeek 官方 Chat Completions API** 完成单轮与多轮对话；内容以官方文档为准，不依赖特定业务项目。

---

## 1. 前置条件

1. 在 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册并创建 **API Key**。
2. Node.js 建议使用当前 LTS 版本。
3. 对外请求使用 `fetch`（Node 18+ 内置）或 `axios` 等 HTTP 客户端均可。

**Base URL**：`https://api.deepseek.com`  

**认证方式**：请求头携带  

```http
Authorization: Bearer <你的 API Key>
Content-Type: application/json
```

---

## 2. 需要调用的接口（核心仅此一个）

| 项目 | 说明 |
|------|------|
| **方法** | `POST` |
| **路径** | `/chat/completions`（完整 URL：`https://api.deepseek.com/chat/completions`） |
| **作用** | 根据 `messages` 生成助手回复；支持流式（SSE）与非流式 JSON。 |

官方文档：[Create Chat Completion](https://api-docs.deepseek.com/api/create-chat-completion)

---

## 3. 请求体（Body）参数说明

以下为 JSON 请求体中的常用字段。带「必填」的为接口层面要求。

### 3.0 `messages` 格式详解（Chat Completions，非 MCP）

调用 `POST /chat/completions` 时，请求体中的 **`messages` 是「对话上下文」的唯一载体**。该结构与 **OpenAI Chat Completions** 一致，DeepSeek 采用同一套字段约定；它与 **MCP（Model Context Protocol）** 无关——MCP 使用 JSON-RPC 等另一套消息形态，不要混淆。

#### 3.0.1 顶层约束

| 项目 | 说明 |
|------|------|
| 字段名 | `messages` |
| JSON 类型 | 数组（`array`） |
| 元素个数 | **至少 1 条**消息对象，否则请求不合法。 |
| 语义 | 按**时间顺序**排列的会话片段；模型只根据本次请求里携带的内容推理，**不会自动记住**你上一次 HTTP 请求里发过什么，多轮必须由你在每次请求中**完整或按策略裁剪后**重放历史。 |

#### 3.0.2 单条消息对象（通用结构）

每条消息是一个 JSON 对象，**至少需要**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `role` | string | 是 | 作者角色，取值见下表。 |
| `content` | string 或 null | 视场景 | 文本内容。普通对话下为字符串；在部分工具调用流程中，某条消息的 `content` 可能为空，需配合 `tool_calls` 等字段，以官方文档为准。 |

可选字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 参与者显示名，用于同一 `role` 下区分多方（例如多个 user）；由业务自行约定命名规则。 |

**最小合法示例（仅用户一句）：**

```json
{
  "role": "user",
  "content": "用一句话介绍 Koa。"
}
```

**带系统提示时，通常把 `system` 放在数组最前：**

```json
{
  "role": "system",
  "content": "你是简洁的技术助手，回答用中文。"
}
```

#### 3.0.3 `role` 取值与含义

| `role` | 含义与典型用途 |
|--------|----------------|
| `system` | **系统指令**：设定助手人设、输出格式、安全策略等。同一会话里一般 **0 或 1 条**即可，且习惯上置于 `messages` 数组**第一项**。并非所有调用都必须有 `system`。 |
| `user` | **终端用户**（或你业务里代表用户的一方）输入的问题、指令、补充材料。 |
| `assistant` | **模型在此前轮次中的回复**。多轮对话时，必须把接口**上一次返回**的助手正文（见响应里的 `choices[0].message.content`）按原样或经你审核后的版本，以 `assistant` 身份追加进 `messages`，否则模型看不到自己的上一句。 |
| `tool` | **工具执行结果**：在启用 Function Calling、`assistant` 消息含 `tool_calls` 时，由你把各工具的运行结果以 `role: "tool"` 的消息回传给模型；通常还需带 `tool_call_id` 等与请求对应的字段，**细节以官方 [Tool Calls](https://api-docs.deepseek.com/guides/tool_calls) 为准**。 |

普通「你问我答」聊天，**只用到 `system`（可选）、`user`、`assistant` 三种**即可。

#### 3.0.4 多轮对话的推荐顺序

1. （可选）一条 `system`。  
2. 交替积累：`user` → `assistant` → `user` → `assistant` → …  
3. **最后一条**应为当前要模型继续接话的输入：通常是 **`user`**（用户新问题）；若你在做工具调用闭环，则按官方说明在 `tool` / `assistant` 之间衔接。

**禁止依赖的错误假设**：仅发送「最新一条 user」而不带历史 `assistant`，却期望模型记住前文——**接口层面不会自动合并历史**，除非你在服务端或客户端自行把历史拼进 `messages`。

#### 3.0.5 与工具调用相关的扩展（简要）

当请求体中带 `tools` 且模型返回工具调用时，`assistant` 消息可能包含 **`tool_calls`**（例如函数名与参数），随后你需要追加 **`role: "tool"`** 的消息，把执行结果写进 `content`（并带上官方要求的 `tool_call_id` 等）。此类消息的完整字段列表以 **DeepSeek 官方 Create Chat Completion 文档**为准；日常纯文本聊天可忽略本节。

#### 3.0.6 完整多轮示例（JSON）

下面表示：系统提示 + 用户两问 + 助手一答 + 用户第二问（共 4 条消息入参；模型将基于此前文生成对「那缺点呢？」的回答）：

```json
{
  "model": "deepseek-chat",
  "messages": [
    {
      "role": "system",
      "content": "你是资深后端，回答简练。"
    },
    {
      "role": "user",
      "content": "Koa 和 Express 有什么主要区别？"
    },
    {
      "role": "assistant",
      "content": "Koa 基于中间件与 async/await，更轻、无内置路由；Express 生态大、约定多。二者都可搭建 HTTP 服务。"
    },
    {
      "role": "user",
      "content": "那缺点呢？"
    }
  ]
}
```

业务代码里常见写法是：用数组 `push({ role: "user", content: q })` 与 `push({ role: "assistant", content: a })` 按轮次追加，与上述 JSON 等价。

#### 3.0.7 与其它格式的区别（对照）

| 格式 | 用途 |
|------|------|
| **本文 `messages[]`** | HTTP `POST /chat/completions` 的请求体字段，OpenAI 兼容，DeepSeek 官方聊天接口使用。 |
| **MCP** | 宿主机与工具/资源之间的协议，消息多为 JSON-RPC，**不是** `{ role, content }` 列表。 |
| **流式响应 SSE** | 响应侧格式（`data: {...}` 行），不是请求里 `messages` 的结构。 |

---

### 3.1 必填

| 字段 | 类型 | 说明 |
|------|------|------|
| `model` | string | 模型 ID。常用值：`deepseek-chat`（对话）、`deepseek-reasoner`（带推理过程，响应中可能含 `reasoning_content`）。 |
| `messages` | object[] | 对话消息列表，至少 1 条；**结构与约束见上文 3.0**。 |

### 3.2 常用可选参数

| 字段 | 类型 | 说明 |
|------|------|------|
| `stream` | boolean | `true` 时以 **SSE** 形式流式返回增量内容；流结束会有 `data: [DONE]`。 |
| `stream_options` | object | 仅在 `stream: true` 时有效。例如 `include_usage: true` 可在结束前多一段含 `usage` 的 chunk。 |
| `temperature` | number | 采样温度，默认约 `1`，范围与官方说明一致；一般与 `top_p` 二选一调节即可。 |
| `top_p` | number | 核采样，默认约 `1`。 |
| `max_tokens` | integer | 本次生成上限 token 数；总长受模型上下文限制，定价与上限见官方说明。 |
| `frequency_penalty` | number | 约 -2～2，抑制重复用词。 |
| `presence_penalty` | number | 约 -2～2，鼓励谈新话题。 |
| `stop` | string 或 string[] | 最多 16 个停止序列，命中则停止生成。 |
| `response_format` | object | 例如 `{ "type": "json_object" }` 约束输出为 JSON；**必须在 system/user 中明确要求输出 JSON**，否则可能长时间输出空白。 |
| `tools` | object[] | Function Calling 工具列表。 |
| `tool_choice` | string 或 object | 控制是否/如何调用工具：`none` / `auto` / `required` 或指定某函数名。 |
| `thinking` | object | 思维链相关：`type` 为 `enabled` 或 `disabled`（以官方当前文档为准）。 |
| `logprobs` | boolean | 是否返回 token 对数概率。 |
| `top_logprobs` | integer | 与 `logprobs` 配合，每个位置返回的最可能 token 数量（有上限）。 |

### 3.3 非流式请求示例

```json
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "system", "content": "你是一个简洁的技术助手。" },
    { "role": "user", "content": "Koa 和 Express 的主要区别？" }
  ],
  "temperature": 0.7,
  "max_tokens": 1024
}
```

### 3.4 流式请求示例

```json
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "user", "content": "写一首四行短诗。" }
  ],
  "stream": true
}
```

响应为 `text/event-stream`，多行形态为：

```text
data: {"id":"...","choices":[{"delta":{"content":"你"},"index":0}],...}

data: [DONE]
```

解析时需按行读取，去掉 `data: ` 前缀；内容为 `[DONE]` 表示结束；其余行为 JSON，增量正文一般在 `choices[0].delta.content`。

---

## 4. 响应说明（非流式）

HTTP 200 时 body 为 **Chat Completion 对象**，主要字段包括：

| 字段 | 说明 |
|------|------|
| `id` | 本次完成 ID。 |
| `object` | 固定为 `chat.completion`。 |
| `created` | Unix 时间戳（秒）。 |
| `model` | 实际使用的模型名。 |
| `choices` | 数组；通常取 `choices[0].message.content` 为助手全文。 |
| `choices[].finish_reason` | 结束原因：`stop`、`length`、`content_filter`、`tool_calls` 等。 |
| `usage` | `prompt_tokens`、`completion_tokens`、`total_tokens` 等用量。 |

使用 `deepseek-reasoner` 时，助手消息中可能还有 `reasoning_content`（推理过程），与最终 `content` 区分以官方文档为准。

错误时 HTTP 非 2xx，body 多为 JSON，含 `error` 对象（`message`、`type`、`code` 等），应在 Koa 中读取并映射为合适的 HTTP 状态码或业务错误码。

---

## 5. 用 Koa 接好「非流式」聊天

思路：`POST /api/chat` 读取客户端传来的 `messages`（或由服务端根据 session 拼好历史），转发到 DeepSeek，再把 `choices[0].message.content` 等返回给前端。

依赖示例：

```bash
npm install koa koa-bodyparser koa-router
```

示例逻辑（省略错误分支细节，仅作结构参考）：

```javascript
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import Router from 'koa-router'

const app = new Koa()
const router = new Router()

app.use(bodyParser())

router.post('/api/chat', async (ctx) => {
  const body = ctx.request.body
  const messages = body.messages
  const apiKey = process.env.DEEPSEEK_API_KEY

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: body.model || 'deepseek-chat',
      messages: messages,
      temperature: body.temperature,
      max_tokens: body.max_tokens
    })
  })

  const data = await res.json()
  if (!res.ok) {
    ctx.status = res.status
    ctx.body = data
    return
  }

  const text =
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content

  ctx.body = { reply: text, usage: data.usage }
})

app.use(router.routes())
app.listen(3000)
```

**多轮记忆**：不在模型侧「自动记住」；每次请求都把完整 `messages` 数组（含历史 `user` / `assistant`）传入即可。会话 ID 与历史存储由你的业务（内存、Redis、数据库）维护。

---

## 6. 用 Koa 做「流式」聊天（SSE）

思路：`stream: true` 时，DeepSeek 返回的是 **ReadableStream**（或 Node 中的流）。Koa 中设置：

- `ctx.set('Content-Type', 'text/event-stream; charset=utf-8')`
- `ctx.set('Cache-Control', 'no-cache')`
- `ctx.set('Connection', 'keep-alive')`
- 使用 `ctx.res.write()` 持续写入 `data: ...\n\n`，结束时 `ctx.res.end()`。

注意：不要先让 Koa 默认再去 `ctx.body = stream` 写完整 JSON；若使用 `@koa/router` 的异步路由，需确保在流结束前不提前返回默认 body。常见做法是拿到 `fetch` 的 `response.body` 后，用 Node 的 `Readable.fromWeb`（Node 18+）或逐块读取，把解析出的 `delta.content` 再封装成 SSE 行写给浏览器。

前端使用 `EventSource` 仅支持 GET，因此流式场景更常见的是：**前端用 `fetch` + `ReadableStream` 读响应**，或 **WebSocket** 由 Koa 配合 `ws` 库转发增量；HTTP SSE 则由上述方式手写 `text/event-stream`。

---

## 7. 安全与工程建议

1. **API Key 仅放服务端环境变量**，不要出现在前端或仓库中。
2. 对客户端只暴露「会话 ID + 当前用户输入」，由服务端根据会话拉取历史并组装 `messages`，避免前端篡改历史。
3. 限制 `messages` 总长度或轮数，防止超出上下文与费用失控。
4. 流式接口需处理客户端断开（`req.on('close', ...)`），及时中止对上游的读取，节省资源。

---

## 8. 参考链接

- [Create Chat Completion（官方）](https://api-docs.deepseek.com/api/create-chat-completion)
- [DeepSeek 开放平台](https://platform.deepseek.com/)
- [Koa 文档](https://koajs.com/)

文档中的模型名、字段默认值与定价以 DeepSeek 官网实时说明为准；若接口升级，请以官方 API 文档为准做增量调整。
