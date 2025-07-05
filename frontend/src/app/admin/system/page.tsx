"use client";

import { useAuthStore } from "@/store/auth";
import {
  CogIcon,
  DatabaseIcon,
  ServerIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminSystemPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState({
    version: "1.0.0",
    uptime: "5 dias, 3 horas",
    memory: "2.4 GB / 8 GB",
    cpu: "15%",
    database: "PostgreSQL 15.0",
    backupStatus: "Último backup: 2 horas atrás",
    totalUsers: 156,
    totalCompanies: 23,
    totalSessions: 45,
    totalMessages: 12543,
  });

  // Verificar se é super admin
  useEffect(() => {
    if (!user) return;

    const isSuperAdmin = user.currentCompany?.role?.name === "SUPER_ADMIN";
    if (!isSuperAdmin) {
      router.push("/");
      return;
    }
  }, [user, router]);

  const handleBackup = async () => {
    setLoading(true);
    // TODO: Implementar API de backup
    setTimeout(() => {
      setLoading(false);
      alert("Backup iniciado com sucesso!");
    }, 2000);
  };

  const handleClearCache = async () => {
    setLoading(true);
    // TODO: Implementar API de limpeza de cache
    setTimeout(() => {
      setLoading(false);
      alert("Cache limpo com sucesso!");
    }, 1000);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CogIcon className="w-8 h-8 mr-3 text-blue-600" />
                Configurações do Sistema
              </h1>
              <p className="text-gray-600 mt-2">
                Monitore e configure o sistema
              </p>
            </div>
          </div>
        </div>

        {/* Informações do Sistema */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status do Sistema */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ServerIcon className="w-5 h-5 mr-2 text-green-600" />
                Status do Sistema
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Versão:</span>
                  <span className="font-medium">{systemInfo.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uptime:</span>
                  <span className="font-medium text-green-600">
                    {systemInfo.uptime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Memória:</span>
                  <span className="font-medium">{systemInfo.memory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CPU:</span>
                  <span className="font-medium">{systemInfo.cpu}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Database:</span>
                  <span className="font-medium">{systemInfo.database}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas Globais */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DatabaseIcon className="w-5 h-5 mr-2 text-blue-600" />
                Estatísticas Globais
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Usuários:</span>
                  <span className="font-medium text-blue-600">
                    {systemInfo.totalUsers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Empresas:</span>
                  <span className="font-medium text-purple-600">
                    {systemInfo.totalCompanies}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sessões Ativas:</span>
                  <span className="font-medium text-green-600">
                    {systemInfo.totalSessions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Mensagens:</span>
                  <span className="font-medium text-indigo-600">
                    {systemInfo.totalMessages}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Último Backup:</span>
                  <span className="font-medium text-gray-900">
                    {systemInfo.backupStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ações Administrativas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <ShieldCheckIcon className="w-5 h-5 mr-2 text-red-600" />
              Ações Administrativas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Backup */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Backup do Sistema
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Criar backup completo do banco de dados
                </p>
                <button
                  onClick={handleBackup}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Criando..." : "Criar Backup"}
                </button>
              </div>

              {/* Cache */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Limpar Cache</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Limpar cache do sistema para melhor performance
                </p>
                <button
                  onClick={handleClearCache}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Limpando..." : "Limpar Cache"}
                </button>
              </div>

              {/* Logs */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Visualizar Logs
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Visualizar logs do sistema e erros
                </p>
                <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                  Ver Logs
                </button>
              </div>

              {/* Manutenção */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Modo Manutenção
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Ativar modo de manutenção para usuários
                </p>
                <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors">
                  Ativar Manutenção
                </button>
              </div>

              {/* Reiniciar */}
              <div className="border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Reiniciar Sistema
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Reiniciar todos os serviços do sistema
                </p>
                <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                  Reiniciar
                </button>
              </div>

              {/* Configurações */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Configurações Avançadas
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Acessar configurações avançadas do sistema
                </p>
                <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                  Configurar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
