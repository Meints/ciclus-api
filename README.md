# Ciclus API

API para gestão de empresas de serviços recorrentes — plataforma SaaS que organiza contratos, ordens de serviço, clientes e equipes técnicas.

> **Status:** Projeto em fase inicial de desenvolvimento. Schema do banco completo e estrutura de plugins montada. Rotas de negócio ainda não implementadas.

---

## Índice

- [Stack](#stack)
- [Estrutura do Projeto](#estrutura-do-projeto)
  - [Raiz](#raiz)
  - [src/ — Código Fonte](#src--código-fonte)
  - [prisma/ — Banco de Dados](#prisma--banco-de-dados)
  - [generated/prisma/ — Cliente Prisma Gerado](#generatedprisma--cliente-prisma-gerado)
- [Modelo de Dados](#modelo-de-dados)
  - [Enums](#enums)
  - [Entidades](#entidades)
  - [Relacionamentos](#relacionamentos)
- [Plugins do Fastify](#plugins-do-fastify)
- [Rotas](#rotas)
- [Configuração de Ambiente](#configuração-de-ambiente)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Ferramentas e Configurações](#ferramentas-e-configurações)
  - [TypeScript](#typescript)
  - [ESLint](#eslint)
  - [Prettier](#prettier)
  - [Husky + Commitlint](#husky--commitlint)
  - [Prisma Config](#prisma-config)
- [Seed](#seed)
- [Como Rodar](#como-rodar)
- [Repositório](#repositório)

---

## Stack

| Categoria         | Tecnologia                                               |
| ----------------- | -------------------------------------------------------- |
| Runtime           | Node.js com TypeScript                                   |
| Framework         | Fastify 5                                                |
| Banco de Dados    | PostgreSQL (Supabase) via Prisma 7.8                     |
| Autenticação      | JWT (stateless) + bcrypt + cookies assinados             |
| Validação         | Zod 4                                                    |
| ORM               | Prisma 7.8 (com `@prisma/adapter-pg`)                    |
| Documentação      | Swagger / OpenAPI (rota `/docs` apenas em dev)           |
| Logger            | Pino + pino-pretty (dev)                                 |
| Build             | tsup                                                     |
| Dev Server        | tsx watch                                                |

---

## Estrutura do Projeto

```
ciclus-api/
├── .env                       # Variáveis de ambiente (real, gitignorado)
├── .env.example               # Template das variáveis de ambiente
├── .gitignore                 # node_modules, /generated/prisma, .env
├── .husky/
│   ├── commit-msg             # Hook: valida mensagem de commit
│   ├── pre-commit             # Hook: roda lint antes de commitar
│   └── _/                     # Stubs internos do Husky
├── commitlint.config.cjs      # Config Conventional Commits
├── eslint.config.js           # ESLint flat config (Prettier + ignores)
├── package.json               # Dependências e scripts
├── prisma.config.ts           # Config do Prisma ORM (schema, migrations, seed)
├── tsconfig.json              # TypeScript strict config
├── prisma/
│   ├── schema.prisma          # Schema completo com 7 modelos e 4 enums
│   ├── seed.ts                # Seed inicial (Ciclus + 3 owners)
│   └── migrations/
│       └── 20260612212400_init/
│           ├── migration.sql  # DDL com todas as tabelas, índices, FKs
│           └── migration_lock.toml
├── src/
│   ├── server.ts              # Entry point
│   ├── app.ts                 # Factory do Fastify
│   ├── config/
│   │   ├── env.ts             # Validação de env vars com Zod
│   │   ├── logger.ts          # Config do Pino
│   │   └── prisma.ts          # Instância do PrismaClient
│   ├── plugins/
│   │   ├── cookie.ts          # @fastify/cookie
│   │   ├── cors.ts            # @fastify/cors
│   │   ├── helmet.ts          # @fastify/helmet
│   │   ├── jwt.ts             # @fastify/jwt + decorator authenticate
│   │   ├── rate-limit.ts      # @fastify/rate-limit
│   │   └── swagger.ts         # @fastify/swagger + swagger-ui
│   └── routes/
│       └── health.route.ts    # GET /health
└── generated/prisma/          # Cliente Prisma gerado (gitignored)
    ├── index.ts
    ├── client.ts
    ├── browser.ts
    ├── models.ts
    ├── enums.ts
    ├── commonInputTypes.ts
    ├── default.js
    ├── models/
    │   ├── Company.ts
    │   ├── User.ts
    │   ├── Employee.ts
    │   ├── Customer.ts
    │   ├── Contract.ts
    │   ├── Service.ts
    │   └── AuditLog.ts
    └── internal/
        ├── class.ts
        ├── prismaNamespace.ts
        └── prismaNamespaceBrowser.ts
```

---

### src/ — Código Fonte

#### `src/server.ts`
Entry point. Carrega `dotenv`, chama `buildApp()` e sobe o servidor em `0.0.0.0:{PORT}`.

#### `src/app.ts`
Factory que cria a instância do Fastify com logger e registra todos os plugins e rotas:
1. `cookiePlugin` — assinatura de cookies
2. `jwtPlugin` — autenticação JWT (deve vir antes de cors/helmet para funcionar corretamente)
3. `corsPlugin` — CORS configurável
4. `helmetPlugin` — headers de segurança
5. `rateLimitPlugin` — rate limiting
6. `swaggerPlugin` — documentação Swagger (apenas em dev)
7. `healthRoute` — health check

#### `src/config/env.ts`
Validação de variáveis de ambiente com `@t3-oss/env-core` + Zod:

| Variável                | Tipo        | Padrão               | Descrição                          |
| ----------------------- | ----------- | -------------------- | ---------------------------------- |
| `NODE_ENV`              | enum        | `development`        | development \| test \| production  |
| `PORT`                  | número      | `3333`               | Porta do servidor                  |
| `DATABASE_URL`          | URL         | —                    | URL do banco (com PgBouncer)       |
| `DIRECT_URL`            | URL         | —                    | URL direta do banco (migrations)   |
| `JWT_SECRET`            | string (32+) | —                   | Chave JWT (mín. 32 caracteres)     |
| `JWT_EXPIRES_IN`        | número      | `86400`              | Expiração JWT em segundos (1 dia)  |
| `COOKIE_SECRET`          | string (32+) | —                   | Chave cookies (mín. 32 caracteres) |
| `CORS_ORIGIN`           | URL         | —                    | Origem permitida CORS              |
| `RATE_LIMIT_MAX`        | número      | `100`                | Máximo de requisições             |
| `RATE_LIMIT_TIME_WINDOW`| número      | `60000`              | Janela de rate limit em ms         |
| `LOG_LEVEL`             | enum        | `info`               | trace \| debug \| info \| warn \| error \| fatal |

#### `src/config/logger.ts`
Usa `pino-pretty` com colorização em desenvolvimento, JSON puro em produção.

#### `src/config/prisma.ts`
Instância do `PrismaClient` usando `PrismaPg` adapter (com `@prisma/adapter-pg`).

#### `src/plugins/`
Todos os plugins usam `fastify-plugin` (encapsulamento quebrado) e registram no escopo raiz.

| Plugin    | Arquivo        | Funcionalidade                                           |
| --------- | -------------- | -------------------------------------------------------- |
| Cookie    | `cookie.ts`    | `@fastify/cookie` com `secret` do env, hook `onRequest` |
| CORS      | `cors.ts`      | `@fastify/cors` com `origin` e `credentials: true`       |
| Helmet    | `helmet.ts`    | `@fastify/helmet`; CSP desligado em dev para Swagger     |
| JWT       | `jwt.ts`       | `@fastify/jwt` com cookie `token` assinado + decorator `authenticate` |
| Rate Limit| `rate-limit.ts`| `@fastify/rate-limit` com key por `userId` ou IP         |
| Swagger   | `swagger.ts`   | `@fastify/swagger` + `swagger-ui` em `/docs` (só dev)   |

**Detalhe do JWT** (`src/plugins/jwt.ts`):
- Payload tipado: `{ sub: userId, companyId, role: OWNER | ADMIN | TECHNICIAN }`
- Cookie: nome `token`, assinado (signed)
- Decorator `app.authenticate`: preHandler que verifica JWT e retorna 401 se inválido
- Type augmentation em `@fastify/jwt` e `fastify`

**Detalhe do Rate Limit** (`src/plugins/rate-limit.ts`):
- Key generator: usa `request.user.sub` se autenticado, fallback para `request.ip`

#### `src/routes/health.route.ts`

**GET /health**
```json
// 200
{ "status": "ok", "uptime": 123, "timestamp": "2026-06-18T...", "database": "connected" }

// 503
{ "status": "unhealthy", "uptime": 123, "timestamp": "2026-06-18T...", "database": "disconnected" }
```
- Executa `SELECT 1` no banco via Prisma (`$queryRawUnsafe`)
- Retorna `uptime` desde o start do servidor (variável `startTime` no módulo)

---

### prisma/ — Banco de Dados

#### `prisma/schema.prisma`

**Provider:** PostgreSQL  
**Generator:** `prisma-client` com output em `../generated/prisma`  
**Datasource:** `postgresql` (URL vinda do `prisma.config.ts` que usa `DIRECT_URL`)

#### `prisma.config.ts`
```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: process.env["DIRECT_URL"]! },
});
```
A migration usa a `DIRECT_URL` (conexão direta, sem PgBouncer) enquanto a aplicação usa `DATABASE_URL` (com PgBouncer via Supabase pooler).

---

## Modelo de Dados

### Enums

| Enum                | Valores                                                    |
| ------------------- | ---------------------------------------------------------- |
| `ContractFrequency` | `MONTHLY`, `BIMONTHLY`, `QUARTERLY`, `SEMIANNUAL`, `YEARLY` |
| `ContractStatus`    | `ACTIVE`, `ABOUT_TO_EXPIRE`, `EXPIRED`, `CANCELLED`, `PAUSED` |
| `ServiceStatus`     | `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NOT_FOUND`, `RESCHEDULED` |
| `UserRole`          | `OWNER`, `ADMIN`, `TECHNICIAN`                             |

### Entidades

#### Company (`companies`)
| Campo               | Tipo     | Mapeado como       | Descrição                    |
| ------------------- | -------- | ------------------ | ---------------------------- |
| id                  | String   | —                  | UUID PK                      |
| name                | String   | —                  | Nome da empresa              |
| document            | String?  | —                  | CNPJ/CPF                     |
| logoUrl             | String?  | `logo_url`         | URL do logo                  |
| lastServiceNumber   | Int      | `last_service_number` | Último número de OS usado |
| createdAt           | DateTime | `created_at`       | —                            |
| updatedAt           | DateTime | `updated_at`       | —                            |
| **Índice:** `document`                                                                   |
| **Relações:** users, customers, contracts, services, auditLogs, employees               |

#### User (`users`)
| Campo         | Tipo     | Mapeado como   | Descrição                 |
| ------------- | -------- | -------------- | ------------------------- |
| id            | String   | —              | UUID PK                   |
| companyId     | String   | `company_id`   | FK → companies            |
| name          | String   | —              | Nome                      |
| email         | String   | —              | **Unique**                |
| passwordHash  | String   | `password_hash`| Hash bcrypt               |
| role          | UserRole | —              | Default: `OWNER`          |
| createdAt     | DateTime | `created_at`   | —                         |
| updatedAt     | DateTime | `updated_at`   | —                         |
| **Índices:** `company_id`, `email` (unique)                                            |
| **Relações:** company, auditLogs                                                       |

#### Employee (`employees`)
| Campo     | Tipo      | Mapeado como | Descrição            |
| --------- | --------- | ------------ | -------------------- |
| id        | String    | —            | UUID PK              |
| companyId | String    | `company_id` | FK → companies       |
| name      | String    | —            | Nome                 |
| email     | String?   | —            | —                    |
| phone     | String?   | —            | —                    |
| isActive  | Boolean   | `is_active`  | Default: `true`      |
| createdAt | DateTime  | `created_at` | —                    |
| updatedAt | DateTime  | `updated_at` | —                    |
| deletedAt | DateTime? | `deleted_at` | Soft delete          |
| **Índices:** `company_id`                                                              |
| **Relações:** company, services                                                        |

#### Customer (`customers`)
| Campo     | Tipo      | Mapeado como | Descrição               |
| --------- | --------- | ------------ | ----------------------- |
| id        | String    | —            | UUID PK                 |
| companyId | String    | `company_id` | FK → companies          |
| name      | String    | —            | Nome                    |
| email     | String?   | —            | —                       |
| phone     | String?   | —            | —                       |
| document  | String?   | —            | CPF/CNPJ                |
| address   | String?   | —            | Endereço                |
| notes     | String?   | —            | Observações             |
| isActive  | Boolean   | `is_active`  | Default: `true`         |
| createdAt | DateTime  | `created_at` | —                       |
| updatedAt | DateTime  | `updated_at` | —                       |
| deletedAt | DateTime? | `deleted_at` | Soft delete             |
| **Unique:** `(company_id, email)`                                                    |
| **Índices:** `company_id`, `(company_id, name)`, `(company_id, phone)`, `(company_id, document)` |
| **Relações:** company, contracts, services                                           |

#### Contract (`contracts`)
| Campo           | Tipo              | Mapeado como      | Descrição                    |
| --------------- | ----------------- | ----------------- | ---------------------------- |
| id              | String            | —                 | UUID PK                      |
| companyId       | String            | `company_id`      | FK → companies               |
| customerId      | String            | `customer_id`     | FK → customers               |
| frequency       | ContractFrequency | —                 | Frequência do serviço        |
| amount          | Decimal(10,2)     | —                 | Valor do contrato            |
| startDate       | DateTime          | `start_date`      | Início da vigência           |
| endDate         | DateTime          | `end_date`        | Fim da vigência              |
| nextServiceDate | DateTime?         | `next_service_date` | Próxima OS prevista        |
| status          | ContractStatus    | —                 | Default: `ACTIVE`            |
| notes           | String?           | —                 | Observações                  |
| renewCounter    | Int               | `renew_counter`   | Quantas vezes renovou        |
| lastRenewedAt   | DateTime?         | `last_renewed_at` | Última renovação             |
| createdAt       | DateTime          | `created_at`      | —                            |
| updatedAt       | DateTime          | `updated_at`      | —                            |
| deletedAt       | DateTime?         | `deleted_at`      | Soft delete                  |
| **Índices:** `company_id`, `(company_id, status)`, `(company_id, next_service_date)`     |
| **Relações:** company, customer, services                                             |

#### Service (`services`)
| Campo           | Tipo          | Mapeado como     | Descrição                       |
| --------------- | ------------- | ---------------- | ------------------------------- |
| id              | String        | —                | UUID PK                         |
| serviceNumber   | Int           | `service_number` | Número sequencial por empresa   |
| companyId       | String        | `company_id`     | FK → companies                  |
| contractId      | String?       | `contract_id`    | FK → contracts (opcional)       |
| customerId      | String        | `customer_id`    | FK → customers                  |
| scheduledAt     | DateTime      | `scheduled_at`   | Data agendada                   |
| completedDate   | DateTime?     | `completed_date` | Data de conclusão               |
| status          | ServiceStatus | —                | Default: `SCHEDULED`            |
| amount          | Decimal(10,2)?| —                | Valor da OS                     |
| isPaid          | Boolean       | `is_paid`        | Default: `false`                |
| employeeId      | String?       | `employee_id`    | FK → employees (opcional)       |
| notes           | String?       | —                | Observações                     |
| photos          | String[]      | —                | Array de URLs de fotos          |
| signatureUrl    | String?       | `signature_url`  | URL da assinatura               |
| durationMinutes | Int?          | `duration_minutes`| Duração em minutos              |
| createdAt       | DateTime      | `created_at`     | —                               |
| updatedAt       | DateTime      | `updated_at`     | —                               |
| deletedAt       | DateTime?     | `deleted_at`     | Soft delete                     |
| **Unique:** `(company_id, service_number)`                                            |
| **Índices:** `company_id`, `(company_id, scheduled_at)`, `(company_id, status)`         |
| **Relações:** company, contract?, customer, employee?                                 |

#### AuditLog (`audit_logs`)
| Campo      | Tipo     | Mapeado como | Descrição              |
| ---------- | -------- | ------------ | ---------------------- |
| id         | String   | —            | UUID PK                |
| companyId  | String   | `company_id` | FK → companies         |
| userId     | String?  | `user_id`    | FK → users (opcional)  |
| entityType | String   | `entity_type`| Tipo da entidade       |
| entityId   | String   | `entity_id`  | ID da entidade         |
| action     | String   | —            | Ação (ex: CREATE)      |
| oldData    | Json?    | `old_data`   | Dados anteriores       |
| newData    | Json?    | `new_data`   | Dados novos            |
| createdAt  | DateTime | `created_at` | — (sem updated_at)     |
| **Índices:** `company_id`                                                              |
| **Relações:** company, user?                                                          |

### Relacionamentos

```
Company ──┬── User (N)
          ├── Employee (N)
          ├── Customer (N)
          ├── Contract (N)
          ├── Service (N)
          └── AuditLog (N)

Customer ──┬── Contract (N)
           └── Service (N)

Contract ── Service (N)

Employee ── Service (N)

User ── AuditLog (N)
```

**Regras de deleção:**
- `RESTRICT` → users, employees, customers, contracts, audit_logs (company_id)
- `RESTRICT` → contracts (customer_id), services (company_id, customer_id)
- `SET NULL` → services (contract_id, employee_id), audit_logs (user_id)

---

## Seed

`prisma/seed.ts` — cria:
- **Empresa:** "Ciclus" (id fixo `ciclus-seed-company`)
- **3 usuários OWNER** com senha `admin123` (bcrypt hash):
  - Cadu — `cadumeints0@gmail.com`
  - Arthur — `arthurmontandon08@gmail.com`
  - Victor — `victorvinicios@gmail.com`

```bash
npm run prisma:seed
```

---

## Configuração de Ambiente

Copie o `.env.example` para `.env` e preencha:

```env
NODE_ENV=development
PORT=3333
DATABASE_URL="postgresql://user:password@pooler.supabase.com:6543/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@pooler.supabase.com:5432/database"
JWT_SECRET=your-secret-key-min-32-chars-long
JWT_EXPIRES_IN=86400
COOKIE_SECRET=your-cookie-secret
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000
LOG_LEVEL=info
```

> `DATABASE_URL` usa a porta 6543 (pooler do Supabase com PgBouncer).  
> `DIRECT_URL` usa a porta 5432 (conexão direta para migrations).

---

## Scripts Disponíveis

| Script                  | Comando                             | Descrição                           |
| ----------------------- | ----------------------------------- | ----------------------------------- |
| `npm run dev`           | `tsx watch src/server.ts`           | Dev server com hot reload           |
| `npm run build`         | `tsup src/server.ts --format esm,cjs` | Build para produção               |
| `npm run start`         | `node dist/server.js`               | Inicia o build de produção          |
| `npm run prisma:migrate`| `prisma migrate dev`                | Cria/executa migrations             |
| `npm run prisma:generate`| `prisma generate`                  | Gera o cliente Prisma               |
| `npm run prisma:studio` | `prisma studio`                     | Abre Prisma Studio (GUI do banco)   |
| `npm run lint`          | `eslint .`                          | Lint em todo o projeto              |
| `npm run format`        | `prettier --write .`                | Formata todo o projeto              |
| `npm run prepare`       | `husky`                             | Instala hooks do Husky              |

---

## Ferramentas e Configurações

### TypeScript

`tsconfig.json` — Configuração strict:
- `target: ESNext`, `module: preserve`, `moduleResolution: bundler`
- `strict: true`, `noUncheckedIndexedAccess: true`
- `verbatimModuleSyntax: true`, `isolatedModules: true`
- `declaration: true`, `sourceMap: true`, `declarationMap: true`
- `skipLibCheck: true`

### ESLint

`eslint.config.js` — Flat config:
- Extends `eslint-config-prettier` (desliga regras conflitantes com Prettier)
- Ignora `generated/`, `dist/`, `node_modules/`

### Prettier

Disponível via `npm run format`, sem arquivo de configuração dedicado (usa defaults do Prettier 3).

### Husky + Commitlint

`.husky/pre-commit`:
```bash
npm run lint
```

`.husky/commit-msg`:
```bash
npx --no -- commitlint --edit "$1"
```

`commitlint.config.cjs`:
```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
};
```

Portanto, commits devem seguir [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add login route
fix: correct service date calculation
chore: update dependencies
```

### Prisma Config

`prisma.config.ts` — arquivo de configuração do Prisma 7.8+ (substitui `prisma/schema.prisma` para configurações de ambiente):
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations`
- Seed: `tsx prisma/seed.ts`
- Datasource URL: `DIRECT_URL`

---

## Rotas

| Método | Rota      | Descrição                     | Autenticação |
| ------ | --------- | ----------------------------- | ------------ |
| GET    | `/health` | Health check (banco + uptime) | ✗            |
| GET    | `/docs`   | Swagger UI (apenas em dev)    | ✗            |

---

## Como Rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 3. Configurar banco de dados
npm run prisma:migrate    # Executa migrations
npm run prisma:seed       # Opcional: dados iniciais

# 4. Rodar em desenvolvimento
npm run dev

# 5. Build para produção
npm run build
npm run start
```

---

## Repositório

[https://github.com/Meints/ciclus-api](https://github.com/Meints/ciclus-api)
