# 📋 Tasks Específicas por Sprint - Enhanced DrawDB

## 🎯 SPRINT 1: Base e Responsabilidades (Dias 1-7)

### ✅ Checklist Detalhado - Dia 1

#### 🔧 Setup Supabase
- [ ] **Criar arquivo .env na raiz do projeto**
  ```bash
  touch .env
  ```
- [ ] **Adicionar variáveis de ambiente**
  ```env
  VITE_SUPABASE_URL=https://gfgrxvhpzgbrmsmwfbxf.supabase.co
  VITE_SUPABASE_ANON_KEY=[obter do dashboard]
  ```
- [ ] **Instalar dependência Supabase**
  ```bash
  npm install @supabase/supabase-js
  ```
- [ ] **Criar client Supabase**
  - Arquivo: `src/lib/supabase.js`
  - Conteúdo: client configurado com env vars
- [ ] **Testar conexão**
  - Console log para verificar conexão

### ✅ Checklist Detalhado - Dia 2

#### 🔐 AuthContext
- [ ] **Criar arquivo AuthContext.jsx**
  - Path: `src/context/AuthContext.jsx`
  - Exports: AuthProvider, useAuth
- [ ] **Implementar funções essenciais**
  - `signUp(email, password)`
  - `signIn(email, password)`
  - `signOut()`
  - `user` state
  - `loading` state
- [ ] **Integrar no App.jsx**
  - Wrapper AuthProvider
  - Proteger rotas se necessário

#### 📊 ProjectsContext  
- [ ] **Criar arquivo ProjectsContext.jsx**
  - Path: `src/context/ProjectsContext.jsx`
  - Exports: ProjectsProvider, useProjects
- [ ] **Implementar CRUD completo**
  - `createProject(nome, descricao)`
  - `updateProject(id, data)`
  - `deleteProject(id)`
  - `listProjects()`
  - `currentProject` state
- [ ] **Conectar com Supabase**
  - Queries na tabela `projetos`
  - Error handling

### ✅ Checklist Detalhado - Dia 3

#### 🏷️ Estrutura de Responsabilidades
- [ ] **Definir schema JSONB**
  ```json
  {
    "tables": [
      {
        "id": "uuid",
        "name": "users",
        "fields": [
          {
            "id": "uuid", 
            "name": "email",
            "type": "varchar",
            "responsibility": "F"  // F, B, N, S
          }
        ]
      }
    ]
  }
  ```
- [ ] **Testar inserção no Supabase**
  - Criar projeto de teste
  - Verificar JSONB salvo corretamente
- [ ] **Validar schema**
  - Função de validação
  - Error handling

### ✅ Checklist Detalhado - Dia 4

#### 🎨 Constantes de Cores
- [ ] **Atualizar constants.js**
  ```javascript
  export const responsibilityColors = {
    F: "#3B82F6", // Frontend - Azul
    B: "#10B981", // Backend - Verde  
    N: "#F59E0B", // n8n - Amarelo
    S: "#8B5CF6", // Supabase - Roxo
  };
  ```

#### 🔽 Dropdown Component
- [ ] **Criar ResponsibilityDropdown**
  - Path: `src/components/ResponsibilityDropdown.jsx`
  - Props: `value`, `onChange`
  - Options: F, B, N, S com cores
- [ ] **Modificar TableField.jsx**
  - Path: `src/components/EditorSidePanel/TablesTab/TableField.jsx`
  - Adicionar dropdown ao lado do tipo
  - Integrar com context

### ✅ Checklist Detalhado - Dia 5

#### 🖼️ Canvas Visual
- [ ] **Modificar Table.jsx**
  - Path: `src/components/EditorCanvas/Table.jsx`
  - Mostrar letra F,B,N,S ao lado de cada campo
  - Aplicar cor correspondente
- [ ] **Implementar responsividade**
  - Calcular largura necessária
  - Evitar overflow das letras
  - Manter proporções

### ✅ Checklist Detalhado - Dia 6

#### 💾 Persistência
- [ ] **Modificar SaveStateContext**
  - Path: `src/context/SaveStateContext.jsx`
  - Substituir save por Supabase
  - Manter IndexedDB como fallback
- [ ] **Auto-save com debounce**
  - Timeout de 2 segundos
  - Indicador visual de saving

### ✅ Checklist Detalhado - Dia 7

#### 🧪 Testes e Demo
- [ ] **Lista de testes manuais**
  - Criar tabela com responsabilidades
  - Salvar e recarregar projeto
  - Verificar cores no canvas
  - Testar responsividade
- [ ] **Documentar bugs encontrados**
- [ ] **Demo para stakeholders**

---

## 🤖 SPRINT 2: Chat AI (Dias 8-17)

### ✅ Checklist Detalhado - Dia 8-9

#### 💬 Interface Chat
- [ ] **Criar ChatContext.jsx**
  ```javascript
  // State necessário:
  // - messages: []
  // - isTyping: false  
  // - apiKey: ""
  // - isConfigured: false
  ```
- [ ] **Criar ChatPanel.jsx**
  - Sidebar com toggle
  - Interface tipo ChatGPT
  - Input + histórico
- [ ] **Modal de configuração**
  - API Key OpenAI
  - Validação da key

### ✅ Checklist Detalhado - Dia 10-11

