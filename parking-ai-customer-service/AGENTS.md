# Repository Guidelines

## 项目结构与模块组织
- `src/`：React + TypeScript 前端（Vite），入口 `src/main.tsx`，页面逻辑在 `src/App.tsx`。
- `src/hooks/`：通话逻辑与状态管理（如 `useAICall.ts`）。
- `src/components/`、`src/assets/`：可复用组件与静态资源。
- `server/`：后端 API（Express）。`server/index.js` 为 ESM 版本，`server/server.js` 为 CommonJS 版本。
- `index.html`、`css/`、`js/`：静态 H5 版本（与 React 版本并存，修改前先确认目标实现）。

## 构建、测试与开发命令
```bash
npm install              # 安装前端依赖
npm run dev              # Vite 开发服务器（3000，代理 /api -> 4000）
npm run build            # 生产构建（tsc + vite build）
npm run preview          # 预览构建产物
npm run server           # 启动 server/index.js（默认 4000）
cd server && npm install # 安装后端依赖
cd server && npm run dev # Nodemon 启动 server/server.js
```

## 编码风格与命名约定
- `src/` 使用 2 空格缩进、单引号、分号；避免 `any`。
- 组件文件用 PascalCase，hooks 以 `useX` 命名，CSS 类名用 kebab-case。
- 后端保持与文件一致的模块风格：`server/index.js` 为 ESM，`server/server.js` 为 CommonJS。

## 测试指南
- 当前无自动化测试与覆盖率要求，`server/package.json` 中的 `test` 为占位。
- 如新增测试，建议使用 `src/__tests__/` 或 `server/__tests__/`，命名 `*.test.ts(x)` 或 `*.spec.js`，并补充脚本。

## 提交与 PR 指南
- 当前目录无 Git 历史，无法总结既有提交规范。
- 建议使用简短命令式或 Conventional Commits（如 `feat:` / `fix:`）。
- PR 应包含：变更摘要、测试步骤、UI 变更截图、涉及端口或配置的说明。

## 安全与配置
- 禁止提交 `.env`，以 `server/.env.example` 为模板。
- 密钥仅放后端环境变量；如调整端口，同步更新 `vite.config.ts` 与文档。
