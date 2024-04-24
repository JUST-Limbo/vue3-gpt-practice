

# vue3-gpt-practice

## Introduce

这个是只有前端的页面，主要目的是给出打字机交互的解决方案，所以数据都是mock的。

前端页面的样式自己写的话还要调优，我不是不会写是不想抓小放大。所以我样式直接拿[ChatGPTNextWeb](https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web)的样式来改的，特此说明。

打字机的效果主要看以下2个文件。

+ `/views/home/cmp/chatInputPanel.vue`
+ `/views/home/cmp/chatItemBot.vue`

## Install

```sh
nvm use 18.20.0 # node v18
pnpm i # 安装前端依赖
cd ./server
pnpm i -g nodemon
pnpm i # 安装mock server依赖
```

## Setup

```sh
# 根目录运行以下命令
pnpm run dev # 启动前端
pnpm run server # 启动mock server
```

## Question

+ 机器人在回答问题的时候，我没把输入框禁用，如果是打算抄我作业的话注意一下这里要补作业哦。
+ `highlight`的`languages`库里没有`languages/html`，我用了`languages/xml`凑合了一下，不知能不能完全兼容。
+ `highlight.js`似乎不能高亮`Vue`代码？反正`languages`里没找到`Vue`，大约需要再装个插件。
+ 因为扒的别人的样式，所以`tailwind`这个包装了我几乎没用。

## Reference

[ChatGPTNextWeb/ChatGPT-Next-Web: A cross-platform ChatGPT/Gemini UI (Web / PWA / Linux / Win / MacOS). 一键拥有你自己的跨平台 ChatGPT/Gemini 应用。 (github.com)](https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web)
