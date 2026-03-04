# AGENTS.md

Guia para agentes de IA que irão trabalhar neste repositório.

## 1) Visão Geral

- Projeto: `xango-tests`
- Tipo: aplicação web Next.js para teste de APIs Xango
- Fluxos principais:
  - Consulta única (`/unique`)
  - Processamento em lote (`/batch`)
  - Comparação de CSVs de lotes (`/compare`)
  - Login (`/login`) com NextAuth (provider de credenciais para ambiente de desenvolvimento)

## 2) Stack do Projeto

- Linguagem: TypeScript (`strict: true`)
- Framework: Next.js 16 (App Router)
- UI: React 19, Tailwind CSS v4, shadcn/ui, Radix UI, lucide-react
- Auth: next-auth v4 (sessão JWT)
- Tema: next-themes
- HTTP: `fetch` + `undici`
- Utilitários: `clsx`, `tailwind-merge`, `sonner`
- Lint: ESLint 9 + `eslint-config-next`
- Testes automatizados: **não há suíte configurada atualmente**

## 3) Arquitetura

- `app/`
  - Páginas e rotas (App Router)
  - Endpoints backend em `app/api/*/route.ts`
- `server/`
  - Serviços server-side (integração IAM e builder de requests)
- `components/`
  - `ui/`: componentes base
  - `shared/`, `unique/`, `batch/`, `login/`: componentes de domínio
- `hooks/`: hooks client-side
- `types/`: tipos compartilhados e augmentação de tipos do NextAuth
- `mock/data/`: CSVs de exemplo

Fluxo de chamada principal (consulta):
1. Página client envia requisição para `/api/unique`
2. Route handler monta request com `server/api/registry.ts`
3. Route handler obtém token IAM via `server/auth/iam.ts`
4. API externa é chamada e retorno normalizado em `{ meta, data/error }`

## 4) Padrões de Código

- Preferir componentes funcionais com TypeScript
- Manter separação entre UI (`components`) e integração server-side (`server`)
- Usar alias `@/*` para imports internos
- Evitar `any`; preferir tipos explícitos e unions
- Reutilizar utilitários existentes (`lib/utils.ts`) antes de criar novos
- Manter consistência com padrão atual de formulários e páginas (estrutura em cards + componentes de domínio)

## 5) Como Rodar Localmente

Pré-requisitos:
- Node.js 20+
- npm

Passos:
1. `npm install`
2. Criar `.env.local` com base em `.env.example`
3. `npm run dev`
4. Abrir `http://localhost:3000`

Scripts disponíveis:
- `npm run dev`
- `npm run build`
- `npm start`
- `npm run lint`

## 6) Como Rodar Testes

Atualmente não existe framework de testes automatizados configurado.

Validação mínima obrigatória antes de concluir mudanças:
1. `npm run lint`
2. Smoke test manual das rotas afetadas
3. Se alterar autenticação/API, validar ao menos:
   - login/logout
   - `/api/unique`
   - exportação/importação CSV em `/batch` e `/compare`

## 7) Regras Importantes do Projeto

- Não commitar segredos (`.env.local` já está no `.gitignore`)
- Se adicionar nova env var, atualizar `.env.example` e documentação relevante
- Não quebrar contratos de payload entre UI e `server/api/registry.ts`
- Preservar rotas existentes e comportamento esperado dos fluxos principais
- Mudanças grandes devem manter compatibilidade dos componentes de UI compartilhados

## 8) Convenções de Commit

Seguir padrão observado no histórico: **Conventional Commits**.

Formato:
- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `docs: ...`
- `chore: ...`

Regras:
- Mensagem curta e objetiva
- Um commit por unidade lógica de mudança
- Evitar commits misturando refactor e mudança funcional não relacionada

## 9) Regras para Modificar Código com Segurança

- Nunca logar credenciais, tokens ou dados sensíveis
- Evitar qualquer bypass de TLS fora de contexto estritamente local de desenvolvimento
- Não expor tokens IAM ao frontend sem necessidade explícita e justificativa
- Ao alterar autenticação:
  - validar middleware/proxy e proteção de rotas
  - garantir fluxo de sessão consistente (`next-auth`)
- Ao alterar integrações externas:
  - tratar erro com contexto útil, mas sem vazar segredos
  - manter timeouts/comportamento resiliente quando possível
- Antes de finalizar:
  - rodar lint
  - revisar impactos em `app/api`, `server/*` e componentes consumidores

## 10) Checklist de Entrega para Agentes

1. Mudança implementada com menor impacto possível
2. Tipagem mantida/aperfeiçoada
3. `npm run lint` executado
4. Fluxo afetado validado manualmente
5. Documentação/env atualizadas se necessário
