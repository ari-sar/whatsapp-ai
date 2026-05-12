import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

export interface FlowMetadata {
  id: string;
  name: string;
  description: string;
  businessType: string;
  isActive: boolean;
}

interface FlowState {
  metadata: FlowMetadata;
  nodes: Node[];
  edges: Edge[];
  setMetadata: (meta: FlowMetadata) => void;
  patchMetadata: (patch: Partial<FlowMetadata>) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: Partial<Node>) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (edgeId: string) => void;
  reset: () => void;
}

const defaultMetadata: FlowMetadata = {
  id: '',
  name: '',
  description: '',
  businessType: '',
  isActive: true,
};

export const useFlowStore = create<FlowState>((set) => ({
  metadata: defaultMetadata,
  nodes: [],
  edges: [],

  setMetadata: (meta) => set({ metadata: meta }),
  patchMetadata: (patch) => set((s) => ({ metadata: { ...s.metadata, ...patch } })),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    })),

  updateNode: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, ...data } : n)),
    })),

  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
  removeEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    })),

  reset: () => set({ metadata: defaultMetadata, nodes: [], edges: [] }),
}));
