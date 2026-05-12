import { create } from 'zustand';

interface BuilderState {
  selectedNodeId: string | null;
  panX: number;
  panY: number;
  zoom: number;
  isLoading: boolean;
  error: string | null;

  setSelectedNodeId: (id: string | null) => void;
  setPan: (x: number, y: number) => void;
  setZoom: (z: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (err: string | null) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  selectedNodeId: null,
  panX: 0,
  panY: 0,
  zoom: 1,
  isLoading: false,
  error: null,

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setZoom: (z) => set({ zoom: z }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (err) => set({ error: err }),
  reset: () =>
    set({
      selectedNodeId: null,
      panX: 0,
      panY: 0,
      zoom: 1,
      isLoading: false,
      error: null,
    }),
}));
