var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports, module) {
    "use strict";
    var fs2 = __require("fs");
    var path3 = __require("path");
    var os = __require("os");
    var crypto3 = __require("crypto");
    var TIPS = [
      "\u25C8 encrypted .env [www.dotenvx.com]",
      "\u25C8 secrets for agents [www.dotenvx.com]",
      "\u2301 auth for agents [www.vestauth.com]",
      "\u2318 custom filepath { path: '/custom/path/.env' }",
      "\u2318 enable debugging { debug: true }",
      "\u2318 override existing { override: true }",
      "\u2318 suppress logs { quiet: true }",
      "\u2318 multiple files { path: ['.env.local', '.env'] }"
    ];
    function _getRandomTip() {
      return TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    function parseBoolean(value) {
      if (typeof value === "string") {
        return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
      }
      return Boolean(value);
    }
    function supportsAnsi() {
      return process.stdout.isTTY;
    }
    function dim(text) {
      return supportsAnsi() ? `\x1B[2m${text}\x1B[0m` : text;
    }
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.error(`\u26A0 ${message}`);
    }
    function _debug(message) {
      console.log(`\u2506 ${message}`);
    }
    function _log(message) {
      console.log(`\u25C7 ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs2.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path3.resolve(process.cwd(), ".env.vault");
      }
      if (fs2.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path3.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
      const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (debug || !quiet) {
        _log("loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path3.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
      let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("no encoding is specified (UTF-8 is used by default)");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path4 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs2.readFileSync(path4, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`failed to load ${path4} ${e.message}`);
          }
          lastError = e;
        }
      }
      const populated = DotenvModule.populate(processEnv, parsedAll, options);
      debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
      quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
      if (debug || !quiet) {
        const keysCount = Object.keys(populated).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path3.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injected env (${keysCount}) from ${shortPaths.join(",")} ${dim(`// tip: ${_getRandomTip()}`)}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config2(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto3.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      const populated = {};
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
            populated[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }
      }
      return populated;
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config: config2,
      decrypt,
      parse,
      populate
    };
    module.exports.configDotenv = DotenvModule.configDotenv;
    module.exports._configVault = DotenvModule._configVault;
    module.exports._parseVault = DotenvModule._parseVault;
    module.exports.config = DotenvModule.config;
    module.exports.decrypt = DotenvModule.decrypt;
    module.exports.parse = DotenvModule.parse;
    module.exports.populate = DotenvModule.populate;
    module.exports = DotenvModule;
  }
});

// node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS({
  "node_modules/dotenv/lib/env-options.js"(exports, module) {
    "use strict";
    var options = {};
    if (process.env.DOTENV_CONFIG_ENCODING != null) {
      options.encoding = process.env.DOTENV_CONFIG_ENCODING;
    }
    if (process.env.DOTENV_CONFIG_PATH != null) {
      options.path = process.env.DOTENV_CONFIG_PATH;
    }
    if (process.env.DOTENV_CONFIG_QUIET != null) {
      options.quiet = process.env.DOTENV_CONFIG_QUIET;
    }
    if (process.env.DOTENV_CONFIG_DEBUG != null) {
      options.debug = process.env.DOTENV_CONFIG_DEBUG;
    }
    if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
      options.override = process.env.DOTENV_CONFIG_OVERRIDE;
    }
    if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
      options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
    }
    module.exports = options;
  }
});

// node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS({
  "node_modules/dotenv/lib/cli-options.js"(exports, module) {
    "use strict";
    var re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
    module.exports = function optionMatcher(args) {
      const options = args.reduce(function(acc, cur) {
        const matches = cur.match(re);
        if (matches) {
          acc[matches[1]] = matches[2];
        }
        return acc;
      }, {});
      if (!("quiet" in options)) {
        options.quiet = "true";
      }
      return options;
    };
  }
});

// node_modules/dotenv/config.js
(function() {
  require_main().config(
    Object.assign(
      {},
      require_env_options(),
      require_cli_options()(process.argv)
    )
  );
})();

// src/app.ts
import Fastify from "fastify";
import multipart from "@fastify/multipart";

// src/config/env.ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
var env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(3333),
    DATABASE_URL: z.url(),
    DIRECT_URL: z.url(),
    JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
    JWT_EXPIRES_IN: z.coerce.number().default(60 * 60 * 24),
    // 1 dia
    COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET deve ter pelo menos 32 caracteres"),
    CORS_ORIGIN: z.url(),
    RATE_LIMIT_MAX: z.coerce.number().default(100),
    RATE_LIMIT_TIME_WINDOW: z.coerce.number().default(60 * 1e3),
    // 1 minuto
    LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
    FRONTEND_URL: z.string().default("http://localhost:3000"),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET: z.string().default("ciclus-uploads"),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default("noreply@ciclus.app"),
    ZAPI_INSTANCE_ID: z.string().optional(),
    ZAPI_TOKEN: z.string().optional(),
    ZAPI_BASE_URL: z.string().default("https://api.z-api.io"),
    REFRESH_TOKEN_SECRET: z.string().min(32, "REFRESH_TOKEN_SECRET deve ter pelo menos 32 caracteres").optional(),
    REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().default(60 * 60 * 24 * 30)
    // 30 dias
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true
});

// src/config/logger.ts
var loggerConfig = {
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === "development" ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:mm:ss",
      ignore: "pid,hostname"
    }
  } : void 0
};

// src/lib/app-error.ts
var AppError = class extends Error {
  statusCode;
  code;
  details;
  constructor(message, statusCode, code, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
};

// src/plugins/cookie.ts
import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
var cookie_default = fp(async (app2) => {
  await app2.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: "onRequest"
  });
});

// src/plugins/jwt.ts
import fp2 from "fastify-plugin";
import jwt from "@fastify/jwt";
var jwt_default = fp2(async (app2) => {
  await app2.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
    cookie: {
      cookieName: "ciclus_token",
      signed: false
    }
  });
  app2.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ message: "N\xE3o autenticado" });
    }
  });
});

// src/plugins/cors.ts
import fp3 from "fastify-plugin";
import cors from "@fastify/cors";
var cors_default = fp3(async (app2) => {
  await app2.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true
  });
});

// src/plugins/helmet.ts
import fp4 from "fastify-plugin";
import helmet from "@fastify/helmet";
var helmet_default = fp4(async (app2) => {
  await app2.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === "production" ? void 0 : false
  });
});

// src/plugins/rate-limit.ts
import fp5 from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
var rate_limit_default = fp5(async (app2) => {
  await app2.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW,
    keyGenerator: (request) => {
      const userId = request.user?.sub;
      return userId ?? request.ip;
    }
  });
});

// src/plugins/swagger.ts
import fp6 from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
var swagger_default = fp6(async (app2) => {
  if (env.NODE_ENV === "production") return;
  await app2.register(swagger, {
    openapi: {
      info: {
        title: "ContratosPRO API",
        description: "API de gest\xE3o para empresas de servi\xE7os recorrentes",
        version: "1.0.0"
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      }
    }
  });
  await app2.register(swaggerUI, {
    routePrefix: "/docs"
  });
});

// src/lib/request-context.ts
import { AsyncLocalStorage } from "async_hooks";
import fp7 from "fastify-plugin";
var storage = new AsyncLocalStorage();
var request_context_default = fp7(async (app2) => {
  app2.addHook("onRequest", (request, _reply, done) => {
    const user = request.user;
    if (!user) {
      storage.run({ companyId: "", userId: "", role: "" }, done);
      return;
    }
    storage.run(
      {
        companyId: user.companyId ?? "",
        userId: user.sub ?? "",
        role: user.role ?? ""
      },
      done
    );
  });
});

// src/config/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";

