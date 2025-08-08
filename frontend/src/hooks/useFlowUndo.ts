import { useUndoRedoStore } from "@/store/undoRedo";
import { useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
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
  // 🔥 ATALHOS COM REACT-HOTKEYS-HOOK (substitui addEventListener)

  // Undo: Ctrl+Z ou Cmd+Z
  useHotkeys(
    "ctrl+z, cmd+z",
    (e) => {
      e.preventDefault();
      handleUndo();
    },
    {
      enableOnFormTags: false, // Não ativar em inputs/forms
      description: "Desfazer ação",
    }
  );

  // Redo: Ctrl+Shift+Z, Cmd+Shift+Z, Ctrl+Y, Cmd+Y
  useHotkeys(
    "ctrl+shift+z, cmd+shift+z, ctrl+y, cmd+y",
    (e) => {
      e.preventDefault();
      handleRedo();
    },
    {
      enableOnFormTags: false,
      description: "Refazer ação",
    }
  );

  return {
    saveCurrentState,
    handleUndo,
    handleRedo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
};
