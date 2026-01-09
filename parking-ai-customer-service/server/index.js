import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ICE20201109, * as $ICE20201109 from '@alicloud/ice20201109';
import * as $OpenApi from '@alicloud/tea-openapi';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ALIBABA_ACCESS_KEY_ID = process.env.ALIBABA_ACCESS_KEY_ID;
const ALIBABA_ACCESS_KEY_SECRET = process.env.ALIBABA_ACCESS_KEY_SECRET;
const ALIBABA_REGION_ID = process.env.ALIBABA_REGION_ID || 'cn-shanghai';
const AI_AGENT_ID = process.env.AI_AGENT_ID;

if (!ALIBABA_ACCESS_KEY_ID || !ALIBABA_ACCESS_KEY_SECRET || !AI_AGENT_ID) {
  console.error("Missing required environment variables!");
  process.exit(1);
}

const createClient = () => {
  const config = new $OpenApi.Config({
    accessKeyId: ALIBABA_ACCESS_KEY_ID,
    accessKeySecret: ALIBABA_ACCESS_KEY_SECRET,
  });
  config.endpoint = `ice.${ALIBABA_REGION_ID}.aliyuncs.com`;
  return new ICE20201109(config);
};

app.post('/api/start-call', async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const client = createClient();
    const request = new $ICE20201109.StartAIAgentInstanceRequest({
      agentId: AI_AGENT_ID,
      runtimeConfig: {
        disableInterrupt: false, 
      },
    });

    const response = await client.startAIAgentInstance(request);
    const body = response.body;

    res.json({
      rtcChannelId: body.channelId, 
      rtcJoinToken: body.token,
      agentId: AI_AGENT_ID,
      instanceId: body.instanceId
    });

  } catch (error) {
    console.error('Failed to start AI Agent:', error);
    res.status(500).json({ error: 'Failed to start AI Agent', details: error.message });
  }
});

const PORT = process.env.SERVER_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
