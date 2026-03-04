const express = require('express');
const router = express.Router();
const processController = require('../controllers/processController');

// Process Statistics
router.get('/stats', processController.getProcessStats);

// Process Flow (for spaghetti chart)
router.get('/flow', processController.getProcessFlow);

// Cases
router.get('/cases', processController.getCases);
router.get('/cases/:caseId', processController.getCaseDetails);

// Variant Analysis
router.get('/variants', processController.getVariantAnalysis);

// Activity Metrics
router.get('/activities', processController.getActivityMetrics);

// Time Analytics
router.get('/analytics/time', processController.getTimeAnalytics);

// Bottleneck Analysis
router.get('/analytics/bottlenecks', processController.getBottlenecks);

// Transition Details (for viewing cases with specific transition)
router.get('/transition-details', processController.getTransitionDetails);

// Filter Options
router.get('/filters', processController.getFilterOptions);

module.exports = router;
