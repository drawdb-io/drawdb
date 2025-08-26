# PRD - Enhanced DrawDB
## Product Requirements Document

### 1. Visão Geral do Produto

**Nome do Produto:** Enhanced DrawDB  
**Versão:** 2.0  
**Data:** 2025-08-25  

#### 1.1 Visão
Criar uma ferramenta colaborativa de modelagem de banco de dados com IA integrada, focada em equipes de desenvolvimento, oferecendo identificação de responsabilidades por campo e integração direta com Supabase.

#### 1.2 Missão
Facilitar o desenvolvimento colaborativo através de uma ferramenta intuitiva que conecta design de banco de dados, responsabilidades de equipe e implementação automatizada.

### 2. Objetivos do Produto

#### 2.1 Objetivos Primários
- Implementar sistema de identificação de responsabilidades por campo (F, B, N, S)
- Integrar chat AI com OpenAI para criação automatizada de tabelas
- Adicionar sistema de autenticação e colaboração
- Implementar persistência no Supabase com controle de projetos

#### 2.2 Objetivos Secundários
- Melhorar UX da landing page
- Otimizar performance da aplicação
- Expandir funcionalidades de export/import

### 3. Funcionalidades Detalhadas

#### 3.1 Sistema de Identificação de Responsabilidades
**Prioridade:** Alta  
**Complexidade:** Média  

**Especificações:**
- Dropdown em cada campo da tabela com opções: F (Frontend), B (Backend), N (n8n), S (Supabase)
- Visualização das letras ao lado do nome do campo nas tabelas do canvas
- Cores distintas para cada responsabilidade:
  - F (Frontend): #3B82F6 (azul)
  - B (Backend): #10B981 (verde)
  - N (n8n): #F59E0B (amarelo)
  - S (Supabase): #8B5CF6 (roxo)
- Tabelas responsivas que se ajustam ao conteúdo
- Persistência das configurações de responsabilidade

**Critérios de Aceitação:**
- [ ] Dropdown funcional em cada campo
- [ ] Visualização correta no canvas
- [ ] Cores aplicadas corretamente
- [ ] Responsividade mantida
- [ ] Dados salvos corretamente

#### 3.2 Chat AI Integrado
**Prioridade:** Alta  
**Complexidade:** Alta  

**Especificações:**
- Interface de chat integrada na sidebar
- Configuração de API Key OpenAI
- Configuração MCP Supabase
- Processamento de linguagem natural para criação de tabelas
- Preview das criações antes da execução
- Sistema de aprovação/rejeição
- Criação automática de relacionamentos
- Integração com contexto atual do diagrama

**Critérios de Aceitação:**
- [ ] Interface de chat funcional
- [ ] Configuração de APIs
- [ ] Processamento de comandos em português
- [ ] Preview das alterações
- [ ] Criação automática no canvas
- [ ] Relacionamentos corretos
- [ ] Integração MCP Supabase

#### 3.3 Sistema de Autenticação e Projetos
**Prioridade:** Alta  
**Complexidade:** Alta  

**Especificações:**
- Autenticação via Supabase Auth
- CRUD de projetos
- Sistema de permissões (owner, editor, viewer)
- Compartilhamento por convite
- Sincronização em tempo real
- Versionamento básico
- Backup automático

**Critérios de Aceitação:**
- [ ] Sistema de login/registro
- [ ] Gerenciamento de projetos
- [ ] Permissões funcionando
- [ ] Compartilhamento ativo
- [ ] Sync em tempo real
- [ ] Dados persistentes no Supabase

#### 3.4 Nova Landing Page
**Prioridade:** Média  
**Complexidade:** Baixa  

**Especificações:**
- Design moderno e responsivo
- Showcase das novas funcionalidades
- Call-to-action para registro/login
- Seção de benefícios para equipes
- Demonstração visual das funcionalidades

### 4. Arquitetura Técnica

#### 4.1 Stack Tecnológico
- **Frontend:** React 18 + Vite (mantido)
- **UI:** @douyinfe/semi-ui + TailwindCSS (mantido)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **IA:** OpenAI GPT-4o-mini via API
- **MCP:** Supabase MCP Server
- **Estado:** React Context (expandido)

#### 4.2 Novos Contextos Necessários
- **AuthContext** - Gerenciamento de autenticação
- **ProjectsContext** - Gerenciamento de projetos
- **AIContext** - Integração com IA e MCP
- **CollaborationContext** - Colaboração em tempo real

#### 4.3 Estrutura de Dados Supabase

```sql
-- Usuários (via Supabase Auth)

-- Projetos
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  diagram_data JSONB,
  is_public BOOLEAN DEFAULT FALSE
);

-- Permissões de Projeto
CREATE TABLE project_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role VARCHAR CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico/Versionamento
CREATE TABLE project_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Fases de Desenvolvimento

#### Fase 1: Base e Responsabilidades (2-3 semanas)
- [ ] Setup Supabase
- [ ] Sistema de responsabilidades (F, B, N, S)
- [ ] Ajustes visuais nas tabelas
- [ ] Testes básicos

#### Fase 2: IA e Chat (3-4 semanas)
- [ ] Interface do chat
- [ ] Integração OpenAI
- [ ] Processamento de comandos
- [ ] Sistema de preview
- [ ] MCP Supabase

#### Fase 3: Autenticação e Colaboração (3-4 semanas)
- [ ] Sistema de auth
- [ ] CRUD projetos
- [ ] Permissões
- [ ] Sync tempo real

#### Fase 4: Landing Page e Polish (1-2 semanas)
- [ ] Nova landing page
- [ ] Melhorias UX
- [ ] Otimizações
- [ ] Documentação

### 6. Métricas de Sucesso

#### 6.1 Técnicas
- Tempo de resposta < 2s para operações comuns
- 99% uptime do sistema
- Sync em tempo real < 500ms

#### 6.2 Produto
- Redução de 50% no tempo de modelagem
- Aumento de 80% na colaboração entre equipes
- 90% satisfação dos usuários

### 7. Riscos e Mitigações

#### 7.1 Riscos Técnicos
- **Complexidade da IA:** Implementar por etapas, começar simples
- **Performance:** Otimizar desde o início, usar lazy loading
- **Realtime:** Implementar debounce e throttling

#### 7.2 Riscos de Produto
- **Adoção:** Manter compatibilidade com versão atual
- **Custos API:** Implementar rate limiting e caching

### 8. Próximos Passos

1. **Validação:** Review e aprovação do PRD
2. **Setup:** Configurar ambiente Supabase
3. **Prototipagem:** Criar mockups das novas interfaces
4. **Desenvolvimento:** Iniciar Fase 1

---

**Observações:**
- Este documento é vivo e será atualizado conforme o desenvolvimento
- Feedback da equipe deve ser incorporado regularmente
- Testes devem ser realizados em cada fase