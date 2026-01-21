#!/bin/bash
# 测试不同区域的 Agent ID

REGIONS=("cn-shanghai" "cn-beijing" "cn-hangzhou" "cn-shenzhen" "ap-southeast-1")

echo "测试 Agent ID: 2abd65e5d91a43979708ca300994bb8b"
echo "========================================"
echo ""

for region in "${REGIONS[@]}"; do
    echo "测试区域: $region"

    # 临时修改环境变量
    export ALIBABA_CLOUD_REGION="$region"

    # 测试 API
    response=$(curl -s -X POST http://localhost:3000/api/start-call \
        -H 'Content-Type: application/json' \
        -d "{\"userId\":\"test-$region\",\"region\":\"$region\"}")

    # 检查是否成功
    if echo "$response" | grep -q "AgentNotFound"; then
        echo "  ❌ 失败: Agent 不在此区域"
    elif echo "$response" | grep -q "rtcChannelId"; then
        echo "  ✅ 成功! Agent 在此区域"
        echo "  响应: $response"
        break
    else
        echo "  ⚠️  其他错误: $response"
    fi

    echo ""
done