// generated/prisma/client.ts
import "process";
import * as path from "path";
import { fileURLToPath } from "url";
import "@prisma/client/runtime/client";

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.8.0",
  "engineVersion": "3c6e192761c0362d496ed980de936e2f3cebcd3a",
  "activeProvider": "postgresql",
  "inlineSchema": 'generator client {\n  provider = "prisma-client"\n  output   = "../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nenum ContractFrequency {\n  MONTHLY\n  BIMONTHLY\n  QUARTERLY\n  SEMIANNUAL\n  YEARLY\n}\n\nenum ContractStatus {\n  ACTIVE\n  ABOUT_TO_EXPIRE\n  EXPIRED\n  CANCELLED\n}\n\nenum ServiceStatus {\n  SCHEDULED\n  IN_PROGRESS\n  COMPLETED\n  CONFIRMED\n  CANCELLED\n}\n\nenum UserRole {\n  OWNER\n  ADMIN\n  TECHNICIAN\n}\n\nenum ServiceType {\n  AIR_CONDITIONING\n  PEST_CONTROL\n  CLEANING\n  BUILDING_MAINTENANCE\n  OTHER\n}\n\nenum CompanyNiche {\n  GENERAL\n  HVAC\n  PEST_CONTROL\n  CLEANING\n  BUILDING_MAINTENANCE\n  OTHER\n}\n\nenum CompanyPlan {\n  FREE\n  STARTER\n  PRO\n  BUSINESS\n}\n\nmodel Company {\n  id                String       @id @default(uuid())\n  name              String\n  fantasyName       String?      @map("fantasy_name")\n  document          String?\n  email             String?\n  phone             String?\n  niche             CompanyNiche @default(GENERAL)\n  plan              CompanyPlan  @default(FREE)\n  logoUrl           String?      @map("logo_url")\n  address           Json?\n  isActive          Boolean      @default(true) @map("is_active")\n  dataConsentAt     DateTime?    @map("data_consent_at")\n  trialEndsAt       DateTime?    @map("trial_ends_at")\n  lastServiceNumber Int          @default(0) @map("last_service_number")\n  createdAt         DateTime     @default(now()) @map("created_at")\n  updatedAt         DateTime     @updatedAt @map("updated_at")\n\n  users     User[]\n  customers Customer[]\n  contracts Contract[]\n  services  Service[]\n  auditLogs AuditLog[]\n  employees Employee[]\n\n  @@index([document])\n  @@index([plan])\n  @@map("companies")\n}\n\nmodel User {\n  id                     String     @id @default(uuid())\n  companyId              String     @map("company_id")\n  name                   String\n  email                  String     @unique\n  passwordHash           String     @map("password_hash")\n  role                   UserRole   @default(OWNER)\n  isActive               Boolean    @default(true) @map("is_active")\n  lastLoginAt            DateTime?  @map("last_login_at")\n  refreshTokenHash       String?    @map("refresh_token_hash")\n  resetPasswordToken     String?    @map("reset_password_token")\n  resetPasswordExpiresAt DateTime?  @map("reset_password_expires_at")\n  createdAt              DateTime   @default(now()) @map("created_at")\n  updatedAt              DateTime   @updatedAt @map("updated_at")\n  deletedAt              DateTime?  @map("deleted_at")\n  auditLogs              AuditLog[]\n\n  company Company @relation(fields: [companyId], references: [id])\n\n  @@index([companyId])\n  @@index([companyId, role])\n  @@index([companyId, isActive])\n  @@map("users")\n}\n\nmodel Employee {\n  id        String    @id @default(uuid())\n  companyId String    @map("company_id")\n  name      String\n  email     String?\n  phone     String?\n  isActive  Boolean   @default(true) @map("is_active")\n  createdAt DateTime  @default(now()) @map("created_at")\n  updatedAt DateTime  @updatedAt @map("updated_at")\n  deletedAt DateTime? @map("deleted_at")\n  services  Service[]\n\n  company Company @relation(fields: [companyId], references: [id])\n\n  @@index([companyId])\n  @@index([companyId, isActive])\n  @@map("employees")\n}\n\nmodel Customer {\n  id           String      @id @default(uuid())\n  companyId    String      @map("company_id")\n  name         String\n  fantasyName  String?     @map("fantasy_name")\n  email        String?\n  phone        String?\n  document     String?\n  documentType String      @default("CNPJ") @map("document_type")\n  address      Json?\n  notes        String?\n  isActive     Boolean     @default(true) @map("is_active")\n  createdAt    DateTime    @default(now()) @map("created_at")\n  updatedAt    DateTime    @updatedAt @map("updated_at")\n  deletedAt    DateTime?   @map("deleted_at")\n  contracts    Contract[]\n  services     Service[]\n  equipment    Equipment[]\n\n  company Company @relation(fields: [companyId], references: [id])\n\n  @@unique([companyId, document])\n  @@index([companyId])\n  @@index([companyId, name])\n  @@index([companyId, phone])\n  @@index([companyId, document])\n  @@index([companyId, isActive])\n  @@map("customers")\n}\n\nmodel Contract {\n  id              String            @id @default(uuid())\n  companyId       String            @map("company_id")\n  customerId      String            @map("customer_id")\n  serviceType     ServiceType?      @map("service_type")\n  frequency       ContractFrequency\n  amount          Decimal           @db.Decimal(10, 2)\n  startDate       DateTime          @map("start_date")\n  endDate         DateTime          @map("end_date")\n  nextServiceDate DateTime?         @map("next_service_date")\n  status          ContractStatus    @default(ACTIVE)\n  notes           String?\n  renewCounter    Int               @default(0) @map("renew_counter")\n  lastRenewedAt   DateTime?         @map("last_renewed_at")\n  createdAt       DateTime          @default(now()) @map("created_at")\n  updatedAt       DateTime          @updatedAt @map("updated_at")\n  deletedAt       DateTime?         @map("deleted_at")\n  services        Service[]\n\n  company  Company  @relation(fields: [companyId], references: [id])\n  customer Customer @relation(fields: [customerId], references: [id])\n\n  @@index([companyId])\n  @@index([companyId, status])\n  @@index([companyId, nextServiceDate])\n  @@index([companyId, endDate])\n  @@index([companyId, frequency])\n  @@map("contracts")\n}\n\nmodel Service {\n  id                         String             @id @default(uuid())\n  serviceNumber              Int                @map("service_number")\n  companyId                  String             @map("company_id")\n  contractId                 String?            @map("contract_id")\n  customerId                 String             @map("customer_id")\n  serviceType                ServiceType?       @map("service_type")\n  scheduledAt                DateTime           @map("scheduled_at")\n  completedDate              DateTime?          @map("completed_date")\n  status                     ServiceStatus      @default(SCHEDULED)\n  amount                     Decimal?           @db.Decimal(10, 2)\n  isPaid                     Boolean            @default(false) @map("is_paid")\n  employeeId                 String?            @map("employee_id")\n  notes                      String?\n  executionNotes             String?            @map("execution_notes")\n  reportUrl                  String?            @map("report_url")\n  durationMinutes            Int?               @map("duration_minutes")\n  confirmationToken          String?            @unique @map("confirmation_token")\n  confirmationTokenExpiresAt DateTime?          @map("confirmation_token_expires_at")\n  confirmedAt                DateTime?          @map("confirmed_at")\n  confirmedIp                String?            @map("confirmed_ip")\n  confirmedUserAgent         String?            @map("confirmed_user_agent")\n  cancelledReason            String?            @map("cancelled_reason")\n  createdAt                  DateTime           @default(now()) @map("created_at")\n  updatedAt                  DateTime           @updatedAt @map("updated_at")\n  deletedAt                  DateTime?          @map("deleted_at")\n  equipment                  ServiceEquipment[]\n  photos                     ServicePhoto[]\n\n  company  Company   @relation(fields: [companyId], references: [id])\n  contract Contract? @relation(fields: [contractId], references: [id])\n  customer Customer  @relation(fields: [customerId], references: [id])\n  employee Employee? @relation(fields: [employeeId], references: [id])\n\n  @@unique([companyId, serviceNumber])\n  @@index([companyId])\n  @@index([companyId, scheduledAt])\n  @@index([companyId, status])\n  @@index([companyId, employeeId])\n  @@index([companyId, completedDate])\n  @@map("services")\n}\n\nmodel AuditLog {\n  id         String   @id @default(uuid())\n  companyId  String   @map("company_id")\n  userId     String?  @map("user_id")\n  entityType String   @map("entity_type")\n  entityId   String   @map("entity_id")\n  action     String\n  oldData    Json?    @map("old_data")\n  newData    Json?    @map("new_data")\n  createdAt  DateTime @default(now()) @map("created_at")\n\n  company Company @relation(fields: [companyId], references: [id])\n  user    User?   @relation(fields: [userId], references: [id])\n\n  @@index([companyId])\n  @@index([companyId, entityType])\n  @@index([companyId, userId])\n  @@index([companyId, createdAt])\n  @@map("audit_logs")\n}\n\nmodel Equipment {\n  id           String    @id @default(uuid())\n  companyId    String    @map("company_id")\n  customerId   String    @map("customer_id")\n  type         String\n  brand        String?\n  model        String?\n  capacity     String?\n  serialNumber String?   @map("serial_number")\n  location     String?\n  installedAt  DateTime? @map("installed_at")\n  notes        String?\n  isActive     Boolean   @default(true) @map("is_active")\n  deletedAt    DateTime? @map("deleted_at")\n  createdAt    DateTime  @default(now()) @map("created_at")\n  updatedAt    DateTime  @updatedAt @map("updated_at")\n\n  customer         Customer           @relation(fields: [customerId], references: [id])\n  serviceEquipment ServiceEquipment[]\n\n  @@index([companyId])\n  @@index([customerId])\n  @@index([companyId, type])\n  @@index([companyId, isActive])\n  @@map("equipment")\n}\n\nmodel ServiceEquipment {\n  id          String  @id @default(uuid())\n  serviceId   String  @map("service_id")\n  equipmentId String  @map("equipment_id")\n  notes       String?\n\n  service   Service   @relation(fields: [serviceId], references: [id])\n  equipment Equipment @relation(fields: [equipmentId], references: [id])\n\n  @@unique([serviceId, equipmentId])\n  @@map("service_equipment")\n}\n\nmodel ServicePhoto {\n  id        String   @id @default(uuid())\n  serviceId String   @map("service_id")\n  url       String\n  caption   String?\n  createdAt DateTime @default(now()) @map("created_at")\n\n  service Service @relation(fields: [serviceId], references: [id])\n\n  @@index([serviceId])\n  @@index([serviceId, url])\n  @@map("service_photos")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"Company":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"fantasyName","kind":"scalar","type":"String","dbName":"fantasy_name"},{"name":"document","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"niche","kind":"enum","type":"CompanyNiche"},{"name":"plan","kind":"enum","type":"CompanyPlan"},{"name":"logoUrl","kind":"scalar","type":"String","dbName":"logo_url"},{"name":"address","kind":"scalar","type":"Json"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"dataConsentAt","kind":"scalar","type":"DateTime","dbName":"data_consent_at"},{"name":"trialEndsAt","kind":"scalar","type":"DateTime","dbName":"trial_ends_at"},{"name":"lastServiceNumber","kind":"scalar","type":"Int","dbName":"last_service_number"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"users","kind":"object","type":"User","relationName":"CompanyToUser"},{"name":"customers","kind":"object","type":"Customer","relationName":"CompanyToCustomer"},{"name":"contracts","kind":"object","type":"Contract","relationName":"CompanyToContract"},{"name":"services","kind":"object","type":"Service","relationName":"CompanyToService"},{"name":"auditLogs","kind":"object","type":"AuditLog","relationName":"AuditLogToCompany"},{"name":"employees","kind":"object","type":"Employee","relationName":"CompanyToEmployee"}],"dbName":"companies"},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"passwordHash","kind":"scalar","type":"String","dbName":"password_hash"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"lastLoginAt","kind":"scalar","type":"DateTime","dbName":"last_login_at"},{"name":"refreshTokenHash","kind":"scalar","type":"String","dbName":"refresh_token_hash"},{"name":"resetPasswordToken","kind":"scalar","type":"String","dbName":"reset_password_token"},{"name":"resetPasswordExpiresAt","kind":"scalar","type":"DateTime","dbName":"reset_password_expires_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"auditLogs","kind":"object","type":"AuditLog","relationName":"AuditLogToUser"},{"name":"company","kind":"object","type":"Company","relationName":"CompanyToUser"}],"dbName":"users"},"Employee":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"services","kind":"object","type":"Service","relationName":"EmployeeToService"},{"name":"company","kind":"object","type":"Company","relationName":"CompanyToEmployee"}],"dbName":"employees"},"Customer":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"name","kind":"scalar","type":"String"},{"name":"fantasyName","kind":"scalar","type":"String","dbName":"fantasy_name"},{"name":"email","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"document","kind":"scalar","type":"String"},{"name":"documentType","kind":"scalar","type":"String","dbName":"document_type"},{"name":"address","kind":"scalar","type":"Json"},{"name":"notes","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"contracts","kind":"object","type":"Contract","relationName":"ContractToCustomer"},{"name":"services","kind":"object","type":"Service","relationName":"CustomerToService"},{"name":"equipment","kind":"object","type":"Equipment","relationName":"CustomerToEquipment"},{"name":"company","kind":"object","type":"Company","relationName":"CompanyToCustomer"}],"dbName":"customers"},"Contract":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"customerId","kind":"scalar","type":"String","dbName":"customer_id"},{"name":"serviceType","kind":"enum","type":"ServiceType","dbName":"service_type"},{"name":"frequency","kind":"enum","type":"ContractFrequency"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"startDate","kind":"scalar","type":"DateTime","dbName":"start_date"},{"name":"endDate","kind":"scalar","type":"DateTime","dbName":"end_date"},{"name":"nextServiceDate","kind":"scalar","type":"DateTime","dbName":"next_service_date"},{"name":"status","kind":"enum","type":"ContractStatus"},{"name":"notes","kind":"scalar","type":"String"},{"name":"renewCounter","kind":"scalar","type":"Int","dbName":"renew_counter"},{"name":"lastRenewedAt","kind":"scalar","type":"DateTime","dbName":"last_renewed_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"services","kind":"object","type":"Service","relationName":"ContractToService"},{"name":"company","kind":"object","type":"Company","relationName":"CompanyToContract"},{"name":"customer","kind":"object","type":"Customer","relationName":"ContractToCustomer"}],"dbName":"contracts"},"Service":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"serviceNumber","kind":"scalar","type":"Int","dbName":"service_number"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"contractId","kind":"scalar","type":"String","dbName":"contract_id"},{"name":"customerId","kind":"scalar","type":"String","dbName":"customer_id"},{"name":"serviceType","kind":"enum","type":"ServiceType","dbName":"service_type"},{"name":"scheduledAt","kind":"scalar","type":"DateTime","dbName":"scheduled_at"},{"name":"completedDate","kind":"scalar","type":"DateTime","dbName":"completed_date"},{"name":"status","kind":"enum","type":"ServiceStatus"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"isPaid","kind":"scalar","type":"Boolean","dbName":"is_paid"},{"name":"employeeId","kind":"scalar","type":"String","dbName":"employee_id"},{"name":"notes","kind":"scalar","type":"String"},{"name":"executionNotes","kind":"scalar","type":"String","dbName":"execution_notes"},{"name":"reportUrl","kind":"scalar","type":"String","dbName":"report_url"},{"name":"durationMinutes","kind":"scalar","type":"Int","dbName":"duration_minutes"},{"name":"confirmationToken","kind":"scalar","type":"String","dbName":"confirmation_token"},{"name":"confirmationTokenExpiresAt","kind":"scalar","type":"DateTime","dbName":"confirmation_token_expires_at"},{"name":"confirmedAt","kind":"scalar","type":"DateTime","dbName":"confirmed_at"},{"name":"confirmedIp","kind":"scalar","type":"String","dbName":"confirmed_ip"},{"name":"confirmedUserAgent","kind":"scalar","type":"String","dbName":"confirmed_user_agent"},{"name":"cancelledReason","kind":"scalar","type":"String","dbName":"cancelled_reason"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"equipment","kind":"object","type":"ServiceEquipment","relationName":"ServiceToServiceEquipment"},{"name":"photos","kind":"object","type":"ServicePhoto","relationName":"ServiceToServicePhoto"},{"name":"company","kind":"object","type":"Company","relationName":"CompanyToService"},{"name":"contract","kind":"object","type":"Contract","relationName":"ContractToService"},{"name":"customer","kind":"object","type":"Customer","relationName":"CustomerToService"},{"name":"employee","kind":"object","type":"Employee","relationName":"EmployeeToService"}],"dbName":"services"},"AuditLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"entityType","kind":"scalar","type":"String","dbName":"entity_type"},{"name":"entityId","kind":"scalar","type":"String","dbName":"entity_id"},{"name":"action","kind":"scalar","type":"String"},{"name":"oldData","kind":"scalar","type":"Json","dbName":"old_data"},{"name":"newData","kind":"scalar","type":"Json","dbName":"new_data"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"company","kind":"object","type":"Company","relationName":"AuditLogToCompany"},{"name":"user","kind":"object","type":"User","relationName":"AuditLogToUser"}],"dbName":"audit_logs"},"Equipment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"customerId","kind":"scalar","type":"String","dbName":"customer_id"},{"name":"type","kind":"scalar","type":"String"},{"name":"brand","kind":"scalar","type":"String"},{"name":"model","kind":"scalar","type":"String"},{"name":"capacity","kind":"scalar","type":"String"},{"name":"serialNumber","kind":"scalar","type":"String","dbName":"serial_number"},{"name":"location","kind":"scalar","type":"String"},{"name":"installedAt","kind":"scalar","type":"DateTime","dbName":"installed_at"},{"name":"notes","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"customer","kind":"object","type":"Customer","relationName":"CustomerToEquipment"},{"name":"serviceEquipment","kind":"object","type":"ServiceEquipment","relationName":"EquipmentToServiceEquipment"}],"dbName":"equipment"},"ServiceEquipment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"serviceId","kind":"scalar","type":"String","dbName":"service_id"},{"name":"equipmentId","kind":"scalar","type":"String","dbName":"equipment_id"},{"name":"notes","kind":"scalar","type":"String"},{"name":"service","kind":"object","type":"Service","relationName":"ServiceToServiceEquipment"},{"name":"equipment","kind":"object","type":"Equipment","relationName":"EquipmentToServiceEquipment"}],"dbName":"service_equipment"},"ServicePhoto":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"serviceId","kind":"scalar","type":"String","dbName":"service_id"},{"name":"url","kind":"scalar","type":"String"},{"name":"caption","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"service","kind":"object","type":"Service","relationName":"ServiceToServicePhoto"}],"dbName":"service_photos"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","company","user","auditLogs","_count","users","service","customer","serviceEquipment","equipment","photos","contract","services","employee","contracts","customers","employees","Company.findUnique","Company.findUniqueOrThrow","Company.findFirst","Company.findFirstOrThrow","Company.findMany","data","Company.createOne","Company.createMany","Company.createManyAndReturn","Company.updateOne","Company.updateMany","Company.updateManyAndReturn","create","update","Company.upsertOne","Company.deleteOne","Company.deleteMany","having","_avg","_sum","_min","_max","Company.groupBy","Company.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Employee.findUnique","Employee.findUniqueOrThrow","Employee.findFirst","Employee.findFirstOrThrow","Employee.findMany","Employee.createOne","Employee.createMany","Employee.createManyAndReturn","Employee.updateOne","Employee.updateMany","Employee.updateManyAndReturn","Employee.upsertOne","Employee.deleteOne","Employee.deleteMany","Employee.groupBy","Employee.aggregate","Customer.findUnique","Customer.findUniqueOrThrow","Customer.findFirst","Customer.findFirstOrThrow","Customer.findMany","Customer.createOne","Customer.createMany","Customer.createManyAndReturn","Customer.updateOne","Customer.updateMany","Customer.updateManyAndReturn","Customer.upsertOne","Customer.deleteOne","Customer.deleteMany","Customer.groupBy","Customer.aggregate","Contract.findUnique","Contract.findUniqueOrThrow","Contract.findFirst","Contract.findFirstOrThrow","Contract.findMany","Contract.createOne","Contract.createMany","Contract.createManyAndReturn","Contract.updateOne","Contract.updateMany","Contract.updateManyAndReturn","Contract.upsertOne","Contract.deleteOne","Contract.deleteMany","Contract.groupBy","Contract.aggregate","Service.findUnique","Service.findUniqueOrThrow","Service.findFirst","Service.findFirstOrThrow","Service.findMany","Service.createOne","Service.createMany","Service.createManyAndReturn","Service.updateOne","Service.updateMany","Service.updateManyAndReturn","Service.upsertOne","Service.deleteOne","Service.deleteMany","Service.groupBy","Service.aggregate","AuditLog.findUnique","AuditLog.findUniqueOrThrow","AuditLog.findFirst","AuditLog.findFirstOrThrow","AuditLog.findMany","AuditLog.createOne","AuditLog.createMany","AuditLog.createManyAndReturn","AuditLog.updateOne","AuditLog.updateMany","AuditLog.updateManyAndReturn","AuditLog.upsertOne","AuditLog.deleteOne","AuditLog.deleteMany","AuditLog.groupBy","AuditLog.aggregate","Equipment.findUnique","Equipment.findUniqueOrThrow","Equipment.findFirst","Equipment.findFirstOrThrow","Equipment.findMany","Equipment.createOne","Equipment.createMany","Equipment.createManyAndReturn","Equipment.updateOne","Equipment.updateMany","Equipment.updateManyAndReturn","Equipment.upsertOne","Equipment.deleteOne","Equipment.deleteMany","Equipment.groupBy","Equipment.aggregate","ServiceEquipment.findUnique","ServiceEquipment.findUniqueOrThrow","ServiceEquipment.findFirst","ServiceEquipment.findFirstOrThrow","ServiceEquipment.findMany","ServiceEquipment.createOne","ServiceEquipment.createMany","ServiceEquipment.createManyAndReturn","ServiceEquipment.updateOne","ServiceEquipment.updateMany","ServiceEquipment.updateManyAndReturn","ServiceEquipment.upsertOne","ServiceEquipment.deleteOne","ServiceEquipment.deleteMany","ServiceEquipment.groupBy","ServiceEquipment.aggregate","ServicePhoto.findUnique","ServicePhoto.findUniqueOrThrow","ServicePhoto.findFirst","ServicePhoto.findFirstOrThrow","ServicePhoto.findMany","ServicePhoto.createOne","ServicePhoto.createMany","ServicePhoto.createManyAndReturn","ServicePhoto.updateOne","ServicePhoto.updateMany","ServicePhoto.updateManyAndReturn","ServicePhoto.upsertOne","ServicePhoto.deleteOne","ServicePhoto.deleteMany","ServicePhoto.groupBy","ServicePhoto.aggregate","AND","OR","NOT","id","serviceId","url","caption","createdAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","equipmentId","notes","companyId","customerId","type","brand","model","capacity","serialNumber","location","installedAt","isActive","deletedAt","updatedAt","userId","entityType","entityId","action","oldData","newData","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","serviceNumber","contractId","ServiceType","serviceType","scheduledAt","completedDate","ServiceStatus","status","amount","isPaid","employeeId","executionNotes","reportUrl","durationMinutes","confirmationToken","confirmationTokenExpiresAt","confirmedAt","confirmedIp","confirmedUserAgent","cancelledReason","ContractFrequency","frequency","startDate","endDate","nextServiceDate","ContractStatus","renewCounter","lastRenewedAt","name","fantasyName","email","phone","document","documentType","address","passwordHash","UserRole","role","lastLoginAt","refreshTokenHash","resetPasswordToken","resetPasswordExpiresAt","CompanyNiche","niche","CompanyPlan","plan","logoUrl","dataConsentAt","trialEndsAt","lastServiceNumber","every","some","none","serviceId_equipmentId","companyId_serviceNumber","companyId_document","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "igZeoAEZBQAA7gIAIAcAAOoCACAOAADtAgAgEAAA7AIAIBEAAOsCACASAADvAgAguwEAAOACADC8AQAAQAAQvQEAAOACADC-AQEAAAABwgFAAOkCACHZASAA5gIAIdsBQADpAgAhhAIBAOECACGFAgEA4gIAIYYCAQDiAgAhhwIBAOICACGIAgEA4gIAIYoCAADlAgAgkwIAAOMCkwIilQIAAOQClQIilgIBAOICACGXAkAA5wIAIZgCQADnAgAhmQICAOgCACEBAAAAAQAgEwMAAPECACAFAADuAgAguwEAAIwDADC8AQAAAwAQvQEAAIwDADC-AQEA4QIAIcIBQADpAgAh0AEBAOECACHZASAA5gIAIdoBQADnAgAh2wFAAOkCACGEAgEA4QIAIYYCAQDhAgAhiwIBAOECACGNAgAAjQONAiKOAkAA5wIAIY8CAQDiAgAhkAIBAOICACGRAkAA5wIAIQcDAACnBQAgBQAApQUAINoBAACOAwAgjgIAAI4DACCPAgAAjgMAIJACAACOAwAgkQIAAI4DACATAwAA8QIAIAUAAO4CACC7AQAAjAMAMLwBAAADABC9AQAAjAMAML4BAQAAAAHCAUAA6QIAIdABAQDhAgAh2QEgAOYCACHaAUAA5wIAIdsBQADpAgAhhAIBAOECACGGAgEAAAABiwIBAOECACGNAgAAjQONAiKOAkAA5wIAIY8CAQDiAgAhkAIBAOICACGRAkAA5wIAIQMAAAADACABAAAEADACAAAFACAOAwAA8QIAIAQAAIsDACC7AQAAigMAMLwBAAAHABC9AQAAigMAML4BAQDhAgAhwgFAAOkCACHQAQEA4QIAIdwBAQDiAgAh3QEBAOECACHeAQEA4QIAId8BAQDhAgAh4AEAAOUCACDhAQAA5QIAIAUDAACnBQAgBAAAsAUAINwBAACOAwAg4AEAAI4DACDhAQAAjgMAIA4DAADxAgAgBAAAiwMAILsBAACKAwAwvAEAAAcAEL0BAACKAwAwvgEBAAAAAcIBQADpAgAh0AEBAOECACHcAQEA4gIAId0BAQDhAgAh3gEBAOECACHfAQEA4QIAIeABAADlAgAg4QEAAOUCACADAAAABwAgAQAACAAwAgAACQAgAQAAAAMAIAEAAAAHACAVAwAA8QIAIAsAAIkDACAOAADtAgAgEAAA7AIAILsBAACIAwAwvAEAAA0AEL0BAACIAwAwvgEBAOECACHCAUAA6QIAIc8BAQDiAgAh0AEBAOECACHZASAA5gIAIdoBQADnAgAh2wFAAOkCACGEAgEA4QIAIYUCAQDiAgAhhgIBAOICACGHAgEA4gIAIYgCAQDiAgAhiQIBAOECACGKAgAA5QIAIAsDAACnBQAgCwAArwUAIA4AAKQFACAQAACjBQAgzwEAAI4DACDaAQAAjgMAIIUCAACOAwAghgIAAI4DACCHAgAAjgMAIIgCAACOAwAgigIAAI4DACAWAwAA8QIAIAsAAIkDACAOAADtAgAgEAAA7AIAILsBAACIAwAwvAEAAA0AEL0BAACIAwAwvgEBAAAAAcIBQADpAgAhzwEBAOICACHQAQEA4QIAIdkBIADmAgAh2gFAAOcCACHbAUAA6QIAIYQCAQDhAgAhhQIBAOICACGGAgEA4gIAIYcCAQDiAgAhiAIBAOICACGJAgEA4QIAIYoCAADlAgAgnwIAAIcDACADAAAADQAgAQAADgAwAgAADwAgFgMAAPECACAJAADzAgAgDgAA7QIAILsBAACDAwAwvAEAABEAEL0BAACDAwAwvgEBAOECACHCAUAA6QIAIc8BAQDiAgAh0AEBAOECACHRAQEA4QIAIdoBQADnAgAh2wFAAOkCACHrAQAA_ALrASPvAQAAhgOCAiLwARAAhQMAIf0BAACEA_0BIv4BQADpAgAh_wFAAOkCACGAAkAA5wIAIYICAgDoAgAhgwJAAOcCACEIAwAApwUAIAkAAKgFACAOAACkBQAgzwEAAI4DACDaAQAAjgMAIOsBAACOAwAggAIAAI4DACCDAgAAjgMAIBYDAADxAgAgCQAA8wIAIA4AAO0CACC7AQAAgwMAMLwBAAARABC9AQAAgwMAML4BAQAAAAHCAUAA6QIAIc8BAQDiAgAh0AEBAOECACHRAQEA4QIAIdoBQADnAgAh2wFAAOkCACHrAQAA_ALrASPvAQAAhgOCAiLwARAAhQMAIf0BAACEA_0BIv4BQADpAgAh_wFAAOkCACGAAkAA5wIAIYICAgDoAgAhgwJAAOcCACEDAAAAEQAgAQAAEgAwAgAAEwAgIgMAAPECACAJAADzAgAgCwAA9AIAIAwAAIADACANAACBAwAgDwAAggMAILsBAAD7AgAwvAEAABUAEL0BAAD7AgAwvgEBAOECACHCAUAA6QIAIc8BAQDiAgAh0AEBAOECACHRAQEA4QIAIdoBQADnAgAh2wFAAOkCACHoAQIA6AIAIekBAQDiAgAh6wEAAPwC6wEj7AFAAOkCACHtAUAA5wIAIe8BAAD9Au8BIvABEAD-AgAh8QEgAOYCACHyAQEA4gIAIfMBAQDiAgAh9AEBAOICACH1AQIA_wIAIfYBAQDiAgAh9wFAAOcCACH4AUAA5wIAIfkBAQDiAgAh-gEBAOICACH7AQEA4gIAIRYDAACnBQAgCQAAqAUAIAsAAKkFACAMAACsBQAgDQAArQUAIA8AAK4FACDPAQAAjgMAINoBAACOAwAg6QEAAI4DACDrAQAAjgMAIO0BAACOAwAg8AEAAI4DACDyAQAAjgMAIPMBAACOAwAg9AEAAI4DACD1AQAAjgMAIPYBAACOAwAg9wEAAI4DACD4AQAAjgMAIPkBAACOAwAg-gEAAI4DACD7AQAAjgMAICMDAADxAgAgCQAA8wIAIAsAAPQCACAMAACAAwAgDQAAgQMAIA8AAIIDACC7AQAA-wIAMLwBAAAVABC9AQAA-wIAML4BAQAAAAHCAUAA6QIAIc8BAQDiAgAh0AEBAOECACHRAQEA4QIAIdoBQADnAgAh2wFAAOkCACHoAQIA6AIAIekBAQDiAgAh6wEAAPwC6wEj7AFAAOkCACHtAUAA5wIAIe8BAAD9Au8BIvABEAD-AgAh8QEgAOYCACHyAQEA4gIAIfMBAQDiAgAh9AEBAOICACH1AQIA_wIAIfYBAQAAAAH3AUAA5wIAIfgBQADnAgAh-QEBAOICACH6AQEA4gIAIfsBAQDiAgAhngIAAPoCACADAAAAFQAgAQAAFgAwAgAAFwAgCQgAAPYCACALAAD5AgAguwEAAPgCADC8AQAAGQAQvQEAAPgCADC-AQEA4QIAIb8BAQDhAgAhzgEBAOECACHPAQEA4gIAIQMIAACqBQAgCwAAqwUAIM8BAACOAwAgCggAAPYCACALAAD5AgAguwEAAPgCADC8AQAAGQAQvQEAAPgCADC-AQEAAAABvwEBAOECACHOAQEA4QIAIc8BAQDiAgAhnQIAAPcCACADAAAAGQAgAQAAGgAwAgAAGwAgAwAAABkAIAEAABoAMAIAABsAIAEAAAAZACAJCAAA9gIAILsBAAD1AgAwvAEAAB8AEL0BAAD1AgAwvgEBAOECACG_AQEA4QIAIcABAQDhAgAhwQEBAOICACHCAUAA6QIAIQIIAACqBQAgwQEAAI4DACAJCAAA9gIAILsBAAD1AgAwvAEAAB8AEL0BAAD1AgAwvgEBAAAAAb8BAQDhAgAhwAEBAOECACHBAQEA4gIAIcIBQADpAgAhAwAAAB8AIAEAACAAMAIAACEAIAEAAAARACAOAwAA8QIAIA4AAO0CACC7AQAA8AIAMLwBAAAkABC9AQAA8AIAML4BAQDhAgAhwgFAAOkCACHQAQEA4QIAIdkBIADmAgAh2gFAAOcCACHbAUAA6QIAIYQCAQDhAgAhhgIBAOICACGHAgEA4gIAIQEAAAAkACADAAAAFQAgAQAAFgAwAgAAFwAgAQAAABUAIAEAAAAZACABAAAAHwAgAQAAABUAIAMAAAAVACABAAAWADACAAAXACAUCQAA8wIAIAoAAPQCACC7AQAA8gIAMLwBAAAsABC9AQAA8gIAML4BAQDhAgAhwgFAAOkCACHPAQEA4gIAIdABAQDhAgAh0QEBAOECACHSAQEA4QIAIdMBAQDiAgAh1AEBAOICACHVAQEA4gIAIdYBAQDiAgAh1wEBAOICACHYAUAA5wIAIdkBIADmAgAh2gFAAOcCACHbAUAA6QIAIQoJAACoBQAgCgAAqQUAIM8BAACOAwAg0wEAAI4DACDUAQAAjgMAINUBAACOAwAg1gEAAI4DACDXAQAAjgMAINgBAACOAwAg2gEAAI4DACAUCQAA8wIAIAoAAPQCACC7AQAA8gIAMLwBAAAsABC9AQAA8gIAML4BAQAAAAHCAUAA6QIAIc8BAQDiAgAh0AEBAOECACHRAQEA4QIAIdIBAQDhAgAh0wEBAOICACHUAQEA4gIAIdUBAQDiAgAh1gEBAOICACHXAQEA4gIAIdgBQADnAgAh2QEgAOYCACHaAUAA5wIAIdsBQADpAgAhAwAAACwAIAEAAC0AMAIAAC4AIAEAAAARACABAAAAFQAgAQAAACwAIAMAAAARACABAAASADACAAATACADAAAAFQAgAQAAFgAwAgAAFwAgAwAAAAcAIAEAAAgAMAIAAAkAIAUDAACnBQAgDgAApAUAINoBAACOAwAghgIAAI4DACCHAgAAjgMAIA4DAADxAgAgDgAA7QIAILsBAADwAgAwvAEAACQAEL0BAADwAgAwvgEBAAAAAcIBQADpAgAh0AEBAOECACHZASAA5gIAIdoBQADnAgAh2wFAAOkCACGEAgEA4QIAIYYCAQDiAgAhhwIBAOICACEDAAAAJAAgAQAANgAwAgAANwAgAQAAAAMAIAEAAAANACABAAAAEQAgAQAAABUAIAEAAAAHACABAAAAJAAgAQAAAAEAIBkFAADuAgAgBwAA6gIAIA4AAO0CACAQAADsAgAgEQAA6wIAIBIAAO8CACC7AQAA4AIAMLwBAABAABC9AQAA4AIAML4BAQDhAgAhwgFAAOkCACHZASAA5gIAIdsBQADpAgAhhAIBAOECACGFAgEA4gIAIYYCAQDiAgAhhwIBAOICACGIAgEA4gIAIYoCAADlAgAgkwIAAOMCkwIilQIAAOQClQIilgIBAOICACGXAkAA5wIAIZgCQADnAgAhmQICAOgCACEOBQAApQUAIAcAAKEFACAOAACkBQAgEAAAowUAIBEAAKIFACASAACmBQAghQIAAI4DACCGAgAAjgMAIIcCAACOAwAgiAIAAI4DACCKAgAAjgMAIJYCAACOAwAglwIAAI4DACCYAgAAjgMAIAMAAABAACABAABBADACAAABACADAAAAQAAgAQAAQQAwAgAAAQAgAwAAAEAAIAEAAEEAMAIAAAEAIBYFAACfBQAgBwAAmwUAIA4AAJ4FACAQAACdBQAgEQAAnAUAIBIAAKAFACC-AQEAAAABwgFAAAAAAdkBIAAAAAHbAUAAAAABhAIBAAAAAYUCAQAAAAGGAgEAAAABhwIBAAAAAYgCAQAAAAGKAoAAAAABkwIAAACTAgKVAgAAAJUCApYCAQAAAAGXAkAAAAABmAJAAAAAAZkCAgAAAAEBGAAARQAgEL4BAQAAAAHCAUAAAAAB2QEgAAAAAdsBQAAAAAGEAgEAAAABhQIBAAAAAYYCAQAAAAGHAgEAAAABiAIBAAAAAYoCgAAAAAGTAgAAAJMCApUCAAAAlQIClgIBAAAAAZcCQAAAAAGYAkAAAAABmQICAAAAAQEYAABHADABGAAARwAwFgUAANoEACAHAADWBAAgDgAA2QQAIBAAANgEACARAADXBAAgEgAA2wQAIL4BAQCSAwAhwgFAAJQDACHZASAAogMAIdsBQACUAwAhhAIBAJIDACGFAgEAkwMAIYYCAQCTAwAhhwIBAJMDACGIAgEAkwMAIYoCgAAAAAGTAgAA1ASTAiKVAgAA1QSVAiKWAgEAkwMAIZcCQAChAwAhmAJAAKEDACGZAgIAvwMAIQIAAAABACAYAABKACAQvgEBAJIDACHCAUAAlAMAIdkBIACiAwAh2wFAAJQDACGEAgEAkgMAIYUCAQCTAwAhhgIBAJMDACGHAgEAkwMAIYgCAQCTAwAhigKAAAAAAZMCAADUBJMCIpUCAADVBJUCIpYCAQCTAwAhlwJAAKEDACGYAkAAoQMAIZkCAgC_AwAhAgAAAEAAIBgAAEwAIAIAAABAACAYAABMACADAAAAAQAgHwAARQAgIAAASgAgAQAAAAEAIAEAAABAACANBgAAzwQAICUAANAEACAmAADTBAAgJwAA0gQAICgAANEEACCFAgAAjgMAIIYCAACOAwAghwIAAI4DACCIAgAAjgMAIIoCAACOAwAglgIAAI4DACCXAgAAjgMAIJgCAACOAwAgE7sBAADZAgAwvAEAAFMAEL0BAADZAgAwvgEBAKMCACHCAUAApQIAIdkBIACxAgAh2wFAAKUCACGEAgEAowIAIYUCAQCkAgAhhgIBAKQCACGHAgEApAIAIYgCAQCkAgAhigIAALcCACCTAgAA2gKTAiKVAgAA2wKVAiKWAgEApAIAIZcCQACwAgAhmAJAALACACGZAgIAugIAIQMAAABAACABAABSADAkAABTACADAAAAQAAgAQAAQQAwAgAAAQAgAQAAAAUAIAEAAAAFACADAAAAAwAgAQAABAAwAgAABQAgAwAAAAMAIAEAAAQAMAIAAAUAIAMAAAADACABAAAEADACAAAFACAQAwAAzgQAIAUAAM0EACC-AQEAAAABwgFAAAAAAdABAQAAAAHZASAAAAAB2gFAAAAAAdsBQAAAAAGEAgEAAAABhgIBAAAAAYsCAQAAAAGNAgAAAI0CAo4CQAAAAAGPAgEAAAABkAIBAAAAAZECQAAAAAEBGAAAWwAgDr4BAQAAAAHCAUAAAAAB0AEBAAAAAdkBIAAAAAHaAUAAAAAB2wFAAAAAAYQCAQAAAAGGAgEAAAABiwIBAAAAAY0CAAAAjQICjgJAAAAAAY8CAQAAAAGQAgEAAAABkQJAAAAAAQEYAABdADABGAAAXQAwEAMAAMAEACAFAAC_BAAgvgEBAJIDACHCAUAAlAMAIdABAQCSAwAh2QEgAKIDACHaAUAAoQMAIdsBQACUAwAhhAIBAJIDACGGAgEAkgMAIYsCAQCSAwAhjQIAAL4EjQIijgJAAKEDACGPAgEAkwMAIZACAQCTAwAhkQJAAKEDACECAAAABQAgGAAAYAAgDr4BAQCSAwAhwgFAAJQDACHQAQEAkgMAIdkBIACiAwAh2gFAAKEDACHbAUAAlAMAIYQCAQCSAwAhhgIBAJIDACGLAgEAkgMAIY0CAAC-BI0CIo4CQAChAwAhjwIBAJMDACGQAgEAkwMAIZECQAChAwAhAgAAAAMAIBgAAGIAIAIAAAADACAYAABiACADAAAABQAgHwAAWwAgIAAAYAAgAQAAAAUAIAEAAAADACAIBgAAuwQAICcAAL0EACAoAAC8BAAg2gEAAI4DACCOAgAAjgMAII8CAACOAwAgkAIAAI4DACCRAgAAjgMAIBG7AQAA1QIAMLwBAABpABC9AQAA1QIAML4BAQCjAgAhwgFAAKUCACHQAQEAowIAIdkBIACxAgAh2gFAALACACHbAUAApQIAIYQCAQCjAgAhhgIBAKMCACGLAgEAowIAIY0CAADWAo0CIo4CQACwAgAhjwIBAKQCACGQAgEApAIAIZECQACwAgAhAwAAAAMAIAEAAGgAMCQAAGkAIAMAAAADACABAAAEADACAAAFACABAAAANwAgAQAAADcAIAMAAAAkACABAAA2ADACAAA3ACADAAAAJAAgAQAANgAwAgAANwAgAwAAACQAIAEAADYAMAIAADcAIAsDAAC6BAAgDgAAuQQAIL4BAQAAAAHCAUAAAAAB0AEBAAAAAdkBIAAAAAHaAUAAAAAB2wFAAAAAAYQCAQAAAAGGAgEAAAABhwIBAAAAAQEYAABxACAJvgEBAAAAAcIBQAAAAAHQAQEAAAAB2QEgAAAAAdoBQAAAAAHbAUAAAAABhAIBAAAAAYYCAQAAAAGHAgEAAAABARgAAHMAMAEYAABzADALAwAArwQAIA4AAK4EACC-AQEAkgMAIcIBQACUAwAh0AEBAJIDACHZASAAogMAIdoBQAChAwAh2wFAAJQDACGEAgEAkgMAIYYCAQCTAwAhhwIBAJMDACECAAAANwAgGAAAdgAgCb4BAQCSAwAhwgFAAJQDACHQAQEAkgMAIdkBIACiAwAh2gFAAKEDACHbAUAAlAMAIYQCAQCSAwAhhgIBAJMDACGHAgEAkwMAIQIAAAAkACAYAAB4ACACAAAAJAAgGAAAeAAgAwAAADcAIB8AAHEAICAAAHYAIAEAAAA3ACABAAAAJAAgBgYAAKsEACAnAACtBAAgKAAArAQAINoBAACOAwAghgIAAI4DACCHAgAAjgMAIAy7AQAA1AIAMLwBAAB_ABC9AQAA1AIAML4BAQCjAgAhwgFAAKUCACHQAQEAowIAIdkBIACxAgAh2gFAALACACHbAUAApQIAIYQCAQCjAgAhhgIBAKQCACGHAgEApAIAIQMAAAAkACABAAB-ADAkAAB_ACADAAAAJAAgAQAANgAwAgAANwAgAQAAAA8AIAEAAAAPACADAAAADQAgAQAADgAwAgAADwAgAwAAAA0AIAEAAA4AMAIAAA8AIAMAAAANACABAAAOADACAAAPACASAwAAqgQAIAsAAKkEACAOAACoBAAgEAAApwQAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdABAQAAAAHZASAAAAAB2gFAAAAAAdsBQAAAAAGEAgEAAAABhQIBAAAAAYYCAQAAAAGHAgEAAAABiAIBAAAAAYkCAQAAAAGKAoAAAAABARgAAIcBACAOvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdkBIAAAAAHaAUAAAAAB2wFAAAAAAYQCAQAAAAGFAgEAAAABhgIBAAAAAYcCAQAAAAGIAgEAAAABiQIBAAAAAYoCgAAAAAEBGAAAiQEAMAEYAACJAQAwEgMAAIUEACALAACEBAAgDgAAgwQAIBAAAIIEACC-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdkBIACiAwAh2gFAAKEDACHbAUAAlAMAIYQCAQCSAwAhhQIBAJMDACGGAgEAkwMAIYcCAQCTAwAhiAIBAJMDACGJAgEAkgMAIYoCgAAAAAECAAAADwAgGAAAjAEAIA6-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdkBIACiAwAh2gFAAKEDACHbAUAAlAMAIYQCAQCSAwAhhQIBAJMDACGGAgEAkwMAIYcCAQCTAwAhiAIBAJMDACGJAgEAkgMAIYoCgAAAAAECAAAADQAgGAAAjgEAIAIAAAANACAYAACOAQAgAwAAAA8AIB8AAIcBACAgAACMAQAgAQAAAA8AIAEAAAANACAKBgAA_wMAICcAAIEEACAoAACABAAgzwEAAI4DACDaAQAAjgMAIIUCAACOAwAghgIAAI4DACCHAgAAjgMAIIgCAACOAwAgigIAAI4DACARuwEAANMCADC8AQAAlQEAEL0BAADTAgAwvgEBAKMCACHCAUAApQIAIc8BAQCkAgAh0AEBAKMCACHZASAAsQIAIdoBQACwAgAh2wFAAKUCACGEAgEAowIAIYUCAQCkAgAhhgIBAKQCACGHAgEApAIAIYgCAQCkAgAhiQIBAKMCACGKAgAAtwIAIAMAAAANACABAACUAQAwJAAAlQEAIAMAAAANACABAAAOADACAAAPACABAAAAEwAgAQAAABMAIAMAAAARACABAAASADACAAATACADAAAAEQAgAQAAEgAwAgAAEwAgAwAAABEAIAEAABIAMAIAABMAIBMDAAD9AwAgCQAA_gMAIA4AAPwDACC-AQEAAAABwgFAAAAAAc8BAQAAAAHQAQEAAAAB0QEBAAAAAdoBQAAAAAHbAUAAAAAB6wEAAADrAQPvAQAAAIICAvABEAAAAAH9AQAAAP0BAv4BQAAAAAH_AUAAAAABgAJAAAAAAYICAgAAAAGDAkAAAAABARgAAJ0BACAQvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdEBAQAAAAHaAUAAAAAB2wFAAAAAAesBAAAA6wED7wEAAACCAgLwARAAAAAB_QEAAAD9AQL-AUAAAAAB_wFAAAAAAYACQAAAAAGCAgIAAAABgwJAAAAAAQEYAACfAQAwARgAAJ8BADATAwAA7gMAIAkAAO8DACAOAADtAwAgvgEBAJIDACHCAUAAlAMAIc8BAQCTAwAh0AEBAJIDACHRAQEAkgMAIdoBQAChAwAh2wFAAJQDACHrAQAAwAPrASPvAQAA7AOCAiLwARAA6wMAIf0BAADqA_0BIv4BQACUAwAh_wFAAJQDACGAAkAAoQMAIYICAgC_AwAhgwJAAKEDACECAAAAEwAgGAAAogEAIBC-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdEBAQCSAwAh2gFAAKEDACHbAUAAlAMAIesBAADAA-sBI-8BAADsA4ICIvABEADrAwAh_QEAAOoD_QEi_gFAAJQDACH_AUAAlAMAIYACQAChAwAhggICAL8DACGDAkAAoQMAIQIAAAARACAYAACkAQAgAgAAABEAIBgAAKQBACADAAAAEwAgHwAAnQEAICAAAKIBACABAAAAEwAgAQAAABEAIAoGAADlAwAgJQAA5gMAICYAAOkDACAnAADoAwAgKAAA5wMAIM8BAACOAwAg2gEAAI4DACDrAQAAjgMAIIACAACOAwAggwIAAI4DACATuwEAAMkCADC8AQAAqwEAEL0BAADJAgAwvgEBAKMCACHCAUAApQIAIc8BAQCkAgAh0AEBAKMCACHRAQEAowIAIdoBQACwAgAh2wFAAKUCACHrAQAAuwLrASPvAQAAzAKCAiLwARAAywIAIf0BAADKAv0BIv4BQAClAgAh_wFAAKUCACGAAkAAsAIAIYICAgC6AgAhgwJAALACACEDAAAAEQAgAQAAqgEAMCQAAKsBACADAAAAEQAgAQAAEgAwAgAAEwAgAQAAABcAIAEAAAAXACADAAAAFQAgAQAAFgAwAgAAFwAgAwAAABUAIAEAABYAMAIAABcAIAMAAAAVACABAAAWADACAAAXACAfAwAA4QMAIAkAAOMDACALAADfAwAgDAAA4AMAIA0AAOIDACAPAADkAwAgvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdEBAQAAAAHaAUAAAAAB2wFAAAAAAegBAgAAAAHpAQEAAAAB6wEAAADrAQPsAUAAAAAB7QFAAAAAAe8BAAAA7wEC8AEQAAAAAfEBIAAAAAHyAQEAAAAB8wEBAAAAAfQBAQAAAAH1AQIAAAAB9gEBAAAAAfcBQAAAAAH4AUAAAAAB-QEBAAAAAfoBAQAAAAH7AQEAAAABARgAALMBACAZvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdEBAQAAAAHaAUAAAAAB2wFAAAAAAegBAgAAAAHpAQEAAAAB6wEAAADrAQPsAUAAAAAB7QFAAAAAAe8BAAAA7wEC8AEQAAAAAfEBIAAAAAHyAQEAAAAB8wEBAAAAAfQBAQAAAAH1AQIAAAAB9gEBAAAAAfcBQAAAAAH4AUAAAAAB-QEBAAAAAfoBAQAAAAH7AQEAAAABARgAALUBADABGAAAtQEAMAEAAAARACABAAAAJAAgHwMAAMYDACAJAADIAwAgCwAAxAMAIAwAAMUDACANAADHAwAgDwAAyQMAIL4BAQCSAwAhwgFAAJQDACHPAQEAkwMAIdABAQCSAwAh0QEBAJIDACHaAUAAoQMAIdsBQACUAwAh6AECAL8DACHpAQEAkwMAIesBAADAA-sBI-wBQACUAwAh7QFAAKEDACHvAQAAwQPvASLwARAAwgMAIfEBIACiAwAh8gEBAJMDACHzAQEAkwMAIfQBAQCTAwAh9QECAMMDACH2AQEAkwMAIfcBQAChAwAh-AFAAKEDACH5AQEAkwMAIfoBAQCTAwAh-wEBAJMDACECAAAAFwAgGAAAugEAIBm-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdEBAQCSAwAh2gFAAKEDACHbAUAAlAMAIegBAgC_AwAh6QEBAJMDACHrAQAAwAPrASPsAUAAlAMAIe0BQAChAwAh7wEAAMED7wEi8AEQAMIDACHxASAAogMAIfIBAQCTAwAh8wEBAJMDACH0AQEAkwMAIfUBAgDDAwAh9gEBAJMDACH3AUAAoQMAIfgBQAChAwAh-QEBAJMDACH6AQEAkwMAIfsBAQCTAwAhAgAAABUAIBgAALwBACACAAAAFQAgGAAAvAEAIAEAAAARACABAAAAJAAgAwAAABcAIB8AALMBACAgAAC6AQAgAQAAABcAIAEAAAAVACAVBgAAugMAICUAALsDACAmAAC-AwAgJwAAvQMAICgAALwDACDPAQAAjgMAINoBAACOAwAg6QEAAI4DACDrAQAAjgMAIO0BAACOAwAg8AEAAI4DACDyAQAAjgMAIPMBAACOAwAg9AEAAI4DACD1AQAAjgMAIPYBAACOAwAg9wEAAI4DACD4AQAAjgMAIPkBAACOAwAg-gEAAI4DACD7AQAAjgMAIBy7AQAAuQIAMLwBAADFAQAQvQEAALkCADC-AQEAowIAIcIBQAClAgAhzwEBAKQCACHQAQEAowIAIdEBAQCjAgAh2gFAALACACHbAUAApQIAIegBAgC6AgAh6QEBAKQCACHrAQAAuwLrASPsAUAApQIAIe0BQACwAgAh7wEAALwC7wEi8AEQAL0CACHxASAAsQIAIfIBAQCkAgAh8wEBAKQCACH0AQEApAIAIfUBAgC-AgAh9gEBAKQCACH3AUAAsAIAIfgBQACwAgAh-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_AQEAAAABwAEBAAAAAcEBAQAAAAHCAUAAAAABARgAAJMCADABGAAAkwIAMAYIAACVAwAgvgEBAJIDACG_AQEAkgMAIcABAQCSAwAhwQEBAJMDACHCAUAAlAMAIQIAAAAhACAYAACWAgAgBb4BAQCSAwAhvwEBAJIDACHAAQEAkgMAIcEBAQCTAwAhwgFAAJQDACECAAAAHwAgGAAAmAIAIAIAAAAfACAYAACYAgAgAwAAACEAIB8AAJECACAgAACWAgAgAQAAACEAIAEAAAAfACAEBgAAjwMAICcAAJEDACAoAACQAwAgwQEAAI4DACAIuwEAAKICADC8AQAAnwIAEL0BAACiAgAwvgEBAKMCACG_AQEAowIAIcABAQCjAgAhwQEBAKQCACHCAUAApQIAIQMAAAAfACABAACeAgAwJAAAnwIAIAMAAAAfACABAAAgADACAAAhACAIuwEAAKICADC8AQAAnwIAEL0BAACiAgAwvgEBAKMCACG_AQEAowIAIcABAQCjAgAhwQEBAKQCACHCAUAApQIAIQ4GAACnAgAgJwAArQIAICgAAK0CACDDAQEAAAABxAEBAAAABMUBAQAAAATGAQEAAAABxwEBAAAAAcgBAQAAAAHJAQEAAAABygEBAKwCACHLAQEAAAABzAEBAAAAAc0BAQAAAAEOBgAAqgIAICcAAKsCACAoAACrAgAgwwEBAAAAAcQBAQAAAAXFAQEAAAAFxgEBAAAAAccBAQAAAAHIAQEAAAAByQEBAAAAAcoBAQCpAgAhywEBAAAAAcwBAQAAAAHNAQEAAAABCwYAAKcCACAnAACoAgAgKAAAqAIAIMMBQAAAAAHEAUAAAAAExQFAAAAABMYBQAAAAAHHAUAAAAAByAFAAAAAAckBQAAAAAHKAUAApgIAIQsGAACnAgAgJwAAqAIAICgAAKgCACDDAUAAAAABxAFAAAAABMUBQAAAAATGAUAAAAABxwFAAAAAAcgBQAAAAAHJAUAAAAABygFAAKYCACEIwwECAAAAAcQBAgAAAATFAQIAAAAExgECAAAAAccBAgAAAAHIAQIAAAAByQECAAAAAcoBAgCnAgAhCMMBQAAAAAHEAUAAAAAExQFAAAAABMYBQAAAAAHHAUAAAAAByAFAAAAAAckBQAAAAAHKAUAAqAIAIQ4GAACqAgAgJwAAqwIAICgAAKsCACDDAQEAAAABxAEBAAAABcUBAQAAAAXGAQEAAAABxwEBAAAAAcgBAQAAAAHJAQEAAAABygEBAKkCACHLAQEAAAABzAEBAAAAAc0BAQAAAAEIwwECAAAAAcQBAgAAAAXFAQIAAAAFxgECAAAAAccBAgAAAAHIAQIAAAAByQECAAAAAcoBAgCqAgAhC8MBAQAAAAHEAQEAAAAFxQEBAAAABcYBAQAAAAHHAQEAAAAByAEBAAAAAckBAQAAAAHKAQEAqwIAIcsBAQAAAAHMAQEAAAABzQEBAAAAAQ4GAACnAgAgJwAArQIAICgAAK0CACDDAQEAAAABxAEBAAAABMUBAQAAAATGAQEAAAABxwEBAAAAAcgBAQAAAAHJAQEAAAABygEBAKwCACHLAQEAAAABzAEBAAAAAc0BAQAAAAELwwEBAAAAAcQBAQAAAATFAQEAAAAExgEBAAAAAccBAQAAAAHIAQEAAAAByQEBAAAAAcoBAQCtAgAhywEBAAAAAcwBAQAAAAHNAQEAAAABB7sBAACuAgAwvAEAAIkCABC9AQAArgIAML4BAQCjAgAhvwEBAKMCACHOAQEAowIAIc8BAQCkAgAhErsBAACvAgAwvAEAAPMBABC9AQAArwIAML4BAQCjAgAhwgFAAKUCACHPAQEApAIAIdABAQCjAgAh0QEBAKMCACHSAQEAowIAIdMBAQCkAgAh1AEBAKQCACHVAQEApAIAIdYBAQCkAgAh1wEBAKQCACHYAUAAsAIAIdkBIACxAgAh2gFAALACACHbAUAApQIAIQsGAACqAgAgJwAAtQIAICgAALUCACDDAUAAAAABxAFAAAAABcUBQAAAAAXGAUAAAAABxwFAAAAAAcgBQAAAAAHJAUAAAAABygFAALQCACEFBgAApwIAICcAALMCACAoAACzAgAgwwEgAAAAAcoBIACyAgAhBQYAAKcCACAnAACzAgAgKAAAswIAIMMBIAAAAAHKASAAsgIAIQLDASAAAAABygEgALMCACELBgAAqgIAICcAALUCACAoAAC1AgAgwwFAAAAAAcQBQAAAAAXFAUAAAAAFxgFAAAAAAccBQAAAAAHIAUAAAAAByQFAAAAAAcoBQAC0AgAhCMMBQAAAAAHEAUAAAAAFxQFAAAAABcYBQAAAAAHHAUAAAAAByAFAAAAAAckBQAAAAAHKAUAAtQIAIQy7AQAAtgIAMLwBAADdAQAQvQEAALYCADC-AQEAowIAIcIBQAClAgAh0AEBAKMCACHcAQEApAIAId0BAQCjAgAh3gEBAKMCACHfAQEAowIAIeABAAC3AgAg4QEAALcCACAPBgAAqgIAICcAALgCACAoAAC4AgAgwwGAAAAAAcYBgAAAAAHHAYAAAAAByAGAAAAAAckBgAAAAAHKAYAAAAAB4gEBAAAAAeMBAQAAAAHkAQEAAAAB5QGAAAAAAeYBgAAAAAHnAYAAAAABDMMBgAAAAAHGAYAAAAABxwGAAAAAAcgBgAAAAAHJAYAAAAABygGAAAAAAeIBAQAAAAHjAQEAAAAB5AEBAAAAAeUBgAAAAAHmAYAAAAAB5wGAAAAAARy7AQAAuQIAMLwBAADFAQAQvQEAALkCADC-AQEAowIAIcIBQAClAgAhzwEBAKQCACHQAQEAowIAIdEBAQCjAgAh2gFAALACACHbAUAApQIAIegBAgC6AgAh6QEBAKQCACHrAQAAuwLrASPsAUAApQIAIe0BQACwAgAh7wEAALwC7wEi8AEQAL0CACHxASAAsQIAIfIBAQCkAgAh8wEBAKQCACH0AQEApAIAIfUBAgC-AgAh9gEBAKQCACH3AUAAsAIAIfgBQACwAgAh-QEBAKQCACH6AQEApAIAIfsBAQCkAgAhDQYAAKcCACAlAADIAgAgJgAApwIAICcAAKcCACAoAACnAgAgwwECAAAAAcQBAgAAAATFAQIAAAAExgECAAAAAccBAgAAAAHIAQIAAAAByQECAAAAAcoBAgDHAgAhBwYAAKoCACAnAADGAgAgKAAAxgIAIMMBAAAA6wEDxAEAAADrAQnFAQAAAOsBCcoBAADFAusBIwcGAACnAgAgJwAAxAIAICgAAMQCACDDAQAAAO8BAsQBAAAA7wEIxQEAAADvAQjKAQAAwwLvASINBgAAqgIAICUAAMICACAmAADCAgAgJwAAwgIAICgAAMICACDDARAAAAABxAEQAAAABcUBEAAAAAXGARAAAAABxwEQAAAAAcgBEAAAAAHJARAAAAABygEQAMECACENBgAAqgIAICUAAMACACAmAACqAgAgJwAAqgIAICgAAKoCACDDAQIAAAABxAECAAAABcUBAgAAAAXGAQIAAAABxwECAAAAAcgBAgAAAAHJAQIAAAABygECAL8CACENBgAAqgIAICUAAMACACAmAACqAgAgJwAAqgIAICgAAKoCACDDAQIAAAABxAECAAAABcUBAgAAAAXGAQIAAAABxwECAAAAAcgBAgAAAAHJAQIAAAABygECAL8CACEIwwEIAAAAAcQBCAAAAAXFAQgAAAAFxgEIAAAAAccBCAAAAAHIAQgAAAAByQEIAAAAAcoBCADAAgAhDQYAAKoCACAlAADCAgAgJgAAwgIAICcAAMICACAoAADCAgAgwwEQAAAAAcQBEAAAAAXFARAAAAAFxgEQAAAAAccBEAAAAAHIARAAAAAByQEQAAAAAcoBEADBAgAhCMMBEAAAAAHEARAAAAAFxQEQAAAABcYBEAAAAAHHARAAAAAByAEQAAAAAckBEAAAAAHKARAAwgIAIQcGAACnAgAgJwAAxAIAICgAAMQCACDDAQAAAO8BAsQBAAAA7wEIxQEAAADvAQjKAQAAwwLvASIEwwEAAADvAQLEAQAAAO8BCMUBAAAA7wEIygEAAMQC7wEiBwYAAKoCACAnAADGAgAgKAAAxgIAIMMBAAAA6wEDxAEAAADrAQnFAQAAAOsBCcoBAADFAusBIwTDAQAAAOsBA8QBAAAA6wEJxQEAAADrAQnKAQAAxgLrASMNBgAApwIAICUAAMgCACAmAACnAgAgJwAApwIAICgAAKcCACDDAQIAAAABxAECAAAABMUBAgAAAATGAQIAAAABxwECAAAAAcgBAgAAAAHJAQIAAAABygECAMcCACEIwwEIAAAAAcQBCAAAAATFAQgAAAAExgEIAAAAAccBCAAAAAHIAQgAAAAByQEIAAAAAcoBCADIAgAhE7sBAADJAgAwvAEAAKsBABC9AQAAyQIAML4BAQCjAgAhwgFAAKUCACHPAQEApAIAIdABAQCjAgAh0QEBAKMCACHaAUAAsAIAIdsBQAClAgAh6wEAALsC6wEj7wEAAMwCggIi8AEQAMsCACH9AQAAygL9ASL-AUAApQIAIf8BQAClAgAhgAJAALACACGCAgIAugIAIYMCQACwAgAhBwYAAKcCACAnAADSAgAgKAAA0gIAIMMBAAAA_QECxAEAAAD9AQjFAQAAAP0BCMoBAADRAv0BIg0GAACnAgAgJQAA0AIAICYAANACACAnAADQAgAgKAAA0AIAIMMBEAAAAAHEARAAAAAExQEQAAAABMYBEAAAAAHHARAAAAAByAEQAAAAAckBEAAAAAHKARAAzwIAIQcGAACnAgAgJwAAzgIAICgAAM4CACDDAQAAAIICAsQBAAAAggIIxQEAAACCAgjKAQAAzQKCAiIHBgAApwIAICcAAM4CACAoAADOAgAgwwEAAACCAgLEAQAAAIICCMUBAAAAggIIygEAAM0CggIiBMMBAAAAggICxAEAAACCAgjFAQAAAIICCMoBAADOAoICIg0GAACnAgAgJQAA0AIAICYAANACACAnAADQAgAgKAAA0AIAIMMBEAAAAAHEARAAAAAExQEQAAAABMYBEAAAAAHHARAAAAAByAEQAAAAAckBEAAAAAHKARAAzwIAIQjDARAAAAABxAEQAAAABMUBEAAAAATGARAAAAABxwEQAAAAAcgBEAAAAAHJARAAAAABygEQANACACEHBgAApwIAICcAANICACAoAADSAgAgwwEAAAD9AQLEAQAAAP0BCMUBAAAA_QEIygEAANEC_QEiBMMBAAAA_QECxAEAAAD9AQjFAQAAAP0BCMoBAADSAv0BIhG7AQAA0wIAMLwBAACVAQAQvQEAANMCADC-AQEAowIAIcIBQAClAgAhzwEBAKQCACHQAQEAowIAIdkBIACxAgAh2gFAALACACHbAUAApQIAIYQCAQCjAgAhhQIBAKQCACGGAgEApAIAIYcCAQCkAgAhiAIBAKQCACGJAgEAowIAIYoCAAC3AgAgDLsBAADUAgAwvAEAAH8AEL0BAADUAgAwvgEBAKMCACHCAUAApQIAIdABAQCjAgAh2QEgALECACHaAUAAsAIAIdsBQAClAgAhhAIBAKMCACGGAgEApAIAIYcCAQCkAgAhEbsBAADVAgAwvAEAAGkAEL0BAADVAgAwvgEBAKMCACHCAUAApQIAIdABAQCjAgAh2QEgALECACHaAUAAsAIAIdsBQAClAgAhhAIBAKMCACGGAgEAowIAIYsCAQCjAgAhjQIAANYCjQIijgJAALACACGPAgEApAIAIZACAQCkAgAhkQJAALACACEHBgAApwIAICcAANgCACAoAADYAgAgwwEAAACNAgLEAQAAAI0CCMUBAAAAjQIIygEAANcCjQIiBwYAAKcCACAnAADYAgAgKAAA2AIAIMMBAAAAjQICxAEAAACNAgjFAQAAAI0CCMoBAADXAo0CIgTDAQAAAI0CAsQBAAAAjQIIxQEAAACNAgjKAQAA2AKNAiITuwEAANkCADC8AQAAUwAQvQEAANkCADC-AQEAowIAIcIBQAClAgAh2QEgALECACHbAUAApQIAIYQCAQCjAgAhhQIBAKQCACGGAgEApAIAIYcCAQCkAgAhiAIBAKQCACGKAgAAtwIAIJMCAADaApMCIpUCAADbApUCIpYCAQCkAgAhlwJAALACACGYAkAAsAIAIZkCAgC6AgAhBwYAAKcCACAnAADfAgAgKAAA3wIAIMMBAAAAkwICxAEAAACTAgjFAQAAAJMCCMoBAADeApMCIgcGAACnAgAgJwAA3QIAICgAAN0CACDDAQAAAJUCAsQBAAAAlQIIxQEAAACVAgjKAQAA3AKVAiIHBgAApwIAICcAAN0CACAoAADdAgAgwwEAAACVAgLEAQAAAJUCCMUBAAAAlQIIygEAANwClQIiBMMBAAAAlQICxAEAAACVAgjFAQAAAJUCCMoBAADdApUCIgcGAACnAgAgJwAA3wIAICgAAN8CACDDAQAAAJMCAsQBAAAAkwIIxQEAAACTAgjKAQAA3gKTAiIEwwEAAACTAgLEAQAAAJMCCMUBAAAAkwIIygEAAN8CkwIiGQUAAO4CACAHAADqAgAgDgAA7QIAIBAAAOwCACARAADrAgAgEgAA7wIAILsBAADgAgAwvAEAAEAAEL0BAADgAgAwvgEBAOECACHCAUAA6QIAIdkBIADmAgAh2wFAAOkCACGEAgEA4QIAIYUCAQDiAgAhhgIBAOICACGHAgEA4gIAIYgCAQDiAgAhigIAAOUCACCTAgAA4wKTAiKVAgAA5AKVAiKWAgEA4gIAIZcCQADnAgAhmAJAAOcCACGZAgIA6AIAIQvDAQEAAAABxAEBAAAABMUBAQAAAATGAQEAAAABxwEBAAAAAcgBAQAAAAHJAQEAAAABygEBAK0CACHLAQEAAAABzAEBAAAAAc0BAQAAAAELwwEBAAAAAcQBAQAAAAXFAQEAAAAFxgEBAAAAAccBAQAAAAHIAQEAAAAByQEBAAAAAcoBAQCrAgAhywEBAAAAAcwBAQAAAAHNAQEAAAABBMMBAAAAkwICxAEAAACTAgjFAQAAAJMCCMoBAADfApMCIgTDAQAAAJUCAsQBAAAAlQIIxQEAAACVAgjKAQAA3QKVAiIMwwGAAAAAAcYBgAAAAAHHAYAAAAAByAGAAAAAAckBgAAAAAHKAYAAAAAB4gEBAAAAAeMBAQAAAAHkAQEAAAAB5QGAAAAAAeYBgAAAAAHnAYAAAAABAsMBIAAAAAHKASAAswIAIQjDAUAAAAABxAFAAAAABcUBQAAAAAXGAUAAAAABxwFAAAAAAcgBQAAAAAHJAUAAAAABygFAALUCACEIwwECAAAAAcQBAgAAAATFAQIAAAAExgECAAAAAccBAgAAAAHIAQIAAAAByQECAAAAAcoBAgCnAgAhCMMBQAAAAAHEAUAAAAAExQFAAAAABMYBQAAAAAHHAUAAAAAByAFAAAAAAckBQAAAAAHKAUAAqAIAIQOaAgAAAwAgmwIAAAMAIJwCAAADACADmgIAAA0AIJsCAAANACCcAgAADQAgA5oCAAARACCbAgAAEQAgnAIAABEAIAOaAgAAFQAgmwIAABUAIJwCAAAVACADmgIAAAcAIJsCAAAHACCcAgAABwAgA5oCAAAkACCbAgAAJAAgnAIAACQAIA4DAADxAgAgDgAA7QIAILsBAADwAgAwvAEAACQAEL0BAADwAgAwvgEBAOECACHCAUAA6QIAIdABAQDhAgAh2QEgAOYCACHaAUAA5wIAIdsBQADpAgAhhAIBAOECACGGAgEA4gIAIYcCAQDiAgAhGwUAAO4CACAHAADqAgAgDgAA7QIAIBAAAOwCACARAADrAgAgEgAA7wIAILsBAADgAgAwvAEAAEAAEL0BAADgAgAwvgEBAOECACHCAUAA6QIAIdkBIADmAgAh2wFAAOkCACGEAgEA4QIAIYUCAQDiAgAhhgIBAOICACGHAgEA4gIAIYgCAQDiAgAhigIAAOUCACCTAgAA4wKTAiKVAgAA5AKVAiKWAgEA4gIAIZcCQADnAgAhmAJAAOcCACGZAgIA6AIAIaACAABAACChAgAAQAAgFAkAAPMCACAKAAD0AgAguwEAAPICADC8AQAALAAQvQEAAPICADC-AQEA4QIAIcIBQADpAgAhzwEBAOICACHQAQEA4QIAIdEBAQDhAgAh0gEBAOECACHTAQEA4gIAIdQBAQDiAgAh1QEBAOICACHWAQEA4gIAIdcBAQDiAgAh2AFAAOcCACHZASAA5gIAIdoBQADnAgAh2wFAAOkCACEXAwAA8QIAIAsAAIkDACAOAADtAgAgEAAA7AIAILsBAACIAwAwvAEAAA0AEL0BAACIAwAwvgEBAOECACHCAUAA6QIAIc8BAQDiAgAh0AEBAOECACHZASAA5gIAIdoBQADnAgAh2wFAAOkCACGEAgEA4QIAIYUCAQDiAgAhhgIBAOICACGHAgEA4gIAIYgCAQDiAgAhiQIBAOECACGKAgAA5QIAIKACAAANACChAgAADQAgA5oCAAAZACCbAgAAGQAgnAIAABkAIAkIAAD2AgAguwEAAPUCADC8AQAAHwAQvQEAAPUCADC-AQEA4QIAIb8BAQDhAgAhwAEBAOECACHBAQEA4gIAIcIBQADpAgAhJAMAAPECACAJAADzAgAgCwAA9AIAIAwAAIADACANAACBAwAgDwAAggMAILsBAAD7AgAwvAEAABUAEL0BAAD7AgAwvgEBAOECACHCAUAA6QIAIc8BAQDiAgAh0AEBAOECACHRAQEA4QIAIdoBQADnAgAh2wFAAOkCACHoAQIA6AIAIekBAQDiAgAh6wEAAPwC6wEj7AFAAOkCACHtAUAA5wIAIe8BAAD9Au8BIvABEAD-AgAh8QEgAOYCACHyAQEA4gIAIfMBAQDiAgAh9AEBAOICACH1AQIA_wIAIfYBAQDiAgAh9wFAAOcCACH4AUAA5wIAIfkBAQDiAgAh-gEBAOICACH7AQEA4gIAIaACAAAVACChAgAAFQAgAr8BAQAAAAHOAQEAAAABCQgAAPYCACALAAD5AgAguwEAAPgCADC8AQAAGQAQvQEAAPgCADC-AQEA4QIAIb8BAQDhAgAhzgEBAOECACHPAQEA4gIAIRYJAADzAgAgCgAA9AIAILsBAADyAgAwvAEAACwAEL0BAADyAgAwvgEBAOECACHCAUAA6QIAIc8BAQDiAgAh0AEBAOECACHRAQEA4QIAIdIBAQDhAgAh0wEBAOICACHUAQEA4gIAIdUBAQDiAgAh1gEBAOICACHXAQEA4gIAIdgBQADnAgAh2QEgAOYCACHaAUAA5wIAIdsBQADpAgAhoAIAACwAIKECAAAsACAC0AEBAAAAAegBAgAAAAEiAwAA8QIAIAkAAPMCACALAAD0AgAgDAAAgAMAIA0AAIEDACAPAACCAwAguwEAAPsCADC8AQAAFQAQvQEAAPsCADC-AQEA4QIAIcIBQADpAgAhzwEBAOICACHQAQEA4QIAIdEBAQDhAgAh2gFAAOcCACHbAUAA6QIAIegBAgDoAgAh6QEBAOICACHrAQAA_ALrASPsAUAA6QIAIe0BQADnAgAh7wEAAP0C7wEi8AEQAP4CACHxASAA5gIAIfIBAQDiAgAh8wEBAOICACH0AQEA4gIAIfUBAgD_AgAh9gEBAOICACH3AUAA5wIAIfgBQADnAgAh-QEBAOICACH6AQEA4gIAIfsBAQDiAgAhBMMBAAAA6wEDxAEAAADrAQnFAQAAAOsBCcoBAADGAusBIwTDAQAAAO8BAsQBAAAA7wEIxQEAAADvAQjKAQAAxALvASIIwwEQAAAAAcQBEAAAAAXFARAAAAAFxgEQAAAAAccBEAAAAAHIARAAAAAByQEQAAAAAcoBEADCAgAhCMMBAgAAAAHEAQIAAAAFxQECAAAABcYBAgAAAAHHAQIAAAAByAECAAAAAckBAgAAAAHKAQIAqgIAIQOaAgAAHwAgmwIAAB8AIJwCAAAfACAYAwAA8QIAIAkAAPMCACAOAADtAgAguwEAAIMDADC8AQAAEQAQvQEAAIMDADC-AQEA4QIAIcIBQADpAgAhzwEBAOICACHQAQEA4QIAIdEBAQDhAgAh2gFAAOcCACHbAUAA6QIAIesBAAD8AusBI-8BAACGA4ICIvABEACFAwAh_QEAAIQD_QEi_gFAAOkCACH_AUAA6QIAIYACQADnAgAhggICAOgCACGDAkAA5wIAIaACAAARACChAgAAEQAgEAMAAPECACAOAADtAgAguwEAAPACADC8AQAAJAAQvQEAAPACADC-AQEA4QIAIcIBQADpAgAh0AEBAOECACHZASAA5gIAIdoBQADnAgAh2wFAAOkCACGEAgEA4QIAIYYCAQDiAgAhhwIBAOICACGgAgAAJAAgoQIAACQAIBYDAADxAgAgCQAA8wIAIA4AAO0CACC7AQAAgwMAMLwBAAARABC9AQAAgwMAML4BAQDhAgAhwgFAAOkCACHPAQEA4gIAIdABAQDhAgAh0QEBAOECACHaAUAA5wIAIdsBQADpAgAh6wEAAPwC6wEj7wEAAIYDggIi8AEQAIUDACH9AQAAhAP9ASL-AUAA6QIAIf8BQADpAgAhgAJAAOcCACGCAgIA6AIAIYMCQADnAgAhBMMBAAAA_QECxAEAAAD9AQjFAQAAAP0BCMoBAADSAv0BIgjDARAAAAABxAEQAAAABMUBEAAAAATGARAAAAABxwEQAAAAAcgBEAAAAAHJARAAAAABygEQANACACEEwwEAAACCAgLEAQAAAIICCMUBAAAAggIIygEAAM4CggIiAtABAQAAAAGIAgEAAAABFQMAAPECACALAACJAwAgDgAA7QIAIBAAAOwCACC7AQAAiAMAMLwBAAANABC9AQAAiAMAML4BAQDhAgAhwgFAAOkCACHPAQEA4gIAIdABAQDhAgAh2QEgAOYCACHaAUAA5wIAIdsBQADpAgAhhAIBAOECACGFAgEA4gIAIYYCAQDiAgAhhwIBAOICACGIAgEA4gIAIYkCAQDhAgAhigIAAOUCACADmgIAACwAIJsCAAAsACCcAgAALAAgDgMAAPECACAEAACLAwAguwEAAIoDADC8AQAABwAQvQEAAIoDADC-AQEA4QIAIcIBQADpAgAh0AEBAOECACHcAQEA4gIAId0BAQDhAgAh3gEBAOECACHfAQEA4QIAIeABAADlAgAg4QEAAOUCACAVAwAA8QIAIAUAAO4CACC7AQAAjAMAMLwBAAADABC9AQAAjAMAML4BAQDhAgAhwgFAAOkCACHQAQEA4QIAIdkBIADmAgAh2gFAAOcCACHbAUAA6QIAIYQCAQDhAgAhhgIBAOECACGLAgEA4QIAIY0CAACNA40CIo4CQADnAgAhjwIBAOICACGQAgEA4gIAIZECQADnAgAhoAIAAAMAIKECAAADACATAwAA8QIAIAUAAO4CACC7AQAAjAMAMLwBAAADABC9AQAAjAMAML4BAQDhAgAhwgFAAOkCACHQAQEA4QIAIdkBIADmAgAh2gFAAOcCACHbAUAA6QIAIYQCAQDhAgAhhgIBAOECACGLAgEA4QIAIY0CAACNA40CIo4CQADnAgAhjwIBAOICACGQAgEA4gIAIZECQADnAgAhBMMBAAAAjQICxAEAAACNAgjFAQAAAI0CCMoBAADYAo0CIgAAAAABpQIBAAAAAQGlAgEAAAABAaUCQAAAAAEFHwAAhgYAICAAAIkGACCiAgAAhwYAIKMCAACIBgAgqAIAABcAIAMfAACGBgAgogIAAIcGACCoAgAAFwAgAAAABR8AAP4FACAgAACEBgAgogIAAP8FACCjAgAAgwYAIKgCAAAXACAFHwAA_AUAICAAAIEGACCiAgAA_QUAIKMCAACABgAgqAIAAC4AIAMfAAD-BQAgogIAAP8FACCoAgAAFwAgAx8AAPwFACCiAgAA_QUAIKgCAAAuACAAAAABpQJAAAAAAQGlAiAAAAABBR8AAPYFACAgAAD6BQAgogIAAPcFACCjAgAA-QUAIKgCAAAPACALHwAApQMAMCAAAKoDADCiAgAApgMAMKMCAACnAwAwpAIAAKgDACClAgAAqQMAMKYCAACpAwAwpwIAAKkDADCoAgAAqQMAMKkCAACrAwAwqgIAAKwDADAECAAAnAMAIL4BAQAAAAG_AQEAAAABzwEBAAAAAQIAAAAbACAfAACwAwAgAwAAABsAIB8AALADACAgAACvAwAgARgAAPgFADAKCAAA9gIAIAsAAPkCACC7AQAA-AIAMLwBAAAZABC9AQAA-AIAML4BAQAAAAG_AQEA4QIAIc4BAQDhAgAhzwEBAOICACGdAgAA9wIAIAIAAAAbACAYAACvAwAgAgAAAK0DACAYAACuAwAgB7sBAACsAwAwvAEAAK0DABC9AQAArAMAML4BAQDhAgAhvwEBAOECACHOAQEA4QIAIc8BAQDiAgAhB7sBAACsAwAwvAEAAK0DABC9AQAArAMAML4BAQDhAgAhvwEBAOECACHOAQEA4QIAIc8BAQDiAgAhA74BAQCSAwAhvwEBAJIDACHPAQEAkwMAIQQIAACaAwAgvgEBAJIDACG_AQEAkgMAIc8BAQCTAwAhBAgAAJwDACC-AQEAAAABvwEBAAAAAc8BAQAAAAEDHwAA9gUAIKICAAD3BQAgqAIAAA8AIAQfAAClAwAwogIAAKYDADCkAgAAqAMAIKgCAACpAwAwAAAABR8AAO4FACAgAAD0BQAgogIAAO8FACCjAgAA8wUAIKgCAAABACAHHwAA7AUAICAAAPEFACCiAgAA7QUAIKMCAADwBQAgpgIAAAMAIKcCAAADACCoAgAABQAgAx8AAO4FACCiAgAA7wUAIKgCAAABACADHwAA7AUAIKICAADtBQAgqAIAAAUAIAAAAAAABaUCAgAAAAGrAgIAAAABrAICAAAAAa0CAgAAAAGuAgIAAAABAaUCAAAA6wEDAaUCAAAA7wECBaUCEAAAAAGrAhAAAAABrAIQAAAAAa0CEAAAAAGuAhAAAAABBaUCAgAAAAGrAgIAAAABrAICAAAAAa0CAgAAAAGuAgIAAAABCx8AANYDADAgAADaAwAwogIAANcDADCjAgAA2AMAMKQCAADZAwAgpQIAAKkDADCmAgAAqQMAMKcCAACpAwAwqAIAAKkDADCpAgAA2wMAMKoCAACsAwAwCx8AAMoDADAgAADPAwAwogIAAMsDADCjAgAAzAMAMKQCAADNAwAgpQIAAM4DADCmAgAAzgMAMKcCAADOAwAwqAIAAM4DADCpAgAA0AMAMKoCAADRAwAwBR8AANwFACAgAADqBQAgogIAAN0FACCjAgAA6QUAIKgCAAABACAHHwAA2gUAICAAAOcFACCiAgAA2wUAIKMCAADmBQAgpgIAABEAIKcCAAARACCoAgAAEwAgBR8AANgFACAgAADkBQAgogIAANkFACCjAgAA4wUAIKgCAAAPACAHHwAA1gUAICAAAOEFACCiAgAA1wUAIKMCAADgBQAgpgIAACQAIKcCAAAkACCoAgAANwAgBL4BAQAAAAHAAQEAAAABwQEBAAAAAcIBQAAAAAECAAAAIQAgHwAA1QMAIAMAAAAhACAfAADVAwAgIAAA1AMAIAEYAADfBQAwCQgAAPYCACC7AQAA9QIAMLwBAAAfABC9AQAA9QIAML4BAQAAAAG_AQEA4QIAIcABAQDhAgAhwQEBAOICACHCAUAA6QIAIQIAAAAhACAYAADUAwAgAgAAANIDACAYAADTAwAgCLsBAADRAwAwvAEAANIDABC9AQAA0QMAML4BAQDhAgAhvwEBAOECACHAAQEA4QIAIcEBAQDiAgAhwgFAAOkCACEIuwEAANEDADC8AQAA0gMAEL0BAADRAwAwvgEBAOECACG_AQEA4QIAIcABAQDhAgAhwQEBAOICACHCAUAA6QIAIQS-AQEAkgMAIcABAQCSAwAhwQEBAJMDACHCAUAAlAMAIQS-AQEAkgMAIcABAQCSAwAhwQEBAJMDACHCAUAAlAMAIQS-AQEAAAABwAEBAAAAAcEBAQAAAAHCAUAAAAABBAsAAJ0DACC-AQEAAAABzgEBAAAAAc8BAQAAAAECAAAAGwAgHwAA3gMAIAMAAAAbACAfAADeAwAgIAAA3QMAIAEYAADeBQAwAgAAABsAIBgAAN0DACACAAAArQMAIBgAANwDACADvgEBAJIDACHOAQEAkgMAIc8BAQCTAwAhBAsAAJsDACC-AQEAkgMAIc4BAQCSAwAhzwEBAJMDACEECwAAnQMAIL4BAQAAAAHOAQEAAAABzwEBAAAAAQQfAADWAwAwogIAANcDADCkAgAA2QMAIKgCAACpAwAwBB8AAMoDADCiAgAAywMAMKQCAADNAwAgqAIAAM4DADADHwAA3AUAIKICAADdBQAgqAIAAAEAIAMfAADaBQAgogIAANsFACCoAgAAEwAgAx8AANgFACCiAgAA2QUAIKgCAAAPACADHwAA1gUAIKICAADXBQAgqAIAADcAIAAAAAAAAaUCAAAA_QECBaUCEAAAAAGrAhAAAAABrAIQAAAAAa0CEAAAAAGuAhAAAAABAaUCAAAAggICCx8AAPADADAgAAD1AwAwogIAAPEDADCjAgAA8gMAMKQCAADzAwAgpQIAAPQDADCmAgAA9AMAMKcCAAD0AwAwqAIAAPQDADCpAgAA9gMAMKoCAAD3AwAwBR8AAM0FACAgAADUBQAgogIAAM4FACCjAgAA0wUAIKgCAAABACAFHwAAywUAICAAANEFACCiAgAAzAUAIKMCAADQBQAgqAIAAA8AIB0DAADhAwAgCQAA4wMAIAsAAN8DACAMAADgAwAgDwAA5AMAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdABAQAAAAHRAQEAAAAB2gFAAAAAAdsBQAAAAAHoAQIAAAAB6wEAAADrAQPsAUAAAAAB7QFAAAAAAe8BAAAA7wEC8AEQAAAAAfEBIAAAAAHyAQEAAAAB8wEBAAAAAfQBAQAAAAH1AQIAAAAB9gEBAAAAAfcBQAAAAAH4AUAAAAAB-QEBAAAAAfoBAQAAAAH7AQEAAAABAgAAABcAIB8AAPsDACADAAAAFwAgHwAA-wMAICAAAPoDACABGAAAzwUAMCMDAADxAgAgCQAA8wIAIAsAAPQCACAMAACAAwAgDQAAgQMAIA8AAIIDACC7AQAA-wIAMLwBAAAVABC9AQAA-wIAML4BAQAAAAHCAUAA6QIAIc8BAQDiAgAh0AEBAOECACHRAQEA4QIAIdoBQADnAgAh2wFAAOkCACHoAQIA6AIAIekBAQDiAgAh6wEAAPwC6wEj7AFAAOkCACHtAUAA5wIAIe8BAAD9Au8BIvABEAD-AgAh8QEgAOYCACHyAQEA4gIAIfMBAQDiAgAh9AEBAOICACH1AQIA_wIAIfYBAQAAAAH3AUAA5wIAIfgBQADnAgAh-QEBAOICACH6AQEA4gIAIfsBAQDiAgAhngIAAPoCACACAAAAFwAgGAAA-gMAIAIAAAD4AwAgGAAA-QMAIBy7AQAA9wMAMLwBAAD4AwAQvQEAAPcDADC-AQEA4QIAIcIBQADpAgAhzwEBAOICACHQAQEA4QIAIdEBAQDhAgAh2gFAAOcCACHbAUAA6QIAIegBAgDoAgAh6QEBAOICACHrAQAA_ALrASPsAUAA6QIAIe0BQADnAgAh7wEAAP0C7wEi8AEQAP4CACHxASAA5gIAIfIBAQDiAgAh8wEBAOICACH0AQEA4gIAIfUBAgD_AgAh9gEBAOICACH3AUAA5wIAIfgBQADnAgAh-QEBAOICACH6AQEA4gIAIfsBAQDiAgAhHLsBAAD3AwAwvAEAAPgDABC9AQAA9wMAML4BAQDhAgAhwgFAAOkCACHPAQEA4gIAIdABAQDhAgAh0QEBAOECACHaAUAA5wIAIdsBQADpAgAh6AECAOgCACHpAQEA4gIAIesBAAD8AusBI-wBQADpAgAh7QFAAOcCACHvAQAA_QLvASLwARAA_gIAIfEBIADmAgAh8gEBAOICACHzAQEA4gIAIfQBAQDiAgAh9QECAP8CACH2AQEA4gIAIfcBQADnAgAh-AFAAOcCACH5AQEA4gIAIfoBAQDiAgAh-wEBAOICACEYvgEBAJIDACHCAUAAlAMAIc8BAQCTAwAh0AEBAJIDACHRAQEAkgMAIdoBQAChAwAh2wFAAJQDACHoAQIAvwMAIesBAADAA-sBI-wBQACUAwAh7QFAAKEDACHvAQAAwQPvASLwARAAwgMAIfEBIACiAwAh8gEBAJMDACHzAQEAkwMAIfQBAQCTAwAh9QECAMMDACH2AQEAkwMAIfcBQAChAwAh-AFAAKEDACH5AQEAkwMAIfoBAQCTAwAh-wEBAJMDACEdAwAAxgMAIAkAAMgDACALAADEAwAgDAAAxQMAIA8AAMkDACC-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdEBAQCSAwAh2gFAAKEDACHbAUAAlAMAIegBAgC_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-sBI-wBQACUAwAh7QFAAKEDACHvAQAAwQPvASLwARAAwgMAIfEBIACiAwAh8gEBAJMDACHzAQEAkwMAIfQBAQCTAwAh9QECAMMDACH2AQEAkwMAIfcBQAChAwAh-AFAAKEDACH5AQEAkwMAIfoBAQCTAwAh-wEBAJMDACEdAwAAxgMAIAsAAMQDACAMAADFAwAgDQAAxwMAIA8AAMkDACC-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdoBQAChAwAh2wFAAJQDACHoAQIAvwMAIekBAQCTAwAh6wEAAMAD6wEj7AFAAJQDACHtAUAAoQMAIe8BAADBA-8BIvABEADCAwAh8QEgAKIDACHyAQEAkwMAIfMBAQCTAwAh9AEBAJMDACH1AQIAwwMAIfYBAQCTAwAh9wFAAKEDACH4AUAAoQMAIfkBAQCTAwAh-gEBAJMDACH7AQEAkwMAIR0DAADhAwAgCwAA3wMAIAwAAOADACANAADiAwAgDwAA5AMAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdABAQAAAAHaAUAAAAAB2wFAAAAAAegBAgAAAAHpAQEAAAAB6wEAAADrAQPsAUAAAAAB7QFAAAAAAe8BAAAA7wEC8AEQAAAAAfEBIAAAAAHyAQEAAAAB8wEBAAAAAfQBAQAAAAH1AQIAAAAB9gEBAAAAAfcBQAAAAAH4AUAAAAAB-QEBAAAAAfoBAQAAAAH7AQEAAAABEQMAAP0DACAOAAD8AwAgvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdoBQAAAAAHbAUAAAAAB6wEAAADrAQPvAQAAAIICAvABEAAAAAH9AQAAAP0BAv4BQAAAAAH_AUAAAAABgAJAAAAAAYICAgAAAAGDAkAAAAABAgAAABMAIB8AAKYEACADAAAAEwAgHwAApgQAICAAAKUEACABGAAAxQUAMBYDAADxAgAgCQAA8wIAIA4AAO0CACC7AQAAgwMAMLwBAAARABC9AQAAgwMAML4BAQAAAAHCAUAA6QIAIc8BAQDiAgAh0AEBAOECACHRAQEA4QIAIdoBQADnAgAh2wFAAOkCACHrAQAA_ALrASPvAQAAhgOCAiLwARAAhQMAIf0BAACEA_0BIv4BQADpAgAh_wFAAOkCACGAAkAA5wIAIYICAgDoAgAhgwJAAOcCACECAAAAEwAgGAAApQQAIAIAAACjBAAgGAAApAQAIBO7AQAAogQAMLwBAACjBAAQvQEAAKIEADC-AQEA4QIAIcIBQADpAgAhzwEBAOICACHQAQEA4QIAIdEBAQDhAgAh2gFAAOcCACHbAUAA6QIAIesBAAD8AusBI-8BAACGA4ICIvABEACFAwAh_QEAAIQD_QEi_gFAAOkCACH_AUAA6QIAIYACQADnAgAhggICAOgCACGDAkAA5wIAIRO7AQAAogQAMLwBAACjBAAQvQEAAKIEADC-AQEA4QIAIcIBQADpAgAhzwEBAOICACHQAQEA4QIAIdEBAQDhAgAh2gFAAOcCACHbAUAA6QIAIesBAAD8AusBI-8BAACGA4ICIvABEACFAwAh_QEAAIQD_QEi_gFAAOkCACH_AUAA6QIAIYACQADnAgAhggICAOgCACGDAkAA5wIAIQ--AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdoBQAChAwAh2wFAAJQDACHrAQAAwAPrASPvAQAA7AOCAiLwARAA6wMAIf0BAADqA_0BIv4BQACUAwAh_wFAAJQDACGAAkAAoQMAIYICAgC_AwAhgwJAAKEDACERAwAA7gMAIA4AAO0DACC-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdoBQAChAwAh2wFAAJQDACHrAQAAwAPrASPvAQAA7AOCAiLwARAA6wMAIf0BAADqA_0BIv4BQACUAwAh_wFAAJQDACGAAkAAoQMAIYICAgC_AwAhgwJAAKEDACERAwAA_QMAIA4AAPwDACC-AQEAAAABwgFAAAAAAc8BAQAAAAHQAQEAAAAB2gFAAAAAAdsBQAAAAAHrAQAAAOsBA-8BAAAAggIC8AEQAAAAAf0BAAAA_QEC_gFAAAAAAf8BQAAAAAGAAkAAAAABggICAAAAAYMCQAAAAAEEHwAAmwQAMKICAACcBAAwpAIAAJ4EACCoAgAAnwQAMAQfAACSBAAwogIAAJMEADCkAgAAlQQAIKgCAAD0AwAwBB8AAIYEADCiAgAAhwQAMKQCAACJBAAgqAIAAIoEADADHwAAwwUAIKICAADEBQAgqAIAAAEAIAAAAAsfAACwBAAwIAAAtAQAMKICAACxBAAwowIAALIEADCkAgAAswQAIKUCAAD0AwAwpgIAAPQDADCnAgAA9AMAMKgCAAD0AwAwqQIAALUEADCqAgAA9wMAMAUfAAC9BQAgIAAAwQUAIKICAAC-BQAgowIAAMAFACCoAgAAAQAgHQMAAOEDACAJAADjAwAgCwAA3wMAIAwAAOADACANAADiAwAgvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdEBAQAAAAHaAUAAAAAB2wFAAAAAAegBAgAAAAHpAQEAAAAB6wEAAADrAQPsAUAAAAAB7QFAAAAAAe8BAAAA7wEC8AEQAAAAAfEBIAAAAAHzAQEAAAAB9AEBAAAAAfUBAgAAAAH2AQEAAAAB9wFAAAAAAfgBQAAAAAH5AQEAAAAB-gEBAAAAAfsBAQAAAAECAAAAFwAgHwAAuAQAIAMAAAAXACAfAAC4BAAgIAAAtwQAIAEYAAC_BQAwAgAAABcAIBgAALcEACACAAAA-AMAIBgAALYEACAYvgEBAJIDACHCAUAAlAMAIc8BAQCTAwAh0AEBAJIDACHRAQEAkgMAIdoBQAChAwAh2wFAAJQDACHoAQIAvwMAIekBAQCTAwAh6wEAAMAD6wEj7AFAAJQDACHtAUAAoQMAIe8BAADBA-8BIvABEADCAwAh8QEgAKIDACHzAQEAkwMAIfQBAQCTAwAh9QECAMMDACH2AQEAkwMAIfcBQAChAwAh-AFAAKEDACH5AQEAkwMAIfoBAQCTAwAh-wEBAJMDACEdAwAAxgMAIAkAAMgDACALAADEAwAgDAAAxQMAIA0AAMcDACC-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdEBAQCSAwAh2gFAAKEDACHbAUAAlAMAIegBAgC_AwAh6QEBAJMDACHrAQAAwAPrASPsAUAAlAMAIe0BQAChAwAh7wEAAMED7wEi8AEQAMIDACHxASAAogMAIfMBAQCTAwAh9AEBAJMDACH1AQIAwwMAIfYBAQCTAwAh9wFAAKEDACH4AUAAoQMAIfkBAQCTAwAh-gEBAJMDACH7AQEAkwMAIR0DAADhAwAgCQAA4wMAIAsAAN8DACAMAADgAwAgDQAA4gMAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdABAQAAAAHRAQEAAAAB2gFAAAAAAdsBQAAAAAHoAQIAAAAB6QEBAAAAAesBAAAA6wED7AFAAAAAAe0BQAAAAAHvAQAAAO8BAvABEAAAAAHxASAAAAAB8wEBAAAAAfQBAQAAAAH1AQIAAAAB9gEBAAAAAfcBQAAAAAH4AUAAAAAB-QEBAAAAAfoBAQAAAAH7AQEAAAABBB8AALAEADCiAgAAsQQAMKQCAACzBAAgqAIAAPQDADADHwAAvQUAIKICAAC-BQAgqAIAAAEAIAAAAAGlAgAAAI0CAgsfAADBBAAwIAAAxgQAMKICAADCBAAwowIAAMMEADCkAgAAxAQAIKUCAADFBAAwpgIAAMUEADCnAgAAxQQAMKgCAADFBAAwqQIAAMcEADCqAgAAyAQAMAUfAAC3BQAgIAAAuwUAIKICAAC4BQAgowIAALoFACCoAgAAAQAgCQMAALgDACC-AQEAAAABwgFAAAAAAdABAQAAAAHdAQEAAAAB3gEBAAAAAd8BAQAAAAHgAYAAAAAB4QGAAAAAAQIAAAAJACAfAADMBAAgAwAAAAkAIB8AAMwEACAgAADLBAAgARgAALkFADAOAwAA8QIAIAQAAIsDACC7AQAAigMAMLwBAAAHABC9AQAAigMAML4BAQAAAAHCAUAA6QIAIdABAQDhAgAh3AEBAOICACHdAQEA4QIAId4BAQDhAgAh3wEBAOECACHgAQAA5QIAIOEBAADlAgAgAgAAAAkAIBgAAMsEACACAAAAyQQAIBgAAMoEACAMuwEAAMgEADC8AQAAyQQAEL0BAADIBAAwvgEBAOECACHCAUAA6QIAIdABAQDhAgAh3AEBAOICACHdAQEA4QIAId4BAQDhAgAh3wEBAOECACHgAQAA5QIAIOEBAADlAgAgDLsBAADIBAAwvAEAAMkEABC9AQAAyAQAML4BAQDhAgAhwgFAAOkCACHQAQEA4QIAIdwBAQDiAgAh3QEBAOECACHeAQEA4QIAId8BAQDhAgAh4AEAAOUCACDhAQAA5QIAIAi-AQEAkgMAIcIBQACUAwAh0AEBAJIDACHdAQEAkgMAId4BAQCSAwAh3wEBAJIDACHgAYAAAAAB4QGAAAAAAQkDAAC2AwAgvgEBAJIDACHCAUAAlAMAIdABAQCSAwAh3QEBAJIDACHeAQEAkgMAId8BAQCSAwAh4AGAAAAAAeEBgAAAAAEJAwAAuAMAIL4BAQAAAAHCAUAAAAAB0AEBAAAAAd0BAQAAAAHeAQEAAAAB3wEBAAAAAeABgAAAAAHhAYAAAAABBB8AAMEEADCiAgAAwgQAMKQCAADEBAAgqAIAAMUEADADHwAAtwUAIKICAAC4BQAgqAIAAAEAIAAAAAAAAaUCAAAAkwICAaUCAAAAlQICCx8AAI8FADAgAACUBQAwogIAAJAFADCjAgAAkQUAMKQCAACSBQAgpQIAAJMFADCmAgAAkwUAMKcCAACTBQAwqAIAAJMFADCpAgAAlQUAMKoCAACWBQAwCx8AAIMFADAgAACIBQAwogIAAIQFADCjAgAAhQUAMKQCAACGBQAgpQIAAIcFADCmAgAAhwUAMKcCAACHBQAwqAIAAIcFADCpAgAAiQUAMKoCAACKBQAwCx8AAPoEADAgAAD-BAAwogIAAPsEADCjAgAA_AQAMKQCAAD9BAAgpQIAAJ8EADCmAgAAnwQAMKcCAACfBAAwqAIAAJ8EADCpAgAA_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_AwAh6QEBAJMDACHrAQAAwAPrASPsAUAAlAMAIe0BQAChAwAh7wEAAMED7wEi8AEQAMIDACHxASAAogMAIfIBAQCTAwAh8wEBAJMDACH0AQEAkwMAIfUBAgDDAwAh9gEBAJMDACH3AUAAoQMAIfgBQAChAwAh-QEBAJMDACH6AQEAkwMAIfsBAQCTAwAhHQkAAMgDACALAADEAwAgDAAAxQMAIA0AAMcDACAPAADJAwAgvgEBAJIDACHCAUAAlAMAIc8BAQCTAwAh0QEBAJIDACHaAUAAoQMAIdsBQACUAwAh6AECAL8DACHpAQEAkwMAIesBAADAA-sBI-wBQACUAwAh7QFAAKEDACHvAQAAwQPvASLwARAAwgMAIfEBIACiAwAh8gEBAJMDACHzAQEAkwMAIfQBAQCTAwAh9QECAMMDACH2AQEAkwMAIfcBQAChAwAh-AFAAKEDACH5AQEAkwMAIfoBAQCTAwAh-wEBAJMDACEdCQAA4wMAIAsAAN8DACAMAADgAwAgDQAA4gMAIA8AAOQDACC-AQEAAAABwgFAAAAAAc8BAQAAAAHRAQEAAAAB2gFAAAAAAdsBQAAAAAHoAQIAAAAB6QEBAAAAAesBAAAA6wED7AFAAAAAAe0BQAAAAAHvAQAAAO8BAvABEAAAAAHxASAAAAAB8gEBAAAAAfMBAQAAAAH0AQEAAAAB9QECAAAAAfYBAQAAAAH3AUAAAAAB-AFAAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAREJAAD-AwAgDgAA_AMAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdEBAQAAAAHaAUAAAAAB2wFAAAAAAesBAAAA6wED7wEAAACCAgLwARAAAAAB_QEAAAD9AQL-AUAAAAAB_wFAAAAAAYACQAAAAAGCAgIAAAABgwJAAAAAAQIAAAATACAfAACCBQAgAwAAABMAIB8AAIIFACAgAACBBQAgARgAALMFADACAAAAEwAgGAAAgQUAIAIAAACjBAAgGAAAgAUAIA--AQEAkgMAIcIBQACUAwAhzwEBAJMDACHRAQEAkgMAIdoBQAChAwAh2wFAAJQDACHrAQAAwAPrASPvAQAA7AOCAiLwARAA6wMAIf0BAADqA_0BIv4BQACUAwAh_wFAAJQDACGAAkAAoQMAIYICAgC_AwAhgwJAAKEDACERCQAA7wMAIA4AAO0DACC-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHRAQEAkgMAIdoBQAChAwAh2wFAAJQDACHrAQAAwAPrASPvAQAA7AOCAiLwARAA6wMAIf0BAADqA_0BIv4BQACUAwAh_wFAAJQDACGAAkAAoQMAIYICAgC_AwAhgwJAAKEDACERCQAA_gMAIA4AAPwDACC-AQEAAAABwgFAAAAAAc8BAQAAAAHRAQEAAAAB2gFAAAAAAdsBQAAAAAHrAQAAAOsBA-8BAAAAggIC8AEQAAAAAf0BAAAA_QEC_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_QQAIKgCAACfBAAwBB8AAPEEADCiAgAA8gQAMKQCAAD0BAAgqAIAAPQDADAEHwAA6AQAMKICAADpBAAwpAIAAOsEACCoAgAAxQQAMAQfAADcBAAwogIAAN0EADCkAgAA3wQAIKgCAADgBAAwAAAAAAAADgUAAKUFACAHAAChBQAgDgAApAUAIBAAAKMFACARAACiBQAgEgAApgUAIIUCAACOAwAghgIAAI4DACCHAgAAjgMAIIgCAACOAwAgigIAAI4DACCWAgAAjgMAIJcCAACOAwAgmAIAAI4DACALAwAApwUAIAsAAK8FACAOAACkBQAgEAAAowUAIM8BAACOAwAg2gEAAI4DACCFAgAAjgMAIIYCAACOAwAghwIAAI4DACCIAgAAjgMAIIoCAACOAwAgABYDAACnBQAgCQAAqAUAIAsAAKkFACAMAACsBQAgDQAArQUAIA8AAK4FACDPAQAAjgMAINoBAACOAwAg6QEAAI4DACDrAQAAjgMAIO0BAACOAwAg8AEAAI4DACDyAQAAjgMAIPMBAACOAwAg9AEAAI4DACD1AQAAjgMAIPYBAACOAwAg9wEAAI4DACD4AQAAjgMAIPkBAACOAwAg-gEAAI4DACD7AQAAjgMAIAoJAACoBQAgCgAAqQUAIM8BAACOAwAg0wEAAI4DACDUAQAAjgMAINUBAACOAwAg1gEAAI4DACDXAQAAjgMAINgBAACOAwAg2gEAAI4DACAACAMAAKcFACAJAACoBQAgDgAApAUAIM8BAACOAwAg2gEAAI4DACDrAQAAjgMAIIACAACOAwAggwIAAI4DACAFAwAApwUAIA4AAKQFACDaAQAAjgMAIIYCAACOAwAghwIAAI4DACAABwMAAKcFACAFAAClBQAg2gEAAI4DACCOAgAAjgMAII8CAACOAwAgkAIAAI4DACCRAgAAjgMAIA2-AQEAAAABwgFAAAAAAdkBIAAAAAHaAUAAAAAB2wFAAAAAAYQCAQAAAAGGAgEAAAABiwIBAAAAAY0CAAAAjQICjgJAAAAAAY8CAQAAAAGQAgEAAAABkQJAAAAAAQ2-AQEAAAABwgFAAAAAAc8BAQAAAAHZASAAAAAB2gFAAAAAAdsBQAAAAAGEAgEAAAABhQIBAAAAAYYCAQAAAAGHAgEAAAABiAIBAAAAAYkCAQAAAAGKAoAAAAABD74BAQAAAAHCAUAAAAABzwEBAAAAAdEBAQAAAAHaAUAAAAAB2wFAAAAAAesBAAAA6wED7wEAAACCAgLwARAAAAAB_QEAAAD9AQL-AUAAAAAB_wFAAAAAAYACQAAAAAGCAgIAAAABgwJAAAAAARi-AQEAAAABwgFAAAAAAc8BAQAAAAHRAQEAAAAB2gFAAAAAAdsBQAAAAAHoAQIAAAAB6QEBAAAAAesBAAAA6wED7AFAAAAAAe0BQAAAAAHvAQAAAO8BAvABEAAAAAHxASAAAAAB8gEBAAAAAfMBAQAAAAH0AQEAAAAB9QECAAAAAfYBAQAAAAH3AUAAAAAB-AFAAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAQi-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_QEAAAD9AQL-AUAAAAAB_wFAAAAAAYACQAAAAAGCAgIAAAABgwJAAAAAARi-AQEAAAABwgFAAAAAAc8BAQAAAAHQAQEAAAAB2gFAAAAAAdsBQAAAAAHoAQIAAAAB6QEBAAAAAesBAAAA6wED7AFAAAAAAe0BQAAAAAHvAQAAAO8BAvABEAAAAAHxASAAAAAB8gEBAAAAAfMBAQAAAAH0AQEAAAAB9QECAAAAAfYBAQAAAAH3AUAAAAAB-AFAAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAQ6-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_gMAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdABAQAAAAHRAQEAAAAB2gFAAAAAAdsBQAAAAAHrAQAAAOsBA-8BAAAAggIC8AEQAAAAAf0BAAAA_QEC_gFAAAAAAf8BQAAAAAGAAkAAAAABggICAAAAAYMCQAAAAAECAAAAEwAgHwAA2gUAIBUFAACfBQAgBwAAmwUAIBAAAJ0FACARAACcBQAgEgAAoAUAIL4BAQAAAAHCAUAAAAAB2QEgAAAAAdsBQAAAAAGEAgEAAAABhQIBAAAAAYYCAQAAAAGHAgEAAAABiAIBAAAAAYoCgAAAAAGTAgAAAJMCApUCAAAAlQIClgIBAAAAAZcCQAAAAAGYAkAAAAABmQICAAAAAQIAAAABACAfAADcBQAgA74BAQAAAAHOAQEAAAABzwEBAAAAAQS-AQEAAAABwAEBAAAAAcEBAQAAAAHCAUAAAAABAwAAACQAIB8AANYFACAgAADiBQAgDAAAACQAIAMAAK8EACAYAADiBQAgvgEBAJIDACHCAUAAlAMAIdABAQCSAwAh2QEgAKIDACHaAUAAoQMAIdsBQACUAwAhhAIBAJIDACGGAgEAkwMAIYcCAQCTAwAhCgMAAK8EACC-AQEAkgMAIcIBQACUAwAh0AEBAJIDACHZASAAogMAIdoBQAChAwAh2wFAAJQDACGEAgEAkgMAIYYCAQCTAwAhhwIBAJMDACEDAAAADQAgHwAA2AUAICAAAOUFACATAAAADQAgAwAAhQQAIAsAAIQEACAQAACCBAAgGAAA5QUAIL4BAQCSAwAhwgFAAJQDACHPAQEAkwMAIdABAQCSAwAh2QEgAKIDACHaAUAAoQMAIdsBQACUAwAhhAIBAJIDACGFAgEAkwMAIYYCAQCTAwAhhwIBAJMDACGIAgEAkwMAIYkCAQCSAwAhigKAAAAAAREDAACFBAAgCwAAhAQAIBAAAIIEACC-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdkBIACiAwAh2gFAAKEDACHbAUAAlAMAIYQCAQCSAwAhhQIBAJMDACGGAgEAkwMAIYcCAQCTAwAhiAIBAJMDACGJAgEAkgMAIYoCgAAAAAEDAAAAEQAgHwAA2gUAICAAAOgFACAUAAAAEQAgAwAA7gMAIAkAAO8DACAYAADoBQAgvgEBAJIDACHCAUAAlAMAIc8BAQCTAwAh0AEBAJIDACHRAQEAkgMAIdoBQAChAwAh2wFAAJQDACHrAQAAwAPrASPvAQAA7AOCAiLwARAA6wMAIf0BAADqA_0BIv4BQACUAwAh_wFAAJQDACGAAkAAoQMAIYICAgC_AwAhgwJAAKEDACESAwAA7gMAIAkAAO8DACC-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdEBAQCSAwAh2gFAAKEDACHbAUAAlAMAIesBAADAA-sBI-8BAADsA4ICIvABEADrAwAh_QEAAOoD_QEi_gFAAJQDACH_AUAAlAMAIYACQAChAwAhggICAL8DACGDAkAAoQMAIQMAAABAACAfAADcBQAgIAAA6wUAIBcAAABAACAFAADaBAAgBwAA1gQAIBAAANgEACARAADXBAAgEgAA2wQAIBgAAOsFACC-AQEAkgMAIcIBQACUAwAh2QEgAKIDACHbAUAAlAMAIYQCAQCSAwAhhQIBAJMDACGGAgEAkwMAIYcCAQCTAwAhiAIBAJMDACGKAoAAAAABkwIAANQEkwIilQIAANUElQIilgIBAJMDACGXAkAAoQMAIZgCQAChAwAhmQICAL8DACEVBQAA2gQAIAcAANYEACAQAADYBAAgEQAA1wQAIBIAANsEACC-AQEAkgMAIcIBQACUAwAh2QEgAKIDACHbAUAAlAMAIYQCAQCSAwAhhQIBAJMDACGGAgEAkwMAIYcCAQCTAwAhiAIBAJMDACGKAoAAAAABkwIAANQEkwIilQIAANUElQIilgIBAJMDACGXAkAAoQMAIZgCQAChAwAhmQICAL8DACEPAwAAzgQAIL4BAQAAAAHCAUAAAAAB0AEBAAAAAdkBIAAAAAHaAUAAAAAB2wFAAAAAAYQCAQAAAAGGAgEAAAABiwIBAAAAAY0CAAAAjQICjgJAAAAAAY8CAQAAAAGQAgEAAAABkQJAAAAAAQIAAAAFACAfAADsBQAgFQcAAJsFACAOAACeBQAgEAAAnQUAIBEAAJwFACASAACgBQAgvgEBAAAAAcIBQAAAAAHZASAAAAAB2wFAAAAAAYQCAQAAAAGFAgEAAAABhgIBAAAAAYcCAQAAAAGIAgEAAAABigKAAAAAAZMCAAAAkwIClQIAAACVAgKWAgEAAAABlwJAAAAAAZgCQAAAAAGZAgIAAAABAgAAAAEAIB8AAO4FACADAAAAAwAgHwAA7AUAICAAAPIFACARAAAAAwAgAwAAwAQAIBgAAPIFACC-AQEAkgMAIcIBQACUAwAh0AEBAJIDACHZASAAogMAIdoBQAChAwAh2wFAAJQDACGEAgEAkgMAIYYCAQCSAwAhiwIBAJIDACGNAgAAvgSNAiKOAkAAoQMAIY8CAQCTAwAhkAIBAJMDACGRAkAAoQMAIQ8DAADABAAgvgEBAJIDACHCAUAAlAMAIdABAQCSAwAh2QEgAKIDACHaAUAAoQMAIdsBQACUAwAhhAIBAJIDACGGAgEAkgMAIYsCAQCSAwAhjQIAAL4EjQIijgJAAKEDACGPAgEAkwMAIZACAQCTAwAhkQJAAKEDACEDAAAAQAAgHwAA7gUAICAAAPUFACAXAAAAQAAgBwAA1gQAIA4AANkEACAQAADYBAAgEQAA1wQAIBIAANsEACAYAAD1BQAgvgEBAJIDACHCAUAAlAMAIdkBIACiAwAh2wFAAJQDACGEAgEAkgMAIYUCAQCTAwAhhgIBAJMDACGHAgEAkwMAIYgCAQCTAwAhigKAAAAAAZMCAADUBJMCIpUCAADVBJUCIpYCAQCTAwAhlwJAAKEDACGYAkAAoQMAIZkCAgC_AwAhFQcAANYEACAOAADZBAAgEAAA2AQAIBEAANcEACASAADbBAAgvgEBAJIDACHCAUAAlAMAIdkBIACiAwAh2wFAAJQDACGEAgEAkgMAIYUCAQCTAwAhhgIBAJMDACGHAgEAkwMAIYgCAQCTAwAhigKAAAAAAZMCAADUBJMCIpUCAADVBJUCIpYCAQCTAwAhlwJAAKEDACGYAkAAoQMAIZkCAgC_AwAhEQMAAKoEACAOAACoBAAgEAAApwQAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdABAQAAAAHZASAAAAAB2gFAAAAAAdsBQAAAAAGEAgEAAAABhQIBAAAAAYYCAQAAAAGHAgEAAAABiAIBAAAAAYkCAQAAAAGKAoAAAAABAgAAAA8AIB8AAPYFACADvgEBAAAAAb8BAQAAAAHPAQEAAAABAwAAAA0AIB8AAPYFACAgAAD7BQAgEwAAAA0AIAMAAIUEACAOAACDBAAgEAAAggQAIBgAAPsFACC-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdkBIACiAwAh2gFAAKEDACHbAUAAlAMAIYQCAQCSAwAhhQIBAJMDACGGAgEAkwMAIYcCAQCTAwAhiAIBAJMDACGJAgEAkgMAIYoCgAAAAAERAwAAhQQAIA4AAIMEACAQAACCBAAgvgEBAJIDACHCAUAAlAMAIc8BAQCTAwAh0AEBAJIDACHZASAAogMAIdoBQAChAwAh2wFAAJQDACGEAgEAkgMAIYUCAQCTAwAhhgIBAJMDACGHAgEAkwMAIYgCAQCTAwAhiQIBAJIDACGKAoAAAAABEAkAALEDACC-AQEAAAABwgFAAAAAAc8BAQAAAAHQAQEAAAAB0QEBAAAAAdIBAQAAAAHTAQEAAAAB1AEBAAAAAdUBAQAAAAHWAQEAAAAB1wEBAAAAAdgBQAAAAAHZASAAAAAB2gFAAAAAAdsBQAAAAAECAAAALgAgHwAA_AUAIB4DAADhAwAgCQAA4wMAIAwAAOADACANAADiAwAgDwAA5AMAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdABAQAAAAHRAQEAAAAB2gFAAAAAAdsBQAAAAAHoAQIAAAAB6QEBAAAAAesBAAAA6wED7AFAAAAAAe0BQAAAAAHvAQAAAO8BAvABEAAAAAHxASAAAAAB8gEBAAAAAfMBAQAAAAH0AQEAAAAB9QECAAAAAfYBAQAAAAH3AUAAAAAB-AFAAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAQIAAAAXACAfAAD-BQAgAwAAACwAIB8AAPwFACAgAACCBgAgEgAAACwAIAkAAKMDACAYAACCBgAgvgEBAJIDACHCAUAAlAMAIc8BAQCTAwAh0AEBAJIDACHRAQEAkgMAIdIBAQCSAwAh0wEBAJMDACHUAQEAkwMAIdUBAQCTAwAh1gEBAJMDACHXAQEAkwMAIdgBQAChAwAh2QEgAKIDACHaAUAAoQMAIdsBQACUAwAhEAkAAKMDACC-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdEBAQCSAwAh0gEBAJIDACHTAQEAkwMAIdQBAQCTAwAh1QEBAJMDACHWAQEAkwMAIdcBAQCTAwAh2AFAAKEDACHZASAAogMAIdoBQAChAwAh2wFAAJQDACEDAAAAFQAgHwAA_gUAICAAAIUGACAgAAAAFQAgAwAAxgMAIAkAAMgDACAMAADFAwAgDQAAxwMAIA8AAMkDACAYAACFBgAgvgEBAJIDACHCAUAAlAMAIc8BAQCTAwAh0AEBAJIDACHRAQEAkgMAIdoBQAChAwAh2wFAAJQDACHoAQIAvwMAIekBAQCTAwAh6wEAAMAD6wEj7AFAAJQDACHtAUAAoQMAIe8BAADBA-8BIvABEADCAwAh8QEgAKIDACHyAQEAkwMAIfMBAQCTAwAh9AEBAJMDACH1AQIAwwMAIfYBAQCTAwAh9wFAAKEDACH4AUAAoQMAIfkBAQCTAwAh-gEBAJMDACH7AQEAkwMAIR4DAADGAwAgCQAAyAMAIAwAAMUDACANAADHAwAgDwAAyQMAIL4BAQCSAwAhwgFAAJQDACHPAQEAkwMAIdABAQCSAwAh0QEBAJIDACHaAUAAoQMAIdsBQACUAwAh6AECAL8DACHpAQEAkwMAIesBAADAA-sBI-wBQACUAwAh7QFAAKEDACHvAQAAwQPvASLwARAAwgMAIfEBIACiAwAh8gEBAJMDACHzAQEAkwMAIfQBAQCTAwAh9QECAMMDACH2AQEAkwMAIfcBQAChAwAh-AFAAKEDACH5AQEAkwMAIfoBAQCTAwAh-wEBAJMDACEeAwAA4QMAIAkAAOMDACALAADfAwAgDQAA4gMAIA8AAOQDACC-AQEAAAABwgFAAAAAAc8BAQAAAAHQAQEAAAAB0QEBAAAAAdoBQAAAAAHbAUAAAAAB6AECAAAAAekBAQAAAAHrAQAAAOsBA-wBQAAAAAHtAUAAAAAB7wEAAADvAQLwARAAAAAB8QEgAAAAAfIBAQAAAAHzAQEAAAAB9AEBAAAAAfUBAgAAAAH2AQEAAAAB9wFAAAAAAfgBQAAAAAH5AQEAAAAB-gEBAAAAAfsBAQAAAAECAAAAFwAgHwAAhgYAIAMAAAAVACAfAACGBgAgIAAAigYAICAAAAAVACADAADGAwAgCQAAyAMAIAsAAMQDACANAADHAwAgDwAAyQMAIBgAAIoGACC-AQEAkgMAIcIBQACUAwAhzwEBAJMDACHQAQEAkgMAIdEBAQCSAwAh2gFAAKEDACHbAUAAlAMAIegBAgC_AwAh6QEBAJMDACHrAQAAwAPrASPsAUAAlAMAIe0BQAChAwAh7wEAAMED7wEi8AEQAMIDACHxASAAogMAIfIBAQCTAwAh8wEBAJMDACH0AQEAkwMAIfUBAgDDAwAh9gEBAJMDACH3AUAAoQMAIfgBQAChAwAh-QEBAJMDACH6AQEAkwMAIfsBAQCTAwAhHgMAAMYDACAJAADIAwAgCwAAxAMAIA0AAMcDACAPAADJAwAgvgEBAJIDACHCAUAAlAMAIc8BAQCTAwAh0AEBAJIDACHRAQEAkgMAIdoBQAChAwAh2wFAAJQDACHoAQIAvwMAIekBAQCTAwAh6wEAAMAD6wEj7AFAAJQDACHtAUAAoQMAIe8BAADBA-8BIvABEADCAwAh8QEgAKIDACHyAQEAkwMAIfMBAQCTAwAh9AEBAJMDACH1AQIAwwMAIfYBAQCTAwAh9wFAAKEDACH4AUAAoQMAIfkBAQCTAwAh-gEBAJMDACH7AQEAkwMAIQcFNQMGABEHBgIONAcQMwYREAUSOAwDAwABBQoDBgAEAgMAAQQLAgEFDAAFAwABBgAQCy8JDisHEBQGBAMAAQYADwkABQ4YBwcDAAEGAA4JAAULHAgMIgsNIwYPJQwCCAAHCwAJAwYACgkABQodCAEKHgABCAAHAwMAAQYADQ4mBwEOJwACCygADCkAAQ4qAAMLMgAOMQAQMAAGBT0ABzkADjwAEDsAEToAEj4AAAAABQYAFiUAFyYAGCcAGSgAGgAAAAAABQYAFiUAFyYAGCcAGSgAGgEDAAEBAwABAwYAHycAICgAIQAAAAMGAB8nACAoACEBAwABAQMAAQMGACYnACcoACgAAAADBgAmJwAnKAAoAQMAAQEDAAEDBgAtJwAuKAAvAAAAAwYALScALigALwIDAAEJAAUCAwABCQAFBQYANCUANSYANicANygAOAAAAAAABQYANCUANSYANicANygAOAQDAAEJAAUNuAEGD7kBDAQDAAEJAAUNvwEGD8ABDAUGAD0lAD4mAD8nAEAoAEEAAAAAAAUGAD0lAD4mAD8nAEAoAEECAwABBNIBAgIDAAEE2AECAwYARicARygASAAAAAMGAEYnAEcoAEgBCQAFAQkABQMGAE0nAE4oAE8AAAADBgBNJwBOKABPAggABwsACQIIAAcLAAkDBgBUJwBVKABWAAAAAwYAVCcAVSgAVgEIAAcBCAAHAwYAWycAXCgAXQAAAAMGAFsnAFwoAF0TAgEUPwEVQgEWQwEXRAEZRgEaSBIbSRMcSwEdTRIeThQhTwEiUAEjURIpVBUqVRsrVgIsVwItWAIuWQIvWgIwXAIxXhIyXxwzYQI0YxI1ZB02ZQI3ZgI4ZxI5ah46ayI7bAw8bQw9bgw-bww_cAxAcgxBdBJCdSNDdwxEeRJFeiRGewxHfAxIfRJJgAElSoEBKUuCAQVMgwEFTYQBBU6FAQVPhgEFUIgBBVGKARJSiwEqU40BBVSPARJVkAErVpEBBVeSAQVYkwESWZYBLFqXATBbmAEGXJkBBl2aAQZemwEGX5wBBmCeAQZhoAESYqEBMWOjAQZkpQESZaYBMmanAQZnqAEGaKkBEmmsATNqrQE5a64BB2yvAQdtsAEHbrEBB2-yAQdwtAEHcbYBEnK3ATpzuwEHdL0BEnW-ATt2wQEHd8IBB3jDARJ5xgE8escBQnvIAQN8yQEDfcoBA37LAQN_zAEDgAHOAQOBAdABEoIB0QFDgwHUAQOEAdYBEoUB1wFEhgHZAQOHAdoBA4gB2wESiQHeAUWKAd8BSYsB4AEJjAHhAQmNAeIBCY4B4wEJjwHkAQmQAeYBCZEB6AESkgHpAUqTAesBCZQB7QESlQHuAUuWAe8BCZcB8AEJmAHxARKZAfQBTJoB9QFQmwH2AQicAfcBCJ0B-AEIngH5AQifAfoBCKAB_AEIoQH-ARKiAf8BUaMBgQIIpAGDAhKlAYQCUqYBhQIIpwGGAgioAYcCEqkBigJTqgGLAlerAYwCC6wBjQILrQGOAguuAY8CC68BkAILsAGSAguxAZQCErIBlQJYswGXAgu0AZkCErUBmgJZtgGbAgu3AZwCC7gBnQISuQGgAlq6AaECXg"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// generated/prisma/internal/prismaNamespace.ts
