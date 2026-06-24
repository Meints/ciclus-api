# Ciclus — Plataforma de Gestão de Serviços Recorrentes

SaaS multi-tenant para empresas de serviços recorrentes (climatização, dedetização, limpeza de caixa d'água, manutenção predial, elevadores etc).

---

## 1. Stack

### Backend — `ciclus-api`
| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 22, TypeScript 5 |
| Framework | Fastify 5 |
| ORM | Prisma 7 (PostgreSQL) |
| Auth | JWT (fastify-jwt) + refresh token + bcrypt |
| Validação | Zod 4 |
| PDF | Puppeteer 25 com Chrome → HTML template |
| Email | Resend |
| Storage | Supabase Storage |
| Jobs | node-cron |
| Logger | Pino |

### Frontend — `ciclus-web`
| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) + React 19 |
| Linguagem | TypeScript 5.7 |
| Estilização | Tailwind CSS v4 + tw-animate-css |
| UI | shadcn/ui (Radix primitives) |
| Ícones | lucide-react |
| Estado cliente | Zustand 5 (auth, UI, theme) |
| Estado servidor | TanStack React Query 5 |
| Formulários | react-hook-form + Zod |
| HTTP | Axios (auto-unwrap, 401 → login) |
| Calendário | FullCalendar 6 |
| Date picker | react-day-picker 9 |
| Drag & drop | @dnd-kit |
| Tabelas | @tanstack/react-table |
| Assinatura digital | qrcode.react |
| Notificações | sonner |

---

## 2. Arquitetura

```
[Browser] ←→ Next.js (App Router) ←rewrite /api/*→ [Fastify API] ←→ [PostgreSQL]
                                                     ↕
                                              [Supabase Storage]
                                              [Resend (email)]
                                              [Puppeteer + Chrome (PDF)]
```

- Autenticação: cookie-based JWT + refresh token
- Proxy: `next.config.ts` faz rewrite de `/api/*` para o backend
- Middleware Next.js: protege rotas por role, redireciona não autenticados
- Multi-tenancy: todo recurso escopo por `companyId` extraído do JWT

---

## 3. Modelo de Dados (Prisma)

### Enums
- **ServiceStatus:** `SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED | NOT_FOUND | RESCHEDULED | CONFIRMED`
- **ContractFrequency:** `MONTHLY | BIMONTHLY | QUARTERLY | SEMIANNUAL | YEARLY`
- **ContractStatus:** `ACTIVE | ABOUT_TO_EXPIRE | EXPIRED | CANCELLED | PAUSED`
- **UserRole:** `OWNER | ADMIN | TECHNICIAN`

### Models (8 tabelas)
```
Company (name, document, logoUrl, address, niche, plan, isActive)
  ├── User (name, email, passwordHash, role, isActive) — soft delete
  ├── Employee (name, email, phone, isActive) — soft delete
  ├── Customer (name, document, address, documentType, isActive) — soft delete, unique(companyId, document)
  │     ├── Contract (frequency, amount, startDate, endDate, status) — soft delete
  │     └── Equipment (type, brand, model, location, isActive) — soft delete
  └── Service (serviceNumber, scheduledAt, status, amount, estimatedDurationMinutes, durationMinutes, serviceType, executionNotes, confirmedAt)
        ├── Relaciona: Company, Customer, Contract?, Employee?
        ├── ServiceEquipment (join: serviceId + equipmentId + notes)
        ├── ServicePhoto (url, caption)
        └── Confirmação: confirmationToken (unique), confirmationTokenExpiresAt, confirmedIp, confirmedName, confirmedDocument
  AuditLog (entityType, entityId, action, oldData, newData, userId)
```

### Regras de Negócio no Banco
- `serviceNumber` auto-incremento atômico por company via `UPDATE ... RETURNING`
- Soft delete em Customer, Employee, Equipment, Contract, Service, User + job que limpa registros >90 dias

---

## 4. Rotas da API (Fastify)

### Autenticação — `/auth`
| Método | Rota | Descrição | Rate Limit |
|--------|------|-----------|------------|
| POST | `/login` | Login com email + password | 5/15min |
| POST | `/logout` | Logout, limpa cookie | — |
| GET | `/me` | Dados do usuário logado | — |
| POST | `/refresh` | Renova access token | — |
| POST | `/change-password` | Troca senha | — |
| POST | `/forgot-password` | Envia email de redefinição | 3/60min |
| POST | `/reset-password` | Redefine senha com token | — |

