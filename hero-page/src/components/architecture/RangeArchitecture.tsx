import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ArchitectureNode } from './ArchitectureNode';
import { ArchitectureControls } from './ArchitectureControls';
import { ArchitectureLegend } from './ArchitectureLegend';
import {
  ARCHITECTURE_NODES,
  getEdgesForMode,
  FlowMode,
  CustomNodeDef,
} from './architectureData';

interface RangeArchitectureProps {
  selectedNodeId: 'bastion' | 'wazuh' | 'windows' | 'web' | 'attack';
  onSelectNode: (nodeId: 'bastion' | 'wazuh' | 'windows' | 'web' | 'attack') => void;
}

const nodeTypes = {
  customArchitectureNode: ArchitectureNode,
};

export const RangeArchitecture: React.FC<RangeArchitectureProps> = ({
  selectedNodeId,
  onSelectNode,
}) => {
  const [mode, setMode] = useState<FlowMode>('architecture');

  // Prepare initial nodes with selected state
  const initialNodes: Node[] = useMemo(() => {
    return ARCHITECTURE_NODES.map((n) => ({
      ...n,
      selected: n.id === selectedNodeId,
    }));
  }, [selectedNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(getEdgesForMode('architecture', selectedNodeId) as Edge[]);

  // Update edges when mode or selectedNodeId changes
  useEffect(() => {
    const newEdges = getEdgesForMode(mode, selectedNodeId);
    setEdges(newEdges as Edge[]);
  }, [mode, selectedNodeId, setEdges]);

  // Synchronize node selection state when selectedNodeId changes from outside
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      }))
    );
  }, [selectedNodeId, setNodes]);

  // Handle node click in diagram
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const validIds = ['bastion', 'wazuh', 'windows', 'web', 'attack'] as const;
      if (validIds.includes(node.id as any)) {
        onSelectNode(node.id as any);
      }
    },
    [onSelectNode]
  );

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d0f12] overflow-hidden shadow-2xl flex flex-col">
      {/* Top Flow Mode Controls */}
      <ArchitectureControls mode={mode} onModeChange={setMode} />

      {/* React Flow Interactive Canvas */}
      <div className="w-full h-[460px] sm:h-[480px] bg-[#08090b] relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15, minZoom: 0.7, maxZoom: 1.1 }}
          zoomOnScroll={false}
          zoomOnPinch={false}
          panOnDrag={true}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
          className="select-none"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={28}
            size={1}
            color="rgba(255, 255, 255, 0.07)"
          />
        </ReactFlow>
      </div>

      {/* Bottom Minimal Legend */}
      <ArchitectureLegend />
    </div>
  );
};
