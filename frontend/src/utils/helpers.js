// Format duration from minutes to human-readable string
export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = Math.round(minutes % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  
  return parts.join(' ');
};

// Format large numbers with commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString();
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
};

// Get status color class
export const getStatusClass = (status) => {
  const statusMap = {
    'Completed': 'success',
    'In Progress': 'info',
    'On Hold': 'warning',
    'Cancelled': 'error',
  };
  return statusMap[status] || 'info';
};

// Get priority color class
export const getPriorityClass = (priority) => {
  const priorityMap = {
    'Low': 'info',
    'Medium': 'warning',
    'High': 'error',
    'Critical': 'error',
  };
  return priorityMap[priority] || 'info';
};

// Generate color scale for activities
export const getActivityColor = (index, total) => {
  const hue = (index * 360) / total;
  return `hsl(${hue}, 70%, 60%)`;
};

// Calculate node positions for process flow
export const calculateNodePositions = (activities, width, height) => {
  const padding = 80;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  
  // Order activities roughly by their typical position in the process
  const orderedActivities = [
    'Order Received',
    'Order Validation',
    'Credit Check',
    'License Verification',
    'Inventory Check',
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
  
  const positions = {};
  const cols = 4;
  const rows = Math.ceil(activities.length / cols);
  const cellWidth = usableWidth / cols;
  const cellHeight = usableHeight / rows;
  
  activities.forEach((activity, index) => {
    // Try to find ordered position
    let orderedIndex = orderedActivities.indexOf(activity);
    if (orderedIndex === -1) orderedIndex = index;
    
    const col = orderedIndex % cols;
    const row = Math.floor(orderedIndex / cols);
    
    positions[activity] = {
      x: padding + col * cellWidth + cellWidth / 2,
      y: padding + row * cellHeight + cellHeight / 2,
    };
  });
  
  return positions;
};

// Truncate text
export const truncateText = (text, maxLength = 30) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
