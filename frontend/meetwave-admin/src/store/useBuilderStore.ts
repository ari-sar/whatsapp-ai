import { create } from 'zustand';

interface BuilderState {
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;
  setSelectedNodeId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (err: string | null) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  selectedNodeId: null,
  isLoading: false,
  error: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (err) => set({ error: err }),
  reset: () => set({ selectedNodeId: null, isLoading: false, error: null }),
}));