import * as runtime2 from "@prisma/client/runtime/client";
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/config/prisma.ts
var adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
var prisma = new PrismaClient({ adapter });

// src/routes/health.route.ts
var startTime = Date.now();
async function healthRoute(app2) {
  app2.get("/health", async (_request, reply) => {
    let databaseStatus = "up";
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
    } catch {
      databaseStatus = "down";
    }
    const statusCode = databaseStatus === "down" ? 503 : 200;
    return reply.status(statusCode).send({
      status: databaseStatus === "down" ? "unhealthy" : "ok",
      uptime: Math.floor((Date.now() - startTime) / 1e3),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      database: databaseStatus
    });
  });
}

// src/modules/auth/auth.service.ts
import bcrypt2 from "bcrypt";

// src/lib/audit.ts
async function createAuditLog(input) {
  const data = {
    companyId: input.companyId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action
  };
  if (input.userId !== void 0) data.userId = input.userId;
  if (input.oldData !== void 0) data.oldData = input.oldData;
  if (input.newData !== void 0) data.newData = input.newData;
  await prisma.auditLog.create({ data });
}

// src/lib/token.ts
import crypto from "crypto";
import bcrypt from "bcrypt";
function generateToken() {
  return crypto.randomUUID();
}
async function hashToken(token) {
  return bcrypt.hash(token, 10);
}
async function compareToken(token, hash) {
  return bcrypt.compare(token, hash);
}

