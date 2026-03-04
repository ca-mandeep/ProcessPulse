import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { processAPI } from '../utils/api';
import { formatDuration, formatNumber } from '../utils/helpers';
import { AlertCircle, Info } from 'lucide-react';

function ProcessFlow() {
  const [flowData, setFlowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [viewMode, setViewMode] = useState('structured'); // Default to structured
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchFlowData();
  }, []);

  const fetchFlowData = async () => {
    try {
      setLoading(true);
      const response = await processAPI.getProcessFlow();
      setFlowData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Structured chart - clean directional flow with processing times
  const drawStructuredChart = useCallback(() => {
    if (!flowData || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight - 60;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Define the process order
    const activityOrder = [
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

    // Layout: 4 columns, snake pattern
    const cols = 4;
    const nodeWidth = 140;
    const nodeHeight = 50;
    const hGap = 60;
    const vGap = 80;
    const paddingX = 80;
    const paddingY = 60;

    // Build nodes with positions
    const nodes = [];
    activityOrder.forEach((activity, i) => {
      const nodeData = flowData.nodes.find(n => n.id === activity);
      if (nodeData) {
        const row = Math.floor(i / cols);
        const colInRow = i % cols;
        const col = row % 2 === 0 ? colInRow : (cols - 1 - colInRow); // Snake pattern
        
        nodes.push({
          ...nodeData,
          x: paddingX + col * (nodeWidth + hGap) + nodeWidth / 2,
          y: paddingY + row * (nodeHeight + vGap) + nodeHeight / 2,
          index: i
        });
      }
    });

    // Add any nodes not in predefined order
    flowData.nodes.forEach(n => {
      if (!activityOrder.includes(n.id)) {
        const i = nodes.length;
        const row = Math.floor(i / cols);
        const colInRow = i % cols;
        const col = row % 2 === 0 ? colInRow : (cols - 1 - colInRow);
        nodes.push({
          ...n,
          x: paddingX + col * (nodeWidth + hGap) + nodeWidth / 2,
          y: paddingY + row * (nodeHeight + vGap) + nodeHeight / 2,
          index: i
        });
      }
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const maxFrequency = d3.max(nodes, d => d.frequency) || 1;

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead-structured')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M 0,-4 L 8,0 L 0,4')
      .attr('fill', '#64748b');

    // Get main flow edges (consecutive steps)
    const mainFlowEdges = [];
    for (let i = 0; i < activityOrder.length - 1; i++) {
      const edge = flowData.edges.find(e => 
        e.source === activityOrder[i] && e.target === activityOrder[i + 1]
      );
      if (edge) {
        mainFlowEdges.push(edge);
      }
    }

    // Color scale for duration
    const maxDuration = d3.max(mainFlowEdges, d => d.avgDuration) || 1;
    const getEdgeColor = (duration) => {
      const ratio = duration / maxDuration;
      if (ratio < 0.33) return '#10b981'; // Green - fast
      if (ratio < 0.66) return '#f59e0b'; // Orange - medium
      return '#ef4444'; // Red - slow
    };

    // Draw main flow edges
    mainFlowEdges.forEach(edge => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) return;

      const edgeGroup = g.append('g').attr('class', 'edge-group');

      // Calculate path
      let path;
      const sourceRow = Math.floor(source.index / cols);
      const targetRow = Math.floor(target.index / cols);

      if (sourceRow === targetRow) {
        // Same row - straight horizontal line
        const x1 = source.x + (target.x > source.x ? nodeWidth/2 : -nodeWidth/2);
        const x2 = target.x + (target.x > source.x ? -nodeWidth/2 - 12 : nodeWidth/2 + 12);
        path = `M ${x1} ${source.y} L ${x2} ${target.y}`;
      } else {
        // Different rows - curved connection
        const x1 = source.x;
        const y1 = source.y + nodeHeight/2;
        const x2 = target.x;
        const y2 = target.y - nodeHeight/2 - 12;
        const midY = (y1 + y2) / 2;
        path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
      }

      const edgeColor = getEdgeColor(edge.avgDuration);

      // Draw the line
      edgeGroup.append('path')
        .attr('d', path)
        .attr('stroke', edgeColor)
        .attr('stroke-width', 3)
        .attr('fill', 'none')
        .attr('marker-end', 'url(#arrowhead-structured)')
        .style('cursor', 'pointer')
        .on('click', () => setSelectedEdge(edge))
        .on('mouseover', function() {
          d3.select(this).attr('stroke-width', 5);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke-width', 3);
        });

      // Add duration label on the edge
      const labelX = (source.x + target.x) / 2;
      const labelY = sourceRow === targetRow 
        ? source.y - 15 
        : (source.y + target.y) / 2;

      edgeGroup.append('rect')
        .attr('x', labelX - 35)
        .attr('y', labelY - 10)
        .attr('width', 70)
        .attr('height', 20)
        .attr('rx', 4)
        .attr('fill', edgeColor)
        .attr('opacity', 0.9);

      edgeGroup.append('text')
        .attr('x', labelX)
        .attr('y', labelY + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .text(formatDuration(edge.avgDuration));
    });

    // Draw nodes
    const nodeGroups = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    // Node rectangles
    nodeGroups.append('rect')
      .attr('x', -nodeWidth/2)
      .attr('y', -nodeHeight/2)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 8)
      .attr('fill', (d, i) => {
        const hue = 210 + (i * 8); // Blue gradient
        return `hsl(${hue}, 70%, 45%)`;
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Step number badge
    nodeGroups.append('circle')
      .attr('cx', -nodeWidth/2 + 12)
      .attr('cy', -nodeHeight/2 + 12)
      .attr('r', 12)
      .attr('fill', '#1e293b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    nodeGroups.append('text')
      .attr('x', -nodeWidth/2 + 12)
      .attr('y', -nodeHeight/2 + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text((d, i) => i + 1);

    // Node labels
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 4)
      .attr('fill', '#fff')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .each(function(d) {
        const text = d3.select(this);
        const words = d.id.split(' ');
        if (words.length <= 2) {
          text.text(d.id);
        } else {
          text.attr('y', -4);
          text.text(words.slice(0, 2).join(' '));
          text.append('tspan')
            .attr('x', 0)
            .attr('dy', 14)
            .text(words.slice(2).join(' '));
        }
      });

    // Frequency badge below node
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', nodeHeight/2 + 16)
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .text(d => `${formatNumber(d.frequency)} events`);

    // Fit to view
    const bounds = g.node().getBBox();
    const scale = 0.85 / Math.max(bounds.width / width, bounds.height / height);
    const translateX = width / 2 - scale * (bounds.x + bounds.width / 2);
    const translateY = height / 2 - scale * (bounds.y + bounds.height / 2);
    svg.call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));

  }, [flowData]);

  const drawSpaghettiChart = useCallback(() => {
    if (!flowData || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight - 60;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    const activityOrder = [
      'Order Received', 'Order Validation', 'Credit Check', 'License Verification',
      'Inventory Check', 'Quote Generation', 'Customer Approval', 'Payment Processing',
      'License Provisioning', 'Software Deployment', 'Configuration Setup',
      'Quality Assurance', 'Customer Notification', 'Order Completed'
    ];

    const padding = 100;
    const cols = 4;
    const cellWidth = (width - padding * 2) / cols;
    const cellHeight = (height - padding * 2) / 4;

    const nodes = flowData.nodes.map((node) => {
      let orderIndex = activityOrder.indexOf(node.id);
      if (orderIndex === -1) orderIndex = activityOrder.length;
      const col = orderIndex % cols;
      const row = Math.floor(orderIndex / cols);
      return {
        ...node,
        x: padding + col * cellWidth + cellWidth / 2,
        y: padding + row * cellHeight + cellHeight / 2,
        orderIndex
      };
    });

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const maxFrequency = d3.max(nodes, d => d.frequency) || 1;
    const maxEdgeWeight = d3.max(flowData.edges, d => d.weight) || 1;
    const maxDuration = d3.max(flowData.edges, d => d.avgDuration) || 1;
    
    const edgeColorScale = d3.scaleSequential(d3.interpolateRgb('#10b981', '#ef4444'))
      .domain([0, maxDuration]);

    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#6366f1');

    // Draw edges
    flowData.edges.forEach(d => {
      const source = nodeMap.get(d.source);
      const target = nodeMap.get(d.target);
      if (!source || !target) return;

      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const curvature = 0.3;
      const controlX = midX + (-dy * curvature);
      const controlY = midY + (dx * curvature);
      const strokeWidth = Math.max(1, Math.min(8, (d.weight / maxEdgeWeight) * 8));
      const edgeColor = edgeColorScale(d.avgDuration);

      g.append('path')
        .attr('d', `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`)
        .attr('stroke', edgeColor)
        .attr('stroke-width', strokeWidth)
        .attr('stroke-opacity', 0.6)
        .attr('fill', 'none')
        .attr('marker-end', 'url(#arrowhead)')
        .style('cursor', 'pointer')
        .on('click', () => setSelectedEdge(d))
        .on('mouseover', function() {
          d3.select(this).attr('stroke-opacity', 1).attr('stroke-width', strokeWidth + 2);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke-opacity', 0.6).attr('stroke-width', strokeWidth);
        });
    });

    // Draw nodes
    const nodeGroups = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    nodeGroups.append('circle')
      .attr('r', d => Math.max(25, Math.min(45, 25 + (d.frequency / maxFrequency) * 20)))
      .attr('fill', (d, i) => `hsl(${(i * 360 / nodes.length)}, 70%, 50%)`)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text(d => d.id.length > 15 ? d.id.slice(0, 12) + '...' : d.id)
      .style('font-size', '10px')
      .style('fill', '#fff');

    // Fit to view
    const bounds = g.node().getBBox();
    const scale = 0.85 / Math.max(bounds.width / width, bounds.height / height);
    const translateX = width / 2 - scale * (bounds.x + bounds.width / 2);
    const translateY = height / 2 - scale * (bounds.y + bounds.height / 2);
    svg.call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));

  }, [flowData]);

  // Draw chart based on view mode
  useEffect(() => {
    if (flowData) {
      if (viewMode === 'structured') {
        drawStructuredChart();
      } else {
        drawSpaghettiChart();
      }
    }
  }, [flowData, viewMode, drawStructuredChart, drawSpaghettiChart]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (flowData) {
        if (viewMode === 'structured') {
          drawStructuredChart();
        } else {
          drawSpaghettiChart();
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [flowData, viewMode, drawStructuredChart, drawSpaghettiChart]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading process flow...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <AlertCircle size={48} color="var(--error)" />
        <p style={{ marginTop: '16px', color: 'var(--error)' }}>Error: {error}</p>
        <button className="btn btn-primary" onClick={fetchFlowData} style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Process Flow Visualization</h1>
          <p className="page-subtitle">
            {viewMode === 'structured' 
              ? 'Directional process flow with step-by-step transitions and processing times'
              : 'Spaghetti diagram showing all process paths and transitions'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="tab-nav" style={{ marginBottom: 0 }}>
            <button 
              className={`tab-btn ${viewMode === 'structured' ? 'active' : ''}`}
              onClick={() => setViewMode('structured')}
            >
              Structured
            </button>
            <button 
              className={`tab-btn ${viewMode === 'spaghetti' ? 'active' : ''}`}
              onClick={() => setViewMode('spaghetti')}
            >
              Spaghetti
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="legend" style={{ marginBottom: '24px' }}>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#10b981', width: '24px' }}></div>
          <span>Fast transitions</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#f59e0b', width: '24px' }}></div>
          <span>Medium transitions</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ef4444', width: '24px' }}></div>
          <span>Slow transitions (bottlenecks)</span>
        </div>
        <div className="legend-item">
          <Info size={16} style={{ marginRight: '4px' }} />
          <span>Line thickness = transition frequency</span>
        </div>
      </div>

      {/* Main Chart Container */}
      <div 
        ref={containerRef}
        className="process-flow-container"
        style={{ height: '600px' }}
      >
        <svg ref={svgRef} className="spaghetti-chart" />
      </div>

      {/* Selected Edge Details */}
      {selectedEdge && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">Transition Details: {selectedEdge.source} → {selectedEdge.target}</h3>
            <button 
              className="btn btn-secondary"
              onClick={() => setSelectedEdge(null)}
            >
              Close
            </button>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-value">{formatNumber(selectedEdge.weight)}</div>
              <div className="metric-label">Total Transitions</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{formatDuration(selectedEdge.avgDuration)}</div>
              <div className="metric-label">Avg Duration</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{formatDuration(selectedEdge.minDuration)}</div>
              <div className="metric-label">Min Duration</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{formatDuration(selectedEdge.maxDuration)}</div>
              <div className="metric-label">Max Duration</div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip Container */}
      <div id="tooltip" className="tooltip" style={{ opacity: 0, position: 'fixed' }}></div>

      {/* Activity Summary */}
      <div className="dashboard-grid dashboard-grid-2" style={{ marginTop: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Activity Nodes</h3>
            <span className="badge purple">{flowData.nodes.length} activities</span>
          </div>
          <div className="activity-list">
            {flowData.nodes.sort((a, b) => b.frequency - a.frequency).slice(0, 8).map((node, index) => (
              <div key={node.id} className="activity-item">
                <div className="activity-number">{index + 1}</div>
                <div className="activity-details">
                  <div className="activity-name">{node.name}</div>
                  <div className="activity-meta">Activity in process</div>
                </div>
                <div className="activity-duration">{formatNumber(node.frequency)} events</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Transitions</h3>
            <span className="badge purple">{flowData.edges.length} transitions</span>
          </div>
          <div className="activity-list">
            {flowData.edges.sort((a, b) => b.weight - a.weight).slice(0, 8).map((edge, index) => (
              <div key={`${edge.source}-${edge.target}`} className="activity-item">
                <div className="activity-number">{index + 1}</div>
                <div className="activity-details">
                  <div className="activity-name" style={{ fontSize: '13px' }}>
                    {edge.source} → {edge.target}
                  </div>
                  <div className="activity-meta">Avg: {formatDuration(edge.avgDuration)}</div>
                </div>
                <div className="activity-duration">{formatNumber(edge.weight)}x</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessFlow;