#### 🧠 OpenAI Integration
- [ ] **Instalar dependências**
  ```bash
  npm install openai
  ```
- [ ] **Criar openai.js service**
  ```javascript
  // Funções principais:
  // - sendMessage(message, context)
  // - parseTableResponse(response)
  // - generateTables(description)
  ```
- [ ] **Prompt Engineering**
  - Template para criação de tabelas
  - Context do projeto atual
  - Output estruturado JSON

### ✅ Checklist Detalhado - Dia 12-13

#### 👁️ Preview System
- [ ] **Criar PreviewModal.jsx**
  - Mostrar tabelas que serão criadas
  - Preview visual das responsabilidades
  - Botões: Aprovar/Rejeitar/Modificar
- [ ] **Integração com DiagramContext**
  - Função `createTablesFromAI(tables)`
  - Posicionamento inteligente
  - Auto-relacionamentos

### ✅ Checklist Detalhado - Dia 14-15

#### 🔗 MCP Integration
- [ ] **Estudar MCP Supabase**
  - Comandos disponíveis
  - Formato de resposta
  - Limitações
- [ ] **Integrar no chat**
  - Comando "criar no supabase"
  - Confirmação de segurança
  - Status feedback

---

## 👥 SPRINT 3: Colaboração (Dias 18-27)

### ✅ Checklist Detalhado - Dia 18-19

#### 🔐 Páginas de Auth
- [ ] **Login.jsx**
  - Form email/password
  - Link para registro
  - Forgot password
- [ ] **Register.jsx**  
  - Form completo
  - Validações
  - Confirmação email
- [ ] **PrivateRoute component**
  - Proteção de rotas
  - Redirect automático

### ✅ Checklist Detalhado - Dia 20-21

#### 📊 Dashboard
- [ ] **Dashboard.jsx**
  - Grid de projetos
  - Criar novo projeto
  - Ações rápidas (editar, deletar, compartilhar)
- [ ] **Project Card component**
  - Preview visual
  - Metadata (data, colaboradores)
  - Menu de ações

### ✅ Checklist Detalhado - Dia 22-23

#### 👥 Sistema de Convites
- [ ] **Modal InviteCollaborator**
  - Input email
  - Seleção de papel
  - Send invite
- [ ] **Lista de colaboradores**
  - Avatar + nome + papel
  - Ações (remover, mudar papel)
- [ ] **Permissions enforcement**
  - Verificações no frontend
  - RLS no backend

---

## 🎨 SPRINT 4: Landing e Polish (Dias 28-34)

### ✅ Checklist Detalhado - Dia 28-29

#### 🏠 Landing Page
- [ ] **Hero Section**
  - Título impactante
  - Subtitle explicativo
  - CTA principal
- [ ] **Features Showcase**
  - Responsabilidades F,B,N,S
  - Chat AI
  - Colaboração
- [ ] **Social Proof**
  - Depoimentos (mock)
  - Logos de empresas

### ✅ Checklist Detalhado - Dia 30-31

#### ⚡ Performance
- [ ] **Lazy loading**
  ```javascript
  const ChatPanel = lazy(() => import('./ChatPanel'));
  ```
- [ ] **Bundle analysis**
  ```bash
  npm run build
  npx vite-bundle-analyzer
  ```
- [ ] **Loading states**
  - Skeletons
  - Spinners
  - Progress bars

---

## 🔄 Comandos de Desenvolvimento

### 📝 Commit Patterns
```bash
# Features
git commit -m "feat: adicionar sistema de responsabilidades F,B,N,S"
git commit -m "feat: implementar chat AI com OpenAI"

# Fixes  
git commit -m "fix: corrigir sincronização de dados"

# Docs
git commit -m "docs: atualizar plano de trabalho"
```

### 🧪 Testing Commands
```bash
# Desenvolvimento
npm run dev

# Build test
npm run build
npm run preview

# Lint
npm run lint

# Supabase types
npx supabase gen types typescript --project-id gfgrxvhpzgbrmsmwfbxf
```

### 📊 Progress Tracking
```bash
# Ver status git
git status

# Ver histórico
git log --oneline -10

# Ver branch atual  
git branch --show-current
```

---

## 🚨 Troubleshooting Guide

### ❌ Problemas Comuns

#### 🔐 Supabase Auth
```javascript
// Se auth não funcionar:
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
console.log('Anon Key:', process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...');
```

#### 🤖 OpenAI API
```javascript
// Se API falhar:
try {
  const response = await openai.chat.completions.create({...});
} catch (error) {
  console.log('OpenAI Error:', error.message);
  // Implementar fallback
}
```

#### 📡 Realtime Issues
```javascript
// Se realtime não sincronizar:
const channel = supabase
  .channel('projetos')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'projetos' 
  }, (payload) => {
    console.log('Realtime update:', payload);
  })
  .subscribe();
```

### 🔧 Recovery Commands
```bash
# Reset para estado limpo
git checkout -- .
git clean -fd

# Resetar node_modules
rm -rf node_modules package-lock.json
npm install

# Resetar branch
git checkout main
git branch -D feature/enhanced-drawdb
git checkout -b feature/enhanced-drawdb
```

---

*Este arquivo será sua referência principal durante todo o desenvolvimento. Sempre consulte antes de iniciar qualquer task!*