### Empresa — `/company`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Perfil da empresa (documento mascarado para ADMIN) |
| PUT | `/` | Atualizar dados |
| POST | `/logo` | Upload logo (JPEG/PNG/WebP, magic bytes) |
| GET | `/usage` | Métricas de uso do plano |

### Usuários — `/users`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar (filtros: role, isActive) |
| POST | `/` | Criar (OWNER não pode criar OWNER) |
| GET | `/:id` | Detalhe |
| PUT | `/:id` | Atualizar |
| PATCH | `/:id/toggle` | Ativar/desativar |
| DELETE | `/:id` | Remover (protege último OWNER) |

### Clientes — `/customers`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar (search por nome/doc, filtrar isActive) |
| POST | `/` | Criar (documento único por company, CPF/CNPJ validado) |
| GET | `/:id` | Detalhe (dados mascarados para TECHNICIAN) |
| PUT | `/:id` | Atualizar (exceto isActive) |
| PATCH | `/:id/toggle` | Ativar/desativar (standalone, sem body) |
| DELETE | `/:id` | Remover (bloqueado se contracts ativos) |
| POST | `/:id/reveal` | Revelar dados mascarados (auditado) |

### Funcionários — `/employees`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar (com contagem de serviços no mês) |
| POST | `/` | Criar |
| GET | `/:id` | Detalhe |
| PUT | `/:id` | Atualizar (strict: name/email/phone) |
| PATCH | `/:id/toggle` | Ativar/desativar |
| GET | `/:id/services` | Histórico de serviços |
| GET | `/:id/availability` | Slots ocupados em uma data |

### Equipamentos — `/customers/:customerId/equipment`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar |
| POST | `/` | Criar |
| GET | `/:id` | Detalhe |
| PUT | `/:id` | Atualizar |
| PATCH | `/:id/toggle` | Ativar/desativar |
| DELETE | `/:id` | Remover |

### Contratos — `/contracts`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar (filtros: status, customerId, frequency, date) |
| POST | `/` | Criar (auto-gera primeira OS + serviceNumber na transação) |
| GET | `/:id` | Detalhe |
| PUT | `/:id` | Atualizar |
| PATCH | `/:id/cancel` | Cancelar (cancela OSs pendentes) |

### Serviços — `/services`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Listar (filtros: status, employeeId, customerId, date) |
| POST | `/` | Criar (auto-numbering `last_service_number`) |
| GET | `/:id` | Detalhe |
| PUT | `/:id` | Atualizar |
| PATCH | `/:id/start` | Iniciar (SCHEDULED → IN_PROGRESS) |
| PATCH | `/:id/revert` | Reverter (IN_PROGRESS → SCHEDULED) |
| PATCH | `/:id/reopen` | Reabrir (AWAITING_SIGNATURE → IN_PROGRESS) |
| PATCH | `/:id/complete` | Completar (IN_PROGRESS → COMPLETED) |
| PATCH | `/:id/cancel` | Cancelar |
| PATCH | `/:id/reschedule` | Reagendar |
| POST | `/:id/resend-confirmation` | Reenviar token de confirmação |
| POST | `/:id/preview-report` | Preview do PDF (qualquer status) |
| POST | `/:id/generate-pdf` | Gerar PDF final (só COMPLETED) |
| GET | `/:id/report` | URL do relatório |
| POST | `/:id/photos` | Upload de foto (multipart, salva em disco) |
| DELETE | `/:id/photos/:photoId` | Remover foto |
| POST | `/:id/equipment` | Vincular equipamentos |

### Confirmação (público) — `/confirm/:token`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/:token` | Dados da confirmação (valida token/expiry) |
| POST | `/:token` | Confirmar (status → CONFIRMED, regenera PDF) |

