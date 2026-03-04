const ProcessEvent = require('../models/ProcessEvent');
const Case = require('../models/Case');
const ProcessTransition = require('../models/ProcessTransition');

// Get all process statistics
exports.getProcessStats = async (req, res) => {
  try {
    const [
      totalCases,
      completedCases,
      inProgressCases,
      totalEvents,
      avgDuration,
      activityStats
    ] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({ status: 'Completed' }),
      Case.countDocuments({ status: 'In Progress' }),
      ProcessEvent.countDocuments(),
      Case.aggregate([
        { $match: { status: 'Completed', endTime: { $ne: null } } },
        {
          $project: {
            duration: { $subtract: ['$endTime', '$startTime'] }
          }
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration' },
            minDuration: { $min: '$duration' },
            maxDuration: { $max: '$duration' }
          }
        }
      ]),
      ProcessEvent.aggregate([
        {
          $group: {
            _id: '$activity',
            count: { $sum: 1 },
            avgCost: { $avg: '$cost' }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    const durationStats = avgDuration[0] || { avgDuration: 0, minDuration: 0, maxDuration: 0 };

    res.json({
      overview: {
        totalCases,
        completedCases,
        inProgressCases,
        cancelledCases: await Case.countDocuments({ status: 'Cancelled' }),
        onHoldCases: await Case.countDocuments({ status: 'On Hold' }),
        totalEvents,
        completionRate: totalCases > 0 ? ((completedCases / totalCases) * 100).toFixed(2) : 0
      },
      duration: {
        average: Math.round(durationStats.avgDuration / (1000 * 60)), // in minutes
        min: Math.round(durationStats.minDuration / (1000 * 60)),
        max: Math.round(durationStats.maxDuration / (1000 * 60))
      },
      activityStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get process flow data for spaghetti chart
exports.getProcessFlow = async (req, res) => {
  try {
    const transitions = await ProcessTransition.find().sort({ count: -1 });
    
    // Get activity frequencies
    const activityFrequency = await ProcessEvent.aggregate([
      {
        $group: {
          _id: '$activity',
          frequency: { $sum: 1 }
        }
      },
      { $sort: { frequency: -1 } }
    ]);

    // Get unique activities
    const activities = await ProcessEvent.distinct('activity');

    // Calculate average position of each activity across all cases
    // This determines the natural flow order based on when activities typically happen
    const activityPositions = await ProcessEvent.aggregate([
      { $sort: { caseId: 1, timestamp: 1 } },
      {
        $group: {
          _id: '$caseId',
          activities: { $push: '$activity' }
        }
      },
      { $unwind: { path: '$activities', includeArrayIndex: 'position' } },
      {
        $group: {
          _id: '$activities',
          avgPosition: { $avg: '$position' },
          minPosition: { $min: '$position' },
          maxPosition: { $max: '$position' },
          occurrences: { $sum: 1 }
        }
      },
      { $sort: { avgPosition: 1 } }
    ]);

    // Create ordered activity list based on average position
    const activityOrder = activityPositions.map(a => a._id);

    // Create nodes for visualization
    const nodes = activityFrequency.map((act, index) => ({
      id: act._id,
      name: act._id,
      frequency: act.frequency,
      // Arrange in approximate process order
      x: (index % 4) * 250 + 100,
      y: Math.floor(index / 4) * 150 + 100
    }));

    // Create edges with weights
    const edges = transitions.map(t => ({
      source: t.fromActivity,
      target: t.toActivity,
      weight: t.count,
      avgDuration: Math.round(t.avgDuration / (1000 * 60)), // in minutes
      minDuration: Math.round(t.minDuration / (1000 * 60)),
      maxDuration: Math.round(t.maxDuration / (1000 * 60))
    }));

    res.json({ nodes, edges, activities, activityOrder, activityPositions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get cases with filtering
exports.getCases = async (req, res) => {
  try {
    const { status, variant, region, priority, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (variant) filter.variant = variant;
    if (region) filter.region = region;
    if (priority) filter.priority = priority;

    const cases = await Case.find(filter)
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Case.countDocuments(filter);

    res.json({
      cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single case with all events
exports.getCaseDetails = async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const [caseData, events] = await Promise.all([
      Case.findOne({ caseId }),
      ProcessEvent.find({ caseId }).sort({ timestamp: 1 })
    ]);

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ case: caseData, events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get variant analysis
exports.getVariantAnalysis = async (req, res) => {
  try {
    const variants = await Case.aggregate([
      {
        $group: {
          _id: '$variant',
          count: { $sum: 1 },
          avgOrderValue: { $avg: '$orderValue' },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          variant: '$_id',
          count: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] },
          completionRate: {
            $multiply: [{ $divide: ['$completedCount', '$count'] }, 100]
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get variant paths
    const variantPaths = await Promise.all(
      variants.map(async (v) => {
        const sampleCase = await Case.findOne({ variant: v._id, status: 'Completed' });
        if (sampleCase) {
          const events = await ProcessEvent.find({ caseId: sampleCase.caseId }).sort({ timestamp: 1 });
          return {
            ...v,
            path: events.map(e => e.activity)
          };
        }
        return v;
      })
    );

    res.json(variantPaths);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get activity performance metrics
exports.getActivityMetrics = async (req, res) => {
  try {
    // Get timing data by calculating duration between consecutive events
    const activityMetrics = await ProcessEvent.aggregate([
      {
        $group: {
          _id: '$activity',
          totalOccurrences: { $sum: 1 },
          avgCost: { $avg: '$cost' },
          totalCost: { $sum: '$cost' },
          resources: { $addToSet: '$resource' },
          departments: { $addToSet: '$department' }
        }
      },
      {
        $project: {
          activity: '$_id',
          totalOccurrences: 1,
          avgCost: { $round: ['$avgCost', 2] },
          totalCost: 1,
          resourceCount: { $size: '$resources' },
          departmentCount: { $size: '$departments' }
        }
      },
      { $sort: { totalOccurrences: -1 } }
    ]);

    // Get transition-based timing
    const transitions = await ProcessTransition.aggregate([
      {
        $group: {
          _id: '$fromActivity',
          avgProcessingTime: { $avg: '$avgDuration' }
        }
      }
    ]);

    const timingMap = {};
    transitions.forEach(t => {
      timingMap[t._id] = Math.round(t.avgProcessingTime / (1000 * 60));
    });

    const metricsWithTiming = activityMetrics.map(m => ({
      ...m,
      avgProcessingTime: timingMap[m.activity] || 0
    }));

    res.json(metricsWithTiming);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get time-based analytics
exports.getTimeAnalytics = async (req, res) => {
  try {
    const { groupBy = 'day' } = req.query;

    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'week':
        dateFormat = '%Y-W%V';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const casesOverTime = await Case.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$startTime' } },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          totalValue: { $sum: '$orderValue' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(casesOverTime);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get bottleneck analysis
exports.getBottlenecks = async (req, res) => {
  try {
    const bottlenecks = await ProcessTransition.aggregate([
      {
        $project: {
          fromActivity: 1,
          toActivity: 1,
          count: 1,
          avgDurationMinutes: { $divide: ['$avgDuration', 60000] },
          maxDurationMinutes: { $divide: ['$maxDuration', 60000] }
        }
      },
      { $sort: { avgDurationMinutes: -1 } },
      { $limit: 10 }
    ]);

    // Identify activities with high wait times
    const activityWaitTimes = await ProcessTransition.aggregate([
      {
        $group: {
          _id: '$toActivity',
          avgWaitTime: { $avg: '$avgDuration' },
          totalIncoming: { $sum: '$count' }
        }
      },
      {
        $project: {
          activity: '$_id',
          avgWaitTimeMinutes: { $divide: ['$avgWaitTime', 60000] },
          totalIncoming: 1
        }
      },
      { $sort: { avgWaitTimeMinutes: -1 } }
    ]);

    res.json({
      slowestTransitions: bottlenecks,
      activityWaitTimes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get filter options
exports.getFilterOptions = async (req, res) => {
  try {
    const [statuses, variants, regions, priorities] = await Promise.all([
      Case.distinct('status'),
      Case.distinct('variant'),
      Case.distinct('region'),
      Case.distinct('priority')
    ]);

    res.json({ statuses, variants, regions, priorities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get transition details - cases with specific source->target transition
exports.getTransitionDetails = async (req, res) => {
  try {
    const { source, target } = req.query;
    
    if (!source || !target) {
      return res.status(400).json({ error: 'Source and target activities are required' });
    }

    // Get all events grouped by case
    const events = await ProcessEvent.find().sort({ caseId: 1, timestamp: 1 });
    
    // Group events by caseId
    const eventsByCase = {};
    events.forEach(event => {
      if (!eventsByCase[event.caseId]) {
        eventsByCase[event.caseId] = [];
      }
      eventsByCase[event.caseId].push(event);
    });
    
    // Find cases with this specific transition
    const transitionCases = [];
    
    for (const [caseId, caseEvents] of Object.entries(eventsByCase)) {
      for (let i = 0; i < caseEvents.length - 1; i++) {
        if (caseEvents[i].activity === source && caseEvents[i + 1].activity === target) {
          const sourceEvent = caseEvents[i];
          const targetEvent = caseEvents[i + 1];
          const duration = new Date(targetEvent.timestamp) - new Date(sourceEvent.timestamp);
          
          // Get case info
          const caseInfo = await Case.findOne({ caseId });
          
          transitionCases.push({
            caseId,
            sourceTime: sourceEvent.timestamp,
            targetTime: targetEvent.timestamp,
            duration,
            resource: targetEvent.resource || 'System',
            customer: caseInfo?.customer || '-',
            status: caseInfo?.status || '-',
            region: caseInfo?.region || '-',
            priority: caseInfo?.priority || '-'
          });
          break; // Only count first occurrence per case
        }
      }
    }
    
    // Sort by duration descending
    transitionCases.sort((a, b) => b.duration - a.duration);
    
    res.json({
      transition: { source, target },
      count: transitionCases.length,
      cases: transitionCases.slice(0, 50) // Limit to 50 cases
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
