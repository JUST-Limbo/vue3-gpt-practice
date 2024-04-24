export interface UserValidate {
    code: string
}

export interface UserPermission {
    ernieDalle: boolean
    ernieBot: boolean
    azureOpenAiDalle3: boolean
    azureOpenAi35: boolean
    azureOpenAi4: boolean
}

export interface Message {
    aiEngine: string
    banRound: Nullable<string>
    createTime: string
    extraData: Nullable<string>
    id: number
    isTxt2img: number
    message: string
    needClearHistory: Nullable<string>
    pid: Nullable<string | number>
    type: string
    uid: string
    userUniqueIdentification: string
    chatting?: boolean | undefined
}

export interface MessageList {
    message: Message[]
    uid: string
}
export interface UserValidateRes {
    state: string
    msg: string
    data: {
        messageList: MessageList[];
        userId: string
        userPermission: Partial<UserPermission>
    }
}
