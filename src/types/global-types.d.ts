declare type Nullable<T> = T | null

interface Response<T> {
    code: number
    data: T
    msg: string
}

interface ErrorResponse {
    msg: string
    state: string
}

type ExtendWithAny<T> = T & {
    [key: string]: any;
};

type ArrayOf<T> = T[];
