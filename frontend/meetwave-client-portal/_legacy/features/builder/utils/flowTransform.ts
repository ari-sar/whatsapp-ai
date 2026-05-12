import { Node, Edge } from '@xyflow/react';
import { Flow, StepConfig } from '../../../types/flow';

export const nodesToFlow = (
  nodes: Node[],
  edges: Edge[],
  metadata: { id: string; name: string; description: string }
): Flow => {
  const startNode = nodes.find((n) => n.data?.type === 'start');
  if (!startNode) {
    throw new Error('Flow must have a start node');
  }

  const steps: Record<string, { id: string; config: StepConfig }> = {};
  nodes.forEach((node) => {
    if (node.data?.type !== 'end') {
      steps[node.id] = {
        id: node.id,
        config: {
          type: node.data?.type || 'text',
          label: node.data?.label || node.id,
          prompt: node.data?.prompt,
          options: node.data?.options,
          validation: node.data?.validation,
          metadata: node.data?.metadata,
        },
      };
    }
  });

  const flowEdges = edges.map((e) => ({
    from: e.source,
    to: e.target,
    condition: e.data?.condition,
  }));

  return {
    id: metadata.id,
    name: metadata.name,
    description: metadata.description,
    initialStepId: startNode.id,
    steps,
    edges: flowEdges,
  };
};

export const flowToNodes = (flow: Flow): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  let yOffset = 0;

  Object.entries(flow.steps).forEach(([stepId, step], index) => {
    nodes.push({
      id: stepId,
      data: step.config,
      position: { x: 250 * index, y: yOffset },
      type: step.config.type,
    });
  });

  const endNode: Node = {
    id: 'end-node',
    data: { type: 'end', label: 'End' },
    position: { x: 250 * (Object.keys(flow.steps).length + 1), y: yOffset },
    type: 'end',
  };
  nodes.push(endNode);

  const edges: Edge[] = flow.edges.map((e, i) => ({
    id: `edge-${i}`,
    source: e.from,
    target: e.to,
    data: e.condition ? { condition: e.condition } : undefined,
  }));

  return { nodes, edges };
};

export const validateFlow = (flow: Flow): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!flow.id || !flow.name) {
    errors.push('Flow must have an id and name');
  }

  if (!flow.initialStepId) {
    errors.push('Flow must have an initialStepId');
  }

  if (!flow.steps[flow.initialStepId]) {
    errors.push(`Initial step "${flow.initialStepId}" does not exist`);
  }

  flow.edges.forEach((e) => {
    if (!flow.steps[e.from]) {
      errors.push(`Edge references non-existent step: ${e.from}`);
    }
    if (!flow.steps[e.to] && e.to !== 'end-node') {
      errors.push(`Edge references non-existent target: ${e.to}`);
    }
  });

  return { valid: errors.length === 0, errors };
};
