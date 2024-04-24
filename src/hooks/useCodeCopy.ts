
import { on, hasClass, off } from '@/utils/DomUtils'

export const useCodeCopy = function () {
    const launch = () => {
        const copyHandler = function (e: Event) {
            const copyDom = e.target as HTMLElement
            if (hasClass(copyDom, 'highlight-copy-btn')) {
                const codeDom = copyDom.nextSibling
                navigator.clipboard.writeText(codeDom?.textContent as string)
                ElMessage({
                    message: '已写入剪切板',
                    type: 'success',
                    plain: true,
                })
            }
        }
        on(document, 'mousedown', copyHandler)
        return () => off(document, 'mousemove', copyHandler)
    }
    return { launch }
}
