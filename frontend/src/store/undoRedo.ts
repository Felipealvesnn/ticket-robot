import { Edge, Node } from "reactflow";
import { create } from "zustand";

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

interface UndoRedoStore {
  history: FlowState[];
  currentIndex: number;
  maxHistorySize: number;

  // Actions
  saveState: (nodes: Node[], edges: Edge[]) => void;
  undo: () => FlowState | null;
  redo: () => FlowState | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Getters
  getCurrentState: () => FlowState | null;
  getHistoryInfo: () => {
    currentIndex: number;
    totalStates: number;
    canUndo: boolean;
    canRedo: boolean;
  };
}

export const useUndoRedoStore = create<UndoRedoStore>((set, get) => ({
  history: [],
  currentIndex: -1,
  maxHistorySize: 50, // Limitar histórico para evitar problemas de memória

  saveState: (nodes: Node[], edges: Edge[]) => {
    const { history, currentIndex, maxHistorySize } = get();

    // Criar novo estado
    const newState: FlowState = {
      nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
      edges: JSON.parse(JSON.stringify(edges)), // Deep clone
      timestamp: Date.now(),
    };

    // Remover estados futuros se estivermos no meio do histórico
    const newHistory = history.slice(0, currentIndex + 1);

    // Adicionar novo estado
    newHistory.push(newState);

    // Limitar tamanho do histórico
    if (newHistory.length > maxHistorySize) {
      newHistory.shift(); // Remove o primeiro (mais antigo)
    } else {
      // Se não removemos nenhum, incrementar índice
      set({ currentIndex: currentIndex + 1 });
    }

    set({
      history: newHistory,
      currentIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, currentIndex } = get();

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      set({ currentIndex: newIndex });
      return history[newIndex];
    }

    return null;
  },

  redo: () => {
    const { history, currentIndex } = get();

    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      set({ currentIndex: newIndex });
      return history[newIndex];
    }

    return null;
  },

  canUndo: () => {
    const { currentIndex } = get();
    return currentIndex > 0;
  },

  canRedo: () => {
    const { history, currentIndex } = get();
    return currentIndex < history.length - 1;
  },

  clearHistory: () => {
    set({
      history: [],
      currentIndex: -1,
    });
  },

  getCurrentState: () => {
    const { history, currentIndex } = get();
    return currentIndex >= 0 ? history[currentIndex] : null;
  },

  getHistoryInfo: () => {
    const { history, currentIndex } = get();
    return {
      currentIndex,
      totalStates: history.length,
      canUndo: currentIndex > 0,
      canRedo: currentIndex < history.length - 1,
    };
  },
}));
