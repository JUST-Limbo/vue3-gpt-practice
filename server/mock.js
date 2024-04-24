export const history = [
  {
    uid: 'f48d91db-c5c9-4ac3-9e26-45cf8ff5a9b5',
    chatRecords: [
      {
        id: 7568,
        uid: 'f48d91db-c5c9-4ac3-9e26-45cf8ff5a9b5',
        type: 'question',
        message: '用js实现一个防抖',
        chatEngine: 'ERNIE-Bot',
        createTime: '2024-04-07 23:57:27.000',
        pid: null
      },
      {
        id: 7569,
        uid: 'f48d91db-c5c9-4ac3-9e26-45cf8ff5a9b5',
        type: 'answer',
        message:
          "防抖（debounce）是一种在计算机编程中常见的优化技术，通常用于限制某个函数在短时间内被频繁调用。防抖的基本思想是，如果一个函数持续地、频繁地触发，那么只在它结束后过一段时间才开始执行。\n\n以下是一个简单的防抖函数的实现，使用JavaScript：\n\n\n```javascript\nfunction debounce(func, wait) {\n  let timeout;\n\n  return function() {\n    const context = this;\n    const args = arguments;\n\n    clearTimeout(timeout);\n\n    timeout = setTimeout(function() {\n      func.apply(context, args);\n    }, wait);\n  };\n}\n```\n这个 `debounce` 函数接受两个参数：`func` 是你想要防抖的函数，`wait` 是等待时间（以毫秒为单位）。该函数返回一个新的函数，当这个新函数被调用时，它会取消之前的调用（如果有的话），并设置一个新的定时器，在 `wait` 毫秒后调用 `func`。\n\n这里是如何使用这个防抖函数的示例：\n\n\n```javascript\n// 假设我们有一个处理窗口resize事件的函数\nfunction handleResize() {\n  console.log(window.innerWidth);\n}\n\n// 我们可以使用debounce函数来防抖处理\nconst debouncedHandleResize = debounce(handleResize, 200);\n\n// 现在，我们将这个防抖处理函数绑定到window的resize事件\nwindow.addEventListener('resize', debouncedHandleResize);\n```\n在这个例子中，无论 `resize` 事件多么频繁地触发，`handleResize` 函数都只会在事件结束后的200毫秒内被调用一次。",
        chatEngine: 'ERNIE-Bot',
        createTime: '2024-04-07 23:57:28.000',
        pid: 7568
      }
    ]
  },
  {
    uid: '030898da-3933-42ad-85bd-b49d0a5dd5a2',
    chatRecords: [
      {
        id: 7486,
        uid: '030898da-3933-42ad-85bd-b49d0a5dd5a2',
        type: 'question',
        message: '生成一个500字的小说',
        chatEngine: 'ERNIE-Bot',
        createTime: '2024-04-07 08:54:14.000',
        pid: null
      },
      {
        id: 7487,
        uid: '030898da-3933-42ad-85bd-b49d0a5dd5a2',
        type: 'answer',
        message:
          '**海边的邂逅**\n\n在一个风和日丽的日子，莉莉决定去海边散步，享受一下难得的闲暇时光。海风轻轻拂过她的脸庞，阳光洒在海面上，波光粼粼，仿佛一切烦恼都被这美景所驱散。\n\n莉莉沿着海边走着，突然，她注意到不远处有一个男孩在画画。他专注地描绘着眼前的海景，笔触流畅而有力。莉莉被他的才华所吸引，不由自主地走了过去。\n\n男孩抬起头，看到了莉莉。他微笑着向她打了个招呼，然后继续投入到他的创作中。莉莉站在一旁，静静地看着他画画，心中涌起一股莫名的情愫。\n\n过了一会儿，男孩完成了他的画作。他抬起头，看着莉莉说：“你觉得怎么样？我画得还好吗？”莉莉被他的画作所震撼，连连点头称赞：“太好了！你真的很有天赋！”\n\n男孩笑了，他递给莉莉一张纸条说：“谢谢你的赞美。如果你有兴趣的话，这个周末可以来这里参加一个画展，我会在那里展出我的作品。”莉莉接过纸条，心中充满了期待。\n\n周末到了，莉莉如约来到了画展现场。她看到了男孩的许多作品，每一幅都充满了生命力和情感。在画展的角落里，莉莉和男孩再次相遇。他们聊起了艺术、梦想和生活，仿佛彼此已经认识了很久。\n\n画展结束后，莉莉和男孩一起走在海边。海风依旧轻柔，阳光依旧明媚。他们约定下次还要一起来看海、画画，享受这美好的时光。莉莉的心中充满了幸福和满足，她知道，这次海边的邂逅，将成为她生命中最美好的回忆之一。',
        chatEngine: 'ERNIE-Bot',
        createTime: '2024-04-07 08:54:15.000',
        pid: 7486
      }
    ]
  }
]

export default {
  code: 200,
  msg: '',
  data: history
}
