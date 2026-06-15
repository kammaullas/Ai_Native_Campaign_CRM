const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Segment = require('../models/Segment');
const CommunicationLog = require('../models/CommunicationLog');
const segmentEngine = require('../services/segmentEngine');
const channelClient = require('../services/channelClient');

// GET /api/campaigns - List all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).populate('segmentId', 'name');
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/campaigns/:id - Get a single campaign with detail
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('segmentId');
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    
    // Also fetch the first 100 comm logs for preview
    const logs = await CommunicationLog.find({ campaignId: req.params.id })
      .populate('customerId', 'name email phone')
      .limit(100)
      .sort({ createdAt: -1 });

    res.json({ campaign, logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST /api/campaigns - Create and launch a campaign
router.post('/', async (req, res) => {
  try {
    const { name, segmentId, message, channel } = req.body;
    
    const segment = await Segment.findById(segmentId);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // 1. Fetch all matching customers for this segment
    const customers = await segmentEngine.getMatchingCustomers(segment.rules);
    
    // 2. Create the Campaign document
    const campaign = new Campaign({
      name,
      segmentId,
      message,
      channel,
      status: 'RUNNING',
      stats: {
        total: customers.length,
        sent: 0,
        delivered: 0,
        failed: 0,
        opened: 0,
        clicked: 0
      }
    });
    
    await campaign.save();

    // Respond immediately - process in background
    res.status(202).json(campaign);

    // --- BACKGROUND PROCESSING ---
    
    // 3. Create CommunicationLog entries
    const logEntries = customers.map(customer => {
      // Personalize message
      const personalizedMessage = message.replace(/\{\{name\}\}/gi, customer.name || 'there');
      
      return {
        campaignId: campaign._id,
        customerId: customer._id,
        message: personalizedMessage,
        channel: channel,
        status: 'SENT',
        statusHistory: [{ status: 'SENT', timestamp: new Date() }]
      };
    });

    const createdLogs = await CommunicationLog.insertMany(logEntries);
    
    // Update campaign sent stats
    await Campaign.findByIdAndUpdate(campaign._id, {
      $inc: { 'stats.sent': createdLogs.length }
    });

    // 4. Dispatch to Channel Service
    const dispatchPayload = createdLogs.map(log => ({
      logId: log._id,
      customerId: log.customerId,
      message: log.message,
      channel: log.channel
    }));

    // Send to channel service asynchronously
    channelClient.dispatchToChannelService(campaign._id, dispatchPayload);

  } catch (error) {
    console.error('Failed to launch campaign:', error);
    // Note: Since we return 202 early, if it fails here, we ideally need to mark campaign as FAILED.
    // In a production app, we'd use a background queue manager.
  }
});

// GET /api/campaigns/:id/stats - Get just the stats (for polling)
router.get('/:id/stats', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).select('stats status');
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch campaign stats' });
  }
});

module.exports = router;
