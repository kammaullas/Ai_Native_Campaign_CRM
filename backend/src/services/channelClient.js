const axios = require('axios');
require('dotenv').config();

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:5001';

/**
 * Sends a batch of messages to the external channel service
 * @param {string} campaignId 
 * @param {Array} messages - Array of { logId, customerId, message, channel }
 */
async function dispatchToChannelService(campaignId, messages) {
  try {
    // We do NOT await this in the critical path if we want async background sending, 
    // or we await it here and caller background it.
    await axios.post(`${CHANNEL_SERVICE_URL}/send`, {
      campaignId,
      messages
    });
    console.log(`Dispatched ${messages.length} messages to channel service for campaign ${campaignId}`);
  } catch (error) {
    console.error('Failed to dispatch to channel service:', error.message);
    // Real implementation would use a robust message queue (e.g., BullMQ) with retries
  }
}

module.exports = {
  dispatchToChannelService
};
