# Blosshom & Cafe 微信小程序 MVP

uni-app + Vue 2 微信小程序项目。第一轮前端 MVP 已完成，第二轮 CloudBase 源码与部署资料已加入。未启用云模式时继续使用内置演示菜单和**明确标注的模拟支付**；启用云模式后使用动态菜单和云端可信计价，但仍不会调用微信支付、不会扣款，也不会生成正式取餐号。

## 环境要求与运行

- Node.js 16.13+（本次使用 16.13.1 验证；推荐同代 LTS）
- npm 8+
- 微信开发者工具（运行构建产物）或 HBuilderX

```bash
npm install
npm run lint
npm test
npm run build:mp-weixin
```

构建产物位于 `dist/build/mp-weixin/`。在微信开发者工具中导入该目录；尚无正式 AppID 时使用开发者工具允许的测试/游客模式。取得正式 AppID 后在开发者工具项目设置或部署配置中填写，不要提交 AppSecret。开发监听使用 `npm run dev:mp-weixin`；也可以用 HBuilderX 打开项目根目录并运行到微信开发者工具。

源码中没有 AppSecret、API v3 密钥、商户私钥、证书或占位密钥。`.env.example` 只列出非敏感的前端开关和 CloudBase 环境 ID 名称；真实支付参数未来必须由商家管理员直接配置到云端环境变量或密钥管理中。

## 当前两种运行模式

1. `VUE_APP_USE_CLOUD=false`：本地演示菜单、本地购物车、明确标注的模拟支付和本机模拟订单。
2. `VUE_APP_USE_CLOUD=true`：CloudBase 动态菜单、最近有效菜单缓存、云端可信计价、订单商品快照、本人订单查询。断网读取缓存时禁止创建订单。

第二轮的 `createPayment` 只创建 `UNPAID` 云端订单，为第三轮支付接口保留名称和边界。它不会调用 `wx.requestPayment`，也不会把待支付订单显示成付款成功。

## 服务边界

- `src/services/menu.js#getMenu`：演示模式返回本地数据；云模式调用同名云函数，并缓存最近一次有效菜单。
- `src/services/payment.js#createPayment`：演示模式创建本机未支付订单；云模式只提交商品 ID、规格、数量和取餐信息，不提交可信价格、商品名或订单总额。
- `src/services/order.js#queryOrder`：模拟查单；云模式调用 `queryOrder`。
- `src/services/order.js#getMyOrders`：模拟订单列表；云模式调用 `getMyOrders`。
- `src/services/cloud.js`：唯一的 `wx.cloud` 访问入口，未配置时明确拒绝云调用。

真实支付接入时仍必须由云端重新查询商品、校验规格、计算金额、创建业务订单并处理 API v3；前端回调不能作为付款最终依据。

## 目录

```text
src/
├── components/             品牌头、商品卡、规格层、购物车条、订单卡、空状态
├── config/                 演示菜单、门店展示配置、主题色
├── pages/                  首页、菜单、购物车、结算、支付结果、订单
├── services/               CloudBase、菜单、订单、支付、存储适配层
├── store/cart.js           本地持久化购物车
└── utils/                  金额、规格文本、手机号校验
tests/                      金额、购物车、手机号、模拟支付核心测试
scripts/                    DCloud Vue 2 构建期编译器解析适配
```

## 第二轮 CloudBase 交付

- `cloudfunctions/`：`getMenu`、`createPayment`、`queryOrder`、`getMyOrders`。
- `cloudbase/data/`：当前菜单 JSON/CSV 导入模板。
- `cloudbase/security-rules/`、`function-security-rules.json`、`indexes.json`：最小权限和索引基线。
- `cloudbase/README.md`：集合、索引、数据、图片、云函数和验收步骤。
- `cloudbaserc.json`：环境 `cloud1-d8gupi6ncd593f141` 的无敏感信息部署描述。

## 当前明确未实现

- 微信支付 API v3、通知验签解密、幂等、真实取餐号（第三轮）。
- 文档明确排除的外卖、多门店、会员、积分、优惠券、评价、后台等功能。
- 正式 Logo 和商品图片；当前只有不含外部品牌资产的色块占位视觉。

## 云端部署/第三轮前仍需提供

- 正式门店名称、地址、电话、营业时间。
- 首版菜单（分类、商品、分为单位的价格、规格、排序、上下架）与商品图片。
- 无水印、可商用的正式 Logo，并确认字体、图形和名称商用权利。

支付商户号、绑定状态和云端安全参数不是第二轮动态菜单的前置条件；它们应在第三轮真实支付联调前由商家准备。API v3 密钥和商户私钥不得通过聊天、普通文档或 Git 传递。

第二轮部署步骤见 `cloudbase/README.md`。集合、索引、演示数据和四个云函数完成部署前，`.env.local` 中的 `VUE_APP_USE_CLOUD` 必须保持 `false`。

## 第三方说明

桌码点单与支付后自动出单的部署设计见 [docs/table-ordering-and-printing.md](docs/table-ordering-and-printing.md)。当前前端已经支持桌号参数与小程序码 `scene`，打印厂商适配需在确定设备后接入独立云函数。

需求手册提到的 `a313901703/wp-coffee` 仅作为流程参考。本实现未复制其代码、品牌、Logo、图片或视觉资产。