### Dashboard — `/dashboard`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/summary` | KPI: customers/contracts/services ativos, faturamento mês, MRR |
| GET | `/upcoming-services` | Próximos serviços (startOfDay hoje) |
| GET | `/expiring-contracts` | Contratos a vencer em 30 dias (startOfDay hoje) |
| GET | `/recent-activity` | Audit logs recentes com descrição legível |
| GET | `/technician-status` | Status dos técnicos (FREE/BUSY/OFFLINE) |
| GET | `/monthly-revenue` | Receita dos últimos 12 meses (raw SQL) |

### LGPD — `/lgpd`
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/export` | Exportar dados pessoais | 1/dia |
| POST | `/consent` | Registrar consentimento |
| GET | `/consent` | Status do consentimento |

---

## 5. Jobs Agendados (node-cron 03:00 BRT)

| Job | Horário | Descrição |
|-----|---------|-----------|
| Gerar serviços recorrentes | 00:01 | Cria OS para todo contrato ACTIVE com `nextServiceDate <= now` |
| Expirar contratos | 01:00 | Marca EXPIRED se `endDate < now`, ABOUT_TO_EXPIRE se ≤7 dias |
| Limpar tokens | 02:00 | Anonimiza IPs >90d, remove tokens expirados |
| Limpar deletados | 03:00 | Remove fisicamente registros com `deletedAt > 90 dias` |

---

## 6. Middleware

| Middleware | Descrição |
|------------|-----------|
| `authorize(OWNER, ADMIN, TECHNICIAN)` | Verifica role do usuário no JWT |
| `tenantGuard()` | Garante `companyId` no contexto e no body |
| `tenantResource(getResource)` | Verifica se recurso pertence à company |

---

## 7. PDF (Ordem de Serviço)

Geração via **Puppeteer** renderizando template HTML (`service-report.html`):
- CSS responsivo A4 com grid, zebrado, cores da marca
- Cabeçalho: logo + dados da empresa
- Tabelas: nº OS, datas, cliente (endereço, CPF/CNPJ, telefone, email)
- Descrição do serviço, equipamentos/materiais, observações
- Totais, garantia (90 dias), assinaturas
- Rodapé com data de emissão
- Dados injetados via `page.evaluate()` → JS `configurarEmpresa()` + `preencherOS()`
- Fallback: serviços não-COMPLETED usam PDFKit (legado)

---

## 8. Frontend — Estrutura de Rotas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/login` | Público | Login |
| `/` | OWNER, ADMIN | Dashboard (KPIs, gráfico receita, agenda, contratos a vencer) |
| `/servicos` | Todos | Lista/kanban de OS com filtros (status, técnico, data, busca) |
| `/servicos/[id]` | Todos | Detalhe da OS, ciclo de vida, confirmação, relatório |
| `/clientes` | OWNER, ADMIN | Lista de clientes |
| `/clientes/[id]` | OWNER, ADMIN | Detalhe do cliente + equipamentos + contratos |
| `/contratos` | OWNER, ADMIN | Lista de contratos |
| `/contratos/[id]` | OWNER, ADMIN | Detalhe do contrato + histórico de OS |
| `/equipe` | OWNER, ADMIN | Lista de funcionários |
| `/configuracoes` | OWNER | Onboarding, nicho, tema |
| `/confirm/[token]` | Público | Confirmação simples (legado) |
| `/confirmar/[token]` | Público | Confirmação completa com assinatura digital |

---

## 9. Frontend — Padrões e Decisões

### Data Flow
```
Page → Hook (useServices) → Service Object (serviceService.list) → Axios (lib/api) → /api/*
                                                                                     ↕
                                                                              TanStack Query (cache, loading, error)
```

### Autenticação
- JWT em cookie (`ciclus_token`) + refresh token
- Next.js Middleware lê cookie, decodifica, verifica role
- `useRequireAuth()` hook protege páginas client-side
- Axios interceptor: 401 → redireciona para `/login`

### Máquina de Estados da OS
```
SCHEDULED → IN_PROGRESS → COMPLETED (sem assinatura) → CONFIRMED (com assinatura)
    ↑           ↓
    └─── revert ───┘
SCHEDULED, IN_PROGRESS → CANCELLED
COMPLETED → AWAITING_SIGNATURE (status COMPLETED + `confirmedAt = null`)
```

