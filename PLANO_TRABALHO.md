# 🚀 Plano de Trabalho Detalhado - Enhanced DrawDB

## 📋 Status Atual do Projeto

### ✅ Infraestrutura Existente (PERFEITA!)
O Supabase já está configurado com uma estrutura excelente em português:

**Tabelas Existentes:**
- `projetos` - Armazena diagramas com JSONB
- `colaboradores_projeto` - Sistema de colaboração
- `versoes_projeto` - Versionamento completo
- `compartilhamentos_projeto` - Links de compartilhamento
- **RLS habilitado** em todas as tabelas
- **4 migrations** já aplicadas

### 🎯 Gap Analysis
O que já temos vs o que precisamos:

| Funcionalidade | Status Atual | Precisa |
|---|---|---|
| 🏗️ Estrutura DB | ✅ Completa | Nada |
| 🔐 Autenticação | ✅ Configurada | Integração Frontend |
| 📊 Projetos | ✅ Tabela pronta | CRUD Frontend |
| 👥 Colaboração | ✅ Tabela pronta | Interface UI |
| 🏷️ Responsabilidades F,B,N,S | ❌ Não existe | **CRIAR TUDO** |
| 🤖 Chat AI | ❌ Não existe | **CRIAR TUDO** |
| 🎨 Nova Landing Page | ❌ Não existe | **CRIAR TUDO** |

---

## 🗓️ CRONOGRAMA DETALHADO - 4 SPRINTS

### 📅 SPRINT 1: Base e Responsabilidades (7 dias)
**Objetivo:** Implementar sistema F,B,N,S e conectar com Supabase

#### 🎯 Dia 1: Setup e Configuração
- [ ] **Configurar variáveis de ambiente Supabase**
  - Arquivo: `.env` 
  - Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] **Instalar dependências Supabase**
  - `npm install @supabase/supabase-js`
- [ ] **Criar client Supabase**
  - Arquivo: `src/lib/supabase.js`
- [ ] **Setup de tipos TypeScript (opcional)**
  - Gerar tipos: `npx supabase gen types typescript`

#### 🎯 Dia 2: Contextos de Autenticação
- [ ] **Criar AuthContext**
  - Arquivo: `src/context/AuthContext.jsx`
  - Funções: login, logout, signup, user state
- [ ] **Criar ProjectsContext** 
  - Arquivo: `src/context/ProjectsContext.jsx`
  - CRUD completo de projetos
- [ ] **Integrar contextos no App.jsx**

#### 🎯 Dia 3: Sistema de Responsabilidades - Backend
- [ ] **Modificar estrutura de dados**
  - Atualizar JSONB `dados_diagrama` para incluir responsabilidades
  - Esquema: `{ tables: [{ fields: [{ name, type, responsibility: "F|B|N|S" }] }] }`
- [ ] **Criar migration (se necessário)**
- [ ] **Testar persistência no Supabase**

#### 🎯 Dia 4: Sistema de Responsabilidades - Frontend
- [ ] **Modificar TableField component**
  - Arquivo: `src/components/EditorSidePanel/TablesTab/TableField.jsx`
  - Adicionar dropdown F,B,N,S
- [ ] **Atualizar DiagramContext**
  - Incluir responsabilidades nas operações
- [ ] **Criar constantes de cores**
  - Arquivo: `src/data/constants.js`
  - Cores: F=#3B82F6, B=#10B981, N=#F59E0B, S=#8B5CF6

#### 🎯 Dia 5: Visualização no Canvas
- [ ] **Modificar Table component**
  - Arquivo: `src/components/EditorCanvas/Table.jsx`
  - Mostrar letras F,B,N,S ao lado dos campos
- [ ] **Implementar responsividade**
  - Ajustar largura das tabelas automaticamente
  - Garantir que letras sempre ficam visíveis
- [ ] **Aplicar cores das responsabilidades**

#### 🎯 Dia 6: Persistência e Sincronização
- [ ] **Conectar save/load com Supabase**
  - Modificar `src/context/SaveStateContext.jsx`
  - Substituir IndexedDB por Supabase (manter como fallback)
- [ ] **Implementar auto-save**
  - Debounce de 2 segundos
- [ ] **Testar sincronização**

#### 🎯 Dia 7: Testes e Ajustes Sprint 1
- [ ] **Testes manuais completos**
- [ ] **Correção de bugs**
- [ ] **Documentar no DEVELOPMENT_LOG.md**
- [ ] **Demo Sprint 1**

