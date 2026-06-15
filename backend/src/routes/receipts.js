const express = require('express');
const router = express.Router();
const CommunicationLog = require('../models/CommunicationLog');
const Campaign = require('../models/Campaign');

// POST /api/receipts
router.post('/', async (req, res) => {
  try {
    const { logId, campaignId, status, timestamp } = req.body;

    if (!logId || !campaignId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the log and check if this status already exists (idempotency check)
    // The channel service might retry callbacks, we don't want to double count
    const log = await CommunicationLog.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    const hasStatus = log.statusHistory.some(s => s.status === status);
    if (hasStatus) {
      // Already processed this status for this log
      return res.status(200).json({ message: 'Receipt already processed' });
    }

    // 1. Update CommunicationLog status and push to history
    await CommunicationLog.findByIdAndUpdate(logId, {
      status: status,
      $push: { statusHistory: { status, timestamp: timestamp || new Date() } }
    });

    // 2. Atomically increment the campaign stats
    // Valid stats: delivered, failed, opened, clicked, conversions
    let statField = `stats.${status.toLowerCase()}`;
    if (status === 'CONVERTED') {
      statField = 'stats.conversions';
    }
    
    // We only increment these specific stats
    if (['DELIVERED', 'FAILED', 'OPENED', 'CLICKED', 'CONVERTED'].includes(status)) {
      const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { [statField]: 1 }
      }, { returnDocument: 'after' });
      
      // Update campaign status to COMPLETED if all messages reach terminal state
      if (updatedCampaign.stats.sent > 0 && (updatedCampaign.stats.delivered + updatedCampaign.stats.failed) >= updatedCampaign.stats.sent) {
        if (updatedCampaign.status !== 'COMPLETED') {
          updatedCampaign.status = 'COMPLETED';
          await updatedCampaign.save();
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing receipt:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
});

module.exports = router;
