const express = require('express');
const router = express.Router();
const groqService = require('../services/groqService');
const segmentEngine = require('../services/segmentEngine');

// POST /api/ai/parse-segment
router.post('/parse-segment', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const segmentRules = await groqService.parseSegmentPrompt(prompt);
    
    // Calculate audience size
    let audienceSize = 0;
    if (segmentRules.rules) {
      audienceSize = await segmentEngine.evaluateAudienceSize(segmentRules.rules);
    }
    
    // Return the generated segment
    res.json({
      name: segmentRules.name || 'AI Generated Segment',
      description: segmentRules.description || prompt,
      rules: segmentRules.rules || { operator: 'AND', conditions: [] },
      audienceSize
    });

  } catch (error) {
    console.error('Error parsing segment with AI:', error);
    res.status(500).json({ error: 'Failed to process AI segment parsing' });
  }
});

// POST /api/ai/draft-message
router.post('/draft-message', async (req, res) => {
  try {
    const { segmentDescription, channel, brandTone } = req.body;
    
    if (!segmentDescription || !channel) {
      return res.status(400).json({ error: 'segmentDescription and channel are required' });
    }

    const messages = await groqService.draftMessage(
      segmentDescription, 
      channel, 
      brandTone || 'friendly and professional'
    );
    
    res.json({ messages });
  } catch (error) {
    console.error('Error drafting message with AI:', error);
    res.status(500).json({ error: 'Failed to draft messages' });
  }
});

module.exports = router;
