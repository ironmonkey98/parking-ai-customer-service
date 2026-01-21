# 启动脚本使用说明

本项目提供了三个便捷的启动脚本，帮助你快速启动和停止服务。

## 📋 脚本列表

### 1. `start-all.sh` - 一键启动所有服务 ⭐ 推荐

**功能**：
- 自动检查并清理端口占用（3000, 5173, 5174）
- 检查并安装依赖（如果缺失）
- 验证环境配置文件
- 同时启动后端、用户端、客服端三个服务
- 后台运行并生成日志文件

**使用方法**：
```bash
./start-all.sh
```

**服务信息**：
- 后端服务：http://localhost:3000
- 用户端：http://localhost:5173
- 客服端：http://localhost:5174

**日志文件**：
- `logs/backend.log` - 后端日志
- `logs/user-client.log` - 用户端日志
- `logs/agent-client.log` - 客服端日志

**停止服务**：
- 按 `Ctrl+C` 停止所有服务
- 或运行 `./stop-all.sh`

---

### 2. `stop-all.sh` - 停止所有服务

**功能**：
- 停止所有运行中的服务（通过 PID 文件）
- 强制清理端口占用（以防 PID 不准确）
- 可选清理日志文件

**使用方法**：
```bash
./stop-all.sh
```

**执行流程**：
1. 读取 PID 文件并停止进程
2. 检查端口占用并强制清理
3. 询问是否清理日志文件（5 秒超时，默认保留）

---

### 3. `start-backend.sh` - 仅启动后端

**功能**：
- 仅启动后端服务
- 适用于只需要测试后端 API 的场景

**使用方法**：
```bash
./start-backend.sh
```

**停止服务**：
- 按 `Ctrl+C` 停止

---

## 🚀 快速开始

### 首次使用

1. **配置环境变量**（如果还未配置）：
   ```bash
   cd server
   cp .env.example .env
   # 编辑 .env 文件，填入阿里云密钥
   ```

2. **启动所有服务**：
   ```bash
   ./start-all.sh
   ```

3. **访问应用**：
   - 打开浏览器访问 http://localhost:5173（用户端）
   - 打开浏览器访问 http://localhost:5174（客服端）

### 日常开发

**启动服务**：
```bash
./start-all.sh
```

**查看日志**：
```bash
# 实时查看后端日志
tail -f logs/backend.log

# 实时查看用户端日志
tail -f logs/user-client.log

# 实时查看客服端日志
tail -f logs/agent-client.log
```

**停止服务**：
```bash
./stop-all.sh
```

---

## 🔧 手动启动（替代方案）

如果不想使用脚本，也可以手动分别启动：

### 后端
```bash
cd server
npm run dev
```

### 用户端
```bash
npm run dev
```

### 客服端
```bash
cd agent-client
npm run dev
```

---

## ⚠️ 常见问题

### 1. 端口被占用

**错误信息**：
```
Port 5173 is in use, trying another one...
```

**解决方法**：
- 使用 `./start-all.sh` 会自动清理端口
- 或手动清理：`lsof -ti:5173 | xargs kill -9`

### 2. 脚本没有执行权限

**错误信息**：
```
Permission denied: ./start-all.sh
```

**解决方法**：
```bash
chmod +x start-all.sh stop-all.sh start-backend.sh
```

### 3. 环境变量未配置

**错误信息**：
```
✗ 未找到 server/.env 文件
```

**解决方法**：
```bash
cd server
cp .env.example .env
# 编辑 .env 文件，填入必要的配置
```

### 4. 依赖未安装

脚本会自动检测并安装依赖，但如果失败可以手动安装：

```bash
# 后端依赖
cd server && npm install

# 用户端依赖
cd .. && npm install

# 客服端依赖
cd agent-client && npm install
```

---

## 📝 脚本工作原理

### `start-all.sh` 执行流程

```
1. 清理端口占用（3000, 5173, 5174）
   ↓
2. 检查 Node.js 和 npm
   ↓
3. 检查并安装项目依赖
   ↓
4. 验证环境配置文件
   ↓
5. 创建 logs/ 目录
   ↓
6. 启动后端服务（后台运行，日志重定向）
   ↓
7. 等待 3 秒
   ↓
8. 启动用户端（后台运行，日志重定向）
   ↓
9. 等待 3 秒
   ↓
10. 启动客服端（后台运行，日志重定向）
   ↓
11. 保存 PID 到文件
   ↓
12. 显示服务信息
   ↓
13. 等待 Ctrl+C（捕获信号后清理进程）
```

### PID 文件说明

脚本会在项目根目录创建三个 PID 文件：
- `.backend.pid` - 后端服务进程 ID
- `.user-client.pid` - 用户端进程 ID
- `.agent-client.pid` - 客服端进程 ID

这些文件用于 `stop-all.sh` 脚本停止服务时定位进程。

---

## 🎯 推荐工作流

### 开发阶段
```bash
# 早上开始工作
./start-all.sh

# 开发中...
# 查看日志（如果需要）
tail -f logs/backend.log

# 下班前停止
./stop-all.sh
```

### 仅后端开发
```bash
# 如果只修改后端代码
./start-backend.sh
```

### 调试模式
```bash
# 手动启动可以看到完整输出
cd server && npm run dev  # 终端 1
npm run dev               # 终端 2
cd agent-client && npm run dev  # 终端 3
```

---

## 📦 脚本特性

✅ **自动化**：一键启动所有服务  
✅ **智能检测**：自动检测端口占用并清理  
✅ **依赖管理**：自动检测并安装缺失依赖  
✅ **日志记录**：所有输出重定向到日志文件  
✅ **优雅退出**：Ctrl+C 自动清理所有进程  
✅ **颜色输出**：清晰的彩色终端输出  
✅ **错误处理**：友好的错误提示和解决建议  

---

## 🔗 相关文档

- [项目 README](./README.md)
- [CLAUDE.md - 项目架构说明](./CLAUDE.md)
- [后端 API 文档](./server/README.md)

---

**Happy Coding! 🎉**
