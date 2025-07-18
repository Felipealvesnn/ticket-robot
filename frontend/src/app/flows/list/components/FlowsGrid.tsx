"use client";

import { FC, memo } from "react";
import { FlowCard } from "./FlowCard";

interface FlowsGridProps {
  flows: any[];
  onEdit: (flowId: string) => void;
  onToggleActive: (flowId: string, isActive: boolean) => void;
  onDuplicate: (flowId: string) => void;
  onDelete: (flowId: string) => void;
}

export const FlowsGrid: FC<FlowsGridProps> = memo(
  ({ flows, onEdit, onToggleActive, onDuplicate, onDelete }) => {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {flows.map((flow) => (
          <FlowCard
            key={flow.id}
            flow={flow}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }
);

FlowsGrid.displayName = "FlowsGrid";
