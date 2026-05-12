import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useFlowStore } from '../../../store/useFlowStore';
import { useBuilderStore } from '../../../store/useBuilderStore';
import { nodesToFlow, validateFlow } from '../utils/flowTransform';

export const useFlowBuilder = () => {
  const flowStore = useFlowStore();
  const builderStore = useBuilderStore();

  const handleNodesChange = useCallback((nodes: Node[]) => {
    flowStore.setNodes(nodes);
  }, [flowStore]);

  const handleEdgesChange = useCallback((edges: Edge[]) => {
    flowStore.setEdges(edges);
  }, [flowStore]);

  const handleConnect = useCallback((connection: any) => {
    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      source: connection.source,
      target: connection.target,
    };
    flowStore.addEdge(newEdge);
  }, [flowStore]);

  const addNewNode = useCallback((type: string) => {
    const nodeId = `node-${Date.now()}`;
    const count = flowStore.nodes.length;
    const newNode: Node = {
      id: nodeId,
      type,
      data: {
        type,
        label: `${type} step`,
        prompt: '',
        options: [],
      },
      position: { x: 100 + (count % 4) * 220, y: 220 + Math.floor(count / 4) * 140 },
    };
    flowStore.addNode(newNode);
    builderStore.setSelectedNodeId(nodeId);
  }, [flowStore, builderStore]);

  const updateSelectedNode = useCallback(
    (updates: Record<string, any>) => {
      if (builderStore.selectedNodeId) {
        flowStore.updateNode(builderStore.selectedNodeId, {
          data: { ...flowStore.nodes.find((n) => n.id === builderStore.selectedNodeId)?.data, ...updates },
        });
      }
    },
    [flowStore, builderStore]
  );

  const deleteNode = useCallback((nodeId: string) => {
    flowStore.removeNode(nodeId);
    if (builderStore.selectedNodeId === nodeId) {
      builderStore.setSelectedNodeId(null);
    }
  }, [flowStore, builderStore]);

  const saveFlow = useCallback(async () => {
    try {
      builderStore.setError(null);
      const flow = nodesToFlow(flowStore.nodes, flowStore.edges, flowStore.metadata);
      const validation = validateFlow(flow);

      if (!validation.valid) {
        builderStore.setError(validation.errors.join('; '));
        return { success: false, errors: validation.errors };
      }

      return { success: true, flow };
    } catch (err: any) {
      builderStore.setError(err.message);
      return { success: false, error: err.message };
    }
  }, [flowStore, builderStore]);

  return {
    nodes: flowStore.nodes,
    edges: flowStore.edges,
    metadata: flowStore.metadata,
    selectedNodeId: builderStore.selectedNodeId,
    isLoading: builderStore.isLoading,
    error: builderStore.error,
    handleNodesChange,
    handleEdgesChange,
    handleConnect,
    addNewNode,
    updateSelectedNode,
    deleteNode,
    saveFlow,
    setMetadata: flowStore.setMetadata,
    setSelectedNodeId: builderStore.setSelectedNodeId,
    setError: builderStore.setError,
  };
};
