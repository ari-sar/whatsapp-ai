import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useFlowStore } from '../../../store/useFlowStore';
import { useBuilderStore } from '../../../store/useBuilderStore';
import { nodesToSteps, describeCondition } from '../utils/flowTransform';
import { createFlow, updateFlow } from '../../../api/flowsService';

export const useFlowBuilder = () => {
  const flowStore = useFlowStore();
  const builderStore = useBuilderStore();

  const handleNodesChange = useCallback(
    (nodes: Node[]) => flowStore.setNodes(nodes),
    [flowStore]
  );

  const handleEdgesChange = useCallback(
    (edges: Edge[]) => flowStore.setEdges(edges),
    [flowStore]
  );

  const addNewNode = useCallback(
    (type: string) => {
      const nodeId = `${type}_${Date.now().toString(36)}`;
      const count = flowStore.nodes.length;
      const newNode: Node = {
        id: nodeId,
        type,
        data: {
          type,
          label: `${type} step`,
          prompt: type === 'text' || type === 'list' || type === 'button' ? '' : undefined,
        },
        position: { x: 120 + (count % 4) * 240, y: 120 + Math.floor(count / 4) * 180 },
      };
      flowStore.addNode(newNode);
      builderStore.setSelectedNodeId(nodeId);
    },
    [flowStore, builderStore]
  );

  const updateSelectedNodeData = useCallback(
    (patch: Record<string, any>) => {
      const id = builderStore.selectedNodeId;
      if (!id) return;
      const existing = flowStore.nodes.find((n) => n.id === id);
      if (!existing) return;
      flowStore.updateNode(id, { data: { ...(existing.data ?? {}), ...patch } });
    },
    [flowStore, builderStore]
  );

  const renameSelectedNode = useCallback(
    (newId: string) => {
      const oldId = builderStore.selectedNodeId;
      if (!oldId || !newId || oldId === newId) return;
      if (flowStore.nodes.some((n) => n.id === newId)) return;
      const newNodes = flowStore.nodes.map((n) => (n.id === oldId ? { ...n, id: newId } : n));
      const newEdges = flowStore.edges.map((e) => ({
        ...e,
        source: e.source === oldId ? newId : e.source,
        target: e.target === oldId ? newId : e.target,
      }));
      flowStore.setNodes(newNodes);
      flowStore.setEdges(newEdges);
      builderStore.setSelectedNodeId(newId);
    },
    [flowStore, builderStore]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      flowStore.removeNode(nodeId);
      if (builderStore.selectedNodeId === nodeId) {
        builderStore.setSelectedNodeId(null);
      }
    },
    [flowStore, builderStore]
  );

  const updateEdgeCondition = useCallback(
    (edgeId: string, condition: any | null) => {
      const edge = flowStore.edges.find((e) => e.id === edgeId);
      if (!edge) return;
      const nextData = { ...(edge.data ?? {}), condition: condition ?? undefined };
      if (!condition) delete (nextData as any).condition;
      flowStore.updateEdge(edgeId, {
        data: nextData,
        label: condition ? describeCondition(condition) : undefined,
      });
    },
    [flowStore]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      flowStore.removeEdge(edgeId);
    },
    [flowStore]
  );

  const saveFlow = useCallback(async () => {
    builderStore.setError(null);
    const { nodes, edges, metadata } = flowStore;
    const result = nodesToSteps(nodes, edges);
    if (!result.valid) {
      builderStore.setError(result.errors.join('; '));
      return { success: false, errors: result.errors };
    }
    if (!metadata.name) {
      builderStore.setError('Flow name required');
      return { success: false, errors: ['Flow name required'] };
    }
    if (!metadata.businessType) {
      builderStore.setError('Business type required');
      return { success: false, errors: ['Business type required'] };
    }

    builderStore.setLoading(true);
    try {
      if (metadata.id) {
        await updateFlow(metadata.id, {
          businessType: metadata.businessType,
          name: metadata.name,
          description: metadata.description,
          isActive: metadata.isActive,
          initialStepId: result.initialStepId,
          steps: result.steps,
        });
        return { success: true, id: metadata.id };
      } else {
        const created = await createFlow({
          businessType: metadata.businessType,
          name: metadata.name,
          description: metadata.description,
          initialStepId: result.initialStepId,
          isActive: metadata.isActive,
          steps: result.steps,
        });
        flowStore.patchMetadata({ id: created.id });
        return { success: true, id: created.id };
      }
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? 'Save failed';
      builderStore.setError(msg);
      return { success: false, errors: [msg] };
    } finally {
      builderStore.setLoading(false);
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
    addNewNode,
    updateSelectedNodeData,
    renameSelectedNode,
    deleteNode,
    updateEdgeCondition,
    deleteEdge,
    saveFlow,
    setMetadata: flowStore.setMetadata,
    patchMetadata: flowStore.patchMetadata,
    setSelectedNodeId: builderStore.setSelectedNodeId,
    setError: builderStore.setError,
  };
};
