# 大模型流式输出（SSE）与前端通信、页面渲染

本文从协议与工程实践角度说明：**大模型 API 如何通过类 SSE（Server-Sent Events）流式返回 token**，以及**前端如何接收、解析并渲染到页面**。内容为通用说明，不绑定任何具体业务项目。

---

## 1. 为什么大模型常用「流式」响应

- **非流式**：服务端等整段回答生成完毕后，一次性返回 JSON。用户等待时间长，体感像「卡住」。
- **流式**：服务端边生成边往连接里写数据，前端边收边展示（常见为「打字机」效果），**首字延迟**明显降低，交互更自然。

多数云厂商的 Chat Completions 类接口在请求体里设置 `stream: true` 后，会使用 **HTTP 长连接 + 分块传输**，响应 `Content-Type` 常为 `text/event-stream`，数据格式遵循 **SSE 事件流** 的惯用写法（`data: ...` 多行、空行分隔事件）。

---

## 2. SSE 是什么（在本场景下的含义）

**SSE（Server-Sent Events）** 是浏览器的一种标准：**服务器向客户端单向、持续推送文本事件**。特点简要对比：

| 方式 | 方向 | 典型用途 |
|------|------|----------|
| **SSE** | 服务端 → 客户端（单向） | 日志、通知、**大模型 token 流** |
| **WebSocket** | 双向 | 聊天室、协作、游戏 |
| **普通 HTTP JSON** | 请求-响应一次 | 非流式补全 |

大模型场景里，**客户端仍然用 HTTP POST 发对话**；只是响应体不再是单个 JSON，而是一段**持续的 event-stream 文本**。因此常被称为「SSE 流式」或「流式接口」。

---

## 3. 流式响应长什么样（OpenAI 兼容形态，概念层）

一次流里会有**多条事件**，每条事件一行或多行，以**空行**结束。最常见形态是每行一个 `data:`，后面跟 JSON 字符串：

```text
data: {"id":"...","choices":[{"delta":{"content":"你"}}]}

data: {"id":"...","choices":[{"delta":{"content":"好"}}]}

data: [DONE]

```

要点：

1. **`data:` 前缀**：SSE 规定的事件负载行；一行里 `data:` 与内容之间通常有一个空格。
2. **每条 `data:` 后面的 JSON**：各厂商字段略有差异，但常见结构里，**增量文本**在 `choices[0].delta.content`（有时还有 `role` 等）。
3. **`[DONE]`**：很多实现用一行 `data: [DONE]` 表示流结束（具体以各 API 文档为准）。
4. **中间可能有空 `data:` 或注释行**：解析时要健壮处理。

非流式时，一次响应只有一个 JSON，内含完整 `message.content`；流式则是**很多个小 JSON 片段**，需要前端**拼接**成完整回复。

---

## 4. 整体链路：从模型到页面

```
[浏览器]  POST /chat (messages, stream:true)
    ↓
[你的后端]  可选：鉴权、限流、改写请求
    ↓
[模型服务商]  建立上游流式连接，持续写出 SSE 块
    ↓
[你的后端]  原样转发 或 转换格式后再写出（仍保持 chunked + event-stream）
    ↓
[浏览器]  读响应体字节流 → 按 SSE 规则切分 → 解析 JSON → 累积文本
    ↓
[UI]  绑定到组件状态 → 模板渲染（纯文本或 Markdown 后渲染）
```

**是否必须经过自己的后端？**

- **直连浏览器调 API**：技术上可用，但会把 **API Key 暴露给前端**，一般**不推荐**生产环境。
- **常见做法**：前端只请求**同源或可信域名的自己的接口**；由后端持有 Key，向上游拉流，再对前端转发（可保持 SSE，也可改成 WebSocket，见下文）。

---

## 5. 浏览器如何读流：EventSource 还是 fetch？

### 5.1 `EventSource` 的局限

- 只支持 **GET**，且不便自定义复杂请求体。
- 大模型对话通常是 **POST + JSON body + Authorization 头**。

因此**多数实现不用原生 `EventSource`**，而用 **`fetch` + `ReadableStream`** 自己解析 SSE 文本。

### 5.2 推荐：`fetch` + `ReadableStream`

流程概括：

1. `fetch(url, { method: 'POST', headers: {...}, body: JSON.stringify({...}) })`
2. 取 `response.body.getReader()`，循环 `reader.read()` 直到 `done`
3. 用 `TextDecoder` 把 `Uint8Array` 转成字符串；**注意跨 chunk 的半行问题**（一次 read 可能只收到半句 `data: {"cho`），必须把**残留缓冲区**与新区块拼接后再按行解析。

伪代码结构（仅说明逻辑，非完整健壮实现）：

```javascript
const decoder = new TextDecoder();
let buffer = '';

const reader = response.body.getReader();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // 最后一行可能不完整，放回 buffer

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.indexOf('data:') !== 0) continue;
    const payload = line.slice(5).trim();
    if (payload === '[DONE]') {
      // 流结束
      continue;
    }
    try {
      const obj = JSON.parse(payload);
      const piece = obj.choices && obj.choices[0] && obj.choices[0].delta
        ? obj.choices[0].delta.content
        : '';
      if (piece) {
        // 拼接到当前助手消息
      }
    } catch (e) {
      // 忽略单行解析失败或心跳包
    }
  }
}
```