---

### 📅 SPRINT 2: Chat AI e MCP (10 dias)
**Objetivo:** Implementar chat com IA para criação automática de tabelas

#### 🎯 Dia 8-9: Interface do Chat
- [ ] **Criar ChatContext**
  - Arquivo: `src/context/ChatContext.jsx`
  - Estado: messages, typing, config
- [ ] **Criar componente Chat**
  - Arquivo: `src/components/Chat/ChatPanel.jsx`
  - Interface estilo ChatGPT integrada na sidebar
- [ ] **Configuração de API Keys**
  - Modal para configurar OpenAI API Key
  - Armazenar de forma segura (localStorage criptografado)

#### 🎯 Dia 10-11: Integração OpenAI
- [ ] **Instalar dependências AI**
  - `npm install openai`
- [ ] **Criar serviço OpenAI**
  - Arquivo: `src/services/openai.js`
  - Funções: sendMessage, parseTableCreation
- [ ] **Implementar processamento de linguagem natural**
  - Prompt engineering para criação de tabelas
  - Parsing das respostas da IA

#### 🎯 Dia 12-13: Sistema de Preview
- [ ] **Criar interface de aprovação**
  - Componente: `src/components/Chat/PreviewModal.jsx`
  - Mostrar tabelas que serão criadas
  - Botões: Aprovar, Rejeitar, Modificar
- [ ] **Implementar criação no canvas**
  - Integrar com DiagramContext
  - Posicionamento inteligente das tabelas
  - Criação de relacionamentos automáticos

#### 🎯 Dia 14-15: MCP Supabase
- [ ] **Estudar MCP Supabase disponível**
  - Verificar funcionalidades disponíveis
  - Testar comandos básicos
- [ ] **Integrar MCP no chat**
  - Comandos: "criar tabelas no supabase"
  - Confirmação antes de executar
- [ ] **Implementar feedback visual**
  - Status das operações MCP
  - Logs de execução

#### 🎯 Dia 16-17: Refinamentos e Testes
- [ ] **Melhorar prompts da IA**
  - Testes com diferentes tipos de solicitações
  - Refinamento das respostas
- [ ] **Implementar rate limiting**
  - Controle de custos API
- [ ] **Testes completos Sprint 2**
- [ ] **Documentação e demo**

---

### 📅 SPRINT 3: Autenticação e Colaboração (10 dias)
**Objetivo:** Sistema completo de usuários e colaboração em tempo real

#### 🎯 Dia 18-19: Sistema de Autenticação
- [ ] **Criar páginas de auth**
  - `src/pages/Login.jsx`
  - `src/pages/Register.jsx`
  - `src/pages/ForgotPassword.jsx`
- [ ] **Integrar Supabase Auth**
  - Email/password
  - Providers sociais (opcional)
- [ ] **Proteção de rotas**
  - PrivateRoute component
  - Redirects automáticos

#### 🎯 Dia 20-21: CRUD de Projetos
- [ ] **Dashboard de projetos**
  - `src/pages/Dashboard.jsx`
  - Listar, criar, editar, deletar projetos
- [ ] **Modal de criação de projeto**
  - Nome, descrição, visibilidade
- [ ] **Integração com editor**
  - Carregar projeto selecionado
  - Auto-save no projeto atual

#### 🎯 Dia 22-23: Sistema de Colaboração
- [ ] **Interface de convites**
  - Modal para convidar colaboradores
  - Lista de colaboradores atuais
  - Gerenciar permissões (visualizador, editor, administrador)
- [ ] **Implementar permissões**
  - Verificações no frontend
  - Enforcement via RLS no Supabase
- [ ] **Compartilhamento público**
  - Links de compartilhamento
  - Visualização sem login

#### 🎯 Dia 24-25: Colaboração em Tempo Real
- [ ] **Implementar Supabase Realtime**
  - Subscriptions nas tabelas de projetos
  - Updates em tempo real
- [ ] **Indicadores visuais**
  - Cursors de outros usuários
  - Indicação de quem está editando
- [ ] **Resolução de conflitos**
  - Last-write-wins com avisos
  - Merge inteligente quando possível

#### 🎯 Dia 26-27: Versionamento
- [ ] **Interface de versões**
  - Lista de versões no projeto
  - Comparar versões
  - Restaurar versão anterior
- [ ] **Auto-versionamento**
  - Versão automática a cada X alterações
  - Resumo automático das mudanças
