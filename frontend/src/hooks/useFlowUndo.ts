import { useUndoRedoStore } from "@/store/undoRedo";
import { useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { useReactFlow } from "reactflow";

export const useFlowUndo = () => {
  // Sempre chamar useReactFlow no topo do hook
  const reactFlowAPI = useReactFlow();

  const { getNodes, getEdges, setNodes, setEdges } = reactFlowAPI;
  const { saveState, undo, redo, canUndo, canRedo } = useUndoRedoStore();

  // Salvar estado atual
  const saveCurrentState = useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();
    saveState(nodes, edges);
  }, [getNodes, getEdges, saveState]);

  // Função para desfazer
  const handleUndo = useCallback(() => {
    if (!canUndo()) return;

    const previousState = undo();
    if (previousState) {
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      toast.success("Ação desfeita");
    }
  }, [canUndo, undo, setNodes, setEdges]);

  // Função para refazer
  const handleRedo = useCallback(() => {
    if (!canRedo()) return;

    const nextState = redo();
    if (nextState) {
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      toast.success("Ação refeita");
    }
  }, [canRedo, redo, setNodes, setEdges]);

  // Atalhos globais
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar executar se estivermos em um input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Z") ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  return {
    saveCurrentState,
    handleUndo,
    handleRedo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
};
