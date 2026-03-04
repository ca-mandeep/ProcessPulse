require('dotenv').config();
const mongoose = require('mongoose');
const ProcessEvent = require('../models/ProcessEvent');
const Case = require('../models/Case');
const ProcessTransition = require('../models/ProcessTransition');

// SoftwareONE Order Processing Activities
const activities = [
  'Order Received',
  'Order Validation',
  'Credit Check',
  'Inventory Check',
  'License Verification',
  'Quote Generation',
  'Customer Approval',
  'Payment Processing',
  'License Provisioning',
  'Software Deployment',
  'Configuration Setup',
  'Quality Assurance',
  'Customer Notification',
  'Order Completed'
];

// Process variants (different paths through the process)
const variants = [
  {
    name: 'Standard Order',
    path: ['Order Received', 'Order Validation', 'Credit Check', 'Inventory Check', 'Quote Generation', 'Customer Approval', 'Payment Processing', 'License Provisioning', 'Software Deployment', 'Configuration Setup', 'Quality Assurance', 'Customer Notification', 'Order Completed'],
    probability: 0.4
  },
  {
    name: 'Express Order',
    path: ['Order Received', 'Order Validation', 'Payment Processing', 'License Provisioning', 'Software Deployment', 'Customer Notification', 'Order Completed'],
    probability: 0.2
  },
  {
    name: 'License Renewal',
    path: ['Order Received', 'License Verification', 'Quote Generation', 'Customer Approval', 'Payment Processing', 'License Provisioning', 'Customer Notification', 'Order Completed'],
    probability: 0.15
  },
  {
    name: 'Enterprise Order',
    path: ['Order Received', 'Order Validation', 'Credit Check', 'License Verification', 'Inventory Check', 'Quote Generation', 'Customer Approval', 'Payment Processing', 'License Provisioning', 'Software Deployment', 'Configuration Setup', 'Quality Assurance', 'Customer Notification', 'Order Completed'],
    probability: 0.15
  },
  {
    name: 'Quick Deployment',
    path: ['Order Received', 'Order Validation', 'Inventory Check', 'Payment Processing', 'Software Deployment', 'Customer Notification', 'Order Completed'],
    probability: 0.1
  }
];

const customers = [
  'Acme Corp', 'TechGiant Inc', 'Global Systems', 'DataFlow Ltd', 
  'CloudFirst Solutions', 'Enterprise Holdings', 'Digital Dynamics',
  'Innovate Tech', 'Future Systems', 'Prime Solutions', 'Alpha Industries',
  'Beta Technologies', 'Gamma Corp', 'Delta Systems', 'Omega Enterprises'
];

const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
const departments = ['Sales', 'Operations', 'Finance', 'IT', 'Support', 'Licensing'];
const resources = [
  'John Smith', 'Maria Garcia', 'David Chen', 'Sarah Johnson', 
  'Michael Brown', 'Emily Davis', 'Robert Wilson', 'Jennifer Lee',
  'System Auto', 'API Integration', 'Workflow Engine'
];

// Activity duration ranges (in minutes)
const activityDurations = {
  'Order Received': { min: 1, max: 5 },
  'Order Validation': { min: 5, max: 30 },
  'Credit Check': { min: 10, max: 120 },
  'Inventory Check': { min: 5, max: 60 },
  'License Verification': { min: 15, max: 90 },
  'Quote Generation': { min: 10, max: 45 },
  'Customer Approval': { min: 60, max: 2880 }, // Can take days
  'Payment Processing': { min: 5, max: 60 },
  'License Provisioning': { min: 10, max: 120 },
  'Software Deployment': { min: 30, max: 180 },
  'Configuration Setup': { min: 20, max: 240 },
  'Quality Assurance': { min: 15, max: 90 },
  'Customer Notification': { min: 1, max: 10 },
  'Order Completed': { min: 1, max: 5 }
};

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function selectVariant() {
  const random = Math.random();
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.probability;
    if (random < cumulative) {
      return variant;
    }
  }
  return variants[0];
}

function addRandomVariation(path) {
  // Sometimes add rework loops (15% chance)
  if (Math.random() < 0.15 && path.length > 4) {
    const loopStart = getRandomInt(1, Math.floor(path.length / 2));
    const loopEnd = getRandomInt(loopStart + 1, Math.min(loopStart + 3, path.length - 2));
    const loop = path.slice(loopStart, loopEnd + 1);
    return [...path.slice(0, loopEnd + 1), ...loop, ...path.slice(loopEnd + 1)];
  }
  return path;
}

