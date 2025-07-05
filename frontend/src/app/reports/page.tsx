"use client";

import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  PhoneIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: "2025-01-01",
    end: "2025-01-07",
  });

  const [selectedReport, setSelectedReport] = useState("overview");

  // Dados mockados para demonstração
  const stats = {
    totalMessages: 1245,
    totalContacts: 345,
    activeSessions: 12,
    responseTime: "2.5 min",
    messagesByDay: [
      { day: "Seg", messages: 180 },
      { day: "Ter", messages: 220 },
      { day: "Qua", messages: 195 },
      { day: "Qui", messages: 240 },
      { day: "Sex", messages: 210 },
      { day: "Sáb", messages: 120 },
      { day: "Dom", messages: 78 },
    ],
    topContacts: [
      { name: "João Silva", messages: 45, phone: "+55 11 99999-9999" },
      { name: "Maria Santos", messages: 38, phone: "+55 11 88888-8888" },
      { name: "Pedro Costa", messages: 32, phone: "+55 11 77777-7777" },
      { name: "Ana Oliveira", messages: 28, phone: "+55 11 66666-6666" },
      { name: "Carlos Lima", messages: 25, phone: "+55 11 55555-5555" },
    ],
  };

  const reportTypes = [
    {
      id: "overview",
      name: "Visão Geral",
      description: "Estatísticas gerais do sistema",
      icon: ChartBarIcon,
    },
    {
      id: "messages",
      name: "Mensagens",
      description: "Relatório detalhado de mensagens",
      icon: ChatBubbleLeftRightIcon,
    },
    {
      id: "contacts",
      name: "Contatos",
      description: "Análise de contatos e interações",
      icon: UsersIcon,
    },
    {
      id: "performance",
      name: "Performance",
      description: "Métricas de performance do sistema",
      icon: ClockIcon,
    },
  ];

  const exportReport = (format: string) => {
    // Simular exportação
    alert(`Exportando relatório em formato ${format.toUpperCase()}...`);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ChartBarIcon className="w-8 h-8 mr-3 text-blue-600" />
                Relatórios
              </h1>
              <p className="text-gray-600 mt-2">
                Analise o desempenho e métricas do seu sistema
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => exportReport("pdf")}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                PDF
              </button>
              <button
                onClick={() => exportReport("excel")}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Relatório
                </label>
                <select
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {reportTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Mensagens
                </p>
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
                <p className="text-sm font-medium text-gray-500">
                  Total Contatos
                </p>
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
                <p className="text-sm font-medium text-gray-500">
                  Sessões Ativas
                </p>
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
                <p className="text-sm font-medium text-gray-500">
                  Tempo Resposta
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.responseTime}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico de Mensagens por Dia */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mensagens por Dia
                </h3>
                <ChartBarIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {stats.messagesByDay.map((day, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-12 text-sm text-gray-600">{day.day}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${(day.messages / 250) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-sm font-medium text-gray-900 text-right">
                      {day.messages}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Contatos */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Top Contatos
                </h3>
                <ChartPieIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {stats.topContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {contact.name}
                        </p>
                        <p className="text-sm text-gray-500">{contact.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {contact.messages}
                      </p>
                      <p className="text-xs text-gray-500">mensagens</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tipos de Relatório */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Relatórios Disponíveis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all duration-200 ${
                    selectedReport === type.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:shadow-lg"
                  }`}
                  onClick={() => setSelectedReport(type.id)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                        selectedReport === type.id
                          ? "bg-blue-600"
                          : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          selectedReport === type.id
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {type.name}
                    </h4>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
