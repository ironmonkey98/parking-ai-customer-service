#!/bin/bash

# ============================================================
# 自签名 HTTPS 证书生成脚本
# 用于解决局域网访问时麦克风权限问题
# ============================================================

CERT_DIR="./certs"

# 创建证书目录
mkdir -p "$CERT_DIR"

# 获取本机 IP 地址（用于证书 SAN）
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "192.168.1.100")
else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}' || echo "192.168.1.100")
fi

echo "============================================"
echo "  生成自签名 HTTPS 证书"
echo "============================================"
echo ""
echo "本机 IP: $LOCAL_IP"
echo "证书目录: $CERT_DIR"
echo ""

# 创建 OpenSSL 配置文件（包含 SAN 扩展）
cat > "$CERT_DIR/openssl.cnf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = CN
ST = Fujian
L = Xiamen
O = AIHelper Dev
OU = Development
CN = localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = $LOCAL_IP
EOF

# 生成私钥和自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/key.pem" \
    -out "$CERT_DIR/cert.pem" \
    -config "$CERT_DIR/openssl.cnf"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 证书生成成功！"
    echo ""
    echo "生成的文件："
    echo "  - $CERT_DIR/key.pem  (私钥)"
    echo "  - $CERT_DIR/cert.pem (证书)"
    echo ""
    echo "============================================"
    echo "  使用说明"
    echo "============================================"
    echo ""
    echo "1. 重启开发服务器："
    echo "   npm run dev"
    echo ""
    echo "2. 局域网访问地址："
    echo "   用户端: https://$LOCAL_IP:5173"
    echo "   客服端: https://$LOCAL_IP:5174"
    echo ""
    echo "3. 首次访问时，浏览器会提示证书不受信任："
    echo "   - Chrome: 点击「高级」→「继续前往」"
    echo "   - Firefox: 点击「高级」→「接受风险并继续」"
    echo "   - Safari: 点击「显示详细信息」→「访问此网站」"
    echo ""
    echo "4. 如需永久信任证书（可选）："
    echo "   macOS: 双击 cert.pem → 添加到钥匙串 → 设置为「始终信任」"
    echo "   Windows: 双击 cert.pem → 安装证书 → 放入「受信任的根证书」"
    echo ""
else
    echo ""
    echo "❌ 证书生成失败！请检查 OpenSSL 是否已安装。"
    echo ""
    echo "安装 OpenSSL："
    echo "  macOS:   brew install openssl"
    echo "  Ubuntu:  sudo apt install openssl"
    echo "  Windows: 下载 https://slproweb.com/products/Win32OpenSSL.html"
    exit 1
fi
