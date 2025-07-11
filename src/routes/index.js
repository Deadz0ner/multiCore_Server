const express = require('express');
const router = express.Router();
const { addDummyJob, getQueueStats } = require('../queue');

router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Multi-Core API Server with Queue!',
    workerPID: process.pid,
    timestamp: new Date().toISOString()
  });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Add a dummy job to the queue
router.post('/jobs', async (req, res) => {
  try {
    const { message, shouldFail = false } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const job = await addDummyJob({ message, shouldFail });
    
    res.json({
      success: true,
      jobId: job.id,
      message: 'Job added to queue successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add job to queue',
    });
  }
});

// Get queue statistics
router.get('/queue/stats', async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get queue statistics',
    });
  }
});

module.exports = router;
