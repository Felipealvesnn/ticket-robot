"use client";

import { DashboardStats } from "@/types/dashboard";
import {
  CheckCircle,
  MessageCircle,
  Minus,
  Smartphone,
  Ticket,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  change?: number;
  changeLabel?: string;
}

function StatCard({
  title,
  value,
  icon,
  gradient,
  change,
  changeLabel,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!change) return <Minus className="w-3 h-3" />;
    if (change > 0) return <TrendingUp className="w-3 h-3" />;
    if (change < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!change) return "bg-gray-100 text-gray-800";
    if (change > 0) return "bg-green-100 text-green-800";
    if (change < 0) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
      <div className="flex items-center">
        <div className={`p-3 ${gradient} rounded-xl shadow-lg`}>{icon}</div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {(change !== undefined || changeLabel) && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTrendColor()}`}
              >
                {getTrendIcon()}
                {changeLabel || `${change && change > 0 ? "+" : ""}${change}%`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center">
        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        <div className="ml-4 flex-1">
          <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
          <div className="w-16 h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      <StatCard
        title="Sessões Ativas"
        value={stats.sessions}
        icon={<Smartphone className="w-6 h-6 text-white" />}
        gradient="bg-gradient-to-r from-blue-500 to-blue-600"
        change={12}
      />

      <StatCard
        title="Mensagens Hoje"
        value={stats.messagesInfo.today.toLocaleString()}
        icon={<MessageCircle className="w-6 h-6 text-white" />}
        gradient="bg-gradient-to-r from-green-500 to-green-600"
        change={stats.messagesInfo.percentageChange}
      />

      <StatCard
        title="Contatos"
        value={stats.contactsInfo.total.toLocaleString()}
        icon={<Users className="w-6 h-6 text-white" />}
        gradient="bg-gradient-to-r from-purple-500 to-purple-600"
        change={stats.contactsInfo.percentageChange}
      />

      <StatCard
        title="Tickets Hoje"
        value={stats.ticketsInfo.todayOpened}
        icon={<Ticket className="w-6 h-6 text-white" />}
        gradient="bg-gradient-to-r from-orange-500 to-orange-600"
        change={stats.ticketsInfo.percentageChange}
      />

      <StatCard
        title="Tickets Fechados"
        value={stats.ticketsInfo.todayClosed}
        icon={<CheckCircle className="w-6 h-6 text-white" />}
        gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
        changeLabel={`${stats.ticketsInfo.resolutionRate}% resolvidos`}
      />

      <StatCard
        title="Automações"
        value={stats.automations}
        icon={<Zap className="w-6 h-6 text-white" />}
        gradient="bg-gradient-to-r from-yellow-500 to-yellow-600"
        changeLabel="Ativo"
      />
    </div>
  );
}
