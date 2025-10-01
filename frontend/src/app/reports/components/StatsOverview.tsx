import type { OverviewStats } from "@/services/api";
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  PhoneIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface StatsOverviewProps {
  stats: OverviewStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Mensagens</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.totalMessages.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Contatos</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.totalContacts}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <PhoneIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Sessões Ativas</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.activeSessions}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <ClockIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Tempo Resposta</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.responseTime}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