// src/modules/auth/auth.service.ts
async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true }
  });
  if (!user || user.deletedAt !== null || !user.isActive || !user.company.isActive) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    throw new AppError("Credenciais inv\xE1lidas", 401, "UNAUTHORIZED");
  }
  const passwordMatch = await bcrypt2.compare(password, user.passwordHash);
  if (!passwordMatch) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    throw new AppError("Credenciais inv\xE1lidas", 401, "UNAUTHORIZED");
  }
  const refreshToken = generateToken();
  const hashedRefreshToken = await hashToken(refreshToken);
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash: hashedRefreshToken,
      lastLoginAt: /* @__PURE__ */ new Date()
    },
    include: { company: true }
  });
  await createAuditLog({
    companyId: user.companyId,
    userId: user.id,
    entityType: "User",
    entityId: user.id,
    action: "LOGIN"
  });
  const {
    passwordHash: _ph,
    refreshTokenHash: _rth,
    resetPasswordToken: _rpt,
    resetPasswordExpiresAt: _rpea,
    ...safeUser
  } = updatedUser;
  return { user: safeUser, refreshToken };
}
async function logout(userId, companyId) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null }
  });
  await createAuditLog({
    companyId,
    userId,
    entityType: "User",
    entityId: userId,
    action: "LOGOUT"
  });
}
async function refresh(userId, rawRefreshToken) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.refreshTokenHash || !user.isActive || user.deletedAt) {
    throw new AppError("Token inv\xE1lido", 401, "UNAUTHORIZED");
  }
  const valid = await compareToken(rawRefreshToken, user.refreshTokenHash);
  if (!valid) {
    throw new AppError("Token inv\xE1lido", 401, "UNAUTHORIZED");
  }
  return { user };
}
async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("Usu\xE1rio n\xE3o encontrado", 404, "NOT_FOUND");
  }
  const valid = await bcrypt2.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError("Senha atual incorreta", 400, "INVALID_PASSWORD");
  }
  const newHash = await bcrypt2.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      refreshTokenHash: null
    }
  });
  await createAuditLog({
    companyId: user.companyId,
    userId,
    entityType: "User",
    entityId: userId,
    action: "CHANGE_PASSWORD"
  });
}
async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  const token = generateToken();
  const hashedToken = await hashToken(token);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1e3)
    }
  });
  console.log(`[FORGOT PASSWORD] Token for ${email}: ${token}`);
}
async function resetPassword(token, newPassword) {
  const users = await prisma.user.findMany({
    where: {
      resetPasswordToken: { not: null },
      resetPasswordExpiresAt: { gt: /* @__PURE__ */ new Date() }
    }
  });
  let targetUser = null;
  for (const u of users) {
    if (u.resetPasswordToken && await compareToken(token, u.resetPasswordToken)) {
      targetUser = u;
      break;
    }
  }
  if (!targetUser) {
    throw new AppError("Token inv\xE1lido ou expirado", 400, "INVALID_TOKEN");
  }
  const newHash = await bcrypt2.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: targetUser.id },
    data: {
      passwordHash: newHash,
      refreshTokenHash: null,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null
    }
  });
  await createAuditLog({
    companyId: targetUser.companyId,
    userId: targetUser.id,
    entityType: "User",
    entityId: targetUser.id,
    action: "RESET_PASSWORD"
  });
}

