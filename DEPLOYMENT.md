# Deployment Notes

## 结论

这个项目目前不能直接作为纯静态页面部署到 GitHub Pages。

原因是：

- 前端需要调用 `/api/records`
- `/api/records` 由本地 Express 服务提供
- Express 服务负责读写 `data/records.json`

GitHub Pages 只能托管静态文件，不能运行这个后端服务。

## 当前适合的部署方式

### 1. 本地运行

最适合当前版本。

优点：

- 数据直接保存在本地项目目录
- 不需要数据库
- 使用最简单，最符合当前设计

方式：

```bash
npm install
npm run dev
```

## 如果要上线到公网

有两种主路径。

### 方案 A：前后端一起部署到一个 Node 环境

适合：

- 想保留 JSON 文件存储
- 不想立刻引入数据库

可选平台：

- Render
- Railway
- Fly.io
- 自己的 VPS

需要做的事：

- 把前端构建产物托管给同一个 Node 服务
- 把 `data/records.json` 放到服务器可写目录
- 注意平台的文件系统是否会在重启后丢失数据

风险：

- 很多托管平台的本地磁盘不是持久化存储
- 仅靠服务器文件系统，长期来看不适合多人或正式生产使用

### 方案 B：改成数据库存储

适合：

- 未来要长期使用
- 想多设备同步
- 想做账号体系

推荐方向：

- SQLite：最轻量，适合单用户或轻量部署
- PostgreSQL：更适合正式线上版本

改成数据库后，可以把项目部署为：

- 前端：Vercel / Netlify
- 后端：Render / Railway / Fly.io
- 数据库：Neon / Supabase / Render Postgres

## 不推荐的方式

### GitHub Pages

不推荐原因：

- 不能运行 Express
- 不能写 `data/records.json`
- 只能展示静态前端，无法保存真实数据

## 当前版本的最佳建议

如果当前目标是：

- 自己日常使用
- 在本机记录
- 保持 JSON 结构简单

那就继续使用本地运行模式，不必急着部署到 GitHub Pages。