**跨 chunk 拼接**是流式解析里最容易出 bug 的地方，务必用缓冲区保留「未完结的一行」。

### 5.3 两层切分：为什么先用 `split('\n\n')`，再在块内 `split('\n')`

本仓库 `src/views/deepseek-chat/index.vue` 中的解析采用 **协议上的两层结构**，与第 3 节「事件以空行结束」相对应。

#### 第一层：按 `\n\n` 切 `pending`（事件边界）

SSE 规定：**一个事件**由若干行组成，**事件与事件之间**用 **空行**（即连续两个换行 `\n\n`）分隔。

因此把当前文本缓冲区 `pending` 用 **`pending.split('\n\n')`** 切开，得到的是 **一个个「事件块」**；每个块内部可能仍包含多行（例如多行 `data:`、或 `data:` 与注释混排）。

**为什么要对 `blocks` 做 `pop` 再写回 `pending`？**

`split('\n\n')` 之后，**数组最后一个元素不一定是一个完整事件**：它往往是 **流尚未写到下一个 `\n\n` 之前的尾巴**（例如半截 `data: {"cho`）。若把它当完整包去 `JSON.parse`，会失败或误解析。

因此惯例是：

```text
const blocks = pending.split('\n\n')
pending = blocks.pop() || ''  // 最后一段可能不完整，留到下一轮与后续 chunk 拼接
// 仅对 blocks 中剩余元素做解析（均以 \n\n 结尾，事件边界完整）
```

也就是说：**`pop` 的目的是把「可能未以 `\n\n` 结束的最后一段」从本轮待处理列表中取出，重新放进 `pending`，等待后续字节补全。**

**用例（第一层 + `pop`）**：假设某次解码后 `pending` 正好是下面这样（这里用真实换行表示 `\n`，空行表示事件之间的 `\n\n`）：

```text
data: {"choices":[{"delta":{"content":"A"}}]}

data: {"choices":[{"delta":{"content":"B"}}]}

data: {"cho
```

执行 `pending.split('\n\n')` 会得到长度约为 3 的数组：

1. 第一段：`data: {"choices":[{"delta":{"content":"A"}}]}` → **完整事件**，可进入 `parseSseBlock` 再 `JSON.parse`。
2. 第二段：`data: {"choices":[{"delta":{"content":"B"}}]}` → **完整事件**，同上。
3. 第三段：`data: {"cho` → **明显半截**，若强行 `JSON.parse` 会失败。

因此 **`blocks.pop()` 取走第三段写回 `pending`**，本轮只对前两段做解析；后续 `reader.read()` 再解码出的字符会拼在 `data: {"cho` 后面（例如补上 `ices":[{"delta":{"content":"好"}}]}` 以及随后的 `\n\n`），下一轮 `split('\n\n')` 再得到完整事件。

**用例（仅说明「末尾刚好完整」的边界）**：若 `pending` 以 `\n\n` 结尾、没有「半个事件」留在末尾，例如：

```text
data: {"choices":[{"delta":{"content":"X"}}]}

```

则 `split('\n\n')` 可能得到 `["data: {...}", ""]`（末尾多一个空串）或仅一段，具体取决于实现与是否尾随换行；工程上仍以 **`pop` 把最后一段当作「可能不完整」** 处理即可（最后一段为空串时 `pending` 变为 `''`，行为也安全）。

#### 第二层：在单个事件块内按 `\n` 切行（`block.split('\n')`）

**一个事件块**内部不是单行。规范允许块内有多行，例如：

- 一行 `data: {...}`；
- 或多行 `data:` 拼接长内容；
- 或其它字段行（`event:`、`id:`）、注释行等。

因此在对 **单个** `block` 解析时，要用 **`block.split('\n')`** 得到行数组，再逐行识别 **`data:`** 前缀，取出 `data:` 后的 payload（本项目中见 `parseSseBlock`）。

**用例（第二层，`block.split('\n')`）**：下面表示 **一个** SSE 事件块内部的多种行（仍是一个大模型里常见的简化示意）：

```text
data: {"choices":[{"delta":{"content":"你"}}]}
: 这是注释行示例
data: {"choices":[{"delta":{"content":"好"}}]}
```

对该字符串整体（即某一元素 `block`）执行 `block.split('\n')` 后，可逐行处理：跳过不以 `data:` 开头的行；对 `data:` 行取 payload 并 `JSON.parse`，取出各段的 `delta.content` 再拼接。若规范要求 **多行 `data:` 表示同一逻辑行拼接**，解析时还需按规范把多行 payload 拼成一串再解码（DeepSeek / OpenAI 流式常见为 **每事件单行 JSON**，本仓库按行解析 `data:` 即可覆盖主路径）。

**用例（规范里「同一事件内多行 `data:`」）**：SSE 允许同一事件里出现多行 `data:`，语义上会把这些行的内容按规范拼成**一则** message（行间通常插入换行）。示意（与 JSON 无关，仅说明「块内多行」）：