// src/lib/validate.ts
import "zod";
function validateOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten();
    throw new AppError("Dados inv\xE1lidos", 400, "VALIDATION_ERROR", errors);
  }
  return result.data;
}

// src/modules/auth/dtos/login.dto.ts
import { z as z3 } from "zod";
var loginSchema = z3.object({
  email: z3.string().email("Email inv\xE1lido"),
  password: z3.string().min(1, "Senha \xE9 obrigat\xF3ria")
}).strict();

// src/modules/auth/dtos/change-password.dto.ts
import { z as z4 } from "zod";
var changePasswordSchema = z4.object({
  currentPassword: z4.string().min(1, "Senha atual \xE9 obrigat\xF3ria"),
  newPassword: z4.string().min(6, "Nova senha deve ter no m\xEDnimo 6 caracteres")
}).strict();

// src/modules/auth/dtos/forgot-password.dto.ts
import { z as z5 } from "zod";
var forgotPasswordSchema = z5.object({
  email: z5.string().email("Email inv\xE1lido")
}).strict();

// src/modules/auth/dtos/reset-password.dto.ts
import { z as z6 } from "zod";
var resetPasswordSchema = z6.object({
  token: z6.string().min(1, "Token \xE9 obrigat\xF3rio"),
  newPassword: z6.string().min(6, "Nova senha deve ter no m\xEDnimo 6 caracteres")
}).strict();

// src/modules/auth/auth.controller.ts
var COOKIE_NAME = "ciclus_token";
var cookieOptions = {
  path: "/",
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax"
};
function mapUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    companyName: user.company?.name ?? "",
    niche: user.company?.niche ?? null,
    avatarUrl: user.company?.logoUrl ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
async function login2(request, reply) {
  const { email, password } = validateOrThrow(loginSchema, request.body);
  const result = await login(email, password);
  const jwt2 = await reply.jwtSign({
    sub: result.user.id,
    companyId: result.user.companyId,
    role: result.user.role
  });
  reply.setCookie(COOKIE_NAME, jwt2, {
    ...cookieOptions,
    maxAge: env.JWT_EXPIRES_IN
  });
  reply.setCookie("refresh_token", result.refreshToken, {
    ...cookieOptions,
    maxAge: env.REFRESH_TOKEN_EXPIRES_IN,
    path: "/auth/refresh"
  });
  const user = await prisma.user.findUnique({
    where: { id: result.user.id },
    include: { company: true }
  });
  return reply.status(200).send({
    data: {
      user: user ? mapUser(user) : null,
      accessToken: jwt2
    }
  });
}
async function logout2(request, reply) {
  const user = request.user;
  await logout(user.sub, user.companyId);
  reply.clearCookie(COOKIE_NAME, { path: "/" });
  reply.clearCookie("refresh_token", { path: "/" });
  return reply.status(204).send();
}
async function me(request, reply) {
  const user = request.user;
  const fullUser = await prisma.user.findUnique({
    where: { id: user.sub },
    include: { company: true }
  });
  if (!fullUser) {
    return reply.status(404).send({ message: "Usu\xE1rio n\xE3o encontrado" });
  }
  return reply.status(200).send({ data: mapUser(fullUser) });
}
async function refresh2(request, reply) {
  const tokenCookie = request.cookies.ciclus_token;
  const refreshTokenCookie = request.cookies.refresh_token;
  if (!tokenCookie || !refreshTokenCookie) {
    return reply.status(401).send({ message: "Token n\xE3o encontrado" });
  }
  let decoded;
  try {
    decoded = request.server.jwt.decode(tokenCookie);
  } catch {
    return reply.status(401).send({ message: "Token inv\xE1lido" });
  }
  const result = await refresh(decoded.sub, refreshTokenCookie);
  const jwt2 = await reply.jwtSign({
    sub: result.user.id,
    companyId: result.user.companyId,
    role: result.user.role
  });
  reply.setCookie(COOKIE_NAME, jwt2, {
    ...cookieOptions,
    maxAge: env.JWT_EXPIRES_IN
  });
  return reply.status(200).send({ success: true });
}
async function changePassword2(request, reply) {
  const user = request.user;
  const { currentPassword, newPassword } = validateOrThrow(changePasswordSchema, request.body);
  await changePassword(user.sub, currentPassword, newPassword);
  reply.clearCookie(COOKIE_NAME, { path: "/" });
  reply.clearCookie("refresh_token", { path: "/" });
  return reply.status(204).send();
}
async function forgotPassword2(request, reply) {
  const { email } = validateOrThrow(forgotPasswordSchema, request.body);
  await forgotPassword(email);
  return reply.status(200).send({ success: true });
}
async function resetPassword2(request, reply) {
  const { token, newPassword } = validateOrThrow(resetPasswordSchema, request.body);
  await resetPassword(token, newPassword);
  return reply.status(200).send({ success: true });
}

