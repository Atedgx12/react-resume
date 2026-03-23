/**
 * SystemDiagram - Interactive SVG architecture diagram for a project.
 * Renders nodes with directional flow arrows and clickable info panel.
 */
import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const NODE_COLORS = {
  input:    { fill: '#1a3a5c', stroke: '#64ffda' },
  service:  { fill: '#1c3d5a', stroke: '#57cbff' },
  process:  { fill: '#2a2040', stroke: '#c792ea' },
  ml:       { fill: '#2d1f3d', stroke: '#ff6b9d' },
  database: { fill: '#1a3040', stroke: '#ffcb6b' },
  output:   { fill: '#1a3a3a', stroke: '#64ffda' },
};

const NODE_ICONS = {
  input: '⬤',
  service: '⚙',
  process: '⟳',
  ml: '🧠',
  database: '🗄',
  output: '◆',
};

const NODE_TYPE_LABELS = {
  input: 'Input Source',
  service: 'Service Layer',
  process: 'Processing',
  ml: 'Machine Learning',
  database: 'Data Store',
  output: 'Output',
};

const NODE_DESCRIPTIONS = {
  input: 'Entry point that receives data or user requests into the system.',
  service: 'Core service component handling business logic and routing.',
  process: 'Processing stage that transforms, validates, or enriches data.',
  ml: 'Machine learning component for inference, prediction, or classification.',
  database: 'Persistent data storage for structured or unstructured data.',
  output: 'Final output delivered to users, downstream systems, or dashboards.',
};

export default function SystemDiagram({ architecture }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  if (!architecture) return null;

  const { nodes, edges } = architecture;
  const W = 400, H = 220;
  const NODE_R = 18;
  const ARROW_GAP = 4;

  const getPos = (node) => ({ x: (node.x / 100) * W, y: (node.y / 100) * H });
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  // Shorten line so arrow tip stops at node edge
  const getEdgePoints = (fromNode, toNode) => {
    const from = getPos(fromNode);
    const to = getPos(toNode);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
    const ux = dx / dist;
    const uy = dy / dist;
    return {
      x1: from.x + ux * (NODE_R + 2),
      y1: from.y + uy * (NODE_R + 2),
      x2: to.x - ux * (NODE_R + ARROW_GAP),
      y2: to.y - uy * (NODE_R + ARROW_GAP),
    };
  };

  const getConnections = (nodeId) => {
    const outgoing = edges.filter(e => e.from === nodeId).map(e => nodeMap[e.to]?.label).filter(Boolean);
    const incoming = edges.filter(e => e.to === nodeId).map(e => nodeMap[e.from]?.label).filter(Boolean);
    return { incoming, outgoing };
  };

  const selected = selectedNode ? nodeMap[selectedNode] : null;
  const connections = selectedNode ? getConnections(selectedNode) : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="system-diagram" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64ffda" opacity="0.7" />
          </marker>
          <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64ffda" opacity="1" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges with directional arrows */}
        {edges.map((edge, i) => {
          const fromNode = nodeMap[edge.from];
          const toNode = nodeMap[edge.to];
          if (!fromNode || !toNode) return null;
          const pts = getEdgePoints(fromNode, toNode);
          const isActive = selectedNode && (edge.from === selectedNode || edge.to === selectedNode);
          return (
            <line
              key={i}
              x1={pts.x1} y1={pts.y1}
              x2={pts.x2} y2={pts.y2}
              className="diagram-edge"
              markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
              style={{
                animationDelay: `${i * 0.3}s`,
                opacity: isActive ? 1 : undefined,
                strokeWidth: isActive ? 2 : undefined,
              }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = getPos(node);
          const colors = NODE_COLORS[node.type] || NODE_COLORS.service;
          const isHovered = hoveredNode === node.id;
          const isSelected = selectedNode === node.id;

          return (
            <g
              key={node.id}
              className="diagram-node"
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => setSelectedNode(isSelected ? null : node.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={pos.x} cy={pos.y}
                r={isHovered || isSelected ? 22 : NODE_R}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                filter={isHovered || isSelected ? 'url(#glow)' : undefined}
                className="node-circle"
              />
              <text
                x={pos.x} y={pos.y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="12" className="node-icon-text"
              >
                {NODE_ICONS[node.type] || '●'}
              </text>
              <text
                x={pos.x} y={pos.y + 30}
                textAnchor="middle"
                fontSize="8" fill="#ccd6f6"
                className="node-label"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Node Info Panel */}
      {selected && connections && (
        <div className="node-info-panel">
          <button className="node-info-close" onClick={() => setSelectedNode(null)}>
            <FaTimes />
          </button>
          <h4>{NODE_ICONS[selected.type]} {selected.label}</h4>
          <span className="node-info-type">{NODE_TYPE_LABELS[selected.type] || selected.type}</span>
          <p className="node-info-desc">{NODE_DESCRIPTIONS[selected.type]}</p>
          <div className="node-info-connections">
            {connections.incoming.length > 0 && (
              <p>Receives from: {connections.incoming.map((c, i) => <span key={i}>{c}</span>)}</p>
            )}
            {connections.outgoing.length > 0 && (
              <p>Sends to: {connections.outgoing.map((c, i) => <span key={i}>{c}</span>)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
