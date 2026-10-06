# CloudBase 第二轮部署说明

目标环境：`cloud1-d8gupi6ncd593f141`。环境 ID 和 AppID 属于前端可见标识；本目录不包含 AppSecret、API v3 密钥、商户私钥或证书。

## 1. 创建集合

在微信开发者工具打开构建目录 `dist/build/mp-weixin`，进入“云开发 → 数据库”，创建：

- `categories`
- `products`
- `store_config`
- `tables`
- `orders`

菜单和门店集合设为“所有用户可读、仅管理端可写”，`orders` 设为“仅管理端可读写”。如使用自定义安全规则，逐个复制 `security-rules/` 下对应文件。订单只能通过云函数读写。

## 2. 创建索引

按 `indexes.json` 在控制台创建复合索引。至少需要：

- `categories`: `enabled` 升序 + `sort` 升序。
- `products`: `enabled` 升序 + `sort` 升序。
- `orders`: `openid` 升序 + `createdAt` 降序。
- `orders`: `openid` 升序 + `clientRequestId` 升序，唯一索引，用于防止重复创建订单。

## 3. 导入演示菜单

`data/*.json` 是 CloudBase 控制台可导入的逐行 JSON；CSV 只用于人工批量编辑简单字段。商品规格是嵌套对象时请优先用 JSON，避免 CSV 把对象导成字符串。

导入顺序：`categories.json` → `products.json` → `store_config.json` → `tables.json`。当前桌号模板为 `01–12`；正式制作桌牌前应逐项核对。价格 `basePrice` 必须是人民币“分”的非负整数。商品 `_id`、`id` 必须保持一致，且已经被购物车引用后不要修改。

## 4. 上传商品图片

1. 在“云开发 → 存储”建立 `products/` 目录并上传可商用图片。
2. 复制文件 ID（形如 `cloud://环境/products/C001.jpg`）。
3. 写入对应 `products.image`。
4. 图片建议统一比例和体积；不得上传带其他品牌、水印或权利不明的素材。

普通商品名、价格、图片、排序、`enabled` 和 `soldOut` 修改后不需要重新发布小程序；用户下拉刷新即可生效。

## 5. 部署云函数

构建后 `dist/build/mp-weixin/project.config.json` 会包含 `cloudfunctionRoot: "cloudfunctions/"`，四个云函数也会复制到构建目录。微信开发者工具中分别右键以下目录，选择“上传并部署：云端安装依赖”：

- `getMenu`
- `createPayment`
- `queryOrder`
- `getMyOrders`

再把 `function-security-rules.json` 配置到“云函数 → 权限控制”。`createPayment` 目前只创建经云端可信计价的 `UNPAID` 订单，不调用微信支付、不生成取餐号。

## 6. 启用前端云模式

确认集合、索引、数据和四个云函数均已部署后，将本机 `.env.local` 改为：

```text
VUE_APP_CLOUDBASE_ENV_ID=cloud1-d8gupi6ncd593f141
VUE_APP_USE_CLOUD=true
```

重新运行 `npm run build:mp-weixin`。先验证云菜单和下拉刷新，再创建一笔待支付订单。断网时小程序只展示最近缓存菜单，并禁止创建云端订单。

## 7. 验证访问控制

- 小程序客户端直接写四个集合均应被拒绝。
- `getMyOrders` 只返回 `cloud.getWXContext().OPENID` 对应订单。
- `queryOrder` 使用别人的订单号应返回“未找到订单”。
- 前端篡改商品名、价格、总额不会影响云端金额；云函数只接受商品 ID、规格和数量并重新读取 `products`。
- 连续提交相同 `clientRequestId` 只返回同一订单。

真实微信支付属于第三轮，届时安全参数只配置在云端密钥管理或云函数环境变量中。
