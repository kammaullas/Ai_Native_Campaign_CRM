const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { simulateMessageLifecycle } = require('./src/simulator');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// POST /send - Receive messages to send
app.post('/send', (req, res) => {
  const { campaignId, messages } = req.body;

  if (!campaignId || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Respond immediately
  res.status(202).json({ success: true, received: messages.length });

  // Process asynchronously in the background
  console.log(`Received batch of ${messages.length} messages for campaign ${campaignId}`);
  
  messages.forEach(msg => {
    // Fire and forget
    simulateMessageLifecycle({
      ...msg,
      campaignId
    }).catch(err => {
      console.error('Simulation error:', err);
    });
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'Channel Service OK' });
});

app.listen(PORT, () => {
  console.log(`Channel Service running on port ${PORT}`);
});
