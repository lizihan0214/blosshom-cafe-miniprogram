# 规格模块发布清单

此变更尚未部署。无需修改线上 products.options：新版通过 specsVersion: 1 请求规格，旧版仍使用数据库原始选项。

预定配置在 product-specs.json。冰饮增加冰量；T001/T002增加糖分；T004增加茶底。价格不变。

1. 部署 createPayment/index.js、domain.js、product-specs.js；getMenu/index.js、product-specs.js；dispatchPrint/xpyun.js（保留原环境变量及其余文件）。
2. 在体验环境用配置验证弹窗、不同规格购物车分行、下单和小票打印。
3. 上传审核新版小程序。getMenu和createPayment均按specsVersion应用相同规则，旧客户端继续原流程，不强制升级。
4. 新版自动启用规格，围炉煮茶的备注选茶提示仅在新版返回内容中移除。勿另行在数据库启用必选规格，以免破坏旧客户端兼容。
5. 真机确认标准冰/去冰、三分/七分糖和三个茶底均能支付，且小票含对应选择。

兼容性及订单规格测试已加入自动测试。尚需云函数部署、体验版真机验收和正式上传审核；测试未调用真实支付或打印。
