/**
 * TakeoverAIAgentCall API 封装
 *
 * 功能：
 * - 调用阿里云 TakeoverAIAgentCall API
 * - 实现真人接管 AI 会话
 * - 处理 API 错误
 */

/**
 * 调用 TakeoverAIAgentCall API
 * @param {Object} callIceOpenApi - OpenAPI 调用函数
 * @param {Object} buildOpenApiError - 错误构建函数
 * @param {Object} pickDefined - 过滤未定义值函数
 * @param {Object} params - 参数对象
 * @param {string} params.instanceId - AI 实例 ID
 * @param {string} params.humanAgentUserId - 客服的 RTC User ID
 * @param {boolean} params.requireToken - 是否需要返回 RTC Token（默认 true）
 * @param {string} params.region - 区域
 * @returns {Promise<Object>} API 响应
 */
async function takeoverAIAgentCall(callIceOpenApi, buildOpenApiError, pickDefined, {
  instanceId,
  humanAgentUserId,
  requireToken = true,
  region
}) {
  // 参数验证
  if (!instanceId) {
    return {
      code: 400,
      message: 'instanceId is required',
      success: false
    };
  }

  if (!humanAgentUserId) {
    return {
      code: 400,
      message: 'humanAgentUserId is required',
      success: false
    };
  }

  try {
    console.log(`[TakeoverAPI] Calling TakeoverAIAgentCall:`, {
      instanceId,
      humanAgentUserId,
      requireToken,
      region
    });

    // 调用阿里云 OpenAPI
    const response = await callIceOpenApi(
      'TakeoverAIAgentCall',
      region,
      pickDefined({
        InstanceId: instanceId,
        HumanAgentUserId: humanAgentUserId,
        RequireToken: requireToken
      })
    );

    const body = response?.body || {};
    const code = Number(body.Code || body.code) || 200;

    console.log(`[TakeoverAPI] Response received:`, {
      code,
      channelId: body.ChannelId,
      humanAgentUserId: body.HumanAgentUserId,
      hasToken: !!body.Token
    });

    // 检查响应状态
    if (code !== 200) {
      return {
        code: code,
        message: body.Message || body.message || 'Takeover failed',
        errorCode: body.ErrorCode || body.error_code,
        requestId: body.RequestId || body.request_id,
        success: false
      };
    }

    // 成功响应
    return {
      code: 200,
      message: 'success',
      success: true,
      channelId: body.ChannelId,
      humanAgentUserId: body.HumanAgentUserId,
      token: body.Token,
      requestId: body.RequestId || body.request_id
    };

  } catch (error) {
    console.error('[TakeoverAPI] Error:', error);

    const openApiError = buildOpenApiError(error, 'takeoverAIAgentCall failed');

    return {
      code: openApiError.code,
      message: openApiError.message,
      errorCode: openApiError.error_code,
      requestId: openApiError.request_id,
      success: false
    };
  }
}

module.exports = { takeoverAIAgentCall };
