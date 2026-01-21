# 局域网访问配置指南

## 问题描述

在另一台电脑上无法通过 `http://192.168.171.130:5173` 访问前端页面。

## 原因分析

Vite 开发服务器默认只绑定到 `localhost` (127.0.0.1)，不允许外部设备访问。

## 解决方案

### ✅ 已完成的配置

我们已经修改了两个 Vite 配置文件，添加了 `host: '0.0.0.0'` 配置：

#### 1. 用户端配置 (vite.config.ts)

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // ✅ 允许局域网访问
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

#### 2. 客服端配置 (agent-client/vite.config.ts)

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // ✅ 允许局域网访问
    port: 5174,
  },
});
```

### 🚀 如何使用

#### 步骤 1: 重启服务

配置修改后需要重启服务才能生效：

```bash
# 停止现有服务
./stop-all.sh

# 重新启动
./start-all.sh
```

#### 步骤 2: 查看本机 IP 地址

在启动服务的电脑上查看 IP 地址：

**macOS / Linux:**
```bash
# 方式 1: 使用 ifconfig
ifconfig | grep "inet " | grep -v 127.0.0.1

# 方式 2: 更简洁的命令
ipconfig getifaddr en0  # Wi-Fi
ipconfig getifaddr en1  # 以太网
```

**Windows:**
```cmd
ipconfig
```

假设你的 IP 是 `192.168.171.130`

#### 步骤 3: 在其他设备访问

现在可以在局域网内的其他设备上访问：

- **用户端**: `http://192.168.171.130:5173`
- **客服端**: `http://192.168.171.130:5174`
- **后端 API**: `http://192.168.171.130:3000`

### 📱 支持的设备

- ✅ 同一局域网内的其他电脑
- ✅ 手机/平板（连接到同一 Wi-Fi）
- ✅ 虚拟机（桥接模式）
- ❌ 外网设备（需要配置端口转发）

## 验证配置

### 方法 1: 查看启动日志

启动服务后，Vite 会显示两个地址：

```
VITE v4.5.14  ready in 100 ms

➜  Local:   http://localhost:5173/      ← 本机访问
➜  Network: http://192.168.171.130:5173/ ← 局域网访问 ✅
```

### 方法 2: 检查端口绑定

```bash
# 查看端口绑定情况
lsof -i :5173

# 如果显示 *:5173 或 0.0.0.0:5173，说明配置成功
# 如果显示 127.0.0.1:5173，说明还是本地绑定
```

## 常见问题排查

### 问题 1: 仍然无法访问

**可能原因**：
1. 防火墙阻止了端口
2. 服务未重启
3. 两台设备不在同一网络

**解决方法**：

#### macOS 防火墙设置
```bash
# 临时允许端口（需要管理员权限）
sudo pfctl -d  # 暂时禁用防火墙进行测试

# 或者在系统偏好设置中添加应用例外：
# 系统偏好设置 → 安全性与隐私 → 防火墙 → 防火墙选项
```

#### Linux 防火墙设置
```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 5173/tcp
sudo ufw allow 5174/tcp
sudo ufw allow 3000/tcp

# CentOS/RHEL (firewalld)
sudo firewall-cmd --add-port=5173/tcp --permanent
sudo firewall-cmd --add-port=5174/tcp --permanent
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

#### Windows 防火墙设置
1. 控制面板 → Windows Defender 防火墙
2. 高级设置 → 入站规则 → 新建规则
3. 端口 → TCP → 特定本地端口 → 5173, 5174, 3000
4. 允许连接 → 完成

### 问题 2: 只能访问前端，后端 API 请求失败

**原因**: 前端通过 `localhost:3000` 调用后端 API，但在其他设备上 `localhost` 指向该设备自己。

**解决方法**: 修改前端代码中的 API 地址

#### 方案 A: 使用环境变量（推荐）

创建 `.env.development`:
```env
VITE_API_BASE_URL=http://192.168.171.130:3000
```

修改前端代码使用环境变量：
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
```

#### 方案 B: 修改 Vite Proxy（仅限开发环境）

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.171.130:3000', // 使用具体 IP
        changeOrigin: true
      }
    }
  }
});
```

### 问题 3: 手机访问白屏

**可能原因**：
- HTTPS 混合内容警告
- 浏览器兼容性问题
- 网络代理干扰

**解决方法**：
1. 使用手机浏览器的"桌面模式"
2. 清除浏览器缓存
3. 关闭 VPN 或代理

### 问题 4: 访问速度很慢

**原因**: Vite 开发服务器每次请求都需要实时编译。

**解决方法**：
```bash
# 构建生产版本（更快）
npm run build
npm run preview -- --host 0.0.0.0
```

## 安全注意事项

⚠️ **重要提醒**：

1. **仅在受信任的局域网使用**
   - `0.0.0.0` 会暴露服务到所有网络接口
   - 不要在公共 Wi-Fi 上使用

2. **生产环境不要使用开发服务器**
   - 开发服务器不安全，性能差
   - 生产环境应使用 Nginx/Apache + 构建后的静态文件

3. **敏感信息保护**
   - 不要在代码中硬编码 API 密钥
   - 使用环境变量管理配置

## 生产环境部署

如果需要真正的外网访问，建议：

1. **构建生产版本**:
   ```bash
   npm run build
   ```

2. **使用 Nginx 部署**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /path/to/dist;
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:3000;
       }
   }
   ```

3. **配置 HTTPS**（推荐使用 Let's Encrypt）

## 快速测试脚本

创建一个测试脚本来验证局域网访问：

```bash
#!/bin/bash
# test-network.sh

echo "本机 IP 地址："
ipconfig getifaddr en0 || ipconfig getifaddr en1

echo -e "\n可访问地址："
IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
echo "  用户端: http://$IP:5173"
echo "  客服端: http://$IP:5174"
echo "  后端API: http://$IP:3000"

echo -e "\n端口监听状态："
lsof -i :5173 | head -2
lsof -i :5174 | head -2
lsof -i :3000 | head -2
```

## 总结

✅ **配置完成后**，你应该能够：
1. 在本机访问: `http://localhost:5173`
2. 在局域网其他设备访问: `http://192.168.171.130:5173`
3. Vite 启动时会显示 Network 地址

🔄 **记得重启服务**以使配置生效！

📚 **相关文档**:
- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [SCRIPTS.md](./SCRIPTS.md) - 启动脚本说明
