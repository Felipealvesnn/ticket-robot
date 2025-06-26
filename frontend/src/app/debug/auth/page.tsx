"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";

export default function AuthDebugPage() {
  const {
    user,
    isAuthenticated,
    hasCheckedAuth,
    isLoading,
    checkAuth,
    logout,
  } = useAuthStore();
  const router = useRouter();

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug de Autenticação</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estado Atual */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Estado Atual</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>isAuthenticated:</span>
                <span
                  className={`font-bold ${
                    isAuthenticated ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isAuthenticated ? "✅ true" : "❌ false"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>hasCheckedAuth:</span>
                <span
                  className={`font-bold ${
                    hasCheckedAuth ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {hasCheckedAuth ? "✅ true" : "⏳ false"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>isLoading:</span>
                <span
                  className={`font-bold ${
                    isLoading ? "text-yellow-600" : "text-gray-600"
                  }`}
                >
                  {isLoading ? "⏳ true" : "✅ false"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Token no localStorage:</span>
                <span
                  className={`font-bold ${
                    typeof window !== "undefined" &&
                    localStorage.getItem("auth_token")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {typeof window !== "undefined" &&
                  localStorage.getItem("auth_token")
                    ? "✅ Presente"
                    : "❌ Ausente"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Zustand Storage:</span>
                <span
                  className={`font-bold ${
                    typeof window !== "undefined" &&
                    localStorage.getItem("auth-storage")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {typeof window !== "undefined" &&
                  localStorage.getItem("auth-storage")
                    ? "✅ Presente"
                    : "❌ Ausente"}
                </span>
              </div>
            </div>
          </div>

          {/* Informações do Usuário */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              Informações do Usuário
            </h2>
            {user ? (
              <div className="space-y-2">
                <div>
                  <strong>ID:</strong> {user.id}
                </div>
                <div>
                  <strong>Nome:</strong> {user.name}
                </div>
                <div>
                  <strong>Email:</strong> {user.email}
                </div>
                <div>
                  <strong>Empresas:</strong> {user.companies?.length || 0}
                </div>
                {user.currentCompany && (
                  <div>
                    <strong>Empresa Atual:</strong> {user.currentCompany.name}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum usuário logado</p>
            )}
          </div>

          {/* Ações */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Ações</h2>
            <div className="space-y-2">
              <button
                onClick={checkAuth}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Verificando..." : "Verificar Auth Novamente"}
              </button>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Ir para Login
              </button>
              <button
                onClick={logout}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Test de Recarga */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Teste de Recarga</h2>
            <p className="text-sm text-gray-600 mb-4">
              Para testar a correção da condição de corrida, recarregue a página
              (F5) e verifique se não há redirecionamento indevido para /login.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                Recarregar Página (F5)
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Limpar Storage + Recarregar
              </button>
            </div>
          </div>
        </div>

        {/* Storage Debug */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-4">Debug do Storage</h2>
          <div className="space-y-2">
            <div>
              <strong>auth-storage:</strong>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                {typeof window !== "undefined"
                  ? localStorage.getItem("auth-storage") || "null"
                  : "N/A (SSR)"}
              </pre>
            </div>
            <div>
              <strong>auth_token:</strong>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                {typeof window !== "undefined"
                  ? localStorage.getItem("auth_token")
                    ? "Token presente (oculto por segurança)"
                    : "null"
                  : "N/A (SSR)"}
              </pre>
            </div>
          </div>
        </div>

        {/* Como Testar */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-4">Como Testar</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>Login:</strong> Faça login normalmente
            </li>
            <li>
              <strong>Verifique estado:</strong> Confirme que `hasCheckedAuth` é
              `true` e `isAuthenticated` é `true`
            </li>
            <li>
              <strong>Recarregue:</strong> Pressione F5 ou clique em "Recarregar
              Página"
            </li>
            <li>
              <strong>Observe:</strong> A página deve mostrar "Verificando
              autenticação..." brevemente, mas NÃO deve redirecionar para /login
            </li>
            <li>
              <strong>Confirme:</strong> Após alguns segundos, você deve estar
              de volta nesta página com o estado correto
            </li>
          </ol>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-semibold text-blue-800">
              Comportamento Esperado:
            </h3>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>
                • `hasCheckedAuth` deve ser persistido e restaurado corretamente
              </li>
              <li>
                • `isAuthenticated` deve permanecer `true` após recarga se o
                usuário estava logado
              </li>
              <li>
                • Não deve haver redirecionamento para /login se o token for
                válido
              </li>{" "}
              <li>• O Socket.IO deve reconectar automaticamente</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800">
              🎯 Correção Implementada:
            </h3>
            <p className="text-sm text-green-700 mt-2">
              Agora verificamos se há `user` salvo em vez de apenas
              `isAuthenticated`:
            </p>
            <ul className="text-sm text-green-700 mt-2 space-y-1">
              <li>• ✅ Verificamos se há `user` persistido (mais confiável)</li>
              <li>• ✅ Só redirecionamos se NÃO há usuário E NÃO há token</li>
              <li>• ✅ Adicionamos logs detalhados para debug</li>
              <li>• ✅ O `isAuthenticated` é derivado do `user` (!!user)</li>
            </ul>
            <div className="mt-2 p-2 bg-green-100 rounded text-xs">
              <strong>📋 Abra o DevTools Console</strong> para ver os logs
              detalhados da hidratação e verificação!
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold text-yellow-800">
              Resposta à sua dúvida:
            </h3>
            <p className="text-sm text-yellow-700 mt-2">
              O `isAuthenticated` agora deve persistir como `true` porque:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• Adicionamos `hasCheckedAuth` ao `partialize` do Zustand</li>
              <li>
                • Configuramos `onRehydrateStorage` para lidar com a restauração
              </li>
              <li>
                • O `AuthProvider` agora só redireciona após confirmar que
                verificou a auth
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