// src/modules/auth/auth.routes.ts
async function authRoutes(app2) {
  app2.post(
    "/login",
    {
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } }
    },
    login2
  );
  app2.post(
    "/logout",
    { preHandler: [app2.authenticate] },
    logout2
  );
  app2.get(
    "/me",
    { preHandler: [app2.authenticate] },
    me
  );
  app2.post("/refresh", refresh2);
  app2.post(
    "/change-password",
    { preHandler: [app2.authenticate] },
    changePassword2
  );
  app2.post(
    "/forgot-password",
    {
      config: { rateLimit: { max: 3, timeWindow: "60 minutes" } }
    },
    forgotPassword2
  );
  app2.post("/reset-password", resetPassword2);
}

// src/middleware/authorize.ts
function authorize(...allowedRoles) {
  return async (request, reply) => {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ message: "N\xE3o autenticado" });
    }
    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({ message: "Acesso n\xE3o autorizado" });
    }
  };
}

// src/lib/mask.ts
function maskCpf(cpf) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `***.***.***-${digits.slice(-2)}`;
}
function maskCnpj(cnpj) {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return "**.***.***/***-**";
  return `**.***.${digits.slice(3, 6)}/${digits.slice(6, 9)}-**`;
}
function maskDocument(document, type) {
  if (type === "CPF") return maskCpf(document);
  return maskCnpj(document);
}
function maskEmail(email) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}
function maskCustomerForTechnician(customer) {
  return {
    id: customer.id,
    name: customer.name,
    address: customer.address ?? null
  };
}

// src/modules/company/company.service.ts
async function getCompany(companyId, requestingUserRole) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError("Empresa n\xE3o encontrada", 404, "NOT_FOUND");
  if (requestingUserRole === "ADMIN" && company.document) {
    const documentType = company.document.length <= 11 ? "CPF" : "CNPJ";
    return { ...company, document: maskDocument(company.document, documentType) };
  }
  return company;
}
async function updateCompany(companyId, data, userId) {
  const oldCompany = await prisma.company.findUnique({ where: { id: companyId } });
  if (!oldCompany) throw new AppError("Empresa n\xE3o encontrada", 404, "NOT_FOUND");
  const allowedFields = ["name", "fantasyName", "email", "phone", "niche", "address"];
  const updateData = {};
  for (const key of allowedFields) {
    if (data[key] !== void 0) {
      updateData[key] = data[key];
    }
  }
  if (Object.keys(updateData).length === 0) return oldCompany;
  const updated = await prisma.company.update({
    where: { id: companyId },
    data: updateData
  });
  await createAuditLog({
    companyId,
    userId,
    entityType: "Company",
    entityId: companyId,
    action: "UPDATE",
    oldData: oldCompany,
    newData: updated
  });
  return updated;
}
async function uploadLogo(companyId, fileBuffer, mimeType, userId) {
  const magicBytes = {
    "FFD8FF": ["image/jpeg"],
    "89504E47": ["image/png"],
    "52494646": ["image/webp"]
  };
  const hexSignature = fileBuffer.subarray(0, 4).toString("hex").toUpperCase();
  const detected = Object.keys(magicBytes).some((sig) => hexSignature.startsWith(sig));
  if (!detected) throw new AppError("Formato de imagem n\xE3o suportado", 400, "INVALID_IMAGE");
  const ext = mimeType.split("/")[1];
  const logoUrl = `/uploads/logos/${companyId}.${ext}`;
  await prisma.company.update({
    where: { id: companyId },
    data: { logoUrl }
  });
  await createAuditLog({
    companyId,
    userId,
    entityType: "Company",
    entityId: companyId,
    action: "UPLOAD_LOGO"
  });
  return { logoUrl };
}
async function getUsage(companyId) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new AppError("Empresa n\xE3o encontrada", 404, "NOT_FOUND");
  const now = /* @__PURE__ */ new Date();
  const startOfMonth2 = new Date(now.getFullYear(), now.getMonth(), 1);
  const [activeCustomers, activeContracts, servicesThisMonth] = await Promise.all([
    prisma.customer.count({ where: { companyId, isActive: true, deletedAt: null } }),
    prisma.contract.count({ where: { companyId, status: "ACTIVE", deletedAt: null } }),
    prisma.service.count({ where: { companyId, createdAt: { gte: startOfMonth2 }, deletedAt: null } })
  ]);
  const planLimits = { FREE: 10, STARTER: 100, PRO: 500, BUSINESS: Infinity };
  return {
    activeCustomers,
    activeContracts,
    servicesThisMonth,
    plan: company.plan,
    limits: { customers: planLimits[company.plan] ?? 10, contracts: planLimits[company.plan] ?? 10 }
  };
}

// src/modules/company/dtos/update-company.dto.ts
import { z as z7 } from "zod";
var updateCompanySchema = z7.object({
  name: z7.string().min(2).max(200).optional(),
  fantasyName: z7.string().max(200).nullable().optional(),
  email: z7.string().email().nullable().optional(),
  phone: z7.string().nullable().optional(),
  niche: z7.string().optional(),
  address: z7.any().optional()
}).strict();

// src/modules/company/company.controller.ts
async function getCompany2(request, reply) {
  const user = request.user;
  const company = await getCompany(user.companyId, user.role);
  return reply.status(200).send({ data: company });
}
async function updateCompany2(request, reply) {
  const user = request.user;
  const body = validateOrThrow(updateCompanySchema, request.body);
  const company = await updateCompany(user.companyId, body, user.sub);
  return reply.status(200).send({ data: company });
}
async function uploadLogo2(request, reply) {
  const user = request.user;
  const file = await request.file();
  if (!file) {
    return reply.status(400).send({ error: { code: "NO_FILE", message: "Nenhum arquivo enviado" } });
  }
  const buffer = await file.toBuffer();
  const mimeType = file.mimetype;
  const result = await uploadLogo(user.companyId, buffer, mimeType, user.sub);
  return reply.status(200).send({ data: result });
}
async function getUsage2(request, reply) {
  const user = request.user;
  const usage = await getUsage(user.companyId);
  return reply.status(200).send({ data: usage });
}

// src/modules/company/company.routes.ts
async function companyRoutes(app2) {
  app2.get(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getCompany2
  );
  app2.put(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER")] },
    updateCompany2
  );
  app2.post(
    "/logo",
    { preHandler: [app2.authenticate, authorize("OWNER")] },
    uploadLogo2
  );
  app2.get(
    "/usage",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getUsage2
  );
}

// src/modules/users/users.service.ts
import bcrypt3 from "bcrypt";

// src/utils/pagination.ts
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.pageSize ?? query.limit ?? "20", 10) || 20));
  return { page, limit };
}
function buildMeta(total, params) {
  return {
    page: params.page,
    pageSize: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit) || 1
  };
}
function buildSkip(params) {
  return (params.page - 1) * params.limit;
}

// src/modules/users/users.service.ts
var sensitiveFields = ["passwordHash", "refreshTokenHash", "resetPasswordToken", "resetPasswordExpiresAt"];
function excludeSensitive(user) {
  const result = { ...user };
  for (const field of sensitiveFields) {
    delete result[field];
  }
  return result;
}
async function list(companyId, filters, query) {
  const pagination = parsePagination(query);
  const where = { companyId, deletedAt: null };
  if (filters.role) {
    where.role = filters.role;
  }
  if (filters.isActive !== void 0) {
    where.isActive = filters.isActive === "true";
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: buildSkip(pagination),
      take: pagination.limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.count({ where })
  ]);
  const mapped = users.map((u) => {
    const safe = excludeSensitive(u);
    return {
      ...safe,
      status: safe.isActive ? "ACTIVE" : "INACTIVE"
    };
  });
  return { data: mapped, meta: buildMeta(total, pagination) };
}
async function create(companyId, data, currentUserId, currentUserRole) {
  if (data.role === "OWNER") {
    throw new AppError("N\xE3o \xE9 permitido criar usu\xE1rio com papel OWNER", 403, "FORBIDDEN");
  }
  if (currentUserRole === "ADMIN" && data.role === "ADMIN") {
    throw new AppError("Administradores n\xE3o podem criar outros administradores", 403, "FORBIDDEN");
  }
  const passwordHash = await bcrypt3.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      companyId,
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash
    }
  });
  await createAuditLog({
    companyId,
    userId: currentUserId,
    entityType: "User",
    entityId: user.id,
    action: "CREATE",
    newData: { name: user.name, email: user.email, role: user.role }
  });
  return excludeSensitive(user);
}
async function getById(companyId, userId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId }
  });
  if (!user) {
    throw new AppError("Usu\xE1rio n\xE3o encontrado", 404, "NOT_FOUND");
  }
  return excludeSensitive(user);
}
async function update(companyId, userId, data, currentUserRole) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId }
  });
  if (!user) {
    throw new AppError("Usu\xE1rio n\xE3o encontrado", 404, "NOT_FOUND");
  }
  if (currentUserRole === "ADMIN") {
    if (user.role === "OWNER" || data.role === "OWNER") {
      throw new AppError("Administradores n\xE3o podem alterar pap\xE9is de/dono", 403, "FORBIDDEN");
    }
  }
  const oldData = { name: user.name, role: user.role };
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data.name !== void 0 && { name: data.name },
      ...data.role !== void 0 && { role: data.role }
    }
  });
  await createAuditLog({
    companyId,
    entityType: "User",
    entityId: userId,
    action: "UPDATE",
    oldData,
    newData: { name: updated.name, role: updated.role }
  });
  return excludeSensitive(updated);
}
async function toggle(companyId, userId, currentUserId) {
  if (userId === currentUserId) {
    throw new AppError("N\xE3o \xE9 poss\xEDvel desativar o pr\xF3prio usu\xE1rio", 400, "BAD_REQUEST");
  }
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId }
  });
  if (!user) {
    throw new AppError("Usu\xE1rio n\xE3o encontrado", 404, "NOT_FOUND");
  }
  if (user.isActive) {
    const activeOwnersCount = await prisma.user.count({
      where: { companyId, role: "OWNER", isActive: true, deletedAt: null }
    });
    if (activeOwnersCount === 1 && user.role === "OWNER") {
      throw new AppError("N\xE3o \xE9 poss\xEDvel desativar o \xFAnico propriet\xE1rio ativo", 400, "BAD_REQUEST");
    }
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive }
  });
  await createAuditLog({
    companyId,
    userId: currentUserId,
    entityType: "User",
    entityId: userId,
    action: user.isActive ? "DEACTIVATE" : "ACTIVATE",
    oldData: { isActive: user.isActive },
    newData: { isActive: updated.isActive }
  });
  return excludeSensitive(updated);
}
async function remove(companyId, userId, currentUserId) {
  if (userId === currentUserId) {
    throw new AppError("N\xE3o \xE9 poss\xEDvel excluir o pr\xF3prio usu\xE1rio", 400, "BAD_REQUEST");
  }
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId }
  });
  if (!user) {
    throw new AppError("Usu\xE1rio n\xE3o encontrado", 404, "NOT_FOUND");
  }
  if (user.role === "OWNER") {
    const ownerCount = await prisma.user.count({
      where: { companyId, role: "OWNER", deletedAt: null }
    });
    if (ownerCount <= 1) {
      throw new AppError("N\xE3o \xE9 poss\xEDvel excluir o \xFAnico propriet\xE1rio", 400, "BAD_REQUEST");
    }
  }
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: /* @__PURE__ */ new Date(), isActive: false }
  });
  await createAuditLog({
    companyId,
    userId: currentUserId,
    entityType: "User",
    entityId: userId,
    action: "DELETE",
    oldData: { name: user.name, email: user.email }
  });
}

// src/modules/users/dtos/create-user.dto.ts
import { z as z8 } from "zod";
var createUserSchema = z8.object({
  name: z8.string().min(2, "Nome deve ter no m\xEDnimo 2 caracteres").max(200),
  email: z8.string().email("Email inv\xE1lido"),
  role: z8.enum(["ADMIN", "TECHNICIAN"]),
  password: z8.string().min(6, "Senha deve ter no m\xEDnimo 6 caracteres")
}).strict();

// src/modules/users/dtos/update-user.dto.ts
import { z as z9 } from "zod";
var updateUserSchema = z9.object({
  name: z9.string().min(2).max(200).optional(),
  role: z9.enum(["ADMIN", "TECHNICIAN", "OWNER"]).optional()
}).strict();

// src/modules/users/dtos/user-filters.dto.ts
import { z as z10 } from "zod";
var userFiltersSchema = z10.object({
  page: z10.coerce.number().int().positive().optional(),
  pageSize: z10.coerce.number().int().min(1).max(100).optional(),
  role: z10.enum(["OWNER", "ADMIN", "TECHNICIAN"]).optional(),
  isActive: z10.enum(["true", "false"]).optional()
}).strict();

// src/modules/users/users.controller.ts
async function list2(request, reply) {
  const user = request.user;
  const query = validateOrThrow(userFiltersSchema, request.query);
  const result = await list(
    user.companyId,
    { role: query.role, isActive: query.isActive },
    { page: query.page?.toString(), pageSize: query.pageSize?.toString() }
  );
  return reply.status(200).send(result);
}
async function create2(request, reply) {
  const user = request.user;
  const body = validateOrThrow(createUserSchema, request.body);
  const newUser = await create(user.companyId, body, user.sub, user.role);
  return reply.status(201).send({ data: newUser });
}
async function getById2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const found = await getById(user.companyId, id);
  return reply.status(200).send({ data: found });
}
async function update2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const body = validateOrThrow(updateUserSchema, request.body);
  const updated = await update(user.companyId, id, body, user.role);
  return reply.status(200).send({ data: updated });
}
async function toggle2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const toggled = await toggle(user.companyId, id, user.sub);
  return reply.status(200).send({ data: toggled });
}
async function remove2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  await remove(user.companyId, id, user.sub);
  return reply.status(204).send();
}

// src/modules/users/users.routes.ts
async function usersRoutes(app2) {
  app2.get(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    list2
  );
  app2.post(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    create2
  );
  app2.get(
    "/:id",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getById2
  );
  app2.put(
    "/:id",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    update2
  );
  app2.patch(
    "/:id/toggle",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    toggle2
  );
  app2.delete(
    "/:id",
    { preHandler: [app2.authenticate, authorize("OWNER")] },
    remove2
  );
}

// src/modules/employees/employees.service.ts
async function list3(companyId, filters, query) {
  const pagination = parsePagination(query);
  const where = { companyId, deletedAt: null };
  if (filters.isActive !== void 0) {
    where.isActive = filters.isActive === "true";
  }
  const now = /* @__PURE__ */ new Date();
  const startOfMonth2 = new Date(now.getFullYear(), now.getMonth(), 1);
  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip: buildSkip(pagination),
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            services: {
              where: { createdAt: { gte: startOfMonth2 }, deletedAt: null }
            }
          }
        }
      }
    }),
    prisma.employee.count({ where })
  ]);
  const mapped = employees.map((emp) => ({
    id: emp.id,
    companyId: emp.companyId,
    name: emp.name,
    email: emp.email,
    phone: emp.phone,
    isActive: emp.isActive,
    status: emp.isActive ? "ACTIVE" : "INACTIVE",
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
    servicesThisMonth: emp._count.services
  }));
  return { data: mapped, meta: buildMeta(total, pagination) };
}
async function create3(companyId, data) {
  const employee = await prisma.employee.create({
    data: {
      companyId,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null
    }
  });
  await createAuditLog({
    companyId,
    entityType: "Employee",
    entityId: employee.id,
    action: "CREATE",
    newData: { name: employee.name, email: employee.email, phone: employee.phone }
  });
  return employee;
}
async function getById3(companyId, employeeId) {
  const now = /* @__PURE__ */ new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
    include: {
      services: {
        where: {
          scheduledAt: { gte: now, lte: sevenDaysFromNow },
          deletedAt: null
        },
        orderBy: { scheduledAt: "asc" },
        include: {
          customer: { select: { id: true, name: true } }
        }
      }
    }
  });
  if (!employee) {
    throw new AppError("Funcion\xE1rio n\xE3o encontrado", 404, "NOT_FOUND");
  }
  return employee;
}
async function update3(companyId, employeeId, data) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId }
  });
  if (!employee) {
    throw new AppError("Funcion\xE1rio n\xE3o encontrado", 404, "NOT_FOUND");
  }
  const oldData = { name: employee.name, email: employee.email, phone: employee.phone };
  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      ...data.name !== void 0 && { name: data.name },
      ...data.email !== void 0 && { email: data.email },
      ...data.phone !== void 0 && { phone: data.phone }
    }
  });
  await createAuditLog({
    companyId,
    entityType: "Employee",
    entityId: employeeId,
    action: "UPDATE",
    oldData,
    newData: { name: updated.name, email: updated.email, phone: updated.phone }
  });
  return updated;
}
async function toggle3(companyId, employeeId) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId }
  });
  if (!employee) {
    throw new AppError("Funcion\xE1rio n\xE3o encontrado", 404, "NOT_FOUND");
  }
  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: { isActive: !employee.isActive }
  });
  await createAuditLog({
    companyId,
    entityType: "Employee",
    entityId: employeeId,
    action: employee.isActive ? "DEACTIVATE" : "ACTIVATE",
    oldData: { isActive: employee.isActive },
    newData: { isActive: updated.isActive }
  });
  return updated;
}
async function getServices(companyId, employeeId, filters, query) {
  const pagination = parsePagination(query);
  const where = { companyId, employeeId, deletedAt: null };
  if (filters.dateStart || filters.dateEnd) {
    const scheduledAt = {};
    if (filters.dateStart) {
      scheduledAt.gte = new Date(filters.dateStart);
    }
    if (filters.dateEnd) {
      scheduledAt.lte = new Date(filters.dateEnd);
    }
    where.scheduledAt = scheduledAt;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip: buildSkip(pagination),
      take: pagination.limit,
      orderBy: { scheduledAt: "desc" },
      include: {
        customer: { select: { id: true, name: true } },
        contract: { select: { id: true, frequency: true } }
      }
    }),
    prisma.service.count({ where })
  ]);
  return { data: services, meta: buildMeta(total, pagination) };
}

// src/modules/employees/dtos/create-employee.dto.ts
import { z as z11 } from "zod";
var createEmployeeSchema = z11.object({
  name: z11.string().min(2, "Nome deve ter no m\xEDnimo 2 caracteres").max(200),
  email: z11.string().email().optional().or(z11.literal("")),
  phone: z11.string().optional()
}).strict();

// src/modules/employees/dtos/update-employee.dto.ts
import { z as z12 } from "zod";
var updateEmployeeSchema = z12.object({
  name: z12.string().min(2).max(200).optional(),
  email: z12.string().email().optional().or(z12.literal("")),
  phone: z12.string().optional()
}).strict();

// src/modules/employees/dtos/employee-filters.dto.ts
import { z as z13 } from "zod";
var employeeFiltersSchema = z13.object({
  page: z13.coerce.number().int().positive().optional(),
  pageSize: z13.coerce.number().int().min(1).max(100).optional(),
  isActive: z13.enum(["true", "false"]).optional()
}).strict();

// src/modules/employees/dtos/employee-services-filters.dto.ts
import { z as z14 } from "zod";
var employeeServicesFiltersSchema = z14.object({
  page: z14.string().optional(),
  pageSize: z14.string().optional(),
  dateStart: z14.string().optional(),
  dateEnd: z14.string().optional(),
  status: z14.string().optional()
}).strict();

// src/modules/employees/employees.controller.ts
async function list4(request, reply) {
  const user = request.user;
  const query = validateOrThrow(employeeFiltersSchema, request.query);
  const result = await list3(
    user.companyId,
    { isActive: query.isActive },
    { page: query.page?.toString(), pageSize: query.pageSize?.toString() }
  );
  return reply.status(200).send(result);
}
async function create4(request, reply) {
  const user = request.user;
  const body = validateOrThrow(createEmployeeSchema, request.body);
  const employee = await create3(user.companyId, body);
  return reply.status(201).send({ data: employee });
}
async function getById4(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const employee = await getById3(user.companyId, id);
  return reply.status(200).send({ data: employee });
}
async function update4(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const body = validateOrThrow(updateEmployeeSchema, request.body);
  const updated = await update3(user.companyId, id, body);
  return reply.status(200).send({ data: updated });
}
async function toggle4(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const toggled = await toggle3(user.companyId, id);
  return reply.status(200).send({ data: toggled });
}
async function getServices2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const query = validateOrThrow(employeeServicesFiltersSchema, request.query);
  const result = await getServices(
    user.companyId,
    id,
    { dateStart: query.dateStart, dateEnd: query.dateEnd, status: query.status },
    { page: query.page, pageSize: query.pageSize }
  );
  return reply.status(200).send(result);
}

// src/modules/employees/employees.routes.ts
async function employeesRoutes(app2) {
  app2.get(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    list4
  );
  app2.post(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    create4
  );
  app2.get(
    "/:id",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getById4
  );
  app2.put(
    "/:id",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    update4
  );
  app2.patch(
    "/:id/toggle",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    toggle4
  );
  app2.get(
    "/:id/services",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    getServices2
  );
}

// src/utils/document.ts
function validateCpf(cpf) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits.charAt(i), 10) * (10 - i);
  let mod = sum * 10 % 11;
  if (mod === 10) mod = 0;
  if (mod !== parseInt(digits.charAt(9), 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits.charAt(i), 10) * (11 - i);
  mod = sum * 10 % 11;
  if (mod === 10) mod = 0;
  if (mod !== parseInt(digits.charAt(10), 10)) return false;
  return true;
}
function validateCnpj(cnpj) {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits.charAt(i), 10) * weights1[i];
  let mod = sum % 11;
  const firstDigit = mod < 2 ? 0 : 11 - mod;
  if (firstDigit !== parseInt(digits.charAt(12), 10)) return false;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits.charAt(i), 10) * weights2[i];
  mod = sum % 11;
  const secondDigit = mod < 2 ? 0 : 11 - mod;
  if (secondDigit !== parseInt(digits.charAt(13), 10)) return false;
  return true;
}
function validateDocument(document, type) {
  if (type === "CPF") return validateCpf(document);
  return validateCnpj(document);
}
function formatCpf(cpf) {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
function formatCnpj(cnpj) {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

// src/modules/customers/customers.service.ts
function mapCustomerToFrontend(c, role) {
  const base = {
    id: c.id,
    companyId: c.companyId,
    legalName: c.name,
    tradeName: c.fantasyName ?? null,
    name: c.name,
    fantasyName: c.fantasyName ?? null,
    documentType: c.documentType ?? null,
    phone: c.phone ?? null,
    notes: c.notes ?? null,
    status: c.isActive ? "ACTIVE" : "INACTIVE",
    isActive: c.isActive,
    contractsCount: c._count?.contracts ?? 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  };
  if (role === "TECHNICIAN") {
    return {
      ...base,
      document: c.document ? maskDocument(c.document, c.documentType || "CNPJ") : null,
      email: c.email ? maskEmail(c.email) : null,
      address: null
    };
  }
  return {
    ...base,
    document: c.document ? maskDocument(c.document, c.documentType || "CNPJ") : null,
    email: c.email ? maskEmail(c.email) : null,
    address: c.address ?? null
  };
}
async function list5(companyId, filters, query, userRole) {
  const pagination = parsePagination(query);
  const where = { companyId, deletedAt: null };
  if (filters.isActive !== void 0) {
    where.isActive = filters.isActive === "true";
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { document: { contains: filters.search } }
    ];
  }
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: buildSkip(pagination),
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            contracts: {
              where: { status: "ACTIVE", deletedAt: null }
            }
          }
        }
      }
    }),
    prisma.customer.count({ where })
  ]);
  const mapped = customers.map((c) => mapCustomerToFrontend(c, userRole));
  return {
    data: mapped,
    meta: buildMeta(total, pagination)
  };
}
async function create5(companyId, data) {
  if (!validateDocument(data.document, data.documentType)) {
    throw new AppError(
      data.documentType === "CPF" ? "CPF inv\xE1lido" : "CNPJ inv\xE1lido",
      400,
      "INVALID_DOCUMENT"
    );
  }
  const rawDocument = data.document.replace(/\D/g, "");
  const formattedDocument = data.documentType === "CPF" ? formatCpf(rawDocument) : formatCnpj(rawDocument);
  const existing = await prisma.customer.findUnique({
    where: {
      companyId_document: { companyId, document: rawDocument }
    }
  });
  if (existing) {
    throw new AppError("J\xE1 existe um cliente com esse documento", 409, "CONFLICT");
  }
  const customer = await prisma.customer.create({
    data: {
      companyId,
      name: data.name,
      fantasyName: data.fantasyName ?? null,
      documentType: data.documentType,
      document: formattedDocument,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? void 0,
      notes: data.notes ?? null
    }
  });
  await createAuditLog({
    companyId,
    entityType: "Customer",
    entityId: customer.id,
    action: "CREATE",
    newData: { name: customer.name, fantasyName: customer.fantasyName }
  });
  return mapCustomerToFrontend(customer, "OWNER");
}
async function getById5(companyId, customerId) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId, deletedAt: null },
    include: {
      contracts: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" }
      },
      services: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          contract: { select: { id: true, frequency: true } }
        }
      },
      equipment: {
        where: { isActive: true, deletedAt: null }
      }
    }
  });
  if (!customer) {
    throw new AppError("Cliente n\xE3o encontrado", 404, "NOT_FOUND");
  }
  return {
    ...mapCustomerToFrontend(customer, "OWNER"),
    contracts: customer.contracts,
    services: customer.services,
    equipment: customer.equipment
  };
}
async function reveal(companyId, customerId, userId) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId, deletedAt: null }
  });
  if (!customer) {
    throw new AppError("Cliente n\xE3o encontrado", 404, "NOT_FOUND");
  }
  await createAuditLog({
    companyId,
    userId,
    entityType: "Customer",
    entityId: customerId,
    action: "SENSITIVE_DATA_REVEAL",
    newData: { revealedAt: (/* @__PURE__ */ new Date()).toISOString() }
  });
  return {
    document: customer.document,
    email: customer.email
  };
}
async function update5(companyId, customerId, data, userId) {
  const allowedFields = ["name", "fantasyName", "email", "phone", "address", "notes"];
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId }
  });
  if (!customer) {
    throw new AppError("Cliente n\xE3o encontrado", 404, "NOT_FOUND");
  }
  const oldData = {};
  const updateData = {};
  for (const key of Object.keys(data)) {
    if (data[key] !== void 0 && allowedFields.includes(key)) {
      oldData[key] = customer[key];
      updateData[key] = data[key];
    }
  }
  if (Object.keys(updateData).length === 0) {
    return mapCustomerToFrontend(customer, "OWNER");
  }
  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: updateData
  });
  await createAuditLog({
    companyId,
    userId,
    entityType: "Customer",
    entityId: customerId,
    action: "UPDATE",
    oldData,
    newData: updateData
  });
  return mapCustomerToFrontend(updated, "OWNER");
}
async function toggle5(companyId, customerId) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId }
  });
  if (!customer) {
    throw new AppError("Cliente n\xE3o encontrado", 404, "NOT_FOUND");
  }
  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { isActive: !customer.isActive }
  });
  await createAuditLog({
    companyId,
    entityType: "Customer",
    entityId: customerId,
    action: customer.isActive ? "DEACTIVATE" : "ACTIVATE",
    oldData: { isActive: customer.isActive },
    newData: { isActive: updated.isActive }
  });
  return mapCustomerToFrontend(updated, "OWNER");
}
async function remove3(companyId, customerId) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId },
    include: {
      contracts: {
        where: { status: "ACTIVE", deletedAt: null }
      }
    }
  });
  if (!customer) {
    throw new AppError("Cliente n\xE3o encontrado", 404, "NOT_FOUND");
  }
  if (customer.contracts.length > 0) {
    throw new AppError(
      "N\xE3o \xE9 poss\xEDvel excluir cliente com contratos ativos. Cancele ou aguarde o t\xE9rmino dos contratos antes de excluir.",
      409,
      "HAS_ACTIVE_CONTRACTS"
    );
  }
  await prisma.customer.update({
    where: { id: customerId },
    data: { deletedAt: /* @__PURE__ */ new Date(), isActive: false }
  });
  await createAuditLog({
    companyId,
    entityType: "Customer",
    entityId: customerId,
    action: "DELETE",
    oldData: { name: customer.name }
  });
}

