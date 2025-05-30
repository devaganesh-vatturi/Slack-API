const express=require('express');
const axios=require('axios');
const app=express();
require('dotenv').config();
app.use(express.json());

const SLACK_API = 'https://slack.com/api';
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;
const channelId = process.env.SLACK_CHANNEL_ID;
app.post('/send', async (req, res) => {
  const {text } = req.body;
   if (!text) {
    return res.status(400).json({ error: ' Missing required query parameter: text' });
  }

  try {
    const response = await axios.post(`${SLACK_API}/chat.postMessage`, {
      channel: channelId,
      text: text
    }, {
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/schedule", async (req, res) => {
    const {text,sec} =req.body;
 if (!text || sec) {
    return res.status(400).json({ error: ' Missing required query parameters: text, sec' });
  }

  const result = await axios.post(
        `${SLACK_API}/chat.scheduleMessage`,
    {
      channel: channelId,
      text: text,
      post_at: Math.floor(Date.now() / 1000) + sec 
    },
    {
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
  res.send(result.data);
});


app.get('/getmessages', async (req, res) => {
    
  try {
    const response = await axios.get(`${SLACK_API}/conversations.history`, {
      params: {
        channel: channelId,
        limit: 10, 
      },
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
      }
    });

    if (response.data.ok) {
      res.json(response.data.messages.map(msg => ({
        user: msg.user || (msg.bot_profile?.name || 'Unknown'),
        ts: msg.ts,
        time: new Date(parseFloat(msg.ts) * 1000).toLocaleString(),
        text: msg.text   }))); 
    } else {
      res.status(502).send(`Error from Slack API: ${response.data.error}`);
    }
  } catch (error) {
    res.status(501).send(`Server Error: ${error.message}`);
  }
});

app.patch('/updatemessage', async (req, res) => {
  const { ts, newText } = req.body;

  if (!ts || !newText) {
    return res.status(400).json({ error: ' Missing required query parameters :ts, newText' });
  }

  try {
    const response = await axios.post(`${SLACK_API}/chat.update`, {
      channel:channelId,
      ts,
      text: newText
    }, {
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.ok) {
      res.json({ message: 'Message updated successfully!', data: response.data });
    } else {
      res.status(502).json({ error: response.data.error });
    }
  } catch (error) {
    res.status(501).json({ error: error.message });
  }
});


app.delete('/deletemessage', async (req, res) => {
  const {ts} = req.body; 
  if (!ts) {
    return res.status(400).send('Missing required query parameter: ts');
  }

  try {
    const response = await axios.post(`${SLACK_API}/chat.delete`, null, {
      params: {
        channel: channelId,
        ts: ts,
      },
      headers: {
        Authorization: `Bearer ${SLACK_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data.ok) {
      res.json({ message: 'Message deleted successfully' });
    } else {
      res.status(502).send(`Slack API error: ${response.data.error}`);
    }
  } catch (error) {
    res.status(500).send(`Server error: ${error.message}`);
  }
});

app.post('/',(req,res)=>{
    res.send("hello:)");
})
app.listen(5000,()=>{
    console.log("started 5000");
});