export function processStringWithDelay(str, delay, fun, complete) {
  let currentIndex = 0
  const maxIndex = str.length
  const processNextSubstring = () => {
    if (currentIndex >= maxIndex) return complete()
    const randomLength = 10
    const subStr = str.substr(currentIndex, randomLength)
    fun(subStr)
    if (currentIndex < maxIndex) {
      currentIndex += randomLength
      setTimeout(processNextSubstring, delay)
    }
  }
  processNextSubstring()
}
