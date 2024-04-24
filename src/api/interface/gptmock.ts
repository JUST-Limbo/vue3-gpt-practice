export namespace gptMockNamespace {
    export type ChatEngine = { name: string; value: string; description: string }
    export type chatRecord = {
        id: Number
        uid: string
        type: string
        message: string
        chatEngine: string
        createTime: string
        pid: Nullable<number | string>
        chatting?: boolean
    }
    export type historyItem = {
        uid: string
        chatRecords: ArrayOf<chatRecord>
    }
    export type history = ArrayOf<historyItem>
}
