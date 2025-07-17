"use client";

import { AgentPerformance } from "@/types/dashboard";
import { Clock, MessageSquare, Trophy } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AgentPerformanceChartProps {
  agentPerformance: AgentPerformance[];
  isLoading?: boolean;
}

function LoadingChart() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="p-6">
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

function AgentCard({ agent, rank }: { agent: AgentPerformance; rank: number }) {
  const getRankColor = () => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      case 2:
        return "bg-gradient-to-r from-gray-400 to-gray-600";
      case 3:
        return "bg-gradient-to-r from-orange-400 to-orange-600";
      default:
        return "bg-gradient-to-r from-blue-400 to-blue-600";
    }
  };

  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-8 h-8 ${getRankColor()} rounded-full flex items-center justify-center text-white text-sm font-bold`}
          >
            {rank <= 3 ? getRankIcon() : rank}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{agent.agentName}</h4>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            {agent.ticketsResolved}
          </p>
          <p className="text-xs text-gray-500">tickets</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-gray-500">Resolução</p>
            <p className="font-medium">{agent.averageResolutionTime}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-green-500" />
          <div>
            <p className="text-gray-500">Resposta</p>
            <p className="font-medium">{agent.responseTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentPerformanceChart({
  agentPerformance,
  isLoading,
}: AgentPerformanceChartProps) {
  if (isLoading) {
    return <LoadingChart />;
  }

  if (!agentPerformance || agentPerformance.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Performance dos Atendentes
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Nenhum dado de performance disponível hoje
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Preparar dados para o gráfico
  const chartData = agentPerformance.map((agent) => ({
    name: agent.agentName.split(" ")[0], // Primeiro nome apenas
    tickets: agent.ticketsResolved,
  }));

  return (
    <div className="space-y-6">
      {/* Gráfico de Barras */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Tickets Resolvidos Hoje
              </h3>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Top Performers
            </span>
          </div>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [value, "Tickets Resolvidos"]}
                labelFormatter={(label) => `Atendente: ${label}`}
              />
              <Bar
                dataKey="tickets"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking Detalhado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Ranking Detalhado
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentPerformance.slice(0, 6).map((agent, index) => (
              <AgentCard key={agent.agentId} agent={agent} rank={index + 1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
