"use client";

import { useFlowsStore } from "@/store";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CreateFlowModal,
  EmptyState,
  ErrorState,
  FlowsGrid,
  FlowsHeader,
  LoadingState,
} from "./components";

export default function FlowsListPage() {
  const router = useRouter();
  const {
    flows,
    createFlow,
    deleteFlow,
    duplicateFlow,
    updateFlow,
    setCurrentFlow,
    loadFlowsFromApi,
    isLoading,
    apiError,
  } = useFlowsStore();

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Handlers otimizados com useCallback
  const handleCreateFlow = useCallback(
    (name: string, description: string) => {
      const newFlow = createFlow(name, description);
      setShowCreateModal(false);

      // Usar setTimeout para garantir que o estado seja atualizado
      setTimeout(() => {
        setCurrentFlow(newFlow);
        router.push("/flows");
      }, 100);
    },
    [createFlow, setCurrentFlow, router]
  );

  const handleEditFlow = useCallback(
    (flowId: string) => {
      const flow = flows.find((f) => f.id === flowId);
      if (flow) {
        setCurrentFlow(flow);
        router.push("/flows");
      }
    },
    [flows, setCurrentFlow, router]
  );

  const handleToggleActive = useCallback(
    (flowId: string, isActive: boolean) => {
      updateFlow(flowId, { isActive: !isActive });
    },
    [updateFlow]
  );

  const handleDuplicate = useCallback(
    (flowId: string) => {
      duplicateFlow(flowId);
    },
    [duplicateFlow]
  );

  const handleDelete = useCallback(
    (flowId: string) => {
      deleteFlow(flowId);
    },
    [deleteFlow]
  );

  const handleShowCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);

  const handleRetryLoad = useCallback(async () => {
    try {
      await loadFlowsFromApi();
    } catch (error) {
      console.error("Erro ao recarregar flows:", error);
    }
  }, [loadFlowsFromApi]);

  // Carregar flows da API quando a página é montada
  useEffect(() => {
    const loadFlows = async () => {
      try {
        await loadFlowsFromApi();
      } catch (error) {
        console.error("Erro ao carregar flows:", error);
        // A mensagem de erro já é tratada no store
      }
    };

    loadFlows();
  }, [loadFlowsFromApi]);

  return (
    <div className="min-h-screen bg-gray-50">
      <FlowsHeader onCreateFlow={handleShowCreateModal} />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && <LoadingState />}

        {/* Error State */}
        {apiError && !isLoading && (
          <ErrorState error={apiError} onRetry={handleRetryLoad} />
        )}

        {/* Empty State */}
        {!isLoading && flows.length === 0 && !apiError && (
          <EmptyState onCreateFlow={handleShowCreateModal} />
        )}

        {/* Flows Grid */}
        {!isLoading && flows.length > 0 && (
          <FlowsGrid
            flows={flows}
            onEdit={handleEditFlow}
            onToggleActive={handleToggleActive}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        )}
      </main>

      {/* Create Flow Modal */}
      <CreateFlowModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onCreate={handleCreateFlow}
      />
    </div>
  );
}