- [ ] **Testes e refinamentos Sprint 3**

---

### 📅 SPRINT 4: Landing Page e Finalização (7 dias)
**Objetivo:** Nova landing page e polish final

#### 🎯 Dia 28-29: Nova Landing Page
- [ ] **Design responsivo**
  - Hero section moderna
  - Showcase das funcionalidades
  - Depoimentos (mock inicial)
- [ ] **Seções principais**
  - Benefícios para equipes
  - Comparativo com concorrentes
  - Pricing (se aplicável)
- [ ] **Call-to-actions**
  - Registro/Login
  - Demo interativo

#### 🎯 Dia 30-31: Otimizações
- [ ] **Performance**
  - Lazy loading de componentes
  - Otimização de re-renders
  - Bundle size analysis
- [ ] **UX/UI Polish**
  - Loading states
  - Error boundaries
  - Toasts e feedbacks
  - Micro-interactions

#### 🎯 Dia 32-34: Testes Finais e Deploy
- [ ] **Testes completos**
  - User acceptance testing
  - Performance testing
  - Security review
- [ ] **Documentação final**
  - README atualizado
  - Guia de usuário
  - API documentation
- [ ] **Preparação para produção**
  - Environment variables
  - Error monitoring
  - Analytics

---

## 🛠️ GUIA DE RETOMADA

### 📁 Estrutura de Arquivos Importantes

```
src/
├── context/
│   ├── AuthContext.jsx           # ✅ Criar Sprint 1
│   ├── ProjectsContext.jsx       # ✅ Criar Sprint 1
│   ├── ChatContext.jsx           # ✅ Criar Sprint 2
│   └── CollaborationContext.jsx  # ✅ Criar Sprint 3
├── components/
│   ├── Chat/
│   │   ├── ChatPanel.jsx         # ✅ Criar Sprint 2
│   │   └── PreviewModal.jsx      # ✅ Criar Sprint 2
│   ├── Auth/                     # ✅ Criar Sprint 3
│   └── Dashboard/                # ✅ Criar Sprint 3
├── services/
│   ├── openai.js                 # ✅ Criar Sprint 2
│   └── supabase.js               # ✅ Criar Sprint 1
└── lib/
    └── supabase.js               # ✅ Criar Sprint 1
```

### 🔄 Como Retomar o Trabalho

1. **Verificar Sprint atual** no DEVELOPMENT_LOG.md
2. **Ler último commit** para contexto
3. **Executar `npm run dev`** para testar estado atual
4. **Verificar todos os TODOs** no código
5. **Continuar da próxima task** não concluída

### 📊 Comandos Úteis

```bash
# Desenvolvimento
npm run dev
npm run build
npm run lint

# Supabase
npx supabase gen types typescript --project-id gfgrxvhpzgbrmsmwfbxf

# Git
git status
git add .
git commit -m "feat: [descrição]"
git push origin feature/enhanced-drawdb
```

### 🎯 Métricas de Sucesso por Sprint

**Sprint 1:**
- [ ] Sistema F,B,N,S funcionando 100%
- [ ] Tabelas responsivas com cores
- [ ] Sincronização com Supabase

**Sprint 2:**
- [ ] Chat funcional com IA
- [ ] Criação automática de tabelas
- [ ] MCP Supabase integrado

**Sprint 3:**
- [ ] Login/registro funcionando
- [ ] Colaboração em tempo real
- [ ] Permissões corretas

**Sprint 4:**
- [ ] Landing page moderna
- [ ] Performance otimizada
- [ ] Pronto para produção

---

## 🚨 Pontos de Atenção

### ⚠️ Riscos Técnicos
1. **Custos da OpenAI API** - Implementar rate limiting desde o início
2. **Performance com Realtime** - Usar debounce/throttling
3. **Conflitos de sincronização** - Implementar merge strategies
4. **Segurança das API Keys** - Nunca expor no frontend

### 🔧 Dependências Críticas
- Supabase client configurado corretamente
- MCP Supabase funcionando
- OpenAI API com créditos disponíveis
- RLS policies testadas

### 📝 Documentação Obrigatória
- Atualizar DEVELOPMENT_LOG.md a cada sessão
- Documentar decisões técnicas importantes
- Manter PRD.md atualizado com mudanças
- Screenshots das principais funcionalidades

---

*Este plano será atualizado conforme o progresso. Sempre consultar antes de iniciar uma sessão de desenvolvimento.*