// src/modules/customers/dtos/create-customer.dto.ts
import { z as z15 } from "zod";
var createCustomerSchema = z15.object({
  name: z15.string().min(2, "Nome deve ter no m\xEDnimo 2 caracteres").max(200),
  fantasyName: z15.string().max(200).optional(),
  documentType: z15.enum(["CPF", "CNPJ"]),
  document: z15.string().min(11).max(18),
  email: z15.string().email("Email inv\xE1lido").optional().or(z15.literal("")),
  phone: z15.string().optional(),
  address: z15.object({
    zipCode: z15.string().optional(),
    street: z15.string().optional(),
    number: z15.string().optional(),
    complement: z15.string().optional(),
    neighborhood: z15.string().optional(),
    city: z15.string().optional(),
    state: z15.string().length(2).optional()
  }).optional(),
  notes: z15.string().max(500).optional()
}).strict();

// src/modules/customers/dtos/update-customer.dto.ts
import { z as z16 } from "zod";
var updateCustomerSchema = z16.object({
  name: z16.string().min(2).max(200).optional(),
  fantasyName: z16.string().max(200).nullable().optional(),
  email: z16.string().email().optional().or(z16.literal("")),
  phone: z16.string().optional(),
  address: z16.object({
    zipCode: z16.string().optional(),
    street: z16.string().optional(),
    number: z16.string().optional(),
    complement: z16.string().optional(),
    neighborhood: z16.string().optional(),
    city: z16.string().optional(),
    state: z16.string().length(2).optional()
  }).optional(),
  notes: z16.string().max(500).nullable().optional()
}).strict();

// src/modules/customers/dtos/customer-filters.dto.ts
import { z as z17 } from "zod";
var customerFiltersSchema = z17.object({
  page: z17.coerce.number().int().positive().optional(),
  pageSize: z17.coerce.number().int().min(1).max(100).optional(),
  isActive: z17.enum(["true", "false"]).optional(),
  search: z17.string().optional()
}).strict();

// src/modules/customers/customers.controller.ts
async function list6(request, reply) {
  const user = request.user;
  const query = validateOrThrow(customerFiltersSchema, request.query);
  const result = await list5(
    user.companyId,
    { isActive: query.isActive, search: query.search },
    { page: query.page?.toString(), pageSize: query.pageSize?.toString() },
    user.role
  );
  return reply.status(200).send(result);
}
async function create6(request, reply) {
  const user = request.user;
  const body = validateOrThrow(createCustomerSchema, request.body);
  const customer = await create5(user.companyId, body);
  return reply.status(201).send({ data: customer });
}
async function getById6(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const customer = await getById5(user.companyId, id);
  return reply.status(200).send({ data: customer });
}
async function update6(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const body = validateOrThrow(updateCustomerSchema, request.body);
  const updated = await update5(user.companyId, id, body, user.sub);
  return reply.status(200).send({ data: updated });
}
async function toggle6(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const toggled = await toggle5(user.companyId, id);
  return reply.status(200).send({ data: toggled });
}
async function remove4(request, reply) {
  const user = request.user;
  const { id } = request.params;
  await remove3(user.companyId, id);
  return reply.status(204).send();
}
async function reveal2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  if (user.role === "TECHNICIAN") {
    return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Apenas administradores podem revelar dados sens\xEDveis" } });
  }
  const data = await reveal(user.companyId, id, user.sub);
  return reply.status(200).send({ data });
}

// src/modules/customers/customers.routes.ts
async function customersRoutes(app2) {
  app2.get(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    list6
  );
  app2.post(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    create6
  );
  app2.get(
    "/:id",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getById6
  );
  app2.put(
    "/:id",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    update6
  );
  app2.patch(
    "/:id/toggle",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    toggle6
  );
  app2.delete(
    "/:id",
    { preHandler: [app2.authenticate, authorize("OWNER")] },
    remove4
  );
  app2.post(
    "/:id/reveal",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    reveal2
  );
}

// src/modules/equipment/equipment.service.ts
function mapEquipment(e) {
  return { ...e, status: e.isActive ? "ACTIVE" : "INACTIVE" };
}
async function verifyCustomer(companyId, customerId) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId, deletedAt: null },
    select: { id: true }
  });
  if (!customer) {
    throw new AppError("Cliente n\xE3o encontrado", 404, "NOT_FOUND");
  }
}
async function list7(companyId, customerId, filters) {
  await verifyCustomer(companyId, customerId);
  const where = { companyId, customerId, deletedAt: null };
  if (filters.isActive !== void 0) {
    where.isActive = filters.isActive === "true";
  }
  if (filters.type) {
    where.type = filters.type;
  }
  const items = await prisma.equipment.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });
  return { data: items.map(mapEquipment) };
}
async function create7(companyId, customerId, data, userId) {
  await verifyCustomer(companyId, customerId);
  const equipment = await prisma.equipment.create({
    data: {
      companyId,
      customerId,
      type: data.type,
      brand: data.brand ?? null,
      model: data.model ?? null,
      capacity: data.capacity ?? null,
      serialNumber: data.serialNumber ?? null,
      location: data.location ?? null,
      installedAt: data.installedAt ? new Date(data.installedAt) : null,
      notes: data.notes ?? null
    }
  });
  await createAuditLog({
    companyId,
    userId,
    entityType: "Equipment",
    entityId: equipment.id,
    action: "CREATE",
    newData: {
      type: equipment.type,
      brand: equipment.brand,
      model: equipment.model
    }
  });
  return mapEquipment(equipment);
}
async function getById7(companyId, customerId, equipmentId) {
  await verifyCustomer(companyId, customerId);
  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, companyId, customerId, deletedAt: null }
  });
  if (!equipment) {
    throw new AppError("Equipamento n\xE3o encontrado", 404, "NOT_FOUND");
  }
  const serviceHistory = await prisma.serviceEquipment.findMany({
    where: { equipmentId },
    take: 10,
    orderBy: { service: { scheduledAt: "desc" } },
    include: {
      service: {
        select: { id: true, serviceNumber: true, scheduledAt: true, status: true }
      }
    }
  });
  return { ...mapEquipment(equipment), serviceHistory };
}
async function update7(companyId, customerId, equipmentId, data, userId) {
  await verifyCustomer(companyId, customerId);
  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, companyId, customerId }
  });
  if (!equipment) {
    throw new AppError("Equipamento n\xE3o encontrado", 404, "NOT_FOUND");
  }
  const oldData = {
    type: equipment.type,
    brand: equipment.brand,
    model: equipment.model
  };
  const updated = await prisma.equipment.update({
    where: { id: equipmentId },
    data: {
      ...data.type !== void 0 && { type: data.type },
      ...data.brand !== void 0 && { brand: data.brand },
      ...data.model !== void 0 && { model: data.model },
      ...data.capacity !== void 0 && { capacity: data.capacity },
      ...data.serialNumber !== void 0 && { serialNumber: data.serialNumber },
      ...data.location !== void 0 && { location: data.location },
      ...data.installedAt !== void 0 && { installedAt: new Date(data.installedAt) },
      ...data.notes !== void 0 && { notes: data.notes }
    }
  });
  await createAuditLog({
    companyId,
    userId,
    entityType: "Equipment",
    entityId: equipmentId,
    action: "UPDATE",
    oldData,
    newData: {
      type: updated.type,
      brand: updated.brand,
      model: updated.model
    }
  });
  return mapEquipment(updated);
}
async function toggle7(companyId, customerId, equipmentId) {
  await verifyCustomer(companyId, customerId);
  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, companyId, customerId }
  });
  if (!equipment) {
    throw new AppError("Equipamento n\xE3o encontrado", 404, "NOT_FOUND");
  }
  const updated = await prisma.equipment.update({
    where: { id: equipmentId },
    data: { isActive: !equipment.isActive }
  });
  await createAuditLog({
    companyId,
    entityType: "Equipment",
    entityId: equipmentId,
    action: equipment.isActive ? "DEACTIVATE" : "ACTIVATE",
    oldData: { isActive: equipment.isActive },
    newData: { isActive: updated.isActive }
  });
  return mapEquipment(updated);
}
async function remove5(companyId, customerId, equipmentId) {
  await verifyCustomer(companyId, customerId);
  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, companyId, customerId }
  });
  if (!equipment) {
    throw new AppError("Equipamento n\xE3o encontrado", 404, "NOT_FOUND");
  }
  await prisma.equipment.update({
    where: { id: equipmentId },
    data: { deletedAt: /* @__PURE__ */ new Date(), isActive: false }
  });
  await createAuditLog({
    companyId,
    entityType: "Equipment",
    entityId: equipmentId,
    action: "DELETE",
    oldData: { type: equipment.type, brand: equipment.brand, model: equipment.model }
  });
}

// src/modules/equipment/dtos/create-equipment.dto.ts
import { z as z18 } from "zod";
var createEquipmentSchema = z18.object({
  type: z18.string().min(1, "Tipo \xE9 obrigat\xF3rio"),
  brand: z18.string().optional(),
  model: z18.string().optional(),
  capacity: z18.string().optional(),
  serialNumber: z18.string().optional(),
  location: z18.string().optional(),
  installedAt: z18.string().optional(),
  notes: z18.string().max(500).optional()
}).strict();

// src/modules/equipment/dtos/update-equipment.dto.ts
import { z as z19 } from "zod";
var updateEquipmentSchema = z19.object({
  type: z19.string().optional(),
  brand: z19.string().optional(),
  model: z19.string().optional(),
  capacity: z19.string().optional(),
  serialNumber: z19.string().optional(),
  location: z19.string().optional(),
  installedAt: z19.string().optional(),
  notes: z19.string().max(500).optional()
}).strict();

// src/modules/equipment/dtos/equipment-filters.dto.ts
import { z as z20 } from "zod";
var equipmentFiltersSchema = z20.object({
  isActive: z20.enum(["true", "false"]).optional(),
  type: z20.string().optional()
}).strict();

// src/modules/equipment/equipment.controller.ts
async function list8(request, reply) {
  const user = request.user;
  const { customerId } = request.params;
  const query = validateOrThrow(equipmentFiltersSchema, request.query);
  const result = await list7(user.companyId, customerId, {
    isActive: query.isActive,
    type: query.type
  });
  return reply.status(200).send(result);
}
async function create8(request, reply) {
  const user = request.user;
  const { customerId } = request.params;
  const body = validateOrThrow(createEquipmentSchema, request.body);
  const equipment = await create7(user.companyId, customerId, body, user.sub);
  return reply.status(201).send({ data: equipment });
}
async function getById8(request, reply) {
  const user = request.user;
  const { customerId, equipmentId } = request.params;
  const equipment = await getById7(user.companyId, customerId, equipmentId);
  return reply.status(200).send({ data: equipment });
}
async function update8(request, reply) {
  const user = request.user;
  const { customerId, equipmentId } = request.params;
  const body = validateOrThrow(updateEquipmentSchema, request.body);
  const updated = await update7(user.companyId, customerId, equipmentId, body, user.sub);
  return reply.status(200).send({ data: updated });
}
async function toggle8(request, reply) {
  const user = request.user;
  const { customerId, equipmentId } = request.params;
  const toggled = await toggle7(user.companyId, customerId, equipmentId);
  return reply.status(200).send({ data: toggled });
}
async function remove6(request, reply) {
  const user = request.user;
  const { customerId, equipmentId } = request.params;
  await remove5(user.companyId, customerId, equipmentId);
  return reply.status(204).send();
}

// src/modules/equipment/equipment.routes.ts
async function equipmentRoutes(app2) {
  app2.get(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    list8
  );
  app2.post(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    create8
  );
  app2.get(
    "/:equipmentId",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getById8
  );
  app2.put(
    "/:equipmentId",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    update8
  );
  app2.patch(
    "/:equipmentId/toggle",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    toggle8
  );
  app2.delete(
    "/:equipmentId",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    remove6
  );
}

// src/utils/service-number.ts
async function getNextServiceNumber(companyId) {
  const result = await prisma.$queryRawUnsafe(
    `UPDATE companies SET last_service_number = last_service_number + 1 WHERE id = $1 RETURNING last_service_number`,
    companyId
  );
  const row = result[0];
  if (!row) throw new Error("Falha ao gerar n\xFAmero de servi\xE7o");
  return row.last_service_number;
}
async function getNextServiceNumberInTx(tx, companyId) {
  const result = await tx.$queryRawUnsafe(
    `UPDATE companies SET last_service_number = last_service_number + 1 WHERE id = $1 RETURNING last_service_number`,
    companyId
  );
  const row = result[0];
  if (!row) throw new Error("Falha ao gerar n\xFAmero de servi\xE7o");
  return row.last_service_number;
}

// src/modules/contracts/contracts.service.ts
async function list9(companyId, filters, query) {
  const pagination = parsePagination(query);
  const where = { companyId, deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.frequency) where.frequency = filters.frequency;
  if (filters.dateStart || filters.dateEnd) {
    const nextServiceFilter = {};
    if (filters.dateStart) nextServiceFilter.gte = new Date(filters.dateStart);
    if (filters.dateEnd) nextServiceFilter.lte = new Date(filters.dateEnd);
    where.nextServiceDate = nextServiceFilter;
  }
  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      skip: buildSkip(pagination),
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, address: true } },
        services: {
          where: { deletedAt: null, status: "SCHEDULED" },
          orderBy: { scheduledAt: "asc" },
          take: 1,
          include: { employee: { select: { id: true, name: true } } }
        }
      }
    }),
    prisma.contract.count({ where })
  ]);
  const mapped = contracts.map((c) => {
    const firstService = c.services?.[0];
    const { services: _, customer, ...rest } = c;
    return {
      ...rest,
      customerName: customer?.name ?? "",
      customerId: customer?.id ?? c.customerId,
      customerAddress: customer?.address ?? null,
      nextVisitDate: c.nextServiceDate ?? null,
      value: Number(c.amount),
      responsibleEmployeeId: firstService?.employee?.id ?? null,
      responsibleEmployeeName: firstService?.employee?.name ?? null
    };
  });
  return { data: mapped, meta: buildMeta(total, pagination) };
}
async function create9(companyId, data, userId) {
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, companyId, deletedAt: null },
    select: { id: true }
  });
  if (!customer) throw new AppError("Cliente n\xE3o encontrado", 404, "NOT_FOUND");
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (startDate >= endDate) {
    throw new AppError("Data de in\xEDcio deve ser anterior \xE0 data de t\xE9rmino", 400, "INVALID_DATES");
  }
  const result = await prisma.$transaction(async (tx) => {
    const contract = await tx.contract.create({
      data: {
        companyId,
        customerId: data.customerId,
        frequency: data.frequency,
        amount: data.amount,
        startDate,
        endDate,
        nextServiceDate: startDate,
        notes: data.notes ?? null
      }
    });
    const serviceNumber = await getNextServiceNumberInTx(tx, companyId);
    const service = await tx.service.create({
      data: {
        serviceNumber,
        companyId,
        contractId: contract.id,
        customerId: data.customerId,
        serviceType: data.serviceType,
        scheduledAt: startDate,
        status: "SCHEDULED",
        amount: data.amount,
        employeeId: data.employeeId ?? null
      }
    });
    return { contract, service };
  });
  await createAuditLog({
    companyId,
    userId,
    entityType: "Contract",
    entityId: result.contract.id,
    action: "CREATE",
    newData: { customerId: result.contract.customerId, frequency: result.contract.frequency, amount: result.contract.amount.toString() }
  });
  const { customer: _, ...rest } = result.contract;
  return {
    ...rest,
    customerName: "",
    nextVisitDate: rest.nextServiceDate ?? null,
    value: Number(rest.amount),
    serviceId: result.service.id
  };
}
async function getById9(companyId, contractId) {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, companyId, deletedAt: null },
    include: {
      customer: true,
      services: {
        where: { deletedAt: null },
        orderBy: { scheduledAt: "desc" },
        take: 50,
        include: { employee: { select: { id: true, name: true } } }
      }
    }
  });
  if (!contract) throw new AppError("Contrato n\xE3o encontrado", 404, "NOT_FOUND");
  const { customer, services, ...rest } = contract;
  return {
    ...rest,
    customerName: customer?.name ?? "",
    customerAddress: customer?.address ?? null,
    nextVisitDate: rest.nextServiceDate ?? null,
    value: Number(rest.amount),
    services: services ?? []
  };
}
async function update9(companyId, contractId, data, userId) {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, companyId, deletedAt: null }
  });
  if (!contract) throw new AppError("Contrato n\xE3o encontrado", 404, "NOT_FOUND");
  const oldData = {};
  const updateData = {};
  for (const key of Object.keys(data)) {
    if (data[key] !== void 0) {
      const value = key === "startDate" || key === "endDate" ? new Date(data[key]) : data[key];
      oldData[key] = contract[key];
      updateData[key] = value;
    }
  }
  if (Object.keys(updateData).length === 0) return contract;
  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: updateData
  });
  await createAuditLog({
    companyId,
    userId,
    entityType: "Contract",
    entityId: contractId,
    action: "UPDATE",
    oldData,
    newData: data
  });
  return updated;
}
async function cancel(companyId, contractId, data, userId) {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, companyId, deletedAt: null }
  });
  if (!contract) throw new AppError("Contrato n\xE3o encontrado", 404, "NOT_FOUND");
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.contract.update({
      where: { id: contractId },
      data: { status: "CANCELLED" }
    });
    await tx.service.updateMany({
      where: { contractId, status: "SCHEDULED" },
      data: { status: "CANCELLED", cancelledReason: data.reason }
    });
    return updated;
  });
  await createAuditLog({
    companyId,
    userId,
    entityType: "Contract",
    entityId: contractId,
    action: "CANCEL",
    oldData: { status: contract.status },
    newData: { status: "CANCELLED", reason: data.reason }
  });
  return result;
}

// src/modules/contracts/dtos/create-contract.dto.ts
import { z as z21 } from "zod";
var contractFrequencySchema = z21.enum(["MONTHLY", "BIMONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"]);
var serviceTypeSchema = z21.enum([
  "AIR_CONDITIONING",
  "PEST_CONTROL",
  "CLEANING",
  "BUILDING_MAINTENANCE",
  "OTHER"
]);
var createContractSchema = z21.object({
  customerId: z21.string().uuid("Cliente inv\xE1lido"),
  serviceType: serviceTypeSchema,
  frequency: contractFrequencySchema,
  startDate: z21.string().min(1, "Data de in\xEDcio \xE9 obrigat\xF3ria"),
  endDate: z21.string().min(1, "Data de t\xE9rmino \xE9 obrigat\xF3ria"),
  amount: z21.number().positive("Valor deve ser positivo"),
  employeeId: z21.string().uuid().optional(),
  notes: z21.string().max(500).optional()
}).strict();

// src/modules/contracts/dtos/update-contract.dto.ts
import { z as z22 } from "zod";
var updateContractSchema = z22.object({
  frequency: contractFrequencySchema.optional(),
  startDate: z22.string().optional(),
  endDate: z22.string().optional(),
  amount: z22.number().positive().optional(),
  employeeId: z22.string().uuid().nullable().optional(),
  notes: z22.string().max(500).nullable().optional(),
  status: z22.enum(["ACTIVE", "ABOUT_TO_EXPIRE", "EXPIRED", "CANCELLED"]).optional()
}).strict();

// src/modules/contracts/dtos/cancel-contract.dto.ts
import { z as z23 } from "zod";
var cancelContractSchema = z23.object({
  reason: z23.string().min(1, "Motivo do cancelamento \xE9 obrigat\xF3rio").max(500)
}).strict();

// src/modules/contracts/dtos/contract-filters.dto.ts
import { z as z24 } from "zod";
var contractFiltersSchema = z24.object({
  page: z24.coerce.number().int().positive().optional(),
  pageSize: z24.coerce.number().int().min(1).max(100).optional(),
  status: z24.enum(["ACTIVE", "ABOUT_TO_EXPIRE", "EXPIRED", "CANCELLED"]).optional(),
  customerId: z24.string().uuid().optional(),
  frequency: z24.enum(["MONTHLY", "BIMONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"]).optional(),
  dateStart: z24.string().optional(),
  dateEnd: z24.string().optional()
}).strict();

// src/modules/contracts/contracts.controller.ts
async function list10(request, reply) {
  const user = request.user;
  const query = validateOrThrow(contractFiltersSchema, request.query);
  const result = await list9(user.companyId, {
    status: query.status,
    customerId: query.customerId,
    frequency: query.frequency,
    dateStart: query.dateStart,
    dateEnd: query.dateEnd
  }, { page: query.page?.toString(), pageSize: query.pageSize?.toString() });
  return reply.status(200).send(result);
}
async function create10(request, reply) {
  const user = request.user;
  const body = validateOrThrow(createContractSchema, request.body);
  const result = await create9(user.companyId, {
    customerId: body.customerId,
    serviceType: body.serviceType,
    frequency: body.frequency,
    startDate: body.startDate,
    endDate: body.endDate,
    amount: body.amount,
    employeeId: body.employeeId,
    notes: body.notes
  }, user.sub);
  return reply.status(201).send({ data: result });
}
async function getById10(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const contract = await getById9(user.companyId, id);
  return reply.status(200).send({ data: contract });
}
async function update10(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const body = validateOrThrow(updateContractSchema, request.body);
  const updated = await update9(user.companyId, id, body, user.sub);
  return reply.status(200).send({ data: updated });
}
async function cancel2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const body = validateOrThrow(cancelContractSchema, request.body);
  const updated = await cancel(user.companyId, id, body, user.sub);
  return reply.status(200).send({ data: updated });
}

// src/modules/contracts/contracts.routes.ts
async function contractsRoutes(app2) {
  app2.get(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    list10
  );
  app2.post(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    create10
  );
  app2.get(
    "/:id",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getById10
  );
  app2.put(
    "/:id",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    update10
  );
  app2.patch(
    "/:id/cancel",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    cancel2
  );
}

// src/modules/services/services.service.ts
import crypto2 from "crypto";
import fs from "fs/promises";
import path2 from "path";
async function list11(companyId, filters, query, userRole, userId) {
  const pagination = parsePagination(query);
  const where = { companyId, deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.employeeId) where.employeeId = filters.employeeId;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.contractId) where.contractId = filters.contractId;
  if (filters.dateStart || filters.dateEnd) {
    const scheduledAtFilter = {};
    if (filters.dateStart) scheduledAtFilter.gte = new Date(filters.dateStart);
    if (filters.dateEnd) scheduledAtFilter.lte = new Date(filters.dateEnd);
    where.scheduledAt = scheduledAtFilter;
  }
  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip: buildSkip(pagination),
      take: pagination.limit,
      orderBy: { scheduledAt: "desc" },
      include: {
        customer: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } }
      }
    }),
    prisma.service.count({ where })
  ]);
  return { data: services, meta: buildMeta(total, pagination) };
}
async function getById11(companyId, serviceId, userRole) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
    include: {
      customer: true,
      employee: { select: { id: true, name: true, phone: true } },
      equipment: { include: { equipment: true } },
      photos: true
    }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  const customer = service.customer;
  if (userRole === "TECHNICIAN") {
    return {
      ...service,
      customer: maskCustomerForTechnician(customer)
    };
  }
  return {
    ...service,
    customer: {
      ...customer,
      document: customer.document ? maskDocument(customer.document, customer.documentType || "CNPJ") : null,
      email: customer.email ? maskEmail(customer.email) : null
    }
  };
}
async function start(companyId, serviceId) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  if (service.status !== "SCHEDULED") {
    throw new AppError("Apenas servi\xE7os agendados podem ser iniciados", 400, "INVALID_STATUS");
  }
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { status: "IN_PROGRESS" }
  });
  await createAuditLog({
    companyId,
    entityType: "Service",
    entityId: serviceId,
    action: "START",
    oldData: { status: "SCHEDULED" },
    newData: { status: "IN_PROGRESS" }
  });
  return updated;
}
async function complete(companyId, serviceId, data) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  if (!["SCHEDULED", "IN_PROGRESS"].includes(service.status)) {
    throw new AppError("Apenas servi\xE7os agendados ou em andamento podem ser conclu\xEDdos", 400, "INVALID_STATUS");
  }
  const confirmationToken = crypto2.randomUUID();
  const confirmationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.service.update({
      where: { id: serviceId },
      data: {
        status: "COMPLETED",
        completedDate: /* @__PURE__ */ new Date(),
        executionNotes: data.executionNotes ?? null,
        durationMinutes: data.durationMinutes ?? null,
        confirmationToken,
        confirmationTokenExpiresAt
      }
    });
    if (data.equipmentNotes && data.equipmentNotes.length > 0) {
      for (const eq of data.equipmentNotes) {
        await tx.serviceEquipment.upsert({
          where: { serviceId_equipmentId: { serviceId, equipmentId: eq.equipmentId } },
          create: { serviceId, equipmentId: eq.equipmentId, notes: eq.note },
          update: { notes: eq.note }
        });
      }
    }
    return updated;
  });
  return { ...result, confirmationToken, confirmationLink: `/api/confirm/${confirmationToken}` };
}
async function cancel3(companyId, serviceId, data) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  if (["COMPLETED", "CONFIRMED"].includes(service.status)) {
    throw new AppError("N\xE3o \xE9 poss\xEDvel cancelar um servi\xE7o j\xE1 conclu\xEDdo ou confirmado", 409, "INVALID_STATUS");
  }
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { status: "CANCELLED", cancelledReason: data.reason }
  });
  await createAuditLog({
    companyId,
    entityType: "Service",
    entityId: serviceId,
    action: "CANCEL",
    oldData: { status: service.status },
    newData: { status: "CANCELLED", reason: data.reason }
  });
  return updated;
}
async function reschedule(companyId, serviceId, data) {
  const newDate = new Date(data.scheduledAt);
  if (newDate <= /* @__PURE__ */ new Date()) {
    throw new AppError("A nova data deve ser no futuro", 400, "INVALID_DATE");
  }
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  if (!["SCHEDULED", "IN_PROGRESS"].includes(service.status)) {
    throw new AppError("Apenas servi\xE7os agendados ou em andamento podem ser reagendados", 400, "INVALID_STATUS");
  }
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { scheduledAt: newDate, status: "SCHEDULED" }
  });
  await createAuditLog({
    companyId,
    entityType: "Service",
    entityId: serviceId,
    action: "RESCHEDULE",
    oldData: { scheduledAt: service.scheduledAt, status: service.status },
    newData: { scheduledAt: data.scheduledAt, status: "SCHEDULED" }
  });
  return updated;
}
async function resendConfirmation(companyId, serviceId) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  if (service.status !== "COMPLETED") {
    throw new AppError("Apenas servi\xE7os conclu\xEDdos podem ter confirma\xE7\xE3o reenviada", 400, "INVALID_STATUS");
  }
  const newToken = crypto2.randomUUID();
  const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1e3);
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { confirmationToken: newToken, confirmationTokenExpiresAt: newExpiry }
  });
  return { ...updated, confirmationToken: newToken };
}
async function getReport(companyId, serviceId) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
    select: { id: true, serviceNumber: true, reportUrl: true }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  return {
    data: {
      id: service.id,
      serviceNumber: service.serviceNumber,
      reportUrl: service.reportUrl
    }
  };
}
async function addPhotos(companyId, serviceId, files) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
    select: { id: true }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  if (!files || files.length === 0) {
    return { photos: [] };
  }
  const uploadDir = path2.join(process.cwd(), "uploads", "services", serviceId);
  await fs.mkdir(uploadDir, { recursive: true });
  const createdPhotos = [];
  for (const file of files) {
    const buffer = await file.toBuffer();
    const ext = path2.extname(file.filename) || ".jpg";
    const filename = `${crypto2.randomUUID()}${ext}`;
    const filepath = path2.join(uploadDir, filename);
    await fs.writeFile(filepath, buffer);
    const photo = await prisma.servicePhoto.create({
      data: {
        serviceId,
        url: `/uploads/services/${serviceId}/${filename}`,
        caption: null
      }
    });
    createdPhotos.push(photo);
  }
  return { photos: createdPhotos };
}
async function removePhoto(companyId, serviceId, photoId) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
    select: { id: true }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  const photo = await prisma.servicePhoto.findFirst({
    where: { id: photoId, serviceId }
  });
  if (!photo) throw new AppError("Foto n\xE3o encontrada", 404, "NOT_FOUND");
  await prisma.servicePhoto.delete({ where: { id: photoId } });
  return { success: true };
}
async function linkEquipment(companyId, serviceId, equipmentIds) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
    select: { id: true, customerId: true }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  const equipmentList = await prisma.equipment.findMany({
    where: { id: { in: equipmentIds }, companyId, customerId: service.customerId, deletedAt: null },
    select: { id: true }
  });
  const foundIds = new Set(equipmentList.map((e) => e.id));
  const missingIds = equipmentIds.filter((id) => !foundIds.has(id));
  if (missingIds.length > 0) {
    throw new AppError("Alguns equipamentos n\xE3o pertencem ao cliente do servi\xE7o ou n\xE3o existem", 400, "INVALID_EQUIPMENT");
  }
  await prisma.$transaction(
    equipmentIds.map(
      (equipmentId) => prisma.serviceEquipment.upsert({
        where: { serviceId_equipmentId: { serviceId, equipmentId } },
        create: { serviceId, equipmentId },
        update: {}
      })
    )
  );
  const linked = await prisma.serviceEquipment.findMany({
    where: { serviceId },
    include: { equipment: true }
  });
  return { equipment: linked };
}

