type on = (element: HTMLElement | Document | null, event: string, handler: EventListenerOrEventListenerObject, useCapture?: boolean) => void

export const on: on = function (element, event, handler, useCapture = false) {
    if (element && event && handler) {
        element.addEventListener(event, handler, useCapture);
    }
};

type off = (element: HTMLElement | Document | null, event: string, handler: EventListenerOrEventListenerObject) => void
export const off: off = function (element, event, handler) {
    if (element && event) {
        element.removeEventListener(event, handler);
    }
};


type once = (el: HTMLElement | Document | null, event: string, fn: EventListenerOrEventListenerObject) => void
export const once: once = function (el, event, fn) {
    const listener: EventListener = function (this: HTMLElement, ...args: any[]) {
        if (fn) {
            (fn as Function).apply(this, args);
        }
        off(el, event, listener);
    };
    on(el, event, listener);
};

export function hasClass (el: HTMLElement | null, cls: string): boolean {
    if (!el || !cls) return false;
    if (cls.indexOf(' ') !== -1) throw new Error('className should not contain space.');
    if (el.classList) {
        return el.classList.contains(cls);
    } else {
        // 添加空格是为了确保类名不会与其他类名的一部分匹配
        return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') > -1;
    }
}

export function scrollToBottom (container: HTMLElement) {
    container.scrollTop = container.scrollHeight;
}

// 递归查找并返回最后一个节点内容不为空&&节点内容不为换行符的文本节点,注意我需要的是返回文本节点,而不是文本内容
export function findLastNonEmptyTextNode (node: Node): Text | null {
    // 定义一个辅助函数来递归查找
    function traverse (node: Node): Text | null {
        if (node.nodeType === Node.TEXT_NODE) {
            // 去除首尾空格和换行符，并检查内容是否为空
            const trimmedText = node.nodeValue?.trim().replace(/\n/g, '');
            if (trimmedText) {
                return node as Text;
            }
        } else if (node.childNodes.length > 0) {
            for (let i = node.childNodes.length - 1; i >= 0; i--) {
                const result = traverse(node.childNodes[i]);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }
    return traverse(node);
}
