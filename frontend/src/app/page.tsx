"use client";

import { ActivityIcon } from "@/components/ActivityIcon";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useDashboard, useQuickActions } from "@/hooks/useDashboard";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const {
    stats,
    activities,
    systemStatus,
    chartData,
    agentPerformance,
    isLoading,
    actions,
  } = useDashboard();
  const { createSession, viewReports, openSettings } = useQuickActions();

  const handleRefresh = () => {
    actions.refreshDashboard();
  };

  const handleCreateSession = () => {
    router.push("/sessions");
  };

  const handleFlowBuilder = () => {
    router.push("/flows/list");
  };

  return (
    <ProtectedRoute>
      <div>
        {/* Performance Banner */}
        <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 ${
                    systemStatus.isOnline ? "bg-green-100" : "bg-red-100"
                  } rounded-full flex items-center justify-center`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      systemStatus.isOnline ? "text-green-600" : "text-red-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {systemStatus.isOnline ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    )}
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {systemStatus.isOnline
                    ? "Sistema Operacional"
                    : "Sistema com Problemas"}
                </h3>
                <p className="text-sm text-gray-600">
                  {systemStatus.isOnline
                    ? "Todos os serviços funcionando normalmente"
                    : "Verificando conectividade..."}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-gray-500 text-sm">Uptime</div>
                <div className="font-semibold text-gray-900">
                  {systemStatus.uptime}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-sm">Latência</div>
                <div className="font-semibold text-gray-900">
                  {systemStatus.latency}
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                title="Atualizar dados"
              >
                <svg
                  className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Bem-vindo ao Ticket Robot - Sistema de Automação WhatsApp
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Sessões Ativas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Sessões Ativas
                </p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.sessions}
                  </p>
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    +12%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tickets Hoje */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-indigo-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Tickets Hoje
                </p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.ticketsInfo.todayOpened}
                  </p>
                  <span className="ml-2 text-xs text-gray-500">criados</span>
                </div>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="text-xs text-green-600 font-medium">
                    {stats.ticketsInfo.todayClosed} resolvidos
                  </span>
                  <span className="text-xs text-orange-600">
                    {stats.ticketsInfo.inProgress} em andamento
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagens Hoje */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-green-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Mensagens Hoje
                </p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.messagesInfo.today}
                  </p>
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {stats.messagesInfo.percentageChange > 0 ? "+" : ""}
                    {stats.messagesInfo.percentageChange.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-gray-500">
                    Ontem: {stats.messagesInfo.yesterday}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contatos Totais */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-orange-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Contatos Totais
                </p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.contactsInfo.total}
                  </p>
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {stats.contactsInfo.percentageChange > 0 ? "+" : ""}
                    {stats.contactsInfo.percentageChange.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-gray-500">
                    Este mês: {stats.contactsInfo.thisMonth}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Atividade Recente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Atividade Recente
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Tempo Real
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flow-root max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <ul className="-mb-8">
                  {activities.map((activity, index) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {index !== activities.length - 1 && (
                          <span
                            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          ></span>
                        )}
                        <div className="relative flex items-start space-x-3">
                          <div
                            className={`relative px-1 ${
                              activity.type === "success"
                                ? "bg-green-500"
                                : activity.type === "info"
                                ? "bg-blue-500"
                                : activity.type === "warning"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            } rounded-full flex items-center justify-center h-10 w-10`}
                          >
                            <ActivityIcon
                              icon={activity.icon}
                              className="w-5 h-5 text-white"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">
                                  {activity.action}
                                </p>
                              </div>
                              <p className="mt-0.5 text-sm text-gray-500">
                                {activity.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                  {activities.length === 0 && (
                    <li>
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">
                          <svg
                            className="w-12 h-12 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">
                          Nenhuma atividade recente
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          As atividades aparecerão em tempo real
                        </p>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Top Atendentes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  🏆 Top Atendentes Hoje
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Performance
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {agentPerformance.slice(0, 10).map((agent, index) => (
                  <div
                    key={agent.agentId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-gray-400"
                            : index === 2
                            ? "bg-orange-600"
                            : "bg-blue-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {agent.agentName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {agent.ticketsResolved} tickets
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {agent.averageResolutionTime}
                      </p>
                      <p className="text-xs text-gray-500">
                        Resposta: {agent.responseTime}
                      </p>
                    </div>
                  </div>
                ))}
                {agentPerformance.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <svg
                        className="w-12 h-12 mx-auto"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">
                      Nenhum atendente ativo hoje
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Os dados aparecerão quando houver tickets resolvidos
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Ações Rápidas
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleCreateSession}
                  className="group relative p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        ></path>
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      Nova Sessão
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleFlowBuilder}
                  className="group relative p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                      <svg
                        className="w-6 h-6 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        ></path>
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      Flow Builder
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    router.push("/messages");
                  }}
                  className="group relative p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        ></path>
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      Enviar Mensagem
                    </div>
                  </div>
                </button>

                <button
                  onClick={viewReports}
                  className="group relative p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        ></path>
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      Ver Relatórios
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  📊 Atividade dos Últimos 7 Dias
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-600">Mensagens</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-600">Tickets Resolvidos</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ↗ +23%
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-end justify-between space-x-2 h-40">
                {chartData.map((data, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center group"
                  >
                    <div className="w-full flex flex-col items-center space-y-1">
                      {/* Barra de Mensagens */}
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500 cursor-pointer relative"
                        style={{ height: `${data.value}%`, minHeight: "8px" }}
                        title={`${data.day}: ${
                          data.messages || data.value
                        } mensagens`}
                      >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
                          {data.messages || data.value} msgs
                        </div>
                      </div>

                      {/* Barra de Tickets (menor) */}
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-300 hover:from-green-600 hover:to-green-500 cursor-pointer"
                        style={{
                          height: `${Math.min(data.value * 0.6, 80)}%`,
                          minHeight: "4px",
                        }}
                        title={`${data.day}: ${Math.floor(
                          (data.messages || data.value) * 0.3
                        )} tickets resolvidos`}
                      ></div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500 font-medium">
                      {data.day}
                    </div>
                  </div>
                ))}
              </div>

              {/* Estatísticas Resumidas */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {chartData.reduce(
                        (acc, day) => acc + (day.messages || day.value),
                        0
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Total Mensagens</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.floor(
                        chartData.reduce(
                          (acc, day) => acc + (day.messages || day.value) * 0.3,
                          0
                        )
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Tickets Resolvidos
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.floor(
                        chartData.reduce(
                          (acc, day) => acc + (day.messages || day.value),
                          0
                        ) / 7
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Média Diária</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.ticketsInfo.resolutionRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Taxa Resolução</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
