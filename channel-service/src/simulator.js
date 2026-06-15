const axios = require('axios');
require('dotenv').config();

const CRM_BACKEND_URL = process.env.CRM_BACKEND_URL || 'http://localhost:5000';

/**
 * Helper to pause execution
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulates the delivery lifecycle of a message
 * @param {Object} messageObj - { logId, customerId, message, channel, campaignId }
 */
async function simulateMessageLifecycle(messageObj) {
  const { logId, campaignId } = messageObj;

  // 1. Wait random 500ms–3000ms before doing anything
  const initialDelay = Math.floor(Math.random() * 2500) + 500;
  await sleep(initialDelay);

  // 2. Determine outcome: 85% Delivered, 10% Failed (Wait, that leaves 5% unaccounted. Let's say 90% Delivered, 10% Failed)
  const isDelivered = Math.random() < 0.90;
  
  if (!isDelivered) {
    await sendCallback(logId, campaignId, 'FAILED');
    return; // Lifecycle ends
  }

  // If delivered, send DELIVERED callback
  await sendCallback(logId, campaignId, 'DELIVERED');

  // 3. Determine if opened (60% of delivered)
  const isOpened = Math.random() < 0.60;
  if (!isOpened) {
    return; // Lifecycle ends
  }

  // Wait random delay before open (1000ms - 5000ms)
  const openDelay = Math.floor(Math.random() * 4000) + 1000;
  await sleep(openDelay);
  
  await sendCallback(logId, campaignId, 'OPENED');

  // 4. Determine if clicked (40% of opened)
  const isClicked = Math.random() < 0.40;
  if (!isClicked) {
    return; // Lifecycle ends
  }

  // Wait random delay before click (1000ms - 3000ms)
  const clickDelay = Math.floor(Math.random() * 2000) + 1000;
  await sleep(clickDelay);

  await sendCallback(logId, campaignId, 'CLICKED');

  // 5. Determine if converted (30% of clicked)
  const isConverted = Math.random() < 0.30;
  if (!isConverted) {
    return; // Lifecycle ends
  }

  // Wait random delay before convert (3000ms - 8000ms)
  const convertDelay = Math.floor(Math.random() * 5000) + 3000;
  await sleep(convertDelay);

  console.log("Firing CONVERTED webhook for logId:", logId);
  await sendCallback(logId, campaignId, 'CONVERTED');
}

/**
 * Sends callback to CRM with retry logic
 */
async function sendCallback(logId, campaignId, status, retries = 3) {
  const payload = {
    logId,
    campaignId,
    status,
    timestamp: new Date()
  };

  const backoff = [1000, 2000, 4000]; // exponential backoff

  for (let i = 0; i < retries; i++) {
    try {
      await axios.post(`${CRM_BACKEND_URL}/api/receipts`, payload);
      console.log(`[Success] Callback sent: logId=${logId}, status=${status}`);
      return;
    } catch (error) {
      console.error(`[Error] Callback failed: logId=${logId}, status=${status}. Attempt ${i + 1} of ${retries}`);
      if (i < retries - 1) {
        await sleep(backoff[i]);
      }
    }
  }
  console.error(`[Fatal] Giving up callback for logId=${logId}, status=${status}`);
}

module.exports = {
  simulateMessageLifecycle
};
