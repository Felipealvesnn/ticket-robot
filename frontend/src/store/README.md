# 🗂️ Stores Architecture - Admin & Management

## 📋 **Visão Geral**

Esta refatoração implementa uma arquitetura de stores usando **Zustand** para gerenciar o estado das páginas administrativas e de gestão, separando as responsabilidades e melhorando a organização do código.

## 🏗️ **Arquitetura dos Stores**

### 1. **Admin Users Store** (`/store/admin-users.ts`)

- **Responsabilidade**: Gerenciar usuários globais do sistema (SUPER_ADMIN only)
- **Funcionalidades**:
  - CRUD de usuários globais
  - Gestão de empresas dos usuários
  - Controle de roles e permissões
  - Paginação

### 2. **Management Users Store** (`/store/management-users.ts`)

- **Responsabilidade**: Gerenciar usuários da empresa atual
- **Funcionalidades**:
  - CRUD de usuários da empresa
  - Gestão de roles dentro da empresa
  - Controle de status dos usuários

### 3. **Admin Companies Store** (`/store/admin-companies.ts`)

- **Responsabilidade**: Gerenciar empresas do sistema (SUPER_ADMIN only)
- **Funcionalidades**:
  - CRUD de empresas
  - Controle de status das empresas
  - Estatísticas agregadas (usuários, sessões)
  - Paginação

### 4. **Management Company Store** (`/store/management-company.ts`)

- **Responsabilidade**: Gerenciar configurações da empresa atual
- **Funcionalidades**:
  - Visualização e edição dos dados da empresa
  - Controle de estados de edição
  - Estatísticas da empresa (usuários ativos, totais)
  - Validação e salvamento de alterações

## 🔧 **Como Usar os Stores**

### **Exemplo - Admin Users:**

```tsx
import { useAdminUsersStore } from "@/store/admin-users";

function AdminUsersPage() {
  const {
    users,
    usersLoading,
    usersError,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    reset,
  } = useAdminUsersStore();

  useEffect(() => {
    loadUsers();
    return () => reset(); // Cleanup
  }, []);

  const handleCreateUser = async (userData) => {
    try {
      await createUser(userData);
      // Store automaticamente recarrega a lista
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  return (
    <div>
      {usersLoading && <LoadingSpinner />}
      {usersError && <ErrorMessage message={usersError} />}
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### **Exemplo - Management Users:**

```tsx
import { useManagementUsersStore } from "@/store/management-users";

function ManagementUsersPage() {
  const { user } = useAuthStore();
  const { users, usersLoading, loadUsers, createUser, setCurrentCompanyId } =
    useManagementUsersStore();

  useEffect(() => {
    const companyId = user?.currentCompany?.id;
    if (companyId) {
      setCurrentCompanyId(companyId);
      loadUsers(companyId);
    }
  }, [user]);

  return <div>{/* Componente da página */}</div>;
}
```

### **Exemplo - Management Company:**

```tsx
import { useManagementCompanyStore } from "@/store/management-company";

function ManagementCompanyPage() {
  const { user } = useAuthStore();
  const {
    company,
    companyLoading,
    isEditing,
    saving,
    loadCompany,
    updateCompany,
    setIsEditing,
    getActiveUsersCount,
    reset,
  } = useManagementCompanyStore();

  useEffect(() => {
    const companyId = user?.currentCompany?.id;
    if (companyId) {
      loadCompany(companyId);
    }
    return () => reset();
  }, [user]);

  const handleSave = async (data) => {
    try {
      await updateCompany(company.id, data);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <div>
      {companyLoading && <LoadingSpinner />}
      {company && (
        <div>
          <h1>{company.name}</h1>
          <p>Usuários ativos: {getActiveUsersCount()}</p>
          {isEditing ? (
            <EditForm onSave={handleSave} />
          ) : (
            <button onClick={() => setIsEditing(true)}>
              Editar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

## 🚀 **Benefícios da Arquitetura**

### **1. Separação de Responsabilidades**

- Cada store gerencia um domínio específico
- Reduz acoplamento entre componentes
- Facilita testes unitários

### **2. Performance**

- Cache automático de dados
- Evita requests desnecessários
- Atualizações otimizadas do estado

### **3. Reutilização**

- Outros componentes podem usar os mesmos dados
- Lógica centralizada e reutilizável
- Consistência de estado entre componentes

### **4. Manutenibilidade**

- Código mais organizado e limpo
- Fácil identificação de responsabilidades
- Debugging simplificado

### **5. Developer Experience**

- TypeScript com tipagem completa
- DevTools do Zustand para debugging
- Cleanup automático com `reset()`

## 📂 **Estrutura dos Arquivos**

```
src/
├── store/
│   ├── admin-users.ts       # Store para usuários globais
│   ├── management-users.ts  # Store para usuários da empresa
│   ├── admin-companies.ts   # Store para empresas
│   └── management-company.ts # Store para configurações da empresa
├── app/
│   ├── admin/
│   │   ├── users/page.tsx   # Usa admin-users store
│   │   └── companies/page.tsx # Usa admin-companies store
│   └── management/
│       ├── users/page.tsx   # Usa management-users store
│       └── company/page.tsx # Usa management-company store
```

## 🔒 **Controle de Acesso**

- **Admin Users**: Apenas `SUPER_ADMIN`
- **Admin Companies**: Apenas `SUPER_ADMIN`
- **Management Users**: `COMPANY_OWNER`, `COMPANY_ADMIN`, `SUPER_ADMIN`
- **Management Company**: `COMPANY_OWNER`, `COMPANY_ADMIN`, `SUPER_ADMIN`

## 🧪 **Próximos Passos**

1. **Testes**: Implementar testes unitários para os stores
2. **Otimizações**: Adicionar debounce para buscas
3. **Websockets**: Integrar atualizações em tempo real
4. **Persistência**: Adicionar cache local se necessário

## 🎯 **Padrões Recomendados**

### **1. Sempre fazer cleanup:**

```tsx
useEffect(() => {
  loadData();
  return () => reset(); // Importante!
}, []);
```

### **2. Tratar erros adequadamente:**

```tsx
const handleAction = async () => {
  try {
    await storeAction();
  } catch (error) {
    // Tratar erro específico
    console.error("Erro:", error);
  }
};
```

### **3. Usar loading states:**

```tsx
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
```

---

Esta arquitetura fornece uma base sólida e escalável para o gerenciamento de estado das páginas administrativas! 🚀
