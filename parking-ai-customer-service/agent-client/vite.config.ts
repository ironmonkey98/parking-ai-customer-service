import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// 检查是否存在自签名证书（用于局域网 HTTPS 访问）
// 证书放在父目录的 certs 文件夹中，用户端和客服端共用
const certPath = path.resolve(__dirname, '../certs')
const httpsConfig = fs.existsSync(path.join(certPath, 'key.pem')) && fs.existsSync(path.join(certPath, 'cert.pem'))
  ? {
      key: fs.readFileSync(path.join(certPath, 'key.pem')),
      cert: fs.readFileSync(path.join(certPath, 'cert.pem')),
    }
  : undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5174, // 客服端使用 5174 端口,与用户端 5173 区分
    // ✅ 启用 HTTPS 以支持局域网访问麦克风
    // 如果没有证书文件，则回退到 HTTP（仅限 localhost 使用麦克风）
    https: httpsConfig,
  },
})