async function generateCases(numCases) {
  const cases = [];
  const events = [];
  const transitionMap = new Map();

  const startDate = new Date('2025-01-01');
  const endDate = new Date('2026-02-28');

  for (let i = 0; i < numCases; i++) {
    const caseId = `ORD-${String(i + 1).padStart(6, '0')}`;
    const variant = selectVariant();
    let path = addRandomVariation([...variant.path]);
    
    // Random start time within date range
    const caseStartTime = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );
    
    let currentTime = new Date(caseStartTime);
    const customer = getRandomElement(customers);
    const region = getRandomElement(regions);
    const priority = getRandomElement(['Low', 'Medium', 'Medium', 'High', 'Critical']);
    const orderValue = getRandomInt(500, 500000);

    // Determine if case is completed (90% completed, 10% in progress or other)
    const statusRoll = Math.random();
    let status;
    if (statusRoll < 0.85) {
      status = 'Completed';
    } else if (statusRoll < 0.92) {
      status = 'In Progress';
      path = path.slice(0, getRandomInt(2, path.length - 2));
    } else if (statusRoll < 0.97) {
      status = 'On Hold';
      path = path.slice(0, getRandomInt(3, path.length - 3));
    } else {
      status = 'Cancelled';
      path = path.slice(0, getRandomInt(2, path.length - 4));
    }

    // Generate events for this case
    for (let j = 0; j < path.length; j++) {
      const activity = path[j];
      const duration = activityDurations[activity];
      const activityDuration = getRandomInt(duration.min, duration.max) * 60 * 1000; // Convert to ms
      
      events.push({
        caseId,
        activity,
        timestamp: new Date(currentTime),
        resource: getRandomElement(resources),
        department: getRandomElement(departments),
        cost: getRandomInt(10, 500),
        attributes: {
          customer,
          region,
          priority,
          orderValue,
          variant: variant.name
        }
      });

      // Track transitions
      if (j > 0) {
        const fromActivity = path[j - 1];
        const toActivity = activity;
        const transitionKey = `${fromActivity}|${toActivity}`;
        
        // Calculate transition duration (time between activities)
        const prevDuration = activityDurations[fromActivity];
        const transitionDuration = getRandomInt(prevDuration.min, prevDuration.max) * 60 * 1000;
        
        if (!transitionMap.has(transitionKey)) {
          transitionMap.set(transitionKey, {
            fromActivity,
            toActivity,
            count: 0,
            totalDuration: 0,
            minDuration: Infinity,
            maxDuration: 0,
            durations: []
          });
        }
        
        const transition = transitionMap.get(transitionKey);
        transition.count++;
        transition.totalDuration += transitionDuration;
        transition.durations.push(transitionDuration);
        transition.minDuration = Math.min(transition.minDuration, transitionDuration);
        transition.maxDuration = Math.max(transition.maxDuration, transitionDuration);
      }

      currentTime = new Date(currentTime.getTime() + activityDuration);
    }

    cases.push({
      caseId,
      startTime: caseStartTime,
      endTime: status === 'Completed' ? currentTime : null,
      status,
      variant: variant.name,
      customer,
      orderValue,
      priority,
      region
    });
  }

  // Calculate average durations for transitions
  const transitions = Array.from(transitionMap.values()).map(t => ({
    fromActivity: t.fromActivity,
    toActivity: t.toActivity,
    count: t.count,
    avgDuration: Math.round(t.totalDuration / t.count),
    minDuration: t.minDuration === Infinity ? 0 : t.minDuration,
    maxDuration: t.maxDuration,
    totalDuration: t.totalDuration
  }));

  return { cases, events, transitions };
}

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/process-mining');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      ProcessEvent.deleteMany({}),
      Case.deleteMany({}),
      ProcessTransition.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Generate data
    console.log('Generating process mining data...');
    const { cases, events, transitions } = await generateCases(2000);

    // Insert data
    console.log(`Inserting ${cases.length} cases...`);
    await Case.insertMany(cases);
    
    console.log(`Inserting ${events.length} events...`);
    // Insert in batches for better performance
    const batchSize = 1000;
    for (let i = 0; i < events.length; i += batchSize) {
      await ProcessEvent.insertMany(events.slice(i, i + batchSize));
    }
    
    console.log(`Inserting ${transitions.length} transitions...`);
    await ProcessTransition.insertMany(transitions);

    console.log('Seed completed successfully!');
    console.log(`- Cases: ${cases.length}`);
    console.log(`- Events: ${events.length}`);
    console.log(`- Unique Transitions: ${transitions.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase();