// src/modules/services/dtos/complete-service.dto.ts
import { z as z25 } from "zod";
var equipmentNoteSchema = z25.object({
  equipmentId: z25.string().uuid(),
  note: z25.string().max(500)
});
var completeServiceSchema = z25.object({
  executionNotes: z25.string().min(1, "Observa\xE7\xF5es s\xE3o obrigat\xF3rias").max(2e3).optional(),
  durationMinutes: z25.number().int().positive().optional(),
  equipmentNotes: z25.array(equipmentNoteSchema).optional()
}).strict();

// src/modules/services/dtos/cancel-service.dto.ts
import { z as z26 } from "zod";
var cancelServiceSchema = z26.object({
  reason: z26.string().min(1, "Motivo do cancelamento \xE9 obrigat\xF3rio").max(500)
}).strict();

// src/modules/services/dtos/reschedule-service.dto.ts
import { z as z27 } from "zod";
var rescheduleServiceSchema = z27.object({
  scheduledAt: z27.string().min(1, "Nova data \xE9 obrigat\xF3ria")
}).strict();

// src/modules/services/dtos/service-filters.dto.ts
import { z as z28 } from "zod";
var serviceFiltersSchema = z28.object({
  page: z28.coerce.number().int().positive().optional(),
  pageSize: z28.coerce.number().int().min(1).max(100).optional(),
  status: z28.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CONFIRMED", "CANCELLED"]).optional(),
  employeeId: z28.string().uuid().optional(),
  customerId: z28.string().uuid().optional(),
  contractId: z28.string().uuid().optional(),
  dateStart: z28.string().optional(),
  dateEnd: z28.string().optional()
}).strict();

// src/modules/services/dtos/link-equipment.dto.ts
import { z as z29 } from "zod";
var linkEquipmentSchema = z29.object({
  equipmentIds: z29.array(z29.string().uuid()).min(1, "Selecione pelo menos um equipamento")
}).strict();

// src/modules/services/services.controller.ts
async function list12(request, reply) {
  const user = request.user;
  const query = validateOrThrow(serviceFiltersSchema, request.query);
  const result = await list11(
    user.companyId,
    {
      status: query.status,
      employeeId: query.employeeId,
      customerId: query.customerId,
      contractId: query.contractId,
      dateStart: query.dateStart,
      dateEnd: query.dateEnd
    },
    { page: query.page?.toString(), pageSize: query.pageSize?.toString() },
    user.role,
    user.sub
  );
  return reply.status(200).send(result);
}
async function getById12(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const service = await getById11(user.companyId, id, user.role);
  return reply.status(200).send({ data: service });
}
async function start2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const updated = await start(user.companyId, id);
  return reply.status(200).send({ data: updated });
}
async function complete2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const body = validateOrThrow(completeServiceSchema, request.body);
  const result = await complete(user.companyId, id, body);
  return reply.status(200).send({ data: result });
}
async function cancel4(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const body = validateOrThrow(cancelServiceSchema, request.body);
  const updated = await cancel3(user.companyId, id, body);
  return reply.status(200).send({ data: updated });
}
async function reschedule2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const body = validateOrThrow(rescheduleServiceSchema, request.body);
  const updated = await reschedule(user.companyId, id, body);
  return reply.status(200).send({ data: updated });
}
async function resendConfirmation2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const result = await resendConfirmation(user.companyId, id);
  return reply.status(200).send({ data: result });
}
async function getReport2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const result = await getReport(user.companyId, id);
  return reply.status(200).send(result);
}
async function addPhotos2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const files = request.files ?? [];
  const result = await addPhotos(user.companyId, id, files);
  return reply.status(200).send(result);
}
async function removePhoto2(request, reply) {
  const user = request.user;
  const { id, photoId } = request.params;
  await removePhoto(user.companyId, id, photoId);
  return reply.status(204).send();
}
async function linkEquipment2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const body = validateOrThrow(linkEquipmentSchema, request.body);
  const result = await linkEquipment(user.companyId, id, body.equipmentIds);
  return reply.status(200).send(result);
}

// src/modules/services/services.routes.ts
async function servicesRoutes(app2) {
  app2.get(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    list12
  );
  app2.get(
    "/:id",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    getById12
  );
  app2.patch(
    "/:id/start",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    start2
  );
  app2.patch(
    "/:id/complete",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    complete2
  );
  app2.patch(
    "/:id/cancel",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    cancel4
  );
  app2.patch(
    "/:id/reschedule",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    reschedule2
  );
  app2.post(
    "/:id/resend-confirmation",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    resendConfirmation2
  );
  app2.get(
    "/:id/report",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getReport2
  );
  app2.post(
    "/:id/photos",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    addPhotos2
  );
  app2.delete(
    "/:id/photos/:photoId",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    removePhoto2
  );
  app2.patch(
    "/:id/equipment",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    linkEquipment2
  );
}

// src/modules/confirm/confirm.service.ts
function anonymizeIp(ip) {
  if (!ip || ip === "::1" || ip.startsWith("::ffff:")) {
    return "0.0.0.0";
  }
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.0.0`;
  }
  return "0.0.0.0";
}
async function getConfirmationData(token) {
  const service = await prisma.service.findUnique({
    where: { confirmationToken: token },
    include: {
      employee: { select: { name: true } },
      company: { select: { name: true, logoUrl: true } },
      customer: { select: { id: true, name: true, address: true } },
      equipment: {
        include: {
          equipment: {
            select: { type: true, brand: true, model: true, location: true }
          }
        }
      }
    }
  });
  if (!service) {
    throw new AppError("Link de confirma\xE7\xE3o inv\xE1lido", 404, "NOT_FOUND");
  }
  if (service.confirmationTokenExpiresAt && service.confirmationTokenExpiresAt < /* @__PURE__ */ new Date()) {
    throw new AppError("Link de confirma\xE7\xE3o expirado", 410, "EXPIRED");
  }
  if (service.confirmedAt) {
    return {
      alreadyConfirmed: true,
      confirmedAt: service.confirmedAt
    };
  }
  return {
    serviceNumber: service.serviceNumber,
    serviceType: service.serviceType,
    scheduledAt: service.scheduledAt,
    completedDate: service.completedDate,
    technicianName: service.employee?.name ?? null,
    companyName: service.company.name,
    companyLogo: service.company.logoUrl,
    customerName: service.customer.name,
    equipment: service.equipment.map((se) => ({
      type: se.equipment.type,
      brand: se.equipment.brand,
      model: se.equipment.model,
      location: se.equipment.location
    }))
  };
}
async function confirm(token, ip, userAgent) {
  const service = await prisma.service.findUnique({
    where: { confirmationToken: token },
    select: {
      id: true,
      serviceNumber: true,
      companyId: true,
      confirmationTokenExpiresAt: true,
      confirmedAt: true
    }
  });
  if (!service) {
    throw new AppError("Link de confirma\xE7\xE3o inv\xE1lido", 404, "NOT_FOUND");
  }
  if (service.confirmationTokenExpiresAt && service.confirmationTokenExpiresAt < /* @__PURE__ */ new Date()) {
    throw new AppError("Link de confirma\xE7\xE3o expirado", 410, "EXPIRED");
  }
  if (service.confirmedAt) {
    throw new AppError("Servi\xE7o j\xE1 confirmado", 409, "ALREADY_CONFIRMED");
  }
  const now = /* @__PURE__ */ new Date();
  await prisma.$transaction(async (tx) => {
    await tx.service.update({
      where: { id: service.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: now,
        confirmedIp: anonymizeIp(ip),
        confirmedUserAgent: userAgent,
        confirmationToken: null,
        confirmationTokenExpiresAt: null
      }
    });
    await createAuditLog({
      companyId: service.companyId,
      entityType: "Service",
      entityId: service.id,
      action: "CONFIRM"
    });
  });
  return {
    success: true,
    serviceNumber: service.serviceNumber,
    confirmedAt: now
  };
}

// src/modules/confirm/confirm.controller.ts
async function getConfirmation(request, reply) {
  const { token } = request.params;
  const data = await getConfirmationData(token);
  return reply.status(200).send({ data });
}
async function confirmServiceHandler(request, reply) {
  const { token } = request.params;
  const ip = request.ip;
  const userAgent = request.headers["user-agent"] ?? "";
  const result = await confirm(token, ip, userAgent);
  return reply.status(200).send(result);
}

// src/modules/confirm/confirm.routes.ts
async function confirmRoutes(app2) {
  app2.get(
    "/confirm/:token",
    {
      config: { rateLimit: { max: 20, timeWindow: 6e4 } }
    },
    getConfirmation
  );
  app2.post(
    "/confirm/:token",
    {
      config: { rateLimit: { max: 5, timeWindow: 6e4 } }
    },
    confirmServiceHandler
  );
}

// src/utils/date.ts
function addMonths(date, months) {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== day) {
    result.setDate(0);
  }
  return result;
}
function calcNextServiceDate(currentDate, frequency) {
  switch (frequency) {
    case "MONTHLY":
      return addMonths(currentDate, 1);
    case "BIMONTHLY":
      return addMonths(currentDate, 2);
    case "QUARTERLY":
      return addMonths(currentDate, 3);
    case "SEMIANNUAL":
      return addMonths(currentDate, 6);
    case "YEARLY":
      return addMonths(currentDate, 12);
    default:
      return addMonths(currentDate, 1);
  }
}
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

// src/modules/dashboard/dashboard.service.ts
var FREQ_TO_MONTHS = {
  MONTHLY: 1,
  BIMONTHLY: 2,
  QUARTERLY: 3,
  SEMIANNUAL: 6,
  YEARLY: 12
};
function normalizeToMonthly(amount, frequency) {
  const months = FREQ_TO_MONTHS[frequency] ?? 1;
  return amount / months;
}
async function getSummary(companyId) {
  const now = /* @__PURE__ */ new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const [
    activeCustomers,
    activeContracts,
    servicesThisMonth,
    aboutToExpireContracts,
    delayedServices,
    totalTechnicians,
    totalContractValue,
    servicesScheduledToday,
    completedServices,
    confirmedServices,
    avgHoursRaw
  ] = await Promise.all([
    prisma.customer.count({ where: { companyId, deletedAt: null, isActive: true } }),
    prisma.contract.count({ where: { companyId, deletedAt: null, status: "ACTIVE" } }),
    prisma.service.count({ where: { companyId, deletedAt: null, scheduledAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.contract.count({ where: { companyId, deletedAt: null, status: "ACTIVE", endDate: { gte: now, lte: addMonths(now, 1) } } }),
    prisma.service.count({ where: { companyId, deletedAt: null, status: { in: ["SCHEDULED", "IN_PROGRESS"] }, scheduledAt: { lt: now } } }),
    prisma.employee.count({ where: { companyId, deletedAt: null, isActive: true } }),
    prisma.contract.aggregate({ where: { companyId, deletedAt: null, status: "ACTIVE" }, _sum: { amount: true } }),
    prisma.service.count({ where: { companyId, deletedAt: null, scheduledAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.service.count({ where: { companyId, deletedAt: null, status: "COMPLETED", completedDate: { gte: monthStart, lte: monthEnd } } }),
    prisma.service.count({ where: { companyId, deletedAt: null, status: "COMPLETED", confirmedAt: { not: null }, completedDate: { gte: monthStart, lte: monthEnd } } }),
    prisma.$queryRaw`
      SELECT AVG(
        EXTRACT(EPOCH FROM (s.completed_date - s.scheduled_at)) / 3600
      ) as avg
      FROM services s
      WHERE s.company_id = ${companyId}
        AND s.deleted_at IS NULL
        AND s.status = 'COMPLETED'
        AND s.completed_date IS NOT NULL
        AND s.scheduled_at IS NOT NULL
    `
  ]);
  const activeContractsList = await prisma.contract.findMany({
    where: { companyId, deletedAt: null, status: "ACTIVE" },
    select: { amount: true, frequency: true }
  });
  const monthlyRecurringRevenue = activeContractsList.reduce(
    (sum, c) => sum + normalizeToMonthly(Number(c.amount), c.frequency),
    0
  );
  const techniciansWithServicesToday = await prisma.service.groupBy({
    by: ["employeeId"],
    where: {
      companyId,
      deletedAt: null,
      employeeId: { not: null },
      scheduledAt: { gte: todayStart, lte: todayEnd }
    }
  });
  const techniciansBusyToday = techniciansWithServicesToday.length;
  const confirmationRate = completedServices > 0 ? confirmedServices / completedServices * 100 : 0;
  const averageCompletionHours = avgHoursRaw[0]?.avg ? Number(Number(avgHoursRaw[0].avg).toFixed(1)) : 0;
  return {
    activeCustomers,
    activeContracts,
    servicesThisMonth,
    contractsExpiringIn30Days: aboutToExpireContracts,
    delayedServices,
    techniciansBusyToday,
    totalTechnicians,
    totalContractValue: totalContractValue._sum.amount ? Number(totalContractValue._sum.amount) : 0,
    monthlyRecurringRevenue,
    servicesCompletedThisMonth: completedServices,
    servicesScheduledToday,
    confirmationRate,
    averageCompletionHours
  };
}
async function getUpcomingServices(companyId, start3, end) {
  const now = /* @__PURE__ */ new Date();
  const startDate = start3 ? new Date(start3) : now;
  const endDate = end ? new Date(end) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
  const services = await prisma.service.findMany({
    where: { companyId, deletedAt: null, scheduledAt: { gte: startDate, lte: endDate } },
    include: {
      customer: { select: { id: true, name: true, address: true } },
      employee: { select: { id: true, name: true } }
    },
    orderBy: { scheduledAt: "asc" },
    take: 20
  });
  return services.map((s) => ({
    id: s.id,
    customerName: s.customer.name,
    customerAddress: s.customer.address?.city ?? "",
    employeeName: s.employee?.name ?? null,
    employeeId: s.employee?.id ?? null,
    scheduledDate: s.scheduledAt.toISOString(),
    serviceType: s.serviceType ?? "MAINTENANCE",
    status: s.status
  }));
}
async function getExpiringContracts(companyId) {
  const now = /* @__PURE__ */ new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3);
  const contracts = await prisma.contract.findMany({
    where: { companyId, deletedAt: null, status: "ACTIVE", endDate: { gte: now, lte: thirtyDaysFromNow } },
    include: { customer: { select: { id: true, name: true } } },
    orderBy: { endDate: "asc" }
  });
  return contracts.map((c) => ({
    id: c.id,
    customerId: c.customerId,
    customerName: c.customer.name,
    serviceType: c.serviceType ?? "MAINTENANCE",
    expiresAt: c.endDate.toISOString(),
    daysRemaining: Math.ceil((c.endDate.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24)),
    value: Number(c.amount)
  }));
}
async function getRecentActivity(companyId) {
  const logs = await prisma.auditLog.findMany({
    where: { companyId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    userName: log.user?.name ?? null,
    createdAt: log.createdAt,
    description: buildDescription(log.action, log.entityType, log.entityId, log.user?.name)
  }));
}
async function getTechnicianStatus(companyId) {
  const now = /* @__PURE__ */ new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const employees = await prisma.employee.findMany({
    where: { companyId, deletedAt: null },
    select: {
      id: true,
      name: true,
      isActive: true,
      services: {
        where: {
          deletedAt: null,
          scheduledAt: { gte: todayStart, lte: todayEnd }
        },
        select: {
          id: true,
          status: true,
          customer: { select: { name: true } }
        }
      }
    }
  });
  return employees.map((emp) => {
    const todayServices = emp.services;
    const servicesToday = todayServices.length;
    const completedToday = todayServices.filter((s) => s.status === "COMPLETED").length;
    const currentService = todayServices.find((s) => s.status === "IN_PROGRESS") ?? null;
    let status;
    if (!emp.isActive) {
      status = "OFFLINE";
    } else if (currentService) {
      status = "BUSY";
    } else {
      status = "FREE";
    }
    return {
      id: emp.id,
      name: emp.name,
      servicesToday,
      completedToday,
      currentServiceId: currentService?.id ?? null,
      currentServiceCustomer: currentService?.customer.name ?? null,
      status
    };
  });
}
async function getMonthlyRevenue(companyId) {
  const now = /* @__PURE__ */ new Date();
  const rows = await prisma.$queryRaw`
    SELECT
      TO_CHAR(DATE_TRUNC('month', s.completed_date), 'YYYY-MM') as month,
      COALESCE(SUM(s.amount), 0) as value,
      COUNT(*)::int as count
    FROM services s
    WHERE s.company_id = ${companyId}
      AND s.deleted_at IS NULL
      AND s.status = 'COMPLETED'
      AND s.completed_date >= ${startOfMonth(new Date(now.getFullYear(), now.getMonth() - 11, 1))}
    GROUP BY DATE_TRUNC('month', s.completed_date)
    ORDER BY month ASC
  `;
  const rowsByMonth = new Map(rows.map((r) => [r.month, { value: Number(r.value), services: Number(r.count) }]));
  const result = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const data = rowsByMonth.get(monthKey) ?? { value: 0, services: 0 };
    result.push({ month: monthKey, value: data.value, services: data.services });
  }
  return result;
}
function buildDescription(action, entityType, entityId, userName) {
  const mappings = {
    LOGIN: { _default: `Usu\xE1rio ${userName ?? "desconhecido"} fez login` },
    LOGOUT: { _default: `Usu\xE1rio ${userName ?? "desconhecido"} fez logout` },
    CREATE: {
      Service: `OS #${entityId} foi criada`,
      Customer: "Cliente foi criado",
      Contract: "Contrato foi criado",
      Employee: "Funcion\xE1rio foi criado",
      Equipment: "Equipamento foi criado",
      _default: `${entityType} foi criado`
    },
    UPDATE: {
      Customer: "Cliente foi atualizado",
      Contract: "Contrato foi atualizado",
      Employee: "Funcion\xE1rio foi atualizado",
      Equipment: "Equipamento foi atualizado",
      Company: "Empresa foi atualizada",
      _default: `${entityType} foi atualizado`
    },
    DELETE: { _default: `${entityType} foi removido` },
    START: { Service: `OS #${entityId} foi iniciada`, _default: `${entityType} foi iniciado` },
    COMPLETE: { Service: `OS #${entityId} foi conclu\xEDda`, _default: `${entityType} foi conclu\xEDdo` },
    CONFIRM: { Service: `OS #${entityId} foi confirmada`, _default: `${entityType} foi confirmado` },
    CANCEL: { Service: `OS #${entityId} foi cancelada`, _default: `${entityType} foi cancelado` },
    RESCHEDULE: { Service: `OS #${entityId} foi reagendada`, _default: `${entityType} foi reagendado` },
    CHANGE_PASSWORD: { _default: `${userName ?? "Usu\xE1rio"} alterou a senha` },
    RESET_PASSWORD: { _default: "Senha foi redefinida" },
    CONSENT: { _default: "Consentimento de dados foi registrado" },
    UPLOAD_LOGO: { _default: "Logo da empresa foi atualizado" },
    ACTIVATE: { _default: `${entityType} foi ativado` },
    DEACTIVATE: { _default: `${entityType} foi desativado` }
  };
  const actionMap = mappings[action];
  if (!actionMap) return `${action} em ${entityType}`;
  return actionMap[entityType] ?? actionMap._default ?? `${action} em ${entityType}`;
}

// src/modules/dashboard/dashboard.controller.ts
async function getSummary2(request, reply) {
  const user = request.user;
  const data = await getSummary(user.companyId);
  return reply.status(200).send({ data });
}
async function getUpcomingServices2(request, reply) {
  const user = request.user;
  const query = request.query;
  const data = await getUpcomingServices(user.companyId, query.start, query.end);
  return reply.status(200).send({ data });
}
async function getExpiringContracts2(request, reply) {
  const user = request.user;
  const data = await getExpiringContracts(user.companyId);
  return reply.status(200).send({ data });
}
async function getRecentActivity2(request, reply) {
  const user = request.user;
  const data = await getRecentActivity(user.companyId);
  return reply.status(200).send({ data });
}
async function getTechnicianStatus2(request, reply) {
  const user = request.user;
  const data = await getTechnicianStatus(user.companyId);
  return reply.status(200).send({ data });
}
async function getMonthlyRevenue2(request, reply) {
  const user = request.user;
  const data = await getMonthlyRevenue(user.companyId);
  return reply.status(200).send({ data });
}

// src/modules/dashboard/dashboard.routes.ts
async function dashboardRoutes(app2) {
  app2.get(
    "/dashboard/summary",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getSummary2
  );
  app2.get(
    "/dashboard/upcoming-services",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getUpcomingServices2
  );
  app2.get(
    "/dashboard/expiring-contracts",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getExpiringContracts2
  );
  app2.get(
    "/dashboard/recent-activity",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getRecentActivity2
  );
  app2.get(
    "/dashboard/technician-status",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getTechnicianStatus2
  );
  app2.get(
    "/dashboard/monthly-revenue",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getMonthlyRevenue2
  );
}

// src/modules/lgpd/lgpd.service.ts
async function exportData(userId, companyId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });
  if (!user) {
    throw new AppError("Usu\xE1rio n\xE3o encontrado", 404, "NOT_FOUND");
  }
  const auditLogs = await prisma.auditLog.findMany({
    where: { userId, companyId },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      action: true,
      entityType: true,
      entityId: true,
      createdAt: true
    }
  });
  await createAuditLog({
    companyId,
    userId,
    entityType: "User",
    entityId: userId,
    action: "EXPORT_DATA"
  });
  return {
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    },
    auditLogs
  };
}
async function registerConsent(companyId, userId) {
  const now = /* @__PURE__ */ new Date();
  await prisma.company.update({
    where: { id: companyId },
    data: { dataConsentAt: now }
  });
  await createAuditLog({
    companyId,
    userId,
    entityType: "Company",
    entityId: companyId,
    action: "CONSENT"
  });
  return { dataConsentAt: now, accepted: true };
}
async function getConsent(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { dataConsentAt: true }
  });
  if (!company) {
    throw new AppError("Empresa n\xE3o encontrada", 404, "NOT_FOUND");
  }
  return {
    dataConsentAt: company.dataConsentAt,
    accepted: company.dataConsentAt !== null
  };
}

// src/modules/lgpd/lgpd.controller.ts
async function exportData2(request, reply) {
  const user = request.user;
  const data = await exportData(user.sub, user.companyId);
  return reply.status(200).send({ data });
}
async function registerConsent2(request, reply) {
  const user = request.user;
  const result = await registerConsent(user.companyId, user.sub);
  return reply.status(200).send({ data: result });
}
async function getConsent2(request, reply) {
  const user = request.user;
  const result = await getConsent(user.companyId);
  return reply.status(200).send({ data: result });
}

// src/modules/lgpd/lgpd.routes.ts
async function lgpdRoutes(app2) {
  app2.get(
    "/lgpd/export",
    { preHandler: [app2.authenticate] },
    exportData2
  );
  app2.post(
    "/lgpd/consent",
    { preHandler: [app2.authenticate, authorize("OWNER")] },
    registerConsent2
  );
  app2.get(
    "/lgpd/consent",
    { preHandler: [app2.authenticate, authorize("OWNER")] },
    getConsent2
  );
}

// src/app.ts
function buildApp() {
  const app2 = Fastify({ logger: loggerConfig });
  app2.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details }
      });
    }
    const err = error;
    if (err.validation) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Dados inv\xE1lidos", details: err.validation }
      });
    }
    if (err.statusCode === 429) {
      return reply.status(429).send({
        error: { code: "RATE_LIMIT", message: "Muitas requisi\xE7\xF5es. Tente novamente mais tarde." }
      });
    }
    app2.log.error(err);
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: env.NODE_ENV === "production" ? "Erro interno do servidor" : err.message || "Erro interno"
      }
    });
  });
  app2.register(cookie_default);
  app2.register(jwt_default);
  app2.register(cors_default);
  app2.register(helmet_default);
  app2.register(rate_limit_default);
  app2.register(request_context_default);
  app2.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 }
  });
  app2.register(swagger_default);
  app2.register(healthRoute);
  app2.register(authRoutes, { prefix: "/auth" });
  app2.register(companyRoutes, { prefix: "/company" });
  app2.register(usersRoutes, { prefix: "/users" });
  app2.register(employeesRoutes, { prefix: "/employees" });
  app2.register(customersRoutes, { prefix: "/customers" });
  app2.register(equipmentRoutes, { prefix: "/customers/:customerId/equipment" });
  app2.register(contractsRoutes, { prefix: "/contracts" });
  app2.register(servicesRoutes, { prefix: "/services" });
  app2.register(confirmRoutes);
  app2.register(dashboardRoutes);
  app2.register(lgpdRoutes);
  return app2;
}

// src/jobs/index.ts
import cron from "node-cron";

// src/jobs/generate-services.job.ts
async function generateServicesJob() {
  const contracts = await prisma.contract.findMany({
    where: {
      status: "ACTIVE",
      nextServiceDate: { lte: /* @__PURE__ */ new Date() },
      deletedAt: null
    },
    include: { company: true }
  });
  let generated = 0;
  let errors = 0;
  for (const contract of contracts) {
    try {
      await prisma.$transaction(async (tx) => {
        const serviceNumber = await getNextServiceNumber(contract.companyId);
        await tx.service.create({
          data: {
            serviceNumber,
            companyId: contract.companyId,
            contractId: contract.id,
            customerId: contract.customerId,
            scheduledAt: contract.nextServiceDate,
            status: "SCHEDULED",
            amount: contract.amount
          }
        });
        const newNextDate = calcNextServiceDate(contract.nextServiceDate, contract.frequency);
        await tx.contract.update({
          where: { id: contract.id },
          data: { nextServiceDate: newNextDate }
        });
      });
      generated++;
    } catch {
      errors++;
    }
  }
  console.log(`[generate-services] Geradas: ${generated}, Erros: ${errors}`);
}

// src/jobs/expire-contracts.job.ts
async function expireContractsJob() {
  const now = /* @__PURE__ */ new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3);
  const { count: expired } = await prisma.contract.updateMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: now },
      deletedAt: null
    },
    data: { status: "EXPIRED" }
  });
  const { count: aboutToExpire } = await prisma.contract.updateMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: now, lte: sevenDaysFromNow },
      deletedAt: null
    },
    data: { status: "ABOUT_TO_EXPIRE" }
  });
  console.log(`[expire-contracts] Expirados: ${expired}, Prestes a expirar: ${aboutToExpire}`);
}

// src/jobs/cleanup.job.ts
async function cleanupTokensJob() {
  const now = /* @__PURE__ */ new Date();
  const [expiredTokens] = await Promise.all([
    prisma.service.updateMany({
      where: {
        confirmationToken: { not: null },
        confirmationTokenExpiresAt: { lt: now }
      },
      data: {
        confirmationToken: null,
        confirmationTokenExpiresAt: null
      }
    })
  ]);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1e3);
  const [anonymizedIps] = await Promise.all([
    prisma.service.updateMany({
      where: {
        confirmedAt: { lt: ninetyDaysAgo },
        confirmedIp: { not: null }
      },
      data: {
        confirmedIp: "0.0.0.0"
      }
    })
  ]);
  console.log(`[cleanup] Tokens expirados limpos: ${expiredTokens.count}, IPs anonimizados: ${anonymizedIps.count}`);
}

// src/jobs/index.ts
function registerJobs() {
  cron.schedule("1 0 * * *", () => {
    generateServicesJob().catch((err) => console.error("[generate-services] Erro:", err));
  });
  cron.schedule("0 1 * * *", () => {
    expireContractsJob().catch((err) => console.error("[expire-contracts] Erro:", err));
  });
  cron.schedule("0 2 * * *", () => {
    cleanupTokensJob().catch((err) => console.error("[cleanup-tokens] Erro:", err));
  });
}

// src/server.ts
var app = buildApp();
registerJobs();
app.listen({ port: env.PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
