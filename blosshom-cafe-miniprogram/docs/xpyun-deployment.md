# 芯烨云打印接入（待云端部署与实机验收）

当前实现由 paymentNotify 和 queryOrder 在订单确认已支付后调用内部函数 dispatchPrint。
小票包含桌号、取餐码、商品、规格、数量、金额及备注。订单号作为 print_jobs 的文档 ID，条件更新用于并发抢占。

## 部署

1. 在正式环境创建 print_jobs 集合，应用 cloudbase/security-rules/print_jobs.json，禁止客户端读写。
2. 部署 dispatchPrint，并将其客户端调用权限设为 false。不要给它配置 HTTP 网关。
3. 仅在 dispatchPrint 云端配置 XPYUN_USER、XPYUN_USER_KEY、XPYUN_SN。
4. 配置 XPYUN_ENABLED=false，XPYUN_STARTS_AT 为正式启用时间（带时区的 ISO 时间，例如 2026-10-08T18:00:00+08:00；请使用实际时间）。
5. 部署 paymentNotify 和 queryOrder；超时分别设置 30 秒，dispatchPrint 设置 20 秒。保留现有微信支付环境变量。
6. 确认集合和权限后，设 XPYUN_ENABLED=true。启用时间之前支付的订单不会打印。
7. 新建一笔带桌号的测试订单，支付后核对实物小票。重复查询同一订单，确认不重复出单。

## 状态与限制

- SENT 表示芯烨云已接收或命中其去重保护，不代表实物已出纸；须在芯烨平台核对打印结果。
- FAILED 为明确拒绝，修复配置后再次查单可重试。
- UNKNOWN 为结果不确定，不自动重发；应先核对芯烨平台和纸票。
- DISPATCHING 长时间停留可能是函数中断，须人工核对后处理。
- 芯烨云去重窗口只有五分钟，本地任务状态用于持久去重。
- 离线任务在芯烨云缓存两小时。超时或缺纸应由工作人员检查。
- 尚未实现定时补偿、商家端异常提醒、打印结果回查和人工补打页面。上线前应完成这些运营保障，不能将本阶段视为完整生产验收。

官方文档：https://www.xpyun.net/open/index.html
密钥只存云端环境变量，不提交到版本库。
