export function useScrollToBottom (selector: string) {
    const scrollToBottom = () => {
        nextTick(() => {
            if (document.querySelector(selector)) {
                document.querySelector(selector)!.scrollTo({
                    top: document.querySelector(selector)!.scrollHeight,
                    behavior: 'instant'
                });
            }
        })
    };

    return {
        scrollToBottom
    };
}
