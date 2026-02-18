import { create } from "zustand";

interface AppState {
  sidebarOpen: boolean;
  selectedMetrics: string[];
  campaignFilter: string;
  setSidebarOpen: (open: boolean) => void;
  addMetric: (metric: string) => void;
  removeMetric: (metric: string) => void;
  reorderMetrics: (sourceIndex: number, targetIndex: number) => void;
  setCampaignFilter: (filter: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  selectedMetrics: [],
  campaignFilter: "all",
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addMetric: (metric) =>
    set((state) => {
      if (state.selectedMetrics.includes(metric)) {
        return state;
      }
      return { selectedMetrics: [...state.selectedMetrics, metric] };
    }),
  removeMetric: (metric) =>
    set((state) => ({ selectedMetrics: state.selectedMetrics.filter((item) => item !== metric) })),
  reorderMetrics: (sourceIndex, targetIndex) =>
    set((state) => {
      if (
        sourceIndex < 0 ||
        targetIndex < 0 ||
        sourceIndex >= state.selectedMetrics.length ||
        targetIndex >= state.selectedMetrics.length ||
        sourceIndex === targetIndex
      ) {
        return state;
      }

      const reordered = [...state.selectedMetrics];
      const [movedMetric] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, movedMetric);

      return { selectedMetrics: reordered };
    }),
  setCampaignFilter: (filter) => set({ campaignFilter: filter })
}));
