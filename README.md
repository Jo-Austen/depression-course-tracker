# Depression Course Tracker

一个用于记录抑郁相关疲劳病程的本地 Web 应用。

它适合做高频、即时的状态记录，而不是回顾式总结。用户在页面中填写“此刻”的身心体验，程序会自动计算疲劳等级、生成病程波动图，并把数据保存到项目目录里的 `data/records.json`。

## 功能概览

- 即时记录 6 个维度的当前感受
- 自动计算 `N1-N9` 疲劳等级
- 生成倒置病程图：时间向右推进，疲劳越重越向下
- 自动补全缺失日期，保持连续病程
- 将数据固定保存到本地 JSON 文件
- 支持导出 JSON 备份

## 当前记录维度

- 此刻精神耗竭
- 此刻身体疲惫
- 此刻行动启动难度
- 此刻情绪下沉
- 此刻头脑迟滞
- 此刻接触他人的难度

## 技术栈

- React
- TypeScript
- Vite
- Express
- ECharts

## 目录结构

```txt
.
├── data/                # 本地数据文件
├── server/              # 本地 Node/Express 服务
├── src/                 # 前端页面与图表逻辑
├── README.md
├── DEPLOYMENT.md
└── package.json
```

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

这会同时启动：

- 前端开发服务
- 本地 JSON 数据服务

默认情况下：

- 前端运行在 `http://localhost:5173` 或 Vite 自动分配的下一个端口
- 后端运行在 `http://localhost:3001`

### 3. 打开应用

在浏览器打开终端里显示的前端地址即可。

## 数据存储

正式数据文件位于：

```txt
data/records.json
```

这个文件会被本地服务自动读取和写入。

如果要迁移到另一台电脑，可以复制整个项目目录，或至少带走这一个 JSON 文件。

## 常用命令

```bash
npm run dev
npm test
npm run build
```

## 测试与构建

- `npm test`：运行 Vitest
- `npm run build`：执行 TypeScript 构建检查并打包前端

## 仓库协作建议

- `main`：稳定分支
- `develop`：日常开发分支
- `feat/...`：功能分支

## 说明

这个项目当前不是纯静态站点，因为它依赖本地 Node 服务读写 `data/records.json`。因此它不适合直接部署到 GitHub Pages。更具体的部署方式见 [DEPLOYMENT.md](./DEPLOYMENT.md)。
