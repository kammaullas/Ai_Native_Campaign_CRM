const express = require('express');
const router = express.Router();
const Segment = require('../models/Segment');
const segmentEngine = require('../services/segmentEngine');

// GET /api/segments - List all segments
router.get('/', async (req, res) => {
  try {
    const segments = await Segment.find().sort({ createdAt: -1 });
    res.json(segments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

// POST /api/segments - Create a new segment
router.post('/', async (req, res) => {
  try {
    const { name, description, rules } = req.body;
    
    // Evaluate audience size before saving
    const audienceSize = await segmentEngine.evaluateAudienceSize(rules);

    const segment = new Segment({
      name,
      description,
      rules,
      audienceSize
    });

    await segment.save();
    res.status(201).json(segment);
  } catch (error) {
    console.error('Error creating segment:', error);
    res.status(500).json({ error: 'Failed to create segment' });
  }
});

// GET /api/segments/:id - Get a single segment
router.get('/:id', async (req, res) => {
  try {
    const segment = await Segment.findById(req.params.id);
    if (!segment) return res.status(404).json({ error: 'Segment not found' });
    res.json(segment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch segment' });
  }
});

module.exports = router;