### DatePicker
- Componente compartilhado (`date-picker.tsx`): Popover + react-day-picker + botão limpar (X)
- Auto-close ao selecionar, controle de estado open/close
- Mês capitalizado (Junho 2026) via custom `MonthCaption`
- CSS com `::first-letter` uppercase, hover fix para data selecionada
- Feed de datas: `YYYY-MM-DD` (parse via `parseDateOnly` no backend = meio-dia UTC)

### Kanban
- `@dnd-kit` para drag-and-drop entre colunas: Agendado → Em andamento → Aguardando assinatura → Concluído / Cancelado
- Filtro padrão: semana atual (segunda a domingo) para não poluir
- DatePicker de filtro substitui a semana padrão

### Tratamento de Datas
- Backend: `parseDateOnly()` → `new Date("YYYY-MM-DDT12:00:00.000Z")` (meio-dia UTC)
- Evita off-by-one-day devido a timezone
- Dashboard queries usam `startOfDay(new Date())`

### Máscaras (PT-BR)
- CPF: `XXX.XXX.XXX-XX`
- CNPJ: `XX.XXX.XXX/XXXX-XX`
- Telefone: `(XX) X XXXX-XXXX`
- CEP: `XXXXX-XXX`
- Dados sensíveis mascarados para role TECHNICIAN

---

## 10. Integrações

| Integração | Finalidade | Status |
|------------|-----------|--------|
| Resend | Email transacional (reset de senha) | ✅ |
| Supabase Storage | Upload de fotos e relatórios PDF | ✅ |
| Puppeteer + Chrome | Geração de PDF | ✅ |
| Z-API (WhatsApp) | Configurado no env, sem uso no código | 🔧 Aguardando implementação |

---

## 11. O que Falta / Pendências

### Funcionalidades não implementadas
- **Planos/assinaturas:** `Company.plan` existe mas sem lógica de cobrança, upgrade, trial
- **Z-API/WhatsApp:** Configurado no .env, service não chamado em nenhum fluxo (notificações de OS, lembrete)
- **Relatório financeiro:** Não há extrato, contas a pagar/receber, DRE
- **Notificações push:** Sem sistema de notificações in-app
- **Audit log UI:** Tabela de audit_logs no banco, mas sem página frontend para visualização
- **Múltiplos endereços por cliente:** Customer.address é um único JSON
- **Múltiplos contatos por cliente:** Sem tabela de contatos secundários
- **Recorrência avançada:** Contract.frequency é enum fixo; não permite custom (ex.: "a cada 15 dias")
- **Faturamento/NFe:** Sem integração fiscal
- **App mobile:** Sem aplicativo nativo (apenas web responsivo)

### Melhorias identificadas
- Validação de conflito de agenda desabilitada (datas não têm hora)
- Testes automatizados: não há testes (unitários, integração, e2e)
- Tratamento de erros: erros não mapeados retornam 500 sem detalhes em produção
- Loading states: algumas páginas sem feedback de carregamento
- Onboarding: fluxo de primeira configuração minimalista
- Imagens/favicon: `public/` vazio
- Documentação: apenas este README
- CI/CD: não configurado

### Componentes com gaps visuais conhecidos
- Kanban: ao arrastar entre colunas, sem animação de feedback visual do drop zone
- Tabelas: sem colunas reordenáveis ou redimensionáveis
- Calendário FullCalendar: sem integração com drag-and-drop para criar OS
- Signature pad: funcionalidade básica sem suporte a touch multi-touch em dispositivos móveis

---

## 12. Variáveis de Ambiente

### Backend (`.env`)
```env
NODE_ENV=development
PORT=3333
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=<32+ chars>
JWT_EXPIRES_IN=604800
COOKIE_SECRET=<32+ chars>
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3333
API_URL=http://localhost:3333
```

---

## 13. Comandos

### Backend
```bash
npm run dev           # Desenvolvimento com hot-reload
npm run build         # Build produção (tsup)
npm run start         # Iniciar produção
npm run prisma:migrate  # Rodar migrations
npm run prisma:generate # Gerar Prisma client
npm run prisma:studio   # Abrir Prisma Studio
npm run lint          # ESLint
```

### Frontend
```bash
npm run dev           # Next.js dev server (porta 3000)
npm run build         # Build produção
npm run start         # Iniciar produção
npm run lint          # ESLint
```