```text
data: hello
data: world
```

大模型 Chat Completions 流式里更常见的是 **每个事件一行 `data:` + 一整段 JSON**；第二层 `split('\n')` 的作用仍是：**在单个事件块内先拆成行，再逐行识别 `data:`**；若将来遇到需按规范合并多行 `data:` 再解码的场景，应在 `parseSseBlock` 层按 SSE 规范拼接后再 `JSON.parse`。

#### 对照小结

| 操作 | 分隔符 | 含义 |
|------|--------|------|
| `pending.split('\n\n')` | 双换行 | **事件边界**：上一包 SSE 与下一包之间 |
| `block.split('\n')` | 单换行 | **行边界**：同一事件块内的各行 |
| `blocks.pop()` 写回 `pending` | — | 保留 **可能不完整的最后一段**，避免半截 JSON 被当成完整事件 |

**与 5.2 伪代码的关系**：5.2 用的是「按行缓冲 + 每行判断 `data:`」的写法（`split('\n')` 后对末行 `pop`）；**5.3 是「先按事件（`\n\n`）再按行」**，更符合 SSE「空行分隔事件」的层次，两种思路在工程上都常见，关键是 **缓冲区 + 不把不完整的尾巴当完整帧解析**。

---

## 6. 前端状态与页面渲染

### 6.1 状态模型（与框架无关的思路）

- 维护一条「当前正在生成的助手消息」：字符串 `assistantDraft`，每收到一块 `delta.content` 就 **追加**（`assistantDraft += piece`）。
- 或维护消息列表 `messages[]`，最后一条 `role === 'assistant'` 且 `streaming === true` 时，只更新其 `content`。
- 流结束后：将 `streaming` 置为 `false`，必要时把 `assistantDraft` 合并进历史列表。

这样 UI 只需**绑定同一个字符串或同一条消息的 `content`**，每次追加都会触发视图更新，形成打字机效果。

### 6.2 渲染方式

| 内容类型 | 做法 | 注意 |
|----------|------|------|
| **纯文本** | 文本节点或 `{{ content }}` | 最简单；注意换行可用 `white-space: pre-wrap` |
| **Markdown** | 流式过程中可先当纯文本显示，结束后一次性 md→html；或分段 md（实现更难） | 流式中途 md 不完整，预览可能闪烁 |
| **代码高亮** | 通常在**流结束**或**检测到完整 fenced code** 后再高亮 | 避免高频重算 |

**安全**：若最终要渲染 HTML，必须对不可信内容做 **XSS 防护**（消毒、CSP、仅允许白名单标签等），不要直接把模型输出当 `innerHTML` 盲用。

### 6.3 与 Vue / React 的关系（概念）

- **Vue**：`ref` / `reactive` 保存上述字符串或消息列表；模板里绑定该字段即可，追加时响应式自动刷新。
- **React**：`useState` 保存内容；每次收到 chunk 用函数式更新 `setContent(function (prev) { return prev + piece; })`，避免闭包拿到旧状态。

---

## 7. 错误、中断与结束判定

1. **HTTP 非 2xx**：应在读完 body 前根据 `response.ok` 处理，可读错误 JSON（非流）或错误文本。
2. **上游断开**：`reader.read()` 可能提前 `done`，需在 UI 上标记「已中断」或重试。
3. **用户点击停止**：调用 `reader.cancel()` 或 `AbortController` 中止 `fetch`，并停止更新状态。
4. **正常结束**：收到 `[DONE]` 或上游关闭流且缓冲区解析完毕；检查 JSON 里若有 `finish_reason`（如 `stop`、`length`）可做统计或提示。

---

## 8. 后端转发 SSE 时的注意点

若使用 Node、Koa、Express 等转发上游流：

- 响应头设置 **`Content-Type: text/event-stream`**，**禁用缓冲**（如 `X-Accel-Buffering: no` 在 Nginx 后常用）。
- **尽快**把首字节刷给客户端（减少 TTFB），避免中间件整包缓存响应体。
- 保持 **UTF-8** 编码一致，避免中文被截断在多 chunk 边界时乱码（与前端 `TextDecoder` 的 `stream: true` 配合）。

---

## 9. 小结

| 环节 | 要点 |
|------|------|
| 协议 | 流式响应多为 SSE 形态的 `data:` 行 + JSON 片段 + `[DONE]` |
| 浏览器 | 常用 `fetch` + `ReadableStream` + 缓冲解析，而不是 `EventSource`；可先按 `\n\n` 分事件再按 `\n` 分行（见 5.3） |
| 业务数据 | 从每段 JSON 取 `delta.content`（或厂商等价字段）拼成完整回答 |
| 渲染 | 状态增量更新即打字机；Markdown/HTML 需注意流式与 XSS |
| 工程 | Key 放后端；注意跨 chunk、中断、错误与结束判定 |

如需对照具体厂商字段，请以该厂商最新的 **Chat Completions / 流式** 官方文档为准（不同服务商在 `delta`、工具调用、多模态等字段上会有扩展）。
