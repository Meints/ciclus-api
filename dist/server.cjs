"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var path3 = require("path");
    var os = require("os");
    var crypto3 = require("crypto");
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
    module2.exports.configDotenv = DotenvModule.configDotenv;
    module2.exports._configVault = DotenvModule._configVault;
    module2.exports._parseVault = DotenvModule._parseVault;
    module2.exports.config = DotenvModule.config;
    module2.exports.decrypt = DotenvModule.decrypt;
    module2.exports.parse = DotenvModule.parse;
    module2.exports.populate = DotenvModule.populate;
    module2.exports = DotenvModule;
  }
});

// node_modules/dotenv/lib/env-options.js
var require_env_options = __commonJS({
  "node_modules/dotenv/lib/env-options.js"(exports2, module2) {
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
    module2.exports = options;
  }
});

// node_modules/dotenv/lib/cli-options.js
var require_cli_options = __commonJS({
  "node_modules/dotenv/lib/cli-options.js"(exports2, module2) {
    "use strict";
    var re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
    module2.exports = function optionMatcher(args) {
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
var import_fastify = __toESM(require("fastify"), 1);
var import_multipart = __toESM(require("@fastify/multipart"), 1);

// src/config/env.ts
var import_env_core = require("@t3-oss/env-core");
var import_zod = require("zod");
var env = (0, import_env_core.createEnv)({
  server: {
    NODE_ENV: import_zod.z.enum(["development", "test", "production"]).default("development"),
    PORT: import_zod.z.coerce.number().default(3333),
    DATABASE_URL: import_zod.z.url(),
    DIRECT_URL: import_zod.z.url(),
    JWT_SECRET: import_zod.z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
    JWT_EXPIRES_IN: import_zod.z.coerce.number().default(60 * 60 * 24 * 7),
    // 7 dias
    COOKIE_SECRET: import_zod.z.string().min(32, "COOKIE_SECRET deve ter pelo menos 32 caracteres"),
    CORS_ORIGIN: import_zod.z.url(),
    RATE_LIMIT_MAX: import_zod.z.coerce.number().default(100),
    RATE_LIMIT_TIME_WINDOW: import_zod.z.coerce.number().default(60 * 1e3),
    // 1 minuto
    LOG_LEVEL: import_zod.z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
    FRONTEND_URL: import_zod.z.string().default("http://localhost:3000"),
    SUPABASE_URL: import_zod.z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: import_zod.z.string().optional(),
    SUPABASE_STORAGE_BUCKET: import_zod.z.string().default("ciclus-uploads"),
    RESEND_API_KEY: import_zod.z.string().optional(),
    EMAIL_FROM: import_zod.z.string().default("noreply@ciclus.app"),
    ZAPI_INSTANCE_ID: import_zod.z.string().optional(),
    ZAPI_TOKEN: import_zod.z.string().optional(),
    ZAPI_BASE_URL: import_zod.z.string().default("https://api.z-api.io"),
    REFRESH_TOKEN_SECRET: import_zod.z.string().min(32, "REFRESH_TOKEN_SECRET deve ter pelo menos 32 caracteres").optional(),
    REFRESH_TOKEN_EXPIRES_IN: import_zod.z.coerce.number().default(60 * 60 * 24 * 30)
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
var import_fastify_plugin = __toESM(require("fastify-plugin"), 1);
var import_cookie = __toESM(require("@fastify/cookie"), 1);
var cookie_default = (0, import_fastify_plugin.default)(async (app2) => {
  await app2.register(import_cookie.default, {
    secret: env.COOKIE_SECRET,
    hook: "onRequest"
  });
});

// src/plugins/jwt.ts
var import_fastify_plugin2 = __toESM(require("fastify-plugin"), 1);
var import_jwt = __toESM(require("@fastify/jwt"), 1);
var jwt_default = (0, import_fastify_plugin2.default)(async (app2) => {
  await app2.register(import_jwt.default, {
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
var import_fastify_plugin3 = __toESM(require("fastify-plugin"), 1);
var import_cors = __toESM(require("@fastify/cors"), 1);
var cors_default = (0, import_fastify_plugin3.default)(async (app2) => {
  await app2.register(import_cors.default, {
    origin: env.CORS_ORIGIN,
    credentials: true
  });
});

// src/plugins/helmet.ts
var import_fastify_plugin4 = __toESM(require("fastify-plugin"), 1);
var import_helmet = __toESM(require("@fastify/helmet"), 1);
var helmet_default = (0, import_fastify_plugin4.default)(async (app2) => {
  await app2.register(import_helmet.default, {
    contentSecurityPolicy: env.NODE_ENV === "production" ? void 0 : false
  });
});

// src/plugins/rate-limit.ts
var import_fastify_plugin5 = __toESM(require("fastify-plugin"), 1);
var import_rate_limit = __toESM(require("@fastify/rate-limit"), 1);
var rate_limit_default = (0, import_fastify_plugin5.default)(async (app2) => {
  await app2.register(import_rate_limit.default, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW,
    keyGenerator: (request) => {
      const userId = request.user?.sub;
      return userId ?? request.ip;
    }
  });
});

// src/plugins/swagger.ts
var import_fastify_plugin6 = __toESM(require("fastify-plugin"), 1);
var import_swagger = __toESM(require("@fastify/swagger"), 1);
var import_swagger_ui = __toESM(require("@fastify/swagger-ui"), 1);
var swagger_default = (0, import_fastify_plugin6.default)(async (app2) => {
  if (env.NODE_ENV === "production") return;
  await app2.register(import_swagger.default, {
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
  await app2.register(import_swagger_ui.default, {
    routePrefix: "/docs"
  });
});

// src/lib/request-context.ts
var import_node_async_hooks = require("async_hooks");
var import_fastify_plugin7 = __toESM(require("fastify-plugin"), 1);
var storage = new import_node_async_hooks.AsyncLocalStorage();
var request_context_default = (0, import_fastify_plugin7.default)(async (app2) => {
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
var import_adapter_pg = require("@prisma/adapter-pg");

// generated/prisma/client.ts
var process2 = require("process");
var path = __toESM(require("path"), 1);
var import_node_url = require("url");
var runtime3 = require("@prisma/client/runtime/client");

// generated/prisma/internal/class.ts
var runtime = __toESM(require("@prisma/client/runtime/client"), 1);
var config = {
  "previewFeatures": [],
  "clientVersion": "7.8.0",
  "engineVersion": "3c6e192761c0362d496ed980de936e2f3cebcd3a",
  "activeProvider": "postgresql",
  "inlineSchema": 'generator client {\n  provider = "prisma-client"\n  output   = "../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel Company {\n  id                String     @id @default(uuid())\n  name              String\n  document          String?\n  logoUrl           String?    @map("logo_url")\n  lastServiceNumber Int        @default(0) @map("last_service_number")\n  createdAt         DateTime   @default(now()) @map("created_at")\n  updatedAt         DateTime   @updatedAt @map("updated_at")\n  fantasyName       String?    @map("fantasy_name")\n  email             String?\n  phone             String?\n  niche             String     @default("GENERAL")\n  plan              String     @default("FREE")\n  address           Json?\n  isActive          Boolean    @default(true) @map("is_active")\n  dataConsentAt     DateTime?  @map("data_consent_at")\n  trialEndsAt       DateTime?  @map("trial_ends_at")\n  auditLogs         AuditLog[]\n  contracts         Contract[]\n  customers         Customer[]\n  employees         Employee[]\n  services          Service[]\n  users             User[]\n\n  @@index([document])\n  @@map("companies")\n}\n\nmodel User {\n  id                     String     @id @default(uuid())\n  companyId              String     @map("company_id")\n  name                   String\n  email                  String     @unique\n  passwordHash           String     @map("password_hash")\n  role                   UserRole   @default(OWNER)\n  createdAt              DateTime   @default(now()) @map("created_at")\n  updatedAt              DateTime   @updatedAt @map("updated_at")\n  isActive               Boolean    @default(true) @map("is_active")\n  lastLoginAt            DateTime?  @map("last_login_at")\n  refreshTokenHash       String?    @map("refresh_token_hash")\n  resetPasswordToken     String?    @map("reset_password_token")\n  resetPasswordExpiresAt DateTime?  @map("reset_password_expires_at")\n  deletedAt              DateTime?  @map("deleted_at")\n  auditLogs              AuditLog[]\n  company                Company    @relation(fields: [companyId], references: [id])\n\n  @@index([companyId])\n  @@map("users")\n}\n\nmodel Employee {\n  id        String    @id @default(uuid())\n  companyId String    @map("company_id")\n  name      String\n  email     String?\n  phone     String?\n  isActive  Boolean   @default(true) @map("is_active")\n  createdAt DateTime  @default(now()) @map("created_at")\n  updatedAt DateTime  @updatedAt @map("updated_at")\n  deletedAt DateTime? @map("deleted_at")\n  company   Company   @relation(fields: [companyId], references: [id])\n  services  Service[]\n\n  @@index([companyId])\n  @@map("employees")\n}\n\nmodel Customer {\n  id           String      @id @default(uuid())\n  companyId    String      @map("company_id")\n  name         String\n  email        String?\n  phone        String?\n  document     String?\n  address      Json?\n  notes        String?\n  isActive     Boolean     @default(true) @map("is_active")\n  createdAt    DateTime    @default(now()) @map("created_at")\n  updatedAt    DateTime    @updatedAt @map("updated_at")\n  deletedAt    DateTime?   @map("deleted_at")\n  fantasyName  String?     @map("fantasy_name")\n  documentType String      @default("CNPJ") @map("document_type")\n  contracts    Contract[]\n  company      Company     @relation(fields: [companyId], references: [id])\n  equipment    Equipment[]\n  services     Service[]\n\n  @@unique([companyId, document])\n  @@index([companyId])\n  @@index([companyId, name])\n  @@index([companyId, phone])\n  @@index([companyId, document])\n  @@map("customers")\n}\n\nmodel Contract {\n  id              String            @id @default(uuid())\n  companyId       String            @map("company_id")\n  customerId      String            @map("customer_id")\n  frequency       ContractFrequency\n  amount          Decimal           @db.Decimal(10, 2)\n  startDate       DateTime          @map("start_date")\n  endDate         DateTime          @map("end_date")\n  nextServiceDate DateTime?         @map("next_service_date")\n  status          ContractStatus    @default(ACTIVE)\n  notes           String?\n  renewCounter    Int               @default(0) @map("renew_counter")\n  lastRenewedAt   DateTime?         @map("last_renewed_at")\n  createdAt       DateTime          @default(now()) @map("created_at")\n  updatedAt       DateTime          @updatedAt @map("updated_at")\n  deletedAt       DateTime?         @map("deleted_at")\n  company         Company           @relation(fields: [companyId], references: [id])\n  customer        Customer          @relation(fields: [customerId], references: [id])\n  services        Service[]\n\n  @@index([companyId])\n  @@index([companyId, status])\n  @@index([companyId, nextServiceDate])\n  @@map("contracts")\n}\n\nmodel Service {\n  id                         String             @id @default(uuid())\n  serviceNumber              Int                @map("service_number")\n  companyId                  String             @map("company_id")\n  contractId                 String?            @map("contract_id")\n  customerId                 String             @map("customer_id")\n  scheduledAt                DateTime           @map("scheduled_at")\n  completedDate              DateTime?          @map("completed_date")\n  status                     ServiceStatus      @default(SCHEDULED)\n  amount                     Decimal?           @db.Decimal(10, 2)\n  isPaid                     Boolean            @default(false) @map("is_paid")\n  employeeId                 String?            @map("employee_id")\n  notes                      String?\n  estimatedDurationMinutes   Int?               @map("estimated_duration_minutes")\n  durationMinutes            Int?               @map("duration_minutes")\n  createdAt                  DateTime           @default(now()) @map("created_at")\n  updatedAt                  DateTime           @updatedAt @map("updated_at")\n  deletedAt                  DateTime?          @map("deleted_at")\n  serviceType                String?            @map("service_type")\n  executionNotes             String?            @map("execution_notes")\n  reportUrl                  String?            @map("report_url")\n  confirmationToken          String?            @unique @map("confirmation_token")\n  confirmationTokenExpiresAt DateTime?          @map("confirmation_token_expires_at")\n  confirmedAt                DateTime?          @map("confirmed_at")\n  confirmedIp                String?            @map("confirmed_ip")\n  confirmedUserAgent         String?            @map("confirmed_user_agent")\n  confirmedName              String?            @map("confirmed_name")\n  confirmedDocument          String?            @map("confirmed_document")\n  confirmedDocumentType      String?            @map("confirmed_document_type")\n  cancelledReason            String?            @map("cancelled_reason")\n  equipment                  ServiceEquipment[]\n  photos                     ServicePhoto[]\n  company                    Company            @relation(fields: [companyId], references: [id])\n  contract                   Contract?          @relation(fields: [contractId], references: [id])\n  customer                   Customer           @relation(fields: [customerId], references: [id])\n  employee                   Employee?          @relation(fields: [employeeId], references: [id])\n\n  @@unique([companyId, serviceNumber])\n  @@index([companyId])\n  @@index([companyId, scheduledAt])\n  @@index([companyId, status])\n  @@map("services")\n}\n\nmodel AuditLog {\n  id         String   @id @default(uuid())\n  companyId  String   @map("company_id")\n  userId     String?  @map("user_id")\n  entityType String   @map("entity_type")\n  entityId   String   @map("entity_id")\n  action     String\n  oldData    Json?    @map("old_data")\n  newData    Json?    @map("new_data")\n  createdAt  DateTime @default(now()) @map("created_at")\n  company    Company  @relation(fields: [companyId], references: [id])\n  user       User?    @relation(fields: [userId], references: [id])\n\n  @@index([companyId])\n  @@map("audit_logs")\n}\n\nmodel Equipment {\n  id               String             @id @default(uuid())\n  companyId        String             @map("company_id")\n  customerId       String             @map("customer_id")\n  type             String\n  brand            String?\n  model            String?\n  capacity         String?\n  serialNumber     String?            @map("serial_number")\n  location         String?\n  installedAt      DateTime?          @map("installed_at")\n  notes            String?\n  isActive         Boolean            @default(true) @map("is_active")\n  deletedAt        DateTime?          @map("deleted_at")\n  createdAt        DateTime           @default(now()) @map("created_at")\n  updatedAt        DateTime           @updatedAt @map("updated_at")\n  customer         Customer           @relation(fields: [customerId], references: [id])\n  serviceEquipment ServiceEquipment[]\n\n  @@index([companyId])\n  @@index([customerId])\n  @@map("equipment")\n}\n\nmodel ServiceEquipment {\n  id          String    @id @default(uuid())\n  serviceId   String    @map("service_id")\n  equipmentId String    @map("equipment_id")\n  notes       String?\n  equipment   Equipment @relation(fields: [equipmentId], references: [id])\n  service     Service   @relation(fields: [serviceId], references: [id])\n\n  @@unique([serviceId, equipmentId])\n  @@map("service_equipment")\n}\n\nmodel ServicePhoto {\n  id        String   @id @default(uuid())\n  serviceId String   @map("service_id")\n  url       String\n  caption   String?\n  createdAt DateTime @default(now()) @map("created_at")\n  service   Service  @relation(fields: [serviceId], references: [id])\n\n  @@index([serviceId])\n  @@map("service_photos")\n}\n\nenum ContractFrequency {\n  MONTHLY\n  BIMONTHLY\n  QUARTERLY\n  SEMIANNUAL\n  YEARLY\n}\n\nenum ContractStatus {\n  ACTIVE\n  ABOUT_TO_EXPIRE\n  EXPIRED\n  CANCELLED\n  PAUSED\n}\n\nenum ServiceStatus {\n  SCHEDULED\n  IN_PROGRESS\n  COMPLETED\n  CANCELLED\n  NOT_FOUND\n  RESCHEDULED\n  CONFIRMED\n}\n\nenum UserRole {\n  OWNER\n  ADMIN\n  TECHNICIAN\n}\n',
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
config.runtimeDataModel = JSON.parse('{"models":{"Company":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"document","kind":"scalar","type":"String"},{"name":"logoUrl","kind":"scalar","type":"String","dbName":"logo_url"},{"name":"lastServiceNumber","kind":"scalar","type":"Int","dbName":"last_service_number"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"fantasyName","kind":"scalar","type":"String","dbName":"fantasy_name"},{"name":"email","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"niche","kind":"scalar","type":"String"},{"name":"plan","kind":"scalar","type":"String"},{"name":"address","kind":"scalar","type":"Json"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"dataConsentAt","kind":"scalar","type":"DateTime","dbName":"data_consent_at"},{"name":"trialEndsAt","kind":"scalar","type":"DateTime","dbName":"trial_ends_at"},{"name":"auditLogs","kind":"object","type":"AuditLog","relationName":"AuditLogToCompany"},{"name":"contracts","kind":"object","type":"Contract","relationName":"CompanyToContract"},{"name":"customers","kind":"object","type":"Customer","relationName":"CompanyToCustomer"},{"name":"employees","kind":"object","type":"Employee","relationName":"CompanyToEmployee"},{"name":"services","kind":"object","type":"Service","relationName":"CompanyToService"},{"name":"users","kind":"object","type":"User","relationName":"CompanyToUser"}],"dbName":"companies"},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"passwordHash","kind":"scalar","type":"String","dbName":"password_hash"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"lastLoginAt","kind":"scalar","type":"DateTime","dbName":"last_login_at"},{"name":"refreshTokenHash","kind":"scalar","type":"String","dbName":"refresh_token_hash"},{"name":"resetPasswordToken","kind":"scalar","type":"String","dbName":"reset_password_token"},{"name":"resetPasswordExpiresAt","kind":"scalar","type":"DateTime","dbName":"reset_password_expires_at"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"auditLogs","kind":"object","type":"AuditLog","relationName":"AuditLogToUser"},{"name":"company","kind":"object","type":"Company","relationName":"CompanyToUser"}],"dbName":"users"},"Employee":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"company","kind":"object","type":"Company","relationName":"CompanyToEmployee"},{"name":"services","kind":"object","type":"Service","relationName":"EmployeeToService"}],"dbName":"employees"},"Customer":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"document","kind":"scalar","type":"String"},{"name":"address","kind":"scalar","type":"Json"},{"name":"notes","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"fantasyName","kind":"scalar","type":"String","dbName":"fantasy_name"},{"name":"documentType","kind":"scalar","type":"String","dbName":"document_type"},{"name":"contracts","kind":"object","type":"Contract","relationName":"ContractToCustomer"},{"name":"company","kind":"object","type":"Company","relationName":"CompanyToCustomer"},{"name":"equipment","kind":"object","type":"Equipment","relationName":"CustomerToEquipment"},{"name":"services","kind":"object","type":"Service","relationName":"CustomerToService"}],"dbName":"customers"},"Contract":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"customerId","kind":"scalar","type":"String","dbName":"customer_id"},{"name":"frequency","kind":"enum","type":"ContractFrequency"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"startDate","kind":"scalar","type":"DateTime","dbName":"start_date"},{"name":"endDate","kind":"scalar","type":"DateTime","dbName":"end_date"},{"name":"nextServiceDate","kind":"scalar","type":"DateTime","dbName":"next_service_date"},{"name":"status","kind":"enum","type":"ContractStatus"},{"name":"notes","kind":"scalar","type":"String"},{"name":"renewCounter","kind":"scalar","type":"Int","dbName":"renew_counter"},{"name":"lastRenewedAt","kind":"scalar","type":"DateTime","dbName":"last_renewed_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"company","kind":"object","type":"Company","relationName":"CompanyToContract"},{"name":"customer","kind":"object","type":"Customer","relationName":"ContractToCustomer"},{"name":"services","kind":"object","type":"Service","relationName":"ContractToService"}],"dbName":"contracts"},"Service":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"serviceNumber","kind":"scalar","type":"Int","dbName":"service_number"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"contractId","kind":"scalar","type":"String","dbName":"contract_id"},{"name":"customerId","kind":"scalar","type":"String","dbName":"customer_id"},{"name":"scheduledAt","kind":"scalar","type":"DateTime","dbName":"scheduled_at"},{"name":"completedDate","kind":"scalar","type":"DateTime","dbName":"completed_date"},{"name":"status","kind":"enum","type":"ServiceStatus"},{"name":"amount","kind":"scalar","type":"Decimal"},{"name":"isPaid","kind":"scalar","type":"Boolean","dbName":"is_paid"},{"name":"employeeId","kind":"scalar","type":"String","dbName":"employee_id"},{"name":"notes","kind":"scalar","type":"String"},{"name":"estimatedDurationMinutes","kind":"scalar","type":"Int","dbName":"estimated_duration_minutes"},{"name":"durationMinutes","kind":"scalar","type":"Int","dbName":"duration_minutes"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"serviceType","kind":"scalar","type":"String","dbName":"service_type"},{"name":"executionNotes","kind":"scalar","type":"String","dbName":"execution_notes"},{"name":"reportUrl","kind":"scalar","type":"String","dbName":"report_url"},{"name":"confirmationToken","kind":"scalar","type":"String","dbName":"confirmation_token"},{"name":"confirmationTokenExpiresAt","kind":"scalar","type":"DateTime","dbName":"confirmation_token_expires_at"},{"name":"confirmedAt","kind":"scalar","type":"DateTime","dbName":"confirmed_at"},{"name":"confirmedIp","kind":"scalar","type":"String","dbName":"confirmed_ip"},{"name":"confirmedUserAgent","kind":"scalar","type":"String","dbName":"confirmed_user_agent"},{"name":"confirmedName","kind":"scalar","type":"String","dbName":"confirmed_name"},{"name":"confirmedDocument","kind":"scalar","type":"String","dbName":"confirmed_document"},{"name":"confirmedDocumentType","kind":"scalar","type":"String","dbName":"confirmed_document_type"},{"name":"cancelledReason","kind":"scalar","type":"String","dbName":"cancelled_reason"},{"name":"equipment","kind":"object","type":"ServiceEquipment","relationName":"ServiceToServiceEquipment"},{"name":"photos","kind":"object","type":"ServicePhoto","relationName":"ServiceToServicePhoto"},{"name":"company","kind":"object","type":"Company","relationName":"CompanyToService"},{"name":"contract","kind":"object","type":"Contract","relationName":"ContractToService"},{"name":"customer","kind":"object","type":"Customer","relationName":"CustomerToService"},{"name":"employee","kind":"object","type":"Employee","relationName":"EmployeeToService"}],"dbName":"services"},"AuditLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"userId","kind":"scalar","type":"String","dbName":"user_id"},{"name":"entityType","kind":"scalar","type":"String","dbName":"entity_type"},{"name":"entityId","kind":"scalar","type":"String","dbName":"entity_id"},{"name":"action","kind":"scalar","type":"String"},{"name":"oldData","kind":"scalar","type":"Json","dbName":"old_data"},{"name":"newData","kind":"scalar","type":"Json","dbName":"new_data"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"company","kind":"object","type":"Company","relationName":"AuditLogToCompany"},{"name":"user","kind":"object","type":"User","relationName":"AuditLogToUser"}],"dbName":"audit_logs"},"Equipment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"companyId","kind":"scalar","type":"String","dbName":"company_id"},{"name":"customerId","kind":"scalar","type":"String","dbName":"customer_id"},{"name":"type","kind":"scalar","type":"String"},{"name":"brand","kind":"scalar","type":"String"},{"name":"model","kind":"scalar","type":"String"},{"name":"capacity","kind":"scalar","type":"String"},{"name":"serialNumber","kind":"scalar","type":"String","dbName":"serial_number"},{"name":"location","kind":"scalar","type":"String"},{"name":"installedAt","kind":"scalar","type":"DateTime","dbName":"installed_at"},{"name":"notes","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean","dbName":"is_active"},{"name":"deletedAt","kind":"scalar","type":"DateTime","dbName":"deleted_at"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"updatedAt","kind":"scalar","type":"DateTime","dbName":"updated_at"},{"name":"customer","kind":"object","type":"Customer","relationName":"CustomerToEquipment"},{"name":"serviceEquipment","kind":"object","type":"ServiceEquipment","relationName":"EquipmentToServiceEquipment"}],"dbName":"equipment"},"ServiceEquipment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"serviceId","kind":"scalar","type":"String","dbName":"service_id"},{"name":"equipmentId","kind":"scalar","type":"String","dbName":"equipment_id"},{"name":"notes","kind":"scalar","type":"String"},{"name":"equipment","kind":"object","type":"Equipment","relationName":"EquipmentToServiceEquipment"},{"name":"service","kind":"object","type":"Service","relationName":"ServiceToServiceEquipment"}],"dbName":"service_equipment"},"ServicePhoto":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"serviceId","kind":"scalar","type":"String","dbName":"service_id"},{"name":"url","kind":"scalar","type":"String"},{"name":"caption","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime","dbName":"created_at"},{"name":"service","kind":"object","type":"Service","relationName":"ServiceToServicePhoto"}],"dbName":"service_photos"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","orderBy","cursor","company","auditLogs","_count","user","contracts","customer","equipment","service","photos","contract","services","employee","serviceEquipment","customers","employees","users","Company.findUnique","Company.findUniqueOrThrow","Company.findFirst","Company.findFirstOrThrow","Company.findMany","data","Company.createOne","Company.createMany","Company.createManyAndReturn","Company.updateOne","Company.updateMany","Company.updateManyAndReturn","create","update","Company.upsertOne","Company.deleteOne","Company.deleteMany","having","_avg","_sum","_min","_max","Company.groupBy","Company.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","Employee.findUnique","Employee.findUniqueOrThrow","Employee.findFirst","Employee.findFirstOrThrow","Employee.findMany","Employee.createOne","Employee.createMany","Employee.createManyAndReturn","Employee.updateOne","Employee.updateMany","Employee.updateManyAndReturn","Employee.upsertOne","Employee.deleteOne","Employee.deleteMany","Employee.groupBy","Employee.aggregate","Customer.findUnique","Customer.findUniqueOrThrow","Customer.findFirst","Customer.findFirstOrThrow","Customer.findMany","Customer.createOne","Customer.createMany","Customer.createManyAndReturn","Customer.updateOne","Customer.updateMany","Customer.updateManyAndReturn","Customer.upsertOne","Customer.deleteOne","Customer.deleteMany","Customer.groupBy","Customer.aggregate","Contract.findUnique","Contract.findUniqueOrThrow","Contract.findFirst","Contract.findFirstOrThrow","Contract.findMany","Contract.createOne","Contract.createMany","Contract.createManyAndReturn","Contract.updateOne","Contract.updateMany","Contract.updateManyAndReturn","Contract.upsertOne","Contract.deleteOne","Contract.deleteMany","Contract.groupBy","Contract.aggregate","Service.findUnique","Service.findUniqueOrThrow","Service.findFirst","Service.findFirstOrThrow","Service.findMany","Service.createOne","Service.createMany","Service.createManyAndReturn","Service.updateOne","Service.updateMany","Service.updateManyAndReturn","Service.upsertOne","Service.deleteOne","Service.deleteMany","Service.groupBy","Service.aggregate","AuditLog.findUnique","AuditLog.findUniqueOrThrow","AuditLog.findFirst","AuditLog.findFirstOrThrow","AuditLog.findMany","AuditLog.createOne","AuditLog.createMany","AuditLog.createManyAndReturn","AuditLog.updateOne","AuditLog.updateMany","AuditLog.updateManyAndReturn","AuditLog.upsertOne","AuditLog.deleteOne","AuditLog.deleteMany","AuditLog.groupBy","AuditLog.aggregate","Equipment.findUnique","Equipment.findUniqueOrThrow","Equipment.findFirst","Equipment.findFirstOrThrow","Equipment.findMany","Equipment.createOne","Equipment.createMany","Equipment.createManyAndReturn","Equipment.updateOne","Equipment.updateMany","Equipment.updateManyAndReturn","Equipment.upsertOne","Equipment.deleteOne","Equipment.deleteMany","Equipment.groupBy","Equipment.aggregate","ServiceEquipment.findUnique","ServiceEquipment.findUniqueOrThrow","ServiceEquipment.findFirst","ServiceEquipment.findFirstOrThrow","ServiceEquipment.findMany","ServiceEquipment.createOne","ServiceEquipment.createMany","ServiceEquipment.createManyAndReturn","ServiceEquipment.updateOne","ServiceEquipment.updateMany","ServiceEquipment.updateManyAndReturn","ServiceEquipment.upsertOne","ServiceEquipment.deleteOne","ServiceEquipment.deleteMany","ServiceEquipment.groupBy","ServiceEquipment.aggregate","ServicePhoto.findUnique","ServicePhoto.findUniqueOrThrow","ServicePhoto.findFirst","ServicePhoto.findFirstOrThrow","ServicePhoto.findMany","ServicePhoto.createOne","ServicePhoto.createMany","ServicePhoto.createManyAndReturn","ServicePhoto.updateOne","ServicePhoto.updateMany","ServicePhoto.updateManyAndReturn","ServicePhoto.upsertOne","ServicePhoto.deleteOne","ServicePhoto.deleteMany","ServicePhoto.groupBy","ServicePhoto.aggregate","AND","OR","NOT","id","serviceId","url","caption","createdAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","equipmentId","notes","companyId","customerId","type","brand","model","capacity","serialNumber","location","installedAt","isActive","deletedAt","updatedAt","userId","entityType","entityId","action","oldData","newData","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","serviceNumber","contractId","scheduledAt","completedDate","ServiceStatus","status","amount","isPaid","employeeId","estimatedDurationMinutes","durationMinutes","serviceType","executionNotes","reportUrl","confirmationToken","confirmationTokenExpiresAt","confirmedAt","confirmedIp","confirmedUserAgent","confirmedName","confirmedDocument","confirmedDocumentType","cancelledReason","ContractFrequency","frequency","startDate","endDate","nextServiceDate","ContractStatus","renewCounter","lastRenewedAt","name","email","phone","document","address","fantasyName","documentType","passwordHash","UserRole","role","lastLoginAt","refreshTokenHash","resetPasswordToken","resetPasswordExpiresAt","logoUrl","lastServiceNumber","niche","plan","dataConsentAt","trialEndsAt","every","some","none","companyId_document","companyId_serviceNumber","serviceId_equipmentId","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
  graph: "-wVeoAEZBAAA3wIAIAcAAOACACANAADjAgAgEAAA4QIAIBEAAOICACASAADkAgAguwEAANcCADC8AQAAQAAQvQEAANcCADC-AQEAAAABwgFAANsCACHZASAA3QIAIdsBQADbAgAhhwIBANgCACGIAgEA2QIAIYkCAQDZAgAhigIBANkCACGLAgAA3AIAIIwCAQDZAgAhlQIBANkCACGWAgIA2gIAIZcCAQDYAgAhmAIBANgCACGZAkAA3gIAIZoCQADeAgAhAQAAAAEAIA4DAADnAgAgBgAAgQMAILsBAACAAwAwvAEAAAMAEL0BAACAAwAwvgEBANgCACHCAUAA2wIAIdABAQDYAgAh3AEBANkCACHdAQEA2AIAId4BAQDYAgAh3wEBANgCACHgAQAA3AIAIOEBAADcAgAgBQMAAJgFACAGAAChBQAg3AEAAIIDACDgAQAAggMAIOEBAACCAwAgDgMAAOcCACAGAACBAwAguwEAAIADADC8AQAAAwAQvQEAAIADADC-AQEAAAABwgFAANsCACHQAQEA2AIAIdwBAQDZAgAh3QEBANgCACHeAQEA2AIAId8BAQDYAgAh4AEAANwCACDhAQAA3AIAIAMAAAADACABAAAEADACAAAFACATAwAA5wIAIAQAAN8CACC7AQAA5QIAMLwBAAAHABC9AQAA5QIAML4BAQDYAgAhwgFAANsCACHQAQEA2AIAIdkBIADdAgAh2gFAAN4CACHbAUAA2wIAIYcCAQDYAgAhiAIBANgCACGOAgEA2AIAIZACAADmApACIpECQADeAgAhkgIBANkCACGTAgEA2QIAIZQCQADeAgAhAQAAAAcAIAMAAAADACABAAAEADACAAAFACABAAAAAwAgFQMAAOcCACAIAAD0AgAgDQAA4wIAILsBAAD8AgAwvAEAAAsAEL0BAAD8AgAwvgEBANgCACHCAUAA2wIAIc8BAQDZAgAh0AEBANgCACHRAQEA2AIAIdoBQADeAgAh2wFAANsCACHtAQAA_wKFAiLuARAA_gIAIYACAAD9AoACIoECQADbAgAhggJAANsCACGDAkAA3gIAIYUCAgDaAgAhhgJAAN4CACEHAwAAmAUAIAgAAJ0FACANAACWBQAgzwEAAIIDACDaAQAAggMAIIMCAACCAwAghgIAAIIDACAVAwAA5wIAIAgAAPQCACANAADjAgAguwEAAPwCADC8AQAACwAQvQEAAPwCADC-AQEAAAABwgFAANsCACHPAQEA2QIAIdABAQDYAgAh0QEBANgCACHaAUAA3gIAIdsBQADbAgAh7QEAAP8ChQIi7gEQAP4CACGAAgAA_QKAAiKBAkAA2wIAIYICQADbAgAhgwJAAN4CACGFAgIA2gIAIYYCQADeAgAhAwAAAAsAIAEAAAwAMAIAAA0AIAMAAAALACABAAAMADACAAANACAUCAAA9AIAIA8AAPECACC7AQAA-wIAMLwBAAAQABC9AQAA-wIAML4BAQDYAgAhwgFAANsCACHPAQEA2QIAIdABAQDYAgAh0QEBANgCACHSAQEA2AIAIdMBAQDZAgAh1AEBANkCACHVAQEA2QIAIdYBAQDZAgAh1wEBANkCACHYAUAA3gIAIdkBIADdAgAh2gFAAN4CACHbAUAA2wIAIQoIAACdBQAgDwAAmgUAIM8BAACCAwAg0wEAAIIDACDUAQAAggMAINUBAACCAwAg1gEAAIIDACDXAQAAggMAINgBAACCAwAg2gEAAIIDACAUCAAA9AIAIA8AAPECACC7AQAA-wIAMLwBAAAQABC9AQAA-wIAML4BAQAAAAHCAUAA2wIAIc8BAQDZAgAh0AEBANgCACHRAQEA2AIAIdIBAQDYAgAh0wEBANkCACHUAQEA2QIAIdUBAQDZAgAh1gEBANkCACHXAQEA2QIAIdgBQADeAgAh2QEgAN0CACHaAUAA3gIAIdsBQADbAgAhAwAAABAAIAEAABEAMAIAABIAIAkJAAD6AgAgCgAA9wIAILsBAAD5AgAwvAEAABQAEL0BAAD5AgAwvgEBANgCACG_AQEA2AIAIc4BAQDYAgAhzwEBANkCACEDCQAAoAUAIAoAAJ8FACDPAQAAggMAIAoJAAD6AgAgCgAA9wIAILsBAAD5AgAwvAEAABQAEL0BAAD5AgAwvgEBAAAAAb8BAQDYAgAhzgEBANgCACHPAQEA2QIAIaACAAD4AgAgAwAAABQAIAEAABUAMAIAABYAIAMAAAAUACABAAAVADACAAAWACAJCgAA9wIAILsBAAD2AgAwvAEAABkAEL0BAAD2AgAwvgEBANgCACG_AQEA2AIAIcABAQDYAgAhwQEBANkCACHCAUAA2wIAIQIKAACfBQAgwQEAAIIDACAJCgAA9wIAILsBAAD2AgAwvAEAABkAEL0BAAD2AgAwvgEBAAAAAb8BAQDYAgAhwAEBANgCACHBAQEA2QIAIcIBQADbAgAhAwAAABkAIAEAABoAMAIAABsAIAEAAAALACAOAwAA5wIAIA0AAOMCACC7AQAA6AIAMLwBAAAeABC9AQAA6AIAML4BAQDYAgAhwgFAANsCACHQAQEA2AIAIdkBIADdAgAh2gFAAN4CACHbAUAA2wIAIYcCAQDYAgAhiAIBANkCACGJAgEA2QIAIQEAAAAeACAmAwAA5wIAIAgAAPQCACAJAADxAgAgCwAA8gIAIAwAAPMCACAOAAD1AgAguwEAAO0CADC8AQAAIAAQvQEAAO0CADC-AQEA2AIAIcIBQADbAgAhzwEBANkCACHQAQEA2AIAIdEBAQDYAgAh2gFAAN4CACHbAUAA2wIAIegBAgDaAgAh6QEBANkCACHqAUAA2wIAIesBQADeAgAh7QEAAO4C7QEi7gEQAO8CACHvASAA3QIAIfABAQDZAgAh8QECAPACACHyAQIA8AIAIfMBAQDZAgAh9AEBANkCACH1AQEA2QIAIfYBAQDZAgAh9wFAAN4CACH4AUAA3gIAIfkBAQDZAgAh-gEBANkCACH7AQEA2QIAIfwBAQDZAgAh_QEBANkCACH-AQEA2QIAIRoDAACYBQAgCAAAnQUAIAkAAJoFACALAACbBQAgDAAAnAUAIA4AAJ4FACDPAQAAggMAINoBAACCAwAg6QEAAIIDACDrAQAAggMAIO4BAACCAwAg8AEAAIIDACDxAQAAggMAIPIBAACCAwAg8wEAAIIDACD0AQAAggMAIPUBAACCAwAg9gEAAIIDACD3AQAAggMAIPgBAACCAwAg-QEAAIIDACD6AQAAggMAIPsBAACCAwAg_AEAAIIDACD9AQAAggMAIP4BAACCAwAgJwMAAOcCACAIAAD0AgAgCQAA8QIAIAsAAPICACAMAADzAgAgDgAA9QIAILsBAADtAgAwvAEAACAAEL0BAADtAgAwvgEBAAAAAcIBQADbAgAhzwEBANkCACHQAQEA2AIAIdEBAQDYAgAh2gFAAN4CACHbAUAA2wIAIegBAgDaAgAh6QEBANkCACHqAUAA2wIAIesBQADeAgAh7QEAAO4C7QEi7gEQAO8CACHvASAA3QIAIfABAQDZAgAh8QECAPACACHyAQIA8AIAIfMBAQDZAgAh9AEBANkCACH1AQEA2QIAIfYBAQAAAAH3AUAA3gIAIfgBQADeAgAh-QEBANkCACH6AQEA2QIAIfsBAQDZAgAh_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_ABC9AQAA0QIAML4BAQCjAgAhwgFAAKUCACHQAQEAowIAIdkBIACxAgAh2gFAALACACHbAUAApQIAIYcCAQCjAgAhiAIBAKQCACGJAgEApAIAIQMAAAAeACABAAB-ADAkAAB_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-QEBAAAAAfoBAQAAAAH7AQEAAAAB_AEBAAAAAf0BAQAAAAH-AQEAAAABARgAALMBACAdvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdEBAQAAAAHaAUAAAAAB2wFAAAAAAegBAgAAAAHpAQEAAAAB6gFAAAAAAesBQAAAAAHtAQAAAO0BAu4BEAAAAAHvASAAAAAB8AEBAAAAAfEBAgAAAAHyAQIAAAAB8wEBAAAAAfQBAQAAAAH1AQEAAAAB9gEBAAAAAfcBQAAAAAH4AUAAAAAB-QEBAAAAAfoBAQAAAAH7AQEAAAAB_AEBAAAAAf0BAQAAAAH-AQEAAAABARgAALUBADABGAAAtQEAMAEAAAALACABAAAAHgAgIwMAALkDACAIAAC7AwAgCQAAtwMAIAsAALgDACAMAAC6AwAgDgAAvAMAIL4BAQCGAwAhwgFAAIgDACHPAQEAhwMAIdABAQCGAwAh0QEBAIYDACHaAUAAlQMAIdsBQACIAwAh6AECALMDACHpAQEAhwMAIeoBQACIAwAh6wFAAJUDACHtAQAAtAPtASLuARAAtQMAIe8BIACWAwAh8AEBAIcDACHxAQIAtgMAIfIBAgC2AwAh8wEBAIcDACH0AQEAhwMAIfUBAQCHAwAh9gEBAIcDACH3AUAAlQMAIfgBQACVAwAh-QEBAIcDACH6AQEAhwMAIfsBAQCHAwAh_AEBAIcDACH9AQEAhwMAIf4BAQCHAwAhAgAAACIAIBgAALoBACAdvgEBAIYDACHCAUAAiAMAIc8BAQCHAwAh0AEBAIYDACHRAQEAhgMAIdoBQACVAwAh2wFAAIgDACHoAQIAswMAIekBAQCHAwAh6gFAAIgDACHrAUAAlQMAIe0BAAC0A-0BIu4BEAC1AwAh7wEgAJYDACHwAQEAhwMAIfEBAgC2AwAh8gECALYDACHzAQEAhwMAIfQBAQCHAwAh9QEBAIcDACH2AQEAhwMAIfcBQACVAwAh-AFAAJUDACH5AQEAhwMAIfoBAQCHAwAh-wEBAIcDACH8AQEAhwMAIf0BAQCHAwAh_gEBAIcDACECAAAAIAAgGAAAvAEAIAIAAAAgACAYAAC8AQAgAQAAAAsAIAEAAAAeACADAAAAIgAgHwAAswEAICAAALoBACABAAAAIgAgAQAAACAAIBkFAACuAwAgJQAArwMAICYAALIDACAnAACxAwAgKAAAsAMAIM8BAACCAwAg2gEAAIIDACDpAQAAggMAIOsBAACCAwAg7gEAAIIDACDwAQAAggMAIPEBAACCAwAg8gEAAIIDACDzAQAAggMAIPQBAACCAwAg9QEAAIIDACD2AQAAggMAIPcBAACCAwAg-AEAAIIDACD5AQAAggMAIPoBAACCAwAg-wEAAIIDACD8AQAAggMAIP0BAACCAwAg_gEAAIIDACAguwEAALkCADC8AQAAxQEAEL0BAAC5AgAwvgEBAKMCACHCAUAApQIAIc8BAQCkAgAh0AEBAKMCACHRAQEAowIAIdoBQACwAgAh2wFAAKUCACHoAQIAugIAIekBAQCkAgAh6gFAAKUCACHrAUAAsAIAIe0BAAC7Au0BIu4BEAC8AgAh7wEgALECACHwAQEApAIAIfEBAgC9AgAh8gECAL0CACHzAQEApAIAIfQBAQCkAgAh9QEBAKQCACH2AQEApAIAIfcBQACwAgAh-AFAALACACH5AQEApAIAIfoBAQCkAgAh-wEBAKQCACH8AQEApAIAIf0BAQCkAgAh_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_AQEAAAABzgEBAAAAAc8BAQAAAAEBGAAA-wEAIAS-AQEAAAABvwEBAAAAAc4BAQAAAAHPAQEAAAABARgAAP0BADABGAAA_QEAMAYJAACOAwAgCgAAjwMAIL4BAQCGAwAhvwEBAIYDACHOAQEAhgMAIc8BAQCHAwAhAgAAABYAIBgAAIACACAEvgEBAIYDACG_AQEAhgMAIc4BAQCGAwAhzwEBAIcDACECAAAAFAAgGAAAggIAIAIAAAAUACAYAACCAgAgAwAAABYAIB8AAPsBACAgAACAAgAgAQAAABYAIAEAAAAUACAEBQAAiwMAICcAAI0DACAoAACMAwAgzwEAAIIDACAHuwEAAK4CADC8AQAAiQIAEL0BAACuAgAwvgEBAKMCACG_AQEAowIAIc4BAQCjAgAhzwEBAKQCACEDAAAAFAAgAQAAiAIAMCQAAIkCACADAAAAFAAgAQAAFQAwAgAAFgAgAQAAABsAIAEAAAAbACADAAAAGQAgAQAAGgAwAgAAGwAgAwAAABkAIAEAABoAMAIAABsAIAMAAAAZACABAAAaADACAAAbACAGCgAAigMAIL4BAQAAAAG_AQEAAAABwAEBAAAAAcEBAQAAAAHCAUAAAAABARgAAJECACAFvgEBAAAAAb8BAQAAAAHAAQEAAAABwQEBAAAAAcIBQAAAAAEBGAAAkwIAMAEYAACTAgAwBgoAAIkDACC-AQEAhgMAIb8BAQCGAwAhwAEBAIYDACHBAQEAhwMAIcIBQACIAwAhAgAAABsAIBgAAJYCACAFvgEBAIYDACG_AQEAhgMAIcABAQCGAwAhwQEBAIcDACHCAUAAiAMAIQIAAAAZACAYAACYAgAgAgAAABkAIBgAAJgCACADAAAAGwAgHwAAkQIAICAAAJYCACABAAAAGwAgAQAAABkAIAQFAACDAwAgJwAAhQMAICgAAIQDACDBAQAAggMAIAi7AQAAogIAMLwBAACfAgAQvQEAAKICADC-AQEAowIAIb8BAQCjAgAhwAEBAKMCACHBAQEApAIAIcIBQAClAgAhAwAAABkAIAEAAJ4CADAkAACfAgAgAwAAABkAIAEAABoAMAIAABsAIAi7AQAAogIAMLwBAACfAgAQvQEAAKICADC-AQEAowIAIb8BAQCjAgAhwAEBAKMCACHBAQEApAIAIcIBQAClAgAhDgUAAKcCACAnAACtAgAgKAAArQIAIMMBAQAAAAHEAQEAAAAExQEBAAAABMYBAQAAAAHHAQEAAAAByAEBAAAAAckBAQAAAAHKAQEArAIAIcsBAQAAAAHMAQEAAAABzQEBAAAAAQ4FAACqAgAgJwAAqwIAICgAAKsCACDDAQEAAAABxAEBAAAABcUBAQAAAAXGAQEAAAABxwEBAAAAAcgBAQAAAAHJAQEAAAABygEBAKkCACHLAQEAAAABzAEBAAAAAc0BAQAAAAELBQAApwIAICcAAKgCACAoAACoAgAgwwFAAAAAAcQBQAAAAATFAUAAAAAExgFAAAAAAccBQAAAAAHIAUAAAAAByQFAAAAAAcoBQACmAgAhCwUAAKcCACAnAACoAgAgKAAAqAIAIMMBQAAAAAHEAUAAAAAExQFAAAAABMYBQAAAAAHHAUAAAAAByAFAAAAAAckBQAAAAAHKAUAApgIAIQjDAQIAAAABxAECAAAABMUBAgAAAATGAQIAAAABxwECAAAAAcgBAgAAAAHJAQIAAAABygECAKcCACEIwwFAAAAAAcQBQAAAAATFAUAAAAAExgFAAAAAAccBQAAAAAHIAUAAAAAByQFAAAAAAcoBQACoAgAhDgUAAKoCACAnAACrAgAgKAAAqwIAIMMBAQAAAAHEAQEAAAAFxQEBAAAABcYBAQAAAAHHAQEAAAAByAEBAAAAAckBAQAAAAHKAQEAqQIAIcsBAQAAAAHMAQEAAAABzQEBAAAAAQjDAQIAAAABxAECAAAABcUBAgAAAAXGAQIAAAABxwECAAAAAcgBAgAAAAHJAQIAAAABygECAKoCACELwwEBAAAAAcQBAQAAAAXFAQEAAAAFxgEBAAAAAccBAQAAAAHIAQEAAAAByQEBAAAAAcoBAQCrAgAhywEBAAAAAcwBAQAAAAHNAQEAAAABDgUAAKcCACAnAACtAgAgKAAArQIAIMMBAQAAAAHEAQEAAAAExQEBAAAABMYBAQAAAAHHAQEAAAAByAEBAAAAAckBAQAAAAHKAQEArAIAIcsBAQAAAAHMAQEAAAABzQEBAAAAAQvDAQEAAAABxAEBAAAABMUBAQAAAATGAQEAAAABxwEBAAAAAcgBAQAAAAHJAQEAAAABygEBAK0CACHLAQEAAAABzAEBAAAAAc0BAQAAAAEHuwEAAK4CADC8AQAAiQIAEL0BAACuAgAwvgEBAKMCACG_AQEAowIAIc4BAQCjAgAhzwEBAKQCACESuwEAAK8CADC8AQAA8wEAEL0BAACvAgAwvgEBAKMCACHCAUAApQIAIc8BAQCkAgAh0AEBAKMCACHRAQEAowIAIdIBAQCjAgAh0wEBAKQCACHUAQEApAIAIdUBAQCkAgAh1gEBAKQCACHXAQEApAIAIdgBQACwAgAh2QEgALECACHaAUAAsAIAIdsBQAClAgAhCwUAAKoCACAnAAC1AgAgKAAAtQIAIMMBQAAAAAHEAUAAAAAFxQFAAAAABcYBQAAAAAHHAUAAAAAByAFAAAAAAckBQAAAAAHKAUAAtAIAIQUFAACnAgAgJwAAswIAICgAALMCACDDASAAAAABygEgALICACEFBQAApwIAICcAALMCACAoAACzAgAgwwEgAAAAAcoBIACyAgAhAsMBIAAAAAHKASAAswIAIQsFAACqAgAgJwAAtQIAICgAALUCACDDAUAAAAABxAFAAAAABcUBQAAAAAXGAUAAAAABxwFAAAAAAcgBQAAAAAHJAUAAAAABygFAALQCACEIwwFAAAAAAcQBQAAAAAXFAUAAAAAFxgFAAAAAAccBQAAAAAHIAUAAAAAByQFAAAAAAcoBQAC1AgAhDLsBAAC2AgAwvAEAAN0BABC9AQAAtgIAML4BAQCjAgAhwgFAAKUCACHQAQEAowIAIdwBAQCkAgAh3QEBAKMCACHeAQEAowIAId8BAQCjAgAh4AEAALcCACDhAQAAtwIAIA8FAACqAgAgJwAAuAIAICgAALgCACDDAYAAAAABxgGAAAAAAccBgAAAAAHIAYAAAAAByQGAAAAAAcoBgAAAAAHiAQEAAAAB4wEBAAAAAeQBAQAAAAHlAYAAAAAB5gGAAAAAAecBgAAAAAEMwwGAAAAAAcYBgAAAAAHHAYAAAAAByAGAAAAAAckBgAAAAAHKAYAAAAAB4gEBAAAAAeMBAQAAAAHkAQEAAAAB5QGAAAAAAeYBgAAAAAHnAYAAAAABILsBAAC5AgAwvAEAAMUBABC9AQAAuQIAML4BAQCjAgAhwgFAAKUCACHPAQEApAIAIdABAQCjAgAh0QEBAKMCACHaAUAAsAIAIdsBQAClAgAh6AECALoCACHpAQEApAIAIeoBQAClAgAh6wFAALACACHtAQAAuwLtASLuARAAvAIAIe8BIACxAgAh8AEBAKQCACHxAQIAvQIAIfIBAgC9AgAh8wEBAKQCACH0AQEApAIAIfUBAQCkAgAh9gEBAKQCACH3AUAAsAIAIfgBQACwAgAh-QEBAKQCACH6AQEApAIAIfsBAQCkAgAh_AEBAKQCACH9AQEApAIAIf4BAQCkAgAhDQUAAKcCACAlAADFAgAgJgAApwIAICcAAKcCACAoAACnAgAgwwECAAAAAcQBAgAAAATFAQIAAAAExgECAAAAAccBAgAAAAHIAQIAAAAByQECAAAAAcoBAgDEAgAhBwUAAKcCACAnAADDAgAgKAAAwwIAIMMBAAAA7QECxAEAAADtAQjFAQAAAO0BCMoBAADCAu0BIg0FAACqAgAgJQAAwQIAICYAAMECACAnAADBAgAgKAAAwQIAIMMBEAAAAAHEARAAAAAFxQEQAAAABcYBEAAAAAHHARAAAAAByAEQAAAAAckBEAAAAAHKARAAwAIAIQ0FAACqAgAgJQAAvwIAICYAAKoCACAnAACqAgAgKAAAqgIAIMMBAgAAAAHEAQIAAAAFxQECAAAABcYBAgAAAAHHAQIAAAAByAECAAAAAckBAgAAAAHKAQIAvgIAIQ0FAACqAgAgJQAAvwIAICYAAKoCACAnAACqAgAgKAAAqgIAIMMBAgAAAAHEAQIAAAAFxQECAAAABcYBAgAAAAHHAQIAAAAByAECAAAAAckBAgAAAAHKAQIAvgIAIQjDAQgAAAABxAEIAAAABcUBCAAAAAXGAQgAAAABxwEIAAAAAcgBCAAAAAHJAQgAAAABygEIAL8CACENBQAAqgIAICUAAMECACAmAADBAgAgJwAAwQIAICgAAMECACDDARAAAAABxAEQAAAABcUBEAAAAAXGARAAAAABxwEQAAAAAcgBEAAAAAHJARAAAAABygEQAMACACEIwwEQAAAAAcQBEAAAAAXFARAAAAAFxgEQAAAAAccBEAAAAAHIARAAAAAByQEQAAAAAcoBEADBAgAhBwUAAKcCACAnAADDAgAgKAAAwwIAIMMBAAAA7QECxAEAAADtAQjFAQAAAO0BCMoBAADCAu0BIgTDAQAAAO0BAsQBAAAA7QEIxQEAAADtAQjKAQAAwwLtASINBQAApwIAICUAAMUCACAmAACnAgAgJwAApwIAICgAAKcCACDDAQIAAAABxAECAAAABMUBAgAAAATGAQIAAAABxwECAAAAAcgBAgAAAAHJAQIAAAABygECAMQCACEIwwEIAAAAAcQBCAAAAATFAQgAAAAExgEIAAAAAccBCAAAAAHIAQgAAAAByQEIAAAAAcoBCADFAgAhErsBAADGAgAwvAEAAKsBABC9AQAAxgIAML4BAQCjAgAhwgFAAKUCACHPAQEApAIAIdABAQCjAgAh0QEBAKMCACHaAUAAsAIAIdsBQAClAgAh7QEAAMkChQIi7gEQAMgCACGAAgAAxwKAAiKBAkAApQIAIYICQAClAgAhgwJAALACACGFAgIAugIAIYYCQACwAgAhBwUAAKcCACAnAADPAgAgKAAAzwIAIMMBAAAAgAICxAEAAACAAgjFAQAAAIACCMoBAADOAoACIg0FAACnAgAgJQAAzQIAICYAAM0CACAnAADNAgAgKAAAzQIAIMMBEAAAAAHEARAAAAAExQEQAAAABMYBEAAAAAHHARAAAAAByAEQAAAAAckBEAAAAAHKARAAzAIAIQcFAACnAgAgJwAAywIAICgAAMsCACDDAQAAAIUCAsQBAAAAhQIIxQEAAACFAgjKAQAAygKFAiIHBQAApwIAICcAAMsCACAoAADLAgAgwwEAAACFAgLEAQAAAIUCCMUBAAAAhQIIygEAAMoChQIiBMMBAAAAhQICxAEAAACFAgjFAQAAAIUCCMoBAADLAoUCIg0FAACnAgAgJQAAzQIAICYAAM0CACAnAADNAgAgKAAAzQIAIMMBEAAAAAHEARAAAAAExQEQAAAABMYBEAAAAAHHARAAAAAByAEQAAAAAckBEAAAAAHKARAAzAIAIQjDARAAAAABxAEQAAAABMUBEAAAAATGARAAAAABxwEQAAAAAcgBEAAAAAHJARAAAAABygEQAM0CACEHBQAApwIAICcAAM8CACAoAADPAgAgwwEAAACAAgLEAQAAAIACCMUBAAAAgAIIygEAAM4CgAIiBMMBAAAAgAICxAEAAACAAgjFAQAAAIACCMoBAADPAoACIhG7AQAA0AIAMLwBAACVAQAQvQEAANACADC-AQEAowIAIcIBQAClAgAhzwEBAKQCACHQAQEAowIAIdkBIACxAgAh2gFAALACACHbAUAApQIAIYcCAQCjAgAhiAIBAKQCACGJAgEApAIAIYoCAQCkAgAhiwIAALcCACCMAgEApAIAIY0CAQCjAgAhDLsBAADRAgAwvAEAAH8AEL0BAADRAgAwvgEBAKMCACHCAUAApQIAIdABAQCjAgAh2QEgALECACHaAUAAsAIAIdsBQAClAgAhhwIBAKMCACGIAgEApAIAIYkCAQCkAgAhEbsBAADSAgAwvAEAAGkAEL0BAADSAgAwvgEBAKMCACHCAUAApQIAIdABAQCjAgAh2QEgALECACHaAUAAsAIAIdsBQAClAgAhhwIBAKMCACGIAgEAowIAIY4CAQCjAgAhkAIAANMCkAIikQJAALACACGSAgEApAIAIZMCAQCkAgAhlAJAALACACEHBQAApwIAICcAANUCACAoAADVAgAgwwEAAACQAgLEAQAAAJACCMUBAAAAkAIIygEAANQCkAIiBwUAAKcCACAnAADVAgAgKAAA1QIAIMMBAAAAkAICxAEAAACQAgjFAQAAAJACCMoBAADUApACIgTDAQAAAJACAsQBAAAAkAIIxQEAAACQAgjKAQAA1QKQAiITuwEAANYCADC8AQAAUwAQvQEAANYCADC-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-AFAAN4CACH5AQEA2QIAIfoBAQDZAgAh-wEBANkCACH8AQEA2QIAIf0BAQDZAgAh_gEBANkCACEEwwEAAADtAQLEAQAAAO0BCMUBAAAA7QEIygEAAMMC7QEiCMMBEAAAAAHEARAAAAAFxQEQAAAABcYBEAAAAAHHARAAAAAByAEQAAAAAckBEAAAAAHKARAAwQIAIQjDAQIAAAABxAECAAAABcUBAgAAAAXGAQIAAAABxwECAAAAAcgBAgAAAAHJAQIAAAABygECAKoCACEDmwIAABQAIJwCAAAUACCdAgAAFAAgA5sCAAAZACCcAgAAGQAgnQIAABkAIBcDAADnAgAgCAAA9AIAIA0AAOMCACC7AQAA_AIAMLwBAAALABC9AQAA_AIAML4BAQDYAgAhwgFAANsCACHPAQEA2QIAIdABAQDYAgAh0QEBANgCACHaAUAA3gIAIdsBQADbAgAh7QEAAP8ChQIi7gEQAP4CACGAAgAA_QKAAiKBAkAA2wIAIYICQADbAgAhgwJAAN4CACGFAgIA2gIAIYYCQADeAgAhoQIAAAsAIKICAAALACAXAwAA5wIAIAcAAOACACAJAADrAgAgDQAA4wIAILsBAADqAgAwvAEAAC4AEL0BAADqAgAwvgEBANgCACHCAUAA2wIAIc8BAQDZAgAh0AEBANgCACHZASAA3QIAIdoBQADeAgAh2wFAANsCACGHAgEA2AIAIYgCAQDZAgAhiQIBANkCACGKAgEA2QIAIYsCAADcAgAgjAIBANkCACGNAgEA2AIAIaECAAAuACCiAgAALgAgEAMAAOcCACANAADjAgAguwEAAOgCADC8AQAAHgAQvQEAAOgCADC-AQEA2AIAIcIBQADbAgAh0AEBANgCACHZASAA3QIAIdoBQADeAgAh2wFAANsCACGHAgEA2AIAIYgCAQDZAgAhiQIBANkCACGhAgAAHgAgogIAAB4AIAkKAAD3AgAguwEAAPYCADC8AQAAGQAQvQEAAPYCADC-AQEA2AIAIb8BAQDYAgAhwAEBANgCACHBAQEA2QIAIcIBQADbAgAhKAMAAOcCACAIAAD0AgAgCQAA8QIAIAsAAPICACAMAADzAgAgDgAA9QIAILsBAADtAgAwvAEAACAAEL0BAADtAgAwvgEBANgCACHCAUAA2wIAIc8BAQDZAgAh0AEBANgCACHRAQEA2AIAIdoBQADeAgAh2wFAANsCACHoAQIA2gIAIekBAQDZAgAh6gFAANsCACHrAUAA3gIAIe0BAADuAu0BIu4BEADvAgAh7wEgAN0CACHwAQEA2QIAIfEBAgDwAgAh8gECAPACACHzAQEA2QIAIfQBAQDZAgAh9QEBANkCACH2AQEA2QIAIfcBQADeAgAh-AFAAN4CACH5AQEA2QIAIfoBAQDZAgAh-wEBANkCACH8AQEA2QIAIf0BAQDZAgAh_gEBANkCACGhAgAAIAAgogIAACAAIAK_AQEAAAABzgEBAAAAAQkJAAD6AgAgCgAA9wIAILsBAAD5AgAwvAEAABQAEL0BAAD5AgAwvgEBANgCACG_AQEA2AIAIc4BAQDYAgAhzwEBANkCACEWCAAA9AIAIA8AAPECACC7AQAA-wIAMLwBAAAQABC9AQAA-wIAML4BAQDYAgAhwgFAANsCACHPAQEA2QIAIdABAQDYAgAh0QEBANgCACHSAQEA2AIAIdMBAQDZAgAh1AEBANkCACHVAQEA2QIAIdYBAQDZAgAh1wEBANkCACHYAUAA3gIAIdkBIADdAgAh2gFAAN4CACHbAUAA2wIAIaECAAAQACCiAgAAEAAgFAgAAPQCACAPAADxAgAguwEAAPsCADC8AQAAEAAQvQEAAPsCADC-AQEA2AIAIcIBQADbAgAhzwEBANkCACHQAQEA2AIAIdEBAQDYAgAh0gEBANgCACHTAQEA2QIAIdQBAQDZAgAh1QEBANkCACHWAQEA2QIAIdcBAQDZAgAh2AFAAN4CACHZASAA3QIAIdoBQADeAgAh2wFAANsCACEVAwAA5wIAIAgAAPQCACANAADjAgAguwEAAPwCADC8AQAACwAQvQEAAPwCADC-AQEA2AIAIcIBQADbAgAhzwEBANkCACHQAQEA2AIAIdEBAQDYAgAh2gFAAN4CACHbAUAA2wIAIe0BAAD_AoUCIu4BEAD-AgAhgAIAAP0CgAIigQJAANsCACGCAkAA2wIAIYMCQADeAgAhhQICANoCACGGAkAA3gIAIQTDAQAAAIACAsQBAAAAgAIIxQEAAACAAgjKAQAAzwKAAiIIwwEQAAAAAcQBEAAAAATFARAAAAAExgEQAAAAAccBEAAAAAHIARAAAAAByQEQAAAAAcoBEADNAgAhBMMBAAAAhQICxAEAAACFAgjFAQAAAIUCCMoBAADLAoUCIg4DAADnAgAgBgAAgQMAILsBAACAAwAwvAEAAAMAEL0BAACAAwAwvgEBANgCACHCAUAA2wIAIdABAQDYAgAh3AEBANkCACHdAQEA2AIAId4BAQDYAgAh3wEBANgCACHgAQAA3AIAIOEBAADcAgAgFQMAAOcCACAEAADfAgAguwEAAOUCADC8AQAABwAQvQEAAOUCADC-AQEA2AIAIcIBQADbAgAh0AEBANgCACHZASAA3QIAIdoBQADeAgAh2wFAANsCACGHAgEA2AIAIYgCAQDYAgAhjgIBANgCACGQAgAA5gKQAiKRAkAA3gIAIZICAQDZAgAhkwIBANkCACGUAkAA3gIAIaECAAAHACCiAgAABwAgAAAAAAGmAgEAAAABAaYCAQAAAAEBpgJAAAAAAQUfAAD3BQAgIAAA-gUAIKMCAAD4BQAgpAIAAPkFACCpAgAAIgAgAx8AAPcFACCjAgAA-AUAIKkCAAAiACAAAAAFHwAA7wUAICAAAPUFACCjAgAA8AUAIKQCAAD0BQAgqQIAABIAIAUfAADtBQAgIAAA8gUAIKMCAADuBQAgpAIAAPEFACCpAgAAIgAgAx8AAO8FACCjAgAA8AUAIKkCAAASACADHwAA7QUAIKMCAADuBQAgqQIAACIAIAAAAAGmAkAAAAABAaYCIAAAAAEFHwAA5wUAICAAAOsFACCjAgAA6AUAIKQCAADqBQAgqQIAADAAIAsfAACZAwAwIAAAngMAMKMCAACaAwAwpAIAAJsDADClAgAAnAMAIKYCAACdAwAwpwIAAJ0DADCoAgAAnQMAMKkCAACdAwAwqgIAAJ8DADCrAgAAoAMAMAQKAACRAwAgvgEBAAAAAb8BAQAAAAHPAQEAAAABAgAAABYAIB8AAKQDACADAAAAFgAgHwAApAMAICAAAKMDACABGAAA6QUAMAoJAAD6AgAgCgAA9wIAILsBAAD5AgAwvAEAABQAEL0BAAD5AgAwvgEBAAAAAb8BAQDYAgAhzgEBANgCACHPAQEA2QIAIaACAAD4AgAgAgAAABYAIBgAAKMDACACAAAAoQMAIBgAAKIDACAHuwEAAKADADC8AQAAoQMAEL0BAACgAwAwvgEBANgCACG_AQEA2AIAIc4BAQDYAgAhzwEBANkCACEHuwEAAKADADC8AQAAoQMAEL0BAACgAwAwvgEBANgCACG_AQEA2AIAIc4BAQDYAgAhzwEBANkCACEDvgEBAIYDACG_AQEAhgMAIc8BAQCHAwAhBAoAAI8DACC-AQEAhgMAIb8BAQCGAwAhzwEBAIcDACEECgAAkQMAIL4BAQAAAAG_AQEAAAABzwEBAAAAAQMfAADnBQAgowIAAOgFACCpAgAAMAAgBB8AAJkDADCjAgAAmgMAMKUCAACcAwAgqQIAAJ0DADAAAAAFHwAA3wUAICAAAOUFACCjAgAA4AUAIKQCAADkBQAgqQIAAAEAIAcfAADdBQAgIAAA4gUAIKMCAADeBQAgpAIAAOEFACCnAgAABwAgqAIAAAcAIKkCAAA3ACADHwAA3wUAIKMCAADgBQAgqQIAAAEAIAMfAADdBQAgowIAAN4FACCpAgAANwAgAAAAAAAFpgICAAAAAawCAgAAAAGtAgIAAAABrgICAAAAAa8CAgAAAAEBpgIAAADtAQIFpgIQAAAAAawCEAAAAAGtAhAAAAABrgIQAAAAAa8CEAAAAAEFpgICAAAAAawCAgAAAAGtAgIAAAABrgICAAAAAa8CAgAAAAELHwAAyQMAMCAAAM0DADCjAgAAygMAMKQCAADLAwAwpQIAAMwDACCmAgAAnQMAMKcCAACdAwAwqAIAAJ0DADCpAgAAnQMAMKoCAADOAwAwqwIAAKADADALHwAAvQMAMCAAAMIDADCjAgAAvgMAMKQCAAC_AwAwpQIAAMADACCmAgAAwQMAMKcCAADBAwAwqAIAAMEDADCpAgAAwQMAMKoCAADDAwAwqwIAAMQDADAFHwAAzQUAICAAANsFACCjAgAAzgUAIKQCAADaBQAgqQIAAAEAIAcfAADLBQAgIAAA2AUAIKMCAADMBQAgpAIAANcFACCnAgAACwAgqAIAAAsAIKkCAAANACAFHwAAyQUAICAAANUFACCjAgAAygUAIKQCAADUBQAgqQIAADAAIAcfAADHBQAgIAAA0gUAIKMCAADIBQAgpAIAANEFACCnAgAAHgAgqAIAAB4AIKkCAAAzACAEvgEBAAAAAcABAQAAAAHBAQEAAAABwgFAAAAAAQIAAAAbACAfAADIAwAgAwAAABsAIB8AAMgDACAgAADHAwAgARgAANAFADAJCgAA9wIAILsBAAD2AgAwvAEAABkAEL0BAAD2AgAwvgEBAAAAAb8BAQDYAgAhwAEBANgCACHBAQEA2QIAIcIBQADbAgAhAgAAABsAIBgAAMcDACACAAAAxQMAIBgAAMYDACAIuwEAAMQDADC8AQAAxQMAEL0BAADEAwAwvgEBANgCACG_AQEA2AIAIcABAQDYAgAhwQEBANkCACHCAUAA2wIAIQi7AQAAxAMAMLwBAADFAwAQvQEAAMQDADC-AQEA2AIAIb8BAQDYAgAhwAEBANgCACHBAQEA2QIAIcIBQADbAgAhBL4BAQCGAwAhwAEBAIYDACHBAQEAhwMAIcIBQACIAwAhBL4BAQCGAwAhwAEBAIYDACHBAQEAhwMAIcIBQACIAwAhBL4BAQAAAAHAAQEAAAABwQEBAAAAAcIBQAAAAAEECQAAkAMAIL4BAQAAAAHOAQEAAAABzwEBAAAAAQIAAAAWACAfAADRAwAgAwAAABYAIB8AANEDACAgAADQAwAgARgAAM8FADACAAAAFgAgGAAA0AMAIAIAAAChAwAgGAAAzwMAIAO-AQEAhgMAIc4BAQCGAwAhzwEBAIcDACEECQAAjgMAIL4BAQCGAwAhzgEBAIYDACHPAQEAhwMAIQQJAACQAwAgvgEBAAAAAc4BAQAAAAHPAQEAAAABBB8AAMkDADCjAgAAygMAMKUCAADMAwAgqQIAAJ0DADAEHwAAvQMAMKMCAAC-AwAwpQIAAMADACCpAgAAwQMAMAMfAADNBQAgowIAAM4FACCpAgAAAQAgAx8AAMsFACCjAgAAzAUAIKkCAAANACADHwAAyQUAIKMCAADKBQAgqQIAADAAIAMfAADHBQAgowIAAMgFACCpAgAAMwAgAAAAAAABpgIAAACAAgIFpgIQAAAAAawCEAAAAAGtAhAAAAABrgIQAAAAAa8CEAAAAAEBpgIAAACFAgIFHwAAvgUAICAAAMUFACCjAgAAvwUAIKQCAADEBQAgqQIAAAEAIAUfAAC8BQAgIAAAwgUAIKMCAAC9BQAgpAIAAMEFACCpAgAAMAAgCx8AAOMDADAgAADoAwAwowIAAOQDADCkAgAA5QMAMKUCAADmAwAgpgIAAOcDADCnAgAA5wMAMKgCAADnAwAwqQIAAOcDADCqAgAA6QMAMKsCAADqAwAwIQMAANQDACAIAADWAwAgCQAA0gMAIAsAANMDACAOAADXAwAgvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdEBAQAAAAHaAUAAAAAB2wFAAAAAAegBAgAAAAHqAUAAAAAB6wFAAAAAAe0BAAAA7QEC7gEQAAAAAe8BIAAAAAHwAQEAAAAB8QECAAAAAfIBAgAAAAHzAQEAAAAB9AEBAAAAAfUBAQAAAAH2AQEAAAAB9wFAAAAAAfgBQAAAAAH5AQEAAAAB-gEBAAAAAfsBAQAAAAH8AQEAAAAB_QEBAAAAAf4BAQAAAAECAAAAIgAgHwAA7gMAIAMAAAAiACAfAADuAwAgIAAA7QMAIAEYAADABQAwJwMAAOcCACAIAAD0AgAgCQAA8QIAIAsAAPICACAMAADzAgAgDgAA9QIAILsBAADtAgAwvAEAACAAEL0BAADtAgAwvgEBAAAAAcIBQADbAgAhzwEBANkCACHQAQEA2AIAIdEBAQDYAgAh2gFAAN4CACHbAUAA2wIAIegBAgDaAgAh6QEBANkCACHqAUAA2wIAIesBQADeAgAh7QEAAO4C7QEi7gEQAO8CACHvASAA3QIAIfABAQDZAgAh8QECAPACACHyAQIA8AIAIfMBAQDZAgAh9AEBANkCACH1AQEA2QIAIfYBAQAAAAH3AUAA3gIAIfgBQADeAgAh-QEBANkCACH6AQEA2QIAIfsBAQDZAgAh_AEBANkCACH9AQEA2QIAIf4BAQDZAgAhnwIAAOwCACACAAAAIgAgGAAA7QMAIAIAAADrAwAgGAAA7AMAICC7AQAA6gMAMLwBAADrAwAQvQEAAOoDADC-AQEA2AIAIcIBQADbAgAhzwEBANkCACHQAQEA2AIAIdEBAQDYAgAh2gFAAN4CACHbAUAA2wIAIegBAgDaAgAh6QEBANkCACHqAUAA2wIAIesBQADeAgAh7QEAAO4C7QEi7gEQAO8CACHvASAA3QIAIfABAQDZAgAh8QECAPACACHyAQIA8AIAIfMBAQDZAgAh9AEBANkCACH1AQEA2QIAIfYBAQDZAgAh9wFAAN4CACH4AUAA3gIAIfkBAQDZAgAh-gEBANkCACH7AQEA2QIAIfwBAQDZAgAh_QEBANkCACH-AQEA2QIAISC7AQAA6gMAMLwBAADrAwAQvQEAAOoDADC-AQEA2AIAIcIBQADbAgAhzwEBANkCACHQAQEA2AIAIdEBAQDYAgAh2gFAAN4CACHbAUAA2wIAIegBAgDaAgAh6QEBANkCACHqAUAA2wIAIesBQADeAgAh7QEAAO4C7QEi7gEQAO8CACHvASAA3QIAIfABAQDZAgAh8QECAPACACHyAQIA8AIAIfMBAQDZAgAh9AEBANkCACH1AQEA2QIAIfYBAQDZAgAh9wFAAN4CACH4AUAA3gIAIfkBAQDZAgAh-gEBANkCACH7AQEA2QIAIfwBAQDZAgAh_QEBANkCACH-AQEA2QIAIRy-AQEAhgMAIcIBQACIAwAhzwEBAIcDACHQAQEAhgMAIdEBAQCGAwAh2gFAAJUDACHbAUAAiAMAIegBAgCzAwAh6gFAAIgDACHrAUAAlQMAIe0BAAC0A-0BIu4BEAC1AwAh7wEgAJYDACHwAQEAhwMAIfEBAgC2AwAh8gECALYDACHzAQEAhwMAIfQBAQCHAwAh9QEBAIcDACH2AQEAhwMAIfcBQACVAwAh-AFAAJUDACH5AQEAhwMAIfoBAQCHAwAh-wEBAIcDACH8AQEAhwMAIf0BAQCHAwAh_gEBAIcDACEhAwAAuQMAIAgAALsDACAJAAC3AwAgCwAAuAMAIA4AALwDACC-AQEAhgMAIcIBQACIAwAhzwEBAIcDACHQAQEAhgMAIdEBAQCGAwAh2gFAAJUDACHbAUAAiAMAIegBAgCzAwAh6gFAAIgDACHrAUAAlQMAIe0BAAC0A-0BIu4BEAC1AwAh7wEgAJYDACHwAQEAhwMAIfEBAgC2AwAh8gECALYDACHzAQEAhwMAIfQBAQCHAwAh9QEBAIcDACH2AQEAhwMAIfcBQACVAwAh-AFAAJUDACH5AQEAhwMAIfoBAQCHAwAh-wEBAIcDACH8AQEAhwMAIf0BAQCHAwAh_gEBAIcDACEhAwAA1AMAIAgAANYDACAJAADSAwAgCwAA0wMAIA4AANcDACC-AQEAAAABwgFAAAAAAc8BAQAAAAHQAQEAAAAB0QEBAAAAAdoBQAAAAAHbAUAAAAAB6AECAAAAAeoBQAAAAAHrAUAAAAAB7QEAAADtAQLuARAAAAAB7wEgAAAAAfABAQAAAAHxAQIAAAAB8gECAAAAAfMBAQAAAAH0AQEAAAAB9QEBAAAAAfYBAQAAAAH3AUAAAAAB-AFAAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAfwBAQAAAAH9AQEAAAAB_gEBAAAAAQMfAAC-BQAgowIAAL8FACCpAgAAAQAgAx8AALwFACCjAgAAvQUAIKkCAAAwACAEHwAA4wMAMKMCAADkAwAwpQIAAOYDACCpAgAA5wMAMAAAAAsfAACOBAAwIAAAkwQAMKMCAACPBAAwpAIAAJAEADClAgAAkQQAIKYCAACSBAAwpwIAAJIEADCoAgAAkgQAMKkCAACSBAAwqgIAAJQEADCrAgAAlQQAMAUfAAC0BQAgIAAAugUAIKMCAAC1BQAgpAIAALkFACCpAgAAAQAgCx8AAIIEADAgAACHBAAwowIAAIMEADCkAgAAhAQAMKUCAACFBAAgpgIAAIYEADCnAgAAhgQAMKgCAACGBAAwqQIAAIYEADCqAgAAiAQAMKsCAACJBAAwCx8AAPkDADAgAAD9AwAwowIAAPoDADCkAgAA-wMAMKUCAAD8AwAgpgIAAOcDADCnAgAA5wMAMKgCAADnAwAwqQIAAOcDADCqAgAA_gMAMKsCAADqAwAwIQMAANQDACAJAADSAwAgCwAA0wMAIAwAANUDACAOAADXAwAgvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdoBQAAAAAHbAUAAAAAB6AECAAAAAekBAQAAAAHqAUAAAAAB6wFAAAAAAe0BAAAA7QEC7gEQAAAAAe8BIAAAAAHwAQEAAAAB8QECAAAAAfIBAgAAAAHzAQEAAAAB9AEBAAAAAfUBAQAAAAH2AQEAAAAB9wFAAAAAAfgBQAAAAAH5AQEAAAAB-gEBAAAAAfsBAQAAAAH8AQEAAAAB_QEBAAAAAf4BAQAAAAECAAAAIgAgHwAAgQQAIAMAAAAiACAfAACBBAAgIAAAgAQAIAEYAAC4BQAwAgAAACIAIBgAAIAEACACAAAA6wMAIBgAAP8DACAcvgEBAIYDACHCAUAAiAMAIc8BAQCHAwAh0AEBAIYDACHaAUAAlQMAIdsBQACIAwAh6AECALMDACHpAQEAhwMAIeoBQACIAwAh6wFAAJUDACHtAQAAtAPtASLuARAAtQMAIe8BIACWAwAh8AEBAIcDACHxAQIAtgMAIfIBAgC2AwAh8wEBAIcDACH0AQEAhwMAIfUBAQCHAwAh9gEBAIcDACH3AUAAlQMAIfgBQACVAwAh-QEBAIcDACH6AQEAhwMAIfsBAQCHAwAh_AEBAIcDACH9AQEAhwMAIf4BAQCHAwAhIQMAALkDACAJAAC3AwAgCwAAuAMAIAwAALoDACAOAAC8AwAgvgEBAIYDACHCAUAAiAMAIc8BAQCHAwAh0AEBAIYDACHaAUAAlQMAIdsBQACIAwAh6AECALMDACHpAQEAhwMAIeoBQACIAwAh6wFAAJUDACHtAQAAtAPtASLuARAAtQMAIe8BIACWAwAh8AEBAIcDACHxAQIAtgMAIfIBAgC2AwAh8wEBAIcDACH0AQEAhwMAIfUBAQCHAwAh9gEBAIcDACH3AUAAlQMAIfgBQACVAwAh-QEBAIcDACH6AQEAhwMAIfsBAQCHAwAh_AEBAIcDACH9AQEAhwMAIf4BAQCHAwAhIQMAANQDACAJAADSAwAgCwAA0wMAIAwAANUDACAOAADXAwAgvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdoBQAAAAAHbAUAAAAAB6AECAAAAAekBAQAAAAHqAUAAAAAB6wFAAAAAAe0BAAAA7QEC7gEQAAAAAe8BIAAAAAHwAQEAAAAB8QECAAAAAfIBAgAAAAHzAQEAAAAB9AEBAAAAAfUBAQAAAAH2AQEAAAAB9wFAAAAAAfgBQAAAAAH5AQEAAAAB-gEBAAAAAfsBAQAAAAH8AQEAAAAB_QEBAAAAAf4BAQAAAAEPDwAApgMAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdABAQAAAAHSAQEAAAAB0wEBAAAAAdQBAQAAAAHVAQEAAAAB1gEBAAAAAdcBAQAAAAHYAUAAAAAB2QEgAAAAAdoBQAAAAAHbAUAAAAABAgAAABIAIB8AAI0EACADAAAAEgAgHwAAjQQAICAAAIwEACABGAAAtwUAMBQIAAD0AgAgDwAA8QIAILsBAAD7AgAwvAEAABAAEL0BAAD7AgAwvgEBAAAAAcIBQADbAgAhzwEBANkCACHQAQEA2AIAIdEBAQDYAgAh0gEBANgCACHTAQEA2QIAIdQBAQDZAgAh1QEBANkCACHWAQEA2QIAIdcBAQDZAgAh2AFAAN4CACHZASAA3QIAIdoBQADeAgAh2wFAANsCACECAAAAEgAgGAAAjAQAIAIAAACKBAAgGAAAiwQAIBK7AQAAiQQAMLwBAACKBAAQvQEAAIkEADC-AQEA2AIAIcIBQADbAgAhzwEBANkCACHQAQEA2AIAIdEBAQDYAgAh0gEBANgCACHTAQEA2QIAIdQBAQDZAgAh1QEBANkCACHWAQEA2QIAIdcBAQDZAgAh2AFAAN4CACHZASAA3QIAIdoBQADeAgAh2wFAANsCACESuwEAAIkEADC8AQAAigQAEL0BAACJBAAwvgEBANgCACHCAUAA2wIAIc8BAQDZAgAh0AEBANgCACHRAQEA2AIAIdIBAQDYAgAh0wEBANkCACHUAQEA2QIAIdUBAQDZAgAh1gEBANkCACHXAQEA2QIAIdgBQADeAgAh2QEgAN0CACHaAUAA3gIAIdsBQADbAgAhDr4BAQCGAwAhwgFAAIgDACHPAQEAhwMAIdABAQCGAwAh0gEBAIYDACHTAQEAhwMAIdQBAQCHAwAh1QEBAIcDACHWAQEAhwMAIdcBAQCHAwAh2AFAAJUDACHZASAAlgMAIdoBQACVAwAh2wFAAIgDACEPDwAAmAMAIL4BAQCGAwAhwgFAAIgDACHPAQEAhwMAIdABAQCGAwAh0gEBAIYDACHTAQEAhwMAIdQBAQCHAwAh1QEBAIcDACHWAQEAhwMAIdcBAQCHAwAh2AFAAJUDACHZASAAlgMAIdoBQACVAwAh2wFAAIgDACEPDwAApgMAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdABAQAAAAHSAQEAAAAB0wEBAAAAAdQBAQAAAAHVAQEAAAAB1gEBAAAAAdcBAQAAAAHYAUAAAAAB2QEgAAAAAdoBQAAAAAHbAUAAAAABEAMAAO8DACANAADxAwAgvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdoBQAAAAAHbAUAAAAAB7QEAAACFAgLuARAAAAABgAIAAACAAgKBAkAAAAABggJAAAAAAYMCQAAAAAGFAgIAAAABhgJAAAAAAQIAAAANACAfAACZBAAgAwAAAA0AIB8AAJkEACAgAACYBAAgARgAALYFADAVAwAA5wIAIAgAAPQCACANAADjAgAguwEAAPwCADC8AQAACwAQvQEAAPwCADC-AQEAAAABwgFAANsCACHPAQEA2QIAIdABAQDYAgAh0QEBANgCACHaAUAA3gIAIdsBQADbAgAh7QEAAP8ChQIi7gEQAP4CACGAAgAA_QKAAiKBAkAA2wIAIYICQADbAgAhgwJAAN4CACGFAgIA2gIAIYYCQADeAgAhAgAAAA0AIBgAAJgEACACAAAAlgQAIBgAAJcEACASuwEAAJUEADC8AQAAlgQAEL0BAACVBAAwvgEBANgCACHCAUAA2wIAIc8BAQDZAgAh0AEBANgCACHRAQEA2AIAIdoBQADeAgAh2wFAANsCACHtAQAA_wKFAiLuARAA_gIAIYACAAD9AoACIoECQADbAgAhggJAANsCACGDAkAA3gIAIYUCAgDaAgAhhgJAAN4CACESuwEAAJUEADC8AQAAlgQAEL0BAACVBAAwvgEBANgCACHCAUAA2wIAIc8BAQDZAgAh0AEBANgCACHRAQEA2AIAIdoBQADeAgAh2wFAANsCACHtAQAA_wKFAiLuARAA_gIAIYACAAD9AoACIoECQADbAgAhggJAANsCACGDAkAA3gIAIYUCAgDaAgAhhgJAAN4CACEOvgEBAIYDACHCAUAAiAMAIc8BAQCHAwAh0AEBAIYDACHaAUAAlQMAIdsBQACIAwAh7QEAAN8DhQIi7gEQAN4DACGAAgAA3QOAAiKBAkAAiAMAIYICQACIAwAhgwJAAJUDACGFAgIAswMAIYYCQACVAwAhEAMAAOADACANAADiAwAgvgEBAIYDACHCAUAAiAMAIc8BAQCHAwAh0AEBAIYDACHaAUAAlQMAIdsBQACIAwAh7QEAAN8DhQIi7gEQAN4DACGAAgAA3QOAAiKBAkAAiAMAIYICQACIAwAhgwJAAJUDACGFAgIAswMAIYYCQACVAwAhEAMAAO8DACANAADxAwAgvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdoBQAAAAAHbAUAAAAAB7QEAAACFAgLuARAAAAABgAIAAACAAgKBAkAAAAABggJAAAAAAYMCQAAAAAGFAgIAAAABhgJAAAAAAQQfAACOBAAwowIAAI8EADClAgAAkQQAIKkCAACSBAAwAx8AALQFACCjAgAAtQUAIKkCAAABACAEHwAAggQAMKMCAACDBAAwpQIAAIUEACCpAgAAhgQAMAQfAAD5AwAwowIAAPoDADClAgAA_AMAIKkCAADnAwAwAAAABR8AAK4FACAgAACyBQAgowIAAK8FACCkAgAAsQUAIKkCAAABACALHwAAowQAMCAAAKcEADCjAgAApAQAMKQCAAClBAAwpQIAAKYEACCmAgAA5wMAMKcCAADnAwAwqAIAAOcDADCpAgAA5wMAMKoCAACoBAAwqwIAAOoDADAhAwAA1AMAIAgAANYDACAJAADSAwAgCwAA0wMAIAwAANUDACC-AQEAAAABwgFAAAAAAc8BAQAAAAHQAQEAAAAB0QEBAAAAAdoBQAAAAAHbAUAAAAAB6AECAAAAAekBAQAAAAHqAUAAAAAB6wFAAAAAAe0BAAAA7QEC7gEQAAAAAe8BIAAAAAHxAQIAAAAB8gECAAAAAfMBAQAAAAH0AQEAAAAB9QEBAAAAAfYBAQAAAAH3AUAAAAAB-AFAAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAfwBAQAAAAH9AQEAAAAB_gEBAAAAAQIAAAAiACAfAACrBAAgAwAAACIAIB8AAKsEACAgAACqBAAgARgAALAFADACAAAAIgAgGAAAqgQAIAIAAADrAwAgGAAAqQQAIBy-AQEAhgMAIcIBQACIAwAhzwEBAIcDACHQAQEAhgMAIdEBAQCGAwAh2gFAAJUDACHbAUAAiAMAIegBAgCzAwAh6QEBAIcDACHqAUAAiAMAIesBQACVAwAh7QEAALQD7QEi7gEQALUDACHvASAAlgMAIfEBAgC2AwAh8gECALYDACHzAQEAhwMAIfQBAQCHAwAh9QEBAIcDACH2AQEAhwMAIfcBQACVAwAh-AFAAJUDACH5AQEAhwMAIfoBAQCHAwAh-wEBAIcDACH8AQEAhwMAIf0BAQCHAwAh_gEBAIcDACEhAwAAuQMAIAgAALsDACAJAAC3AwAgCwAAuAMAIAwAALoDACC-AQEAhgMAIcIBQACIAwAhzwEBAIcDACHQAQEAhgMAIdEBAQCGAwAh2gFAAJUDACHbAUAAiAMAIegBAgCzAwAh6QEBAIcDACHqAUAAiAMAIesBQACVAwAh7QEAALQD7QEi7gEQALUDACHvASAAlgMAIfEBAgC2AwAh8gECALYDACHzAQEAhwMAIfQBAQCHAwAh9QEBAIcDACH2AQEAhwMAIfcBQACVAwAh-AFAAJUDACH5AQEAhwMAIfoBAQCHAwAh-wEBAIcDACH8AQEAhwMAIf0BAQCHAwAh_gEBAIcDACEhAwAA1AMAIAgAANYDACAJAADSAwAgCwAA0wMAIAwAANUDACC-AQEAAAABwgFAAAAAAc8BAQAAAAHQAQEAAAAB0QEBAAAAAdoBQAAAAAHbAUAAAAAB6AECAAAAAekBAQAAAAHqAUAAAAAB6wFAAAAAAe0BAAAA7QEC7gEQAAAAAe8BIAAAAAHxAQIAAAAB8gECAAAAAfMBAQAAAAH0AQEAAAAB9QEBAAAAAfYBAQAAAAH3AUAAAAAB-AFAAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAfwBAQAAAAH9AQEAAAAB_gEBAAAAAQMfAACuBQAgowIAAK8FACCpAgAAAQAgBB8AAKMEADCjAgAApAQAMKUCAACmBAAgqQIAAOcDADAAAAABpgIAAACQAgILHwAAtAQAMCAAALkEADCjAgAAtQQAMKQCAAC2BAAwpQIAALcEACCmAgAAuAQAMKcCAAC4BAAwqAIAALgEADCpAgAAuAQAMKoCAAC6BAAwqwIAALsEADAFHwAAqAUAICAAAKwFACCjAgAAqQUAIKQCAACrBQAgqQIAAAEAIAkDAACsAwAgvgEBAAAAAcIBQAAAAAHQAQEAAAAB3QEBAAAAAd4BAQAAAAHfAQEAAAAB4AGAAAAAAeEBgAAAAAECAAAABQAgHwAAvwQAIAMAAAAFACAfAAC_BAAgIAAAvgQAIAEYAACqBQAwDgMAAOcCACAGAACBAwAguwEAAIADADC8AQAAAwAQvQEAAIADADC-AQEAAAABwgFAANsCACHQAQEA2AIAIdwBAQDZAgAh3QEBANgCACHeAQEA2AIAId8BAQDYAgAh4AEAANwCACDhAQAA3AIAIAIAAAAFACAYAAC-BAAgAgAAALwEACAYAAC9BAAgDLsBAAC7BAAwvAEAALwEABC9AQAAuwQAML4BAQDYAgAhwgFAANsCACHQAQEA2AIAIdwBAQDZAgAh3QEBANgCACHeAQEA2AIAId8BAQDYAgAh4AEAANwCACDhAQAA3AIAIAy7AQAAuwQAMLwBAAC8BAAQvQEAALsEADC-AQEA2AIAIcIBQADbAgAh0AEBANgCACHcAQEA2QIAId0BAQDYAgAh3gEBANgCACHfAQEA2AIAIeABAADcAgAg4QEAANwCACAIvgEBAIYDACHCAUAAiAMAIdABAQCGAwAh3QEBAIYDACHeAQEAhgMAId8BAQCGAwAh4AGAAAAAAeEBgAAAAAEJAwAAqgMAIL4BAQCGAwAhwgFAAIgDACHQAQEAhgMAId0BAQCGAwAh3gEBAIYDACHfAQEAhgMAIeABgAAAAAHhAYAAAAABCQMAAKwDACC-AQEAAAABwgFAAAAAAdABAQAAAAHdAQEAAAAB3gEBAAAAAd8BAQAAAAHgAYAAAAAB4QGAAAAAAQQfAAC0BAAwowIAALUEADClAgAAtwQAIKkCAAC4BAAwAx8AAKgFACCjAgAAqQUAIKkCAAABACAAAAAAAAsfAACDBQAwIAAAhwUAMKMCAACEBQAwpAIAAIUFADClAgAAhgUAIKYCAAC4BAAwpwIAALgEADCoAgAAuAQAMKkCAAC4BAAwqgIAAIgFADCrAgAAuwQAMAsfAAD6BAAwIAAA_gQAMKMCAAD7BAAwpAIAAPwEADClAgAA_QQAIKYCAACSBAAwpwIAAJIEADCoAgAAkgQAMKkCAACSBAAwqgIAAP8EADCrAgAAlQQAMAsfAADuBAAwIAAA8wQAMKMCAADvBAAwpAIAAPAEADClAgAA8QQAIKYCAADyBAAwpwIAAPIEADCoAgAA8gQAMKkCAADyBAAwqgIAAPQEADCrAgAA9QQAMAsfAADiBAAwIAAA5wQAMKMCAADjBAAwpAIAAOQEADClAgAA5QQAIKYCAADmBAAwpwIAAOYEADCoAgAA5gQAMKkCAADmBAAwqgIAAOgEADCrAgAA6QQAMAsfAADZBAAwIAAA3QQAMKMCAADaBAAwpAIAANsEADClAgAA3AQAIKYCAADnAwAwpwIAAOcDADCoAgAA5wMAMKkCAADnAwAwqgIAAN4EADCrAgAA6gMAMAsfAADNBAAwIAAA0gQAMKMCAADOBAAwpAIAAM8EADClAgAA0AQAIKYCAADRBAAwpwIAANEEADCoAgAA0QQAMKkCAADRBAAwqgIAANMEADCrAgAA1AQAMA4EAADABAAgvgEBAAAAAcIBQAAAAAHZASAAAAAB2gFAAAAAAdsBQAAAAAGHAgEAAAABiAIBAAAAAY4CAQAAAAGQAgAAAJACApECQAAAAAGSAgEAAAABkwIBAAAAAZQCQAAAAAECAAAANwAgHwAA2AQAIAMAAAA3ACAfAADYBAAgIAAA1wQAIAEYAACnBQAwEwMAAOcCACAEAADfAgAguwEAAOUCADC8AQAABwAQvQEAAOUCADC-AQEAAAABwgFAANsCACHQAQEA2AIAIdkBIADdAgAh2gFAAN4CACHbAUAA2wIAIYcCAQDYAgAhiAIBAAAAAY4CAQDYAgAhkAIAAOYCkAIikQJAAN4CACGSAgEA2QIAIZMCAQDZAgAhlAJAAN4CACECAAAANwAgGAAA1wQAIAIAAADVBAAgGAAA1gQAIBG7AQAA1AQAMLwBAADVBAAQvQEAANQEADC-AQEA2AIAIcIBQADbAgAh0AEBANgCACHZASAA3QIAIdoBQADeAgAh2wFAANsCACGHAgEA2AIAIYgCAQDYAgAhjgIBANgCACGQAgAA5gKQAiKRAkAA3gIAIZICAQDZAgAhkwIBANkCACGUAkAA3gIAIRG7AQAA1AQAMLwBAADVBAAQvQEAANQEADC-AQEA2AIAIcIBQADbAgAh0AEBANgCACHZASAA3QIAIdoBQADeAgAh2wFAANsCACGHAgEA2AIAIYgCAQDYAgAhjgIBANgCACGQAgAA5gKQAiKRAkAA3gIAIZICAQDZAgAhkwIBANkCACGUAkAA3gIAIQ2-AQEAhgMAIcIBQACIAwAh2QEgAJYDACHaAUAAlQMAIdsBQACIAwAhhwIBAIYDACGIAgEAhgMAIY4CAQCGAwAhkAIAALEEkAIikQJAAJUDACGSAgEAhwMAIZMCAQCHAwAhlAJAAJUDACEOBAAAsgQAIL4BAQCGAwAhwgFAAIgDACHZASAAlgMAIdoBQACVAwAh2wFAAIgDACGHAgEAhgMAIYgCAQCGAwAhjgIBAIYDACGQAgAAsQSQAiKRAkAAlQMAIZICAQCHAwAhkwIBAIcDACGUAkAAlQMAIQ4EAADABAAgvgEBAAAAAcIBQAAAAAHZASAAAAAB2gFAAAAAAdsBQAAAAAGHAgEAAAABiAIBAAAAAY4CAQAAAAGQAgAAAJACApECQAAAAAGSAgEAAAABkwIBAAAAAZQCQAAAAAEhCAAA1gMAIAkAANIDACALAADTAwAgDAAA1QMAIA4AANcDACC-AQEAAAABwgFAAAAAAc8BAQAAAAHRAQEAAAAB2gFAAAAAAdsBQAAAAAHoAQIAAAAB6QEBAAAAAeoBQAAAAAHrAUAAAAAB7QEAAADtAQLuARAAAAAB7wEgAAAAAfABAQAAAAHxAQIAAAAB8gECAAAAAfMBAQAAAAH0AQEAAAAB9QEBAAAAAfYBAQAAAAH3AUAAAAAB-AFAAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAfwBAQAAAAH9AQEAAAAB_gEBAAAAAQIAAAAiACAfAADhBAAgAwAAACIAIB8AAOEEACAgAADgBAAgARgAAKYFADACAAAAIgAgGAAA4AQAIAIAAADrAwAgGAAA3wQAIBy-AQEAhgMAIcIBQACIAwAhzwEBAIcDACHRAQEAhgMAIdoBQACVAwAh2wFAAIgDACHoAQIAswMAIekBAQCHAwAh6gFAAIgDACHrAUAAlQMAIe0BAAC0A-0BIu4BEAC1AwAh7wEgAJYDACHwAQEAhwMAIfEBAgC2AwAh8gECALYDACHzAQEAhwMAIfQBAQCHAwAh9QEBAIcDACH2AQEAhwMAIfcBQACVAwAh-AFAAJUDACH5AQEAhwMAIfoBAQCHAwAh-wEBAIcDACH8AQEAhwMAIf0BAQCHAwAh_gEBAIcDACEhCAAAuwMAIAkAALcDACALAAC4AwAgDAAAugMAIA4AALwDACC-AQEAhgMAIcIBQACIAwAhzwEBAIcDACHRAQEAhgMAIdoBQACVAwAh2wFAAIgDACHoAQIAswMAIekBAQCHAwAh6gFAAIgDACHrAUAAlQMAIe0BAAC0A-0BIu4BEAC1AwAh7wEgAJYDACHwAQEAhwMAIfEBAgC2AwAh8gECALYDACHzAQEAhwMAIfQBAQCHAwAh9QEBAIcDACH2AQEAhwMAIfcBQACVAwAh-AFAAJUDACH5AQEAhwMAIfoBAQCHAwAh-wEBAIcDACH8AQEAhwMAIf0BAQCHAwAh_gEBAIcDACEhCAAA1gMAIAkAANIDACALAADTAwAgDAAA1QMAIA4AANcDACC-AQEAAAABwgFAAAAAAc8BAQAAAAHRAQEAAAAB2gFAAAAAAdsBQAAAAAHoAQIAAAAB6QEBAAAAAeoBQAAAAAHrAUAAAAAB7QEAAADtAQLuARAAAAAB7wEgAAAAAfABAQAAAAHxAQIAAAAB8gECAAAAAfMBAQAAAAH0AQEAAAAB9QEBAAAAAfYBAQAAAAH3AUAAAAAB-AFAAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAfwBAQAAAAH9AQEAAAAB_gEBAAAAAQkNAACtBAAgvgEBAAAAAcIBQAAAAAHZASAAAAAB2gFAAAAAAdsBQAAAAAGHAgEAAAABiAIBAAAAAYkCAQAAAAECAAAAMwAgHwAA7QQAIAMAAAAzACAfAADtBAAgIAAA7AQAIAEYAAClBQAwDgMAAOcCACANAADjAgAguwEAAOgCADC8AQAAHgAQvQEAAOgCADC-AQEAAAABwgFAANsCACHQAQEA2AIAIdkBIADdAgAh2gFAAN4CACHbAUAA2wIAIYcCAQDYAgAhiAIBANkCACGJAgEA2QIAIQIAAAAzACAYAADsBAAgAgAAAOoEACAYAADrBAAgDLsBAADpBAAwvAEAAOoEABC9AQAA6QQAML4BAQDYAgAhwgFAANsCACHQAQEA2AIAIdkBIADdAgAh2gFAAN4CACHbAUAA2wIAIYcCAQDYAgAhiAIBANkCACGJAgEA2QIAIQy7AQAA6QQAMLwBAADqBAAQvQEAAOkEADC-AQEA2AIAIcIBQADbAgAh0AEBANgCACHZASAA3QIAIdoBQADeAgAh2wFAANsCACGHAgEA2AIAIYgCAQDZAgAhiQIBANkCACEIvgEBAIYDACHCAUAAiAMAIdkBIACWAwAh2gFAAJUDACHbAUAAiAMAIYcCAQCGAwAhiAIBAIcDACGJAgEAhwMAIQkNAACiBAAgvgEBAIYDACHCAUAAiAMAIdkBIACWAwAh2gFAAJUDACHbAUAAiAMAIYcCAQCGAwAhiAIBAIcDACGJAgEAhwMAIQkNAACtBAAgvgEBAAAAAcIBQAAAAAHZASAAAAAB2gFAAAAAAdsBQAAAAAGHAgEAAAABiAIBAAAAAYkCAQAAAAEQBwAAmgQAIAkAAJwEACANAACdBAAgvgEBAAAAAcIBQAAAAAHPAQEAAAAB2QEgAAAAAdoBQAAAAAHbAUAAAAABhwIBAAAAAYgCAQAAAAGJAgEAAAABigIBAAAAAYsCgAAAAAGMAgEAAAABjQIBAAAAAQIAAAAwACAfAAD5BAAgAwAAADAAIB8AAPkEACAgAAD4BAAgARgAAKQFADAWAwAA5wIAIAcAAOACACAJAADrAgAgDQAA4wIAILsBAADqAgAwvAEAAC4AEL0BAADqAgAwvgEBAAAAAcIBQADbAgAhzwEBANkCACHQAQEA2AIAIdkBIADdAgAh2gFAAN4CACHbAUAA2wIAIYcCAQDYAgAhiAIBANkCACGJAgEA2QIAIYoCAQDZAgAhiwIAANwCACCMAgEA2QIAIY0CAQDYAgAhngIAAOkCACACAAAAMAAgGAAA-AQAIAIAAAD2BAAgGAAA9wQAIBG7AQAA9QQAMLwBAAD2BAAQvQEAAPUEADC-AQEA2AIAIcIBQADbAgAhzwEBANkCACHQAQEA2AIAIdkBIADdAgAh2gFAAN4CACHbAUAA2wIAIYcCAQDYAgAhiAIBANkCACGJAgEA2QIAIYoCAQDZAgAhiwIAANwCACCMAgEA2QIAIY0CAQDYAgAhEbsBAAD1BAAwvAEAAPYEABC9AQAA9QQAML4BAQDYAgAhwgFAANsCACHPAQEA2QIAIdABAQDYAgAh2QEgAN0CACHaAUAA3gIAIdsBQADbAgAhhwIBANgCACGIAgEA2QIAIYkCAQDZAgAhigIBANkCACGLAgAA3AIAIIwCAQDZAgAhjQIBANgCACENvgEBAIYDACHCAUAAiAMAIc8BAQCHAwAh2QEgAJYDACHaAUAAlQMAIdsBQACIAwAhhwIBAIYDACGIAgEAhwMAIYkCAQCHAwAhigIBAIcDACGLAoAAAAABjAIBAIcDACGNAgEAhgMAIRAHAAD1AwAgCQAA9wMAIA0AAPgDACC-AQEAhgMAIcIBQACIAwAhzwEBAIcDACHZASAAlgMAIdoBQACVAwAh2wFAAIgDACGHAgEAhgMAIYgCAQCHAwAhiQIBAIcDACGKAgEAhwMAIYsCgAAAAAGMAgEAhwMAIY0CAQCGAwAhEAcAAJoEACAJAACcBAAgDQAAnQQAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdkBIAAAAAHaAUAAAAAB2wFAAAAAAYcCAQAAAAGIAgEAAAABiQIBAAAAAYoCAQAAAAGLAoAAAAABjAIBAAAAAY0CAQAAAAEQCAAA8AMAIA0AAPEDACC-AQEAAAABwgFAAAAAAc8BAQAAAAHRAQEAAAAB2gFAAAAAAdsBQAAAAAHtAQAAAIUCAu4BEAAAAAGAAgAAAIACAoECQAAAAAGCAkAAAAABgwJAAAAAAYUCAgAAAAGGAkAAAAABAgAAAA0AIB8AAIIFACADAAAADQAgHwAAggUAICAAAIEFACABGAAAowUAMAIAAAANACAYAACBBQAgAgAAAJYEACAYAACABQAgDr4BAQCGAwAhwgFAAIgDACHPAQEAhwMAIdEBAQCGAwAh2gFAAJUDACHbAUAAiAMAIe0BAADfA4UCIu4BEADeAwAhgAIAAN0DgAIigQJAAIgDACGCAkAAiAMAIYMCQACVAwAhhQICALMDACGGAkAAlQMAIRAIAADhAwAgDQAA4gMAIL4BAQCGAwAhwgFAAIgDACHPAQEAhwMAIdEBAQCGAwAh2gFAAJUDACHbAUAAiAMAIe0BAADfA4UCIu4BEADeAwAhgAIAAN0DgAIigQJAAIgDACGCAkAAiAMAIYMCQACVAwAhhQICALMDACGGAkAAlQMAIRAIAADwAwAgDQAA8QMAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdEBAQAAAAHaAUAAAAAB2wFAAAAAAe0BAAAAhQIC7gEQAAAAAYACAAAAgAICgQJAAAAAAYICQAAAAAGDAkAAAAABhQICAAAAAYYCQAAAAAEJBgAArQMAIL4BAQAAAAHCAUAAAAAB3AEBAAAAAd0BAQAAAAHeAQEAAAAB3wEBAAAAAeABgAAAAAHhAYAAAAABAgAAAAUAIB8AAIsFACADAAAABQAgHwAAiwUAICAAAIoFACABGAAAogUAMAIAAAAFACAYAACKBQAgAgAAALwEACAYAACJBQAgCL4BAQCGAwAhwgFAAIgDACHcAQEAhwMAId0BAQCGAwAh3gEBAIYDACHfAQEAhgMAIeABgAAAAAHhAYAAAAABCQYAAKsDACC-AQEAhgMAIcIBQACIAwAh3AEBAIcDACHdAQEAhgMAId4BAQCGAwAh3wEBAIYDACHgAYAAAAAB4QGAAAAAAQkGAACtAwAgvgEBAAAAAcIBQAAAAAHcAQEAAAAB3QEBAAAAAd4BAQAAAAHfAQEAAAAB4AGAAAAAAeEBgAAAAAEEHwAAgwUAMKMCAACEBQAwpQIAAIYFACCpAgAAuAQAMAQfAAD6BAAwowIAAPsEADClAgAA_QQAIKkCAACSBAAwBB8AAO4EADCjAgAA7wQAMKUCAADxBAAgqQIAAPIEADAEHwAA4gQAMKMCAADjBAAwpQIAAOUEACCpAgAA5gQAMAQfAADZBAAwowIAANoEADClAgAA3AQAIKkCAADnAwAwBB8AAM0EADCjAgAAzgQAMKUCAADQBAAgqQIAANEEADAAAAAAAAAOBAAAkgUAIAcAAJMFACANAACWBQAgEAAAlAUAIBEAAJUFACASAACXBQAgiAIAAIIDACCJAgAAggMAIIoCAACCAwAgiwIAAIIDACCMAgAAggMAIJUCAACCAwAgmQIAAIIDACCaAgAAggMAIAAAAAcDAACYBQAgCAAAnQUAIA0AAJYFACDPAQAAggMAINoBAACCAwAggwIAAIIDACCGAgAAggMAIAsDAACYBQAgBwAAkwUAIAkAAJkFACANAACWBQAgzwEAAIIDACDaAQAAggMAIIgCAACCAwAgiQIAAIIDACCKAgAAggMAIIsCAACCAwAgjAIAAIIDACAFAwAAmAUAIA0AAJYFACDaAQAAggMAIIgCAACCAwAgiQIAAIIDACAaAwAAmAUAIAgAAJ0FACAJAACaBQAgCwAAmwUAIAwAAJwFACAOAACeBQAgzwEAAIIDACDaAQAAggMAIOkBAACCAwAg6wEAAIIDACDuAQAAggMAIPABAACCAwAg8QEAAIIDACDyAQAAggMAIPMBAACCAwAg9AEAAIIDACD1AQAAggMAIPYBAACCAwAg9wEAAIIDACD4AQAAggMAIPkBAACCAwAg-gEAAIIDACD7AQAAggMAIPwBAACCAwAg_QEAAIIDACD-AQAAggMAIAoIAACdBQAgDwAAmgUAIM8BAACCAwAg0wEAAIIDACDUAQAAggMAINUBAACCAwAg1gEAAIIDACDXAQAAggMAINgBAACCAwAg2gEAAIIDACAHAwAAmAUAIAQAAJIFACDaAQAAggMAIJECAACCAwAgkgIAAIIDACCTAgAAggMAIJQCAACCAwAgCL4BAQAAAAHCAUAAAAAB3AEBAAAAAd0BAQAAAAHeAQEAAAAB3wEBAAAAAeABgAAAAAHhAYAAAAABDr4BAQAAAAHCAUAAAAABzwEBAAAAAdEBAQAAAAHaAUAAAAAB2wFAAAAAAe0BAAAAhQIC7gEQAAAAAYACAAAAgAICgQJAAAAAAYICQAAAAAGDAkAAAAABhQICAAAAAYYCQAAAAAENvgEBAAAAAcIBQAAAAAHPAQEAAAAB2QEgAAAAAdoBQAAAAAHbAUAAAAABhwIBAAAAAYgCAQAAAAGJAgEAAAABigIBAAAAAYsCgAAAAAGMAgEAAAABjQIBAAAAAQi-AQEAAAABwgFAAAAAAdkBIAAAAAHaAUAAAAAB2wFAAAAAAYcCAQAAAAGIAgEAAAABiQIBAAAAARy-AQEAAAABwgFAAAAAAc8BAQAAAAHRAQEAAAAB2gFAAAAAAdsBQAAAAAHoAQIAAAAB6QEBAAAAAeoBQAAAAAHrAUAAAAAB7QEAAADtAQLuARAAAAAB7wEgAAAAAfABAQAAAAHxAQIAAAAB8gECAAAAAfMBAQAAAAH0AQEAAAAB9QEBAAAAAfYBAQAAAAH3AUAAAAAB-AFAAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAfwBAQAAAAH9AQEAAAAB_gEBAAAAAQ2-AQEAAAABwgFAAAAAAdkBIAAAAAHaAUAAAAAB2wFAAAAAAYcCAQAAAAGIAgEAAAABjgIBAAAAAZACAAAAkAICkQJAAAAAAZICAQAAAAGTAgEAAAABlAJAAAAAARUEAACMBQAgBwAAjQUAIA0AAJAFACAQAACOBQAgEQAAjwUAIL4BAQAAAAHCAUAAAAAB2QEgAAAAAdsBQAAAAAGHAgEAAAABiAIBAAAAAYkCAQAAAAGKAgEAAAABiwKAAAAAAYwCAQAAAAGVAgEAAAABlgICAAAAAZcCAQAAAAGYAgEAAAABmQJAAAAAAZoCQAAAAAECAAAAAQAgHwAAqAUAIAi-AQEAAAABwgFAAAAAAdABAQAAAAHdAQEAAAAB3gEBAAAAAd8BAQAAAAHgAYAAAAAB4QGAAAAAAQMAAABAACAfAACoBQAgIAAArQUAIBcAAABAACAEAADHBAAgBwAAyAQAIA0AAMsEACAQAADJBAAgEQAAygQAIBgAAK0FACC-AQEAhgMAIcIBQACIAwAh2QEgAJYDACHbAUAAiAMAIYcCAQCGAwAhiAIBAIcDACGJAgEAhwMAIYoCAQCHAwAhiwKAAAAAAYwCAQCHAwAhlQIBAIcDACGWAgIAswMAIZcCAQCGAwAhmAIBAIYDACGZAkAAlQMAIZoCQACVAwAhFQQAAMcEACAHAADIBAAgDQAAywQAIBAAAMkEACARAADKBAAgvgEBAIYDACHCAUAAiAMAIdkBIACWAwAh2wFAAIgDACGHAgEAhgMAIYgCAQCHAwAhiQIBAIcDACGKAgEAhwMAIYsCgAAAAAGMAgEAhwMAIZUCAQCHAwAhlgICALMDACGXAgEAhgMAIZgCAQCGAwAhmQJAAJUDACGaAkAAlQMAIRUEAACMBQAgBwAAjQUAIA0AAJAFACAQAACOBQAgEgAAkQUAIL4BAQAAAAHCAUAAAAAB2QEgAAAAAdsBQAAAAAGHAgEAAAABiAIBAAAAAYkCAQAAAAGKAgEAAAABiwKAAAAAAYwCAQAAAAGVAgEAAAABlgICAAAAAZcCAQAAAAGYAgEAAAABmQJAAAAAAZoCQAAAAAECAAAAAQAgHwAArgUAIBy-AQEAAAABwgFAAAAAAc8BAQAAAAHQAQEAAAAB0QEBAAAAAdoBQAAAAAHbAUAAAAAB6AECAAAAAekBAQAAAAHqAUAAAAAB6wFAAAAAAe0BAAAA7QEC7gEQAAAAAe8BIAAAAAHxAQIAAAAB8gECAAAAAfMBAQAAAAH0AQEAAAAB9QEBAAAAAfYBAQAAAAH3AUAAAAAB-AFAAAAAAfkBAQAAAAH6AQEAAAAB-wEBAAAAAfwBAQAAAAH9AQEAAAAB_gEBAAAAAQMAAABAACAfAACuBQAgIAAAswUAIBcAAABAACAEAADHBAAgBwAAyAQAIA0AAMsEACAQAADJBAAgEgAAzAQAIBgAALMFACC-AQEAhgMAIcIBQACIAwAh2QEgAJYDACHbAUAAiAMAIYcCAQCGAwAhiAIBAIcDACGJAgEAhwMAIYoCAQCHAwAhiwKAAAAAAYwCAQCHAwAhlQIBAIcDACGWAgIAswMAIZcCAQCGAwAhmAIBAIYDACGZAkAAlQMAIZoCQACVAwAhFQQAAMcEACAHAADIBAAgDQAAywQAIBAAAMkEACASAADMBAAgvgEBAIYDACHCAUAAiAMAIdkBIACWAwAh2wFAAIgDACGHAgEAhgMAIYgCAQCHAwAhiQIBAIcDACGKAgEAhwMAIYsCgAAAAAGMAgEAhwMAIZUCAQCHAwAhlgICALMDACGXAgEAhgMAIZgCAQCGAwAhmQJAAJUDACGaAkAAlQMAIRUEAACMBQAgBwAAjQUAIA0AAJAFACARAACPBQAgEgAAkQUAIL4BAQAAAAHCAUAAAAAB2QEgAAAAAdsBQAAAAAGHAgEAAAABiAIBAAAAAYkCAQAAAAGKAgEAAAABiwKAAAAAAYwCAQAAAAGVAgEAAAABlgICAAAAAZcCAQAAAAGYAgEAAAABmQJAAAAAAZoCQAAAAAECAAAAAQAgHwAAtAUAIA6-AQEAAAABwgFAAAAAAc8BAQAAAAHQAQEAAAAB2gFAAAAAAdsBQAAAAAHtAQAAAIUCAu4BEAAAAAGAAgAAAIACAoECQAAAAAGCAkAAAAABgwJAAAAAAYUCAgAAAAGGAkAAAAABDr4BAQAAAAHCAUAAAAABzwEBAAAAAdABAQAAAAHSAQEAAAAB0wEBAAAAAdQBAQAAAAHVAQEAAAAB1gEBAAAAAdcBAQAAAAHYAUAAAAAB2QEgAAAAAdoBQAAAAAHbAUAAAAABHL4BAQAAAAHCAUAAAAABzwEBAAAAAdABAQAAAAHaAUAAAAAB2wFAAAAAAegBAgAAAAHpAQEAAAAB6gFAAAAAAesBQAAAAAHtAQAAAO0BAu4BEAAAAAHvASAAAAAB8AEBAAAAAfEBAgAAAAHyAQIAAAAB8wEBAAAAAfQBAQAAAAH1AQEAAAAB9gEBAAAAAfcBQAAAAAH4AUAAAAAB-QEBAAAAAfoBAQAAAAH7AQEAAAAB_AEBAAAAAf0BAQAAAAH-AQEAAAABAwAAAEAAIB8AALQFACAgAAC7BQAgFwAAAEAAIAQAAMcEACAHAADIBAAgDQAAywQAIBEAAMoEACASAADMBAAgGAAAuwUAIL4BAQCGAwAhwgFAAIgDACHZASAAlgMAIdsBQACIAwAhhwIBAIYDACGIAgEAhwMAIYkCAQCHAwAhigIBAIcDACGLAoAAAAABjAIBAIcDACGVAgEAhwMAIZYCAgCzAwAhlwIBAIYDACGYAgEAhgMAIZkCQACVAwAhmgJAAJUDACEVBAAAxwQAIAcAAMgEACANAADLBAAgEQAAygQAIBIAAMwEACC-AQEAhgMAIcIBQACIAwAh2QEgAJYDACHbAUAAiAMAIYcCAQCGAwAhiAIBAIcDACGJAgEAhwMAIYoCAQCHAwAhiwKAAAAAAYwCAQCHAwAhlQIBAIcDACGWAgIAswMAIZcCAQCGAwAhmAIBAIYDACGZAkAAlQMAIZoCQACVAwAhEQMAAJsEACAJAACcBAAgDQAAnQQAIL4BAQAAAAHCAUAAAAABzwEBAAAAAdABAQAAAAHZASAAAAAB2gFAAAAAAdsBQAAAAAGHAgEAAAABiAIBAAAAAYkCAQAAAAGKAgEAAAABiwKAAAAAAYwCAQAAAAGNAgEAAAABAgAAADAAIB8AALwFACAVBAAAjAUAIA0AAJAFACAQAACOBQAgEQAAjwUAIBIAAJEFACC-AQEAAAABwgFAAAAAAdkBIAAAAAHbAUAAAAABhwIBAAAAAYgCAQAAAAGJAgEAAAABigIBAAAAAYsCgAAAAAGMAgEAAAABlQIBAAAAAZYCAgAAAAGXAgEAAAABmAIBAAAAAZkCQAAAAAGaAkAAAAABAgAAAAEAIB8AAL4FACAcvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdEBAQAAAAHaAUAAAAAB2wFAAAAAAegBAgAAAAHqAUAAAAAB6wFAAAAAAe0BAAAA7QEC7gEQAAAAAe8BIAAAAAHwAQEAAAAB8QECAAAAAfIBAgAAAAHzAQEAAAAB9AEBAAAAAfUBAQAAAAH2AQEAAAAB9wFAAAAAAfgBQAAAAAH5AQEAAAAB-gEBAAAAAfsBAQAAAAH8AQEAAAAB_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-gEBAAAAAfsBAQAAAAH8AQEAAAAB_QEBAAAAAf4BAQAAAAECAAAAIgAgHwAA7QUAIBAIAAClAwAgvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdEBAQAAAAHSAQEAAAAB0wEBAAAAAdQBAQAAAAHVAQEAAAAB1gEBAAAAAdcBAQAAAAHYAUAAAAAB2QEgAAAAAdoBQAAAAAHbAUAAAAABAgAAABIAIB8AAO8FACADAAAAIAAgHwAA7QUAICAAAPMFACAkAAAAIAAgAwAAuQMAIAgAALsDACALAAC4AwAgDAAAugMAIA4AALwDACAYAADzBQAgvgEBAIYDACHCAUAAiAMAIc8BAQCHAwAh0AEBAIYDACHRAQEAhgMAIdoBQACVAwAh2wFAAIgDACHoAQIAswMAIekBAQCHAwAh6gFAAIgDACHrAUAAlQMAIe0BAAC0A-0BIu4BEAC1AwAh7wEgAJYDACHwAQEAhwMAIfEBAgC2AwAh8gECALYDACHzAQEAhwMAIfQBAQCHAwAh9QEBAIcDACH2AQEAhwMAIfcBQACVAwAh-AFAAJUDACH5AQEAhwMAIfoBAQCHAwAh-wEBAIcDACH8AQEAhwMAIf0BAQCHAwAh_gEBAIcDACEiAwAAuQMAIAgAALsDACALAAC4AwAgDAAAugMAIA4AALwDACC-AQEAhgMAIcIBQACIAwAhzwEBAIcDACHQAQEAhgMAIdEBAQCGAwAh2gFAAJUDACHbAUAAiAMAIegBAgCzAwAh6QEBAIcDACHqAUAAiAMAIesBQACVAwAh7QEAALQD7QEi7gEQALUDACHvASAAlgMAIfABAQCHAwAh8QECALYDACHyAQIAtgMAIfMBAQCHAwAh9AEBAIcDACH1AQEAhwMAIfYBAQCHAwAh9wFAAJUDACH4AUAAlQMAIfkBAQCHAwAh-gEBAIcDACH7AQEAhwMAIfwBAQCHAwAh_QEBAIcDACH-AQEAhwMAIQMAAAAQACAfAADvBQAgIAAA9gUAIBIAAAAQACAIAACXAwAgGAAA9gUAIL4BAQCGAwAhwgFAAIgDACHPAQEAhwMAIdABAQCGAwAh0QEBAIYDACHSAQEAhgMAIdMBAQCHAwAh1AEBAIcDACHVAQEAhwMAIdYBAQCHAwAh1wEBAIcDACHYAUAAlQMAIdkBIACWAwAh2gFAAJUDACHbAUAAiAMAIRAIAACXAwAgvgEBAIYDACHCAUAAiAMAIc8BAQCHAwAh0AEBAIYDACHRAQEAhgMAIdIBAQCGAwAh0wEBAIcDACHUAQEAhwMAIdUBAQCHAwAh1gEBAIcDACHXAQEAhwMAIdgBQACVAwAh2QEgAJYDACHaAUAAlQMAIdsBQACIAwAhIgMAANQDACAIAADWAwAgCQAA0gMAIAwAANUDACAOAADXAwAgvgEBAAAAAcIBQAAAAAHPAQEAAAAB0AEBAAAAAdEBAQAAAAHaAUAAAAAB2wFAAAAAAegBAgAAAAHpAQEAAAAB6gFAAAAAAesBQAAAAAHtAQAAAO0BAu4BEAAAAAHvASAAAAAB8AEBAAAAAfEBAgAAAAHyAQIAAAAB8wEBAAAAAfQBAQAAAAH1AQEAAAAB9gEBAAAAAfcBQAAAAAH4AUAAAAAB-QEBAAAAAfoBAQAAAAH7AQEAAAAB_AEBAAAAAf0BAQAAAAH-AQEAAAABAgAAACIAIB8AAPcFACADAAAAIAAgHwAA9wUAICAAAPsFACAkAAAAIAAgAwAAuQMAIAgAALsDACAJAAC3AwAgDAAAugMAIA4AALwDACAYAAD7BQAgvgEBAIYDACHCAUAAiAMAIc8BAQCHAwAh0AEBAIYDACHRAQEAhgMAIdoBQACVAwAh2wFAAIgDACHoAQIAswMAIekBAQCHAwAh6gFAAIgDACHrAUAAlQMAIe0BAAC0A-0BIu4BEAC1AwAh7wEgAJYDACHwAQEAhwMAIfEBAgC2AwAh8gECALYDACHzAQEAhwMAIfQBAQCHAwAh9QEBAIcDACH2AQEAhwMAIfcBQACVAwAh-AFAAJUDACH5AQEAhwMAIfoBAQCHAwAh-wEBAIcDACH8AQEAhwMAIf0BAQCHAwAh_gEBAIcDACEiAwAAuQMAIAgAALsDACAJAAC3AwAgDAAAugMAIA4AALwDACC-AQEAhgMAIcIBQACIAwAhzwEBAIcDACHQAQEAhgMAIdEBAQCGAwAh2gFAAJUDACHbAUAAiAMAIegBAgCzAwAh6QEBAIcDACHqAUAAiAMAIesBQACVAwAh7QEAALQD7QEi7gEQALUDACHvASAAlgMAIfABAQCHAwAh8QECALYDACHyAQIAtgMAIfMBAQCHAwAh9AEBAIcDACH1AQEAhwMAIfYBAQCHAwAh9wFAAJUDACH4AUAAlQMAIfkBAQCHAwAh-gEBAIcDACH7AQEAhwMAIfwBAQCHAwAh_QEBAIcDACH-AQEAhwMAIQcEBgIFABEHDgUNNQkQMQYRNAsSOAMCAwABBggDAwMAAQQJAgUABAEECgAEAwABBQAQCAAGDSwJBQMAAQUADwcPBQkTBw0oCQMFAA4IAAYPFwgCCQAHCgAJBwMAAQUADQgABgkYCAscCgwdBQ4fCwEKAAkDAwABBQAMDSMJAQ0kAAIJJQALJgABDycAAwcpAAkqAA0rAAENLQAGBDkABzoADT0AEDsAETwAEj4AAAAABQUAFiUAFyYAGCcAGSgAGgAAAAAABQUAFiUAFyYAGCcAGSgAGgEDAAEBAwABAwUAHycAICgAIQAAAAMFAB8nACAoACEBAwABAQMAAQMFACYnACcoACgAAAADBQAmJwAnKAAoAQMAAQEDAAEDBQAtJwAuKAAvAAAAAwUALScALigALwIDAAEIAAYCAwABCAAGBQUANCUANSYANicANygAOAAAAAAABQUANCUANSYANicANygAOAQDAAEIAAYMuAEFDrkBCwQDAAEIAAYMvwEFDsABCwUFAD0lAD4mAD8nAEAoAEEAAAAAAAUFAD0lAD4mAD8nAEAoAEECAwABBtIBAwIDAAEG2AEDAwUARicARygASAAAAAMFAEYnAEcoAEgBCAAGAQgABgMFAE0nAE4oAE8AAAADBQBNJwBOKABPAgkABwoACQIJAAcKAAkDBQBUJwBVKABWAAAAAwUAVCcAVSgAVgEKAAkBCgAJAwUAWycAXCgAXQAAAAMFAFsnAFwoAF0TAgEUPwEVQgEWQwEXRAEZRgEaSBIbSRMcSwEdTRIeThQhTwEiUAEjURIpVBUqVRsrVgMsVwMtWAMuWQMvWgMwXAMxXhIyXxwzYQM0YxI1ZB02ZQM3ZgM4ZxI5ah46ayI7bAs8bQs9bgs-bws_cAtAcgtBdBJCdSNDdwtEeRJFeiRGewtHfAtIfRJJgAElSoEBKUuCAQZMgwEGTYQBBk6FAQZPhgEGUIgBBlGKARJSiwEqU40BBlSPARJVkAErVpEBBleSAQZYkwESWZYBLFqXATBbmAEFXJkBBV2aAQVemwEFX5wBBWCeAQVhoAESYqEBMWOjAQVkpQESZaYBMmanAQVnqAEFaKkBEmmsATNqrQE5a64BCWyvAQltsAEJbrEBCW-yAQlwtAEJcbYBEnK3ATpzuwEJdL0BEnW-ATt2wQEJd8IBCXjDARJ5xgE8escBQnvIAQJ8yQECfcoBAn7LAQJ_zAECgAHOAQKBAdABEoIB0QFDgwHUAQKEAdYBEoUB1wFEhgHZAQKHAdoBAogB2wESiQHeAUWKAd8BSYsB4AEHjAHhAQeNAeIBB44B4wEHjwHkAQeQAeYBB5EB6AESkgHpAUqTAesBB5QB7QESlQHuAUuWAe8BB5cB8AEHmAHxARKZAfQBTJoB9QFQmwH2AQicAfcBCJ0B-AEIngH5AQifAfoBCKAB_AEIoQH-ARKiAf8BUaMBgQIIpAGDAhKlAYQCUqYBhQIIpwGGAgioAYcCEqkBigJTqgGLAlerAYwCCqwBjQIKrQGOAgquAY8CCq8BkAIKsAGSAgqxAZQCErIBlQJYswGXAgq0AZkCErUBmgJZtgGbAgq3AZwCCrgBnQISuQGgAlq6AaECXg"
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
var runtime2 = __toESM(require("@prisma/client/runtime/client"), 1);
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
var import_meta = {};
globalThis["__dirname"] = path.dirname((0, import_node_url.fileURLToPath)(import_meta.url));
var PrismaClient = getPrismaClientClass();

// src/config/prisma.ts
var adapter = new import_adapter_pg.PrismaPg({ connectionString: env.DATABASE_URL });
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
var import_bcrypt2 = __toESM(require("bcrypt"), 1);

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
var import_node_crypto = __toESM(require("crypto"), 1);
var import_bcrypt = __toESM(require("bcrypt"), 1);
function generateToken() {
  return import_node_crypto.default.randomUUID();
}
async function hashToken(token) {
  return import_bcrypt.default.hash(token, 10);
}
async function compareToken(token, hash) {
  return import_bcrypt.default.compare(token, hash);
}

// src/integrations/email/email.service.ts
var import_resend = require("resend");
var resendClient = null;
function getClient() {
  if (!env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new import_resend.Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}
async function sendForgotPasswordEmail(email, token) {
  const client = getClient();
  const resetLink = `${env.FRONTEND_URL}/reset-password/${token}`;
  if (!client) {
    console.log(`[EMAIL] Resend n\xE3o configurado. Link para ${email}: ${resetLink}`);
    return;
  }
  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "Redefini\xE7\xE3o de senha \u2014 Ciclus",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #185FA5;">Redefini\xE7\xE3o de senha</h2>
        <p>Voc\xEA solicitou a redefini\xE7\xE3o da sua senha no Ciclus.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #185FA5; color: #fff; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Redefinir senha
        </a>
        <p style="color: #666; font-size: 14px;">Este link expira em 1 hora.</p>
        <p style="color: #666; font-size: 14px;">Se voc\xEA n\xE3o solicitou esta redefini\xE7\xE3o, ignore este email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Ciclus \u2014 Gest\xE3o de Servi\xE7os Recorrentes</p>
      </div>
    `
  });
  if (error) {
    console.error(`[EMAIL] Falha ao enviar email para ${email}:`, error);
  }
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
  const passwordMatch = await import_bcrypt2.default.compare(password, user.passwordHash);
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
  const valid = await import_bcrypt2.default.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError("Senha atual incorreta", 400, "INVALID_PASSWORD");
  }
  const newHash = await import_bcrypt2.default.hash(newPassword, 10);
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
  await sendForgotPasswordEmail(email, token);
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
  const newHash = await import_bcrypt2.default.hash(newPassword, 10);
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
var import_zod2 = require("zod");
function validateOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten();
    throw new AppError("Dados inv\xE1lidos", 400, "VALIDATION_ERROR", errors);
  }
  return result.data;
}

// src/modules/auth/dtos/login.dto.ts
var import_zod3 = require("zod");
var PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
var PASSWORD_ERROR = "Senha deve conter no m\xEDnimo 8 caracteres, 1 letra mai\xFAscula, 1 n\xFAmero e 1 caractere especial";
var loginSchema = import_zod3.z.object({
  email: import_zod3.z.string().email("Email inv\xE1lido"),
  password: import_zod3.z.string().min(8, PASSWORD_ERROR).regex(PASSWORD_REGEX, PASSWORD_ERROR)
}).strict();

// src/modules/auth/dtos/change-password.dto.ts
var import_zod4 = require("zod");
var changePasswordSchema = import_zod4.z.object({
  currentPassword: import_zod4.z.string().min(1, "Senha atual \xE9 obrigat\xF3ria"),
  newPassword: import_zod4.z.string().min(6, "Nova senha deve ter no m\xEDnimo 6 caracteres")
}).strict();

// src/modules/auth/dtos/forgot-password.dto.ts
var import_zod5 = require("zod");
var forgotPasswordSchema = import_zod5.z.object({
  email: import_zod5.z.string().email("Email inv\xE1lido")
}).strict();

// src/modules/auth/dtos/reset-password.dto.ts
var import_zod6 = require("zod");
var resetPasswordSchema = import_zod6.z.object({
  token: import_zod6.z.string().min(1, "Token \xE9 obrigat\xF3rio"),
  newPassword: import_zod6.z.string().min(6, "Nova senha deve ter no m\xEDnimo 6 caracteres")
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
  return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
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
var import_zod7 = require("zod");
var updateCompanySchema = import_zod7.z.object({
  name: import_zod7.z.string().min(2).max(200).optional(),
  fantasyName: import_zod7.z.string().max(200).nullable().optional(),
  email: import_zod7.z.string().email().nullable().optional(),
  phone: import_zod7.z.string().nullable().optional(),
  niche: import_zod7.z.string().optional(),
  address: import_zod7.z.any().optional()
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
var import_bcrypt3 = __toESM(require("bcrypt"), 1);

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
  const passwordHash = await import_bcrypt3.default.hash(data.password, 10);
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
var import_zod8 = require("zod");
var createUserSchema = import_zod8.z.object({
  name: import_zod8.z.string().min(2, "Nome deve ter no m\xEDnimo 2 caracteres").max(200),
  email: import_zod8.z.string().email("Email inv\xE1lido"),
  role: import_zod8.z.enum(["ADMIN", "TECHNICIAN"]),
  password: import_zod8.z.string().min(6, "Senha deve ter no m\xEDnimo 6 caracteres")
}).strict();

// src/modules/users/dtos/update-user.dto.ts
var import_zod9 = require("zod");
var updateUserSchema = import_zod9.z.object({
  name: import_zod9.z.string().min(2).max(200).optional(),
  role: import_zod9.z.enum(["ADMIN", "TECHNICIAN", "OWNER"]).optional()
}).strict();

// src/modules/users/dtos/user-filters.dto.ts
var import_zod10 = require("zod");
var userFiltersSchema = import_zod10.z.object({
  page: import_zod10.z.coerce.number().int().positive().optional(),
  pageSize: import_zod10.z.coerce.number().int().min(1).max(100).optional(),
  role: import_zod10.z.enum(["OWNER", "ADMIN", "TECHNICIAN"]).optional(),
  isActive: import_zod10.z.enum(["true", "false"]).optional()
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
async function getAvailability(companyId, employeeId, date, _duration) {
  const targetDate = date ? new Date(date) : /* @__PURE__ */ new Date();
  if (isNaN(targetDate.getTime())) {
    throw new AppError("Data inv\xE1lida", 400, "INVALID_DATE");
  }
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);
  const services = await prisma.service.findMany({
    where: {
      companyId,
      employeeId,
      deletedAt: null,
      status: { notIn: ["CANCELLED", "CONFIRMED"] },
      scheduledAt: { gte: dayStart, lte: dayEnd }
    },
    include: {
      customer: { select: { name: true } }
    },
    orderBy: { scheduledAt: "asc" }
  });
  return services.map((s) => {
    const duration = s.estimatedDurationMinutes ?? s.durationMinutes ?? 60;
    const start3 = s.scheduledAt;
    const end = new Date(start3.getTime() + duration * 6e4);
    return {
      start: start3.toISOString(),
      end: end.toISOString(),
      serviceId: s.id,
      serviceNumber: s.serviceNumber,
      customerName: s.customer.name
    };
  });
}

// src/modules/employees/dtos/create-employee.dto.ts
var import_zod11 = require("zod");
var createEmployeeSchema = import_zod11.z.object({
  name: import_zod11.z.string().min(2, "Nome deve ter no m\xEDnimo 2 caracteres").max(200),
  email: import_zod11.z.string().email().optional().or(import_zod11.z.literal("")),
  phone: import_zod11.z.string().optional()
}).strict();

// src/modules/employees/dtos/update-employee.dto.ts
var import_zod12 = require("zod");
var updateEmployeeSchema = import_zod12.z.object({
  name: import_zod12.z.string().min(2).max(200).optional(),
  email: import_zod12.z.string().email().optional().or(import_zod12.z.literal("")),
  phone: import_zod12.z.string().optional()
}).strict();

// src/modules/employees/dtos/employee-filters.dto.ts
var import_zod13 = require("zod");
var employeeFiltersSchema = import_zod13.z.object({
  page: import_zod13.z.coerce.number().int().positive().optional(),
  pageSize: import_zod13.z.coerce.number().int().min(1).max(100).optional(),
  isActive: import_zod13.z.enum(["true", "false"]).optional()
}).strict();

// src/modules/employees/dtos/employee-services-filters.dto.ts
var import_zod14 = require("zod");
var employeeServicesFiltersSchema = import_zod14.z.object({
  page: import_zod14.z.string().optional(),
  pageSize: import_zod14.z.string().optional(),
  dateStart: import_zod14.z.string().optional(),
  dateEnd: import_zod14.z.string().optional(),
  status: import_zod14.z.string().optional()
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
async function getAvailability2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const { date, duration } = request.query;
  const result = await getAvailability(
    user.companyId,
    id,
    date,
    duration ? parseInt(duration, 10) : void 0
  );
  return reply.status(200).send({ data: result });
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
  app2.get(
    "/:id/availability",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getAvailability2
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
  const email = c.email ?? null;
  if (role === "TECHNICIAN") {
    return {
      ...base,
      document: c.document ? maskDocument(c.document, c.documentType || "CNPJ") : null,
      email,
      address: null
    };
  }
  return {
    ...base,
    document: c.document ? maskDocument(c.document, c.documentType || "CNPJ") : null,
    email,
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
var import_zod15 = require("zod");
var createCustomerSchema = import_zod15.z.object({
  name: import_zod15.z.string().min(2, "Nome deve ter no m\xEDnimo 2 caracteres").max(200),
  fantasyName: import_zod15.z.string().max(200).optional(),
  documentType: import_zod15.z.enum(["CPF", "CNPJ"]),
  document: import_zod15.z.string().min(11).max(18),
  email: import_zod15.z.string().email("Email inv\xE1lido").optional().or(import_zod15.z.literal("")),
  phone: import_zod15.z.string().optional(),
  address: import_zod15.z.object({
    zipCode: import_zod15.z.string().optional(),
    street: import_zod15.z.string().optional(),
    number: import_zod15.z.string().optional(),
    complement: import_zod15.z.string().optional(),
    neighborhood: import_zod15.z.string().optional(),
    city: import_zod15.z.string().optional(),
    state: import_zod15.z.string().length(2).optional()
  }).optional(),
  notes: import_zod15.z.string().max(500).optional()
}).strict();

// src/modules/customers/dtos/update-customer.dto.ts
var import_zod16 = require("zod");
var updateCustomerSchema = import_zod16.z.object({
  name: import_zod16.z.string().min(2).max(200).optional(),
  fantasyName: import_zod16.z.string().max(200).nullable().optional(),
  email: import_zod16.z.string().email().optional().or(import_zod16.z.literal("")),
  phone: import_zod16.z.string().optional(),
  address: import_zod16.z.object({
    zipCode: import_zod16.z.string().optional(),
    street: import_zod16.z.string().optional(),
    number: import_zod16.z.string().optional(),
    complement: import_zod16.z.string().optional(),
    neighborhood: import_zod16.z.string().optional(),
    city: import_zod16.z.string().optional(),
    state: import_zod16.z.string().length(2).optional()
  }).optional(),
  notes: import_zod16.z.string().max(500).nullable().optional()
}).strict();

// src/modules/customers/dtos/customer-filters.dto.ts
var import_zod17 = require("zod");
var customerFiltersSchema = import_zod17.z.object({
  page: import_zod17.z.coerce.number().int().positive().optional(),
  pageSize: import_zod17.z.coerce.number().int().min(1).max(100).optional(),
  isActive: import_zod17.z.enum(["true", "false"]).optional(),
  search: import_zod17.z.string().optional()
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
var import_zod18 = require("zod");
var createEquipmentSchema = import_zod18.z.object({
  type: import_zod18.z.string().min(1, "Tipo \xE9 obrigat\xF3rio"),
  brand: import_zod18.z.string().optional(),
  model: import_zod18.z.string().optional(),
  capacity: import_zod18.z.string().optional(),
  serialNumber: import_zod18.z.string().optional(),
  location: import_zod18.z.string().optional(),
  installedAt: import_zod18.z.string().optional(),
  notes: import_zod18.z.string().max(500).optional()
}).strict();

// src/modules/equipment/dtos/update-equipment.dto.ts
var import_zod19 = require("zod");
var updateEquipmentSchema = import_zod19.z.object({
  type: import_zod19.z.string().optional(),
  brand: import_zod19.z.string().optional(),
  model: import_zod19.z.string().optional(),
  capacity: import_zod19.z.string().optional(),
  serialNumber: import_zod19.z.string().optional(),
  location: import_zod19.z.string().optional(),
  installedAt: import_zod19.z.string().optional(),
  notes: import_zod19.z.string().max(500).optional()
}).strict();

// src/modules/equipment/dtos/equipment-filters.dto.ts
var import_zod20 = require("zod");
var equipmentFiltersSchema = import_zod20.z.object({
  isActive: import_zod20.z.enum(["true", "false"]).optional(),
  type: import_zod20.z.string().optional()
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
    const serviceNumber = await getNextServiceNumber(companyId);
    await tx.service.create({
      data: {
        serviceNumber,
        companyId,
        contractId: contract.id,
        customerId: data.customerId,
        serviceType: null,
        scheduledAt: startDate,
        status: "SCHEDULED",
        amount: data.amount,
        employeeId: data.employeeId ?? null,
        estimatedDurationMinutes: 60
      }
    });
    return contract;
  });
  await createAuditLog({
    companyId,
    userId,
    entityType: "Contract",
    entityId: result.id,
    action: "CREATE",
    newData: { customerId: result.customerId, frequency: result.frequency, amount: result.amount.toString() }
  });
  const { customer: _, ...rest } = result;
  return {
    ...rest,
    customerName: "",
    nextVisitDate: rest.nextServiceDate ?? null,
    value: Number(rest.amount)
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
var import_zod21 = require("zod");
var contractFrequencySchema = import_zod21.z.enum(["MONTHLY", "BIMONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"]);
var createContractSchema = import_zod21.z.object({
  customerId: import_zod21.z.string().uuid("Cliente inv\xE1lido"),
  frequency: contractFrequencySchema,
  startDate: import_zod21.z.string().min(1, "Data de in\xEDcio \xE9 obrigat\xF3ria"),
  endDate: import_zod21.z.string().min(1, "Data de t\xE9rmino \xE9 obrigat\xF3ria"),
  amount: import_zod21.z.number().positive("Valor deve ser positivo"),
  employeeId: import_zod21.z.string().uuid().optional(),
  notes: import_zod21.z.string().max(500).optional()
}).strict();

// src/modules/contracts/dtos/update-contract.dto.ts
var import_zod22 = require("zod");
var updateContractSchema = import_zod22.z.object({
  frequency: contractFrequencySchema.optional(),
  startDate: import_zod22.z.string().optional(),
  endDate: import_zod22.z.string().optional(),
  amount: import_zod22.z.number().positive().optional(),
  employeeId: import_zod22.z.string().uuid().nullable().optional(),
  notes: import_zod22.z.string().max(500).nullable().optional(),
  status: import_zod22.z.enum(["ACTIVE", "ABOUT_TO_EXPIRE", "EXPIRED", "CANCELLED"]).optional()
}).strict();

// src/modules/contracts/dtos/cancel-contract.dto.ts
var import_zod23 = require("zod");
var cancelContractSchema = import_zod23.z.object({
  reason: import_zod23.z.string().min(1, "Motivo do cancelamento \xE9 obrigat\xF3rio").max(500)
}).strict();

// src/modules/contracts/dtos/contract-filters.dto.ts
var import_zod24 = require("zod");
var contractFiltersSchema = import_zod24.z.object({
  page: import_zod24.z.coerce.number().int().positive().optional(),
  pageSize: import_zod24.z.coerce.number().int().min(1).max(100).optional(),
  status: import_zod24.z.enum(["ACTIVE", "ABOUT_TO_EXPIRE", "EXPIRED", "CANCELLED"]).optional(),
  customerId: import_zod24.z.string().uuid().optional(),
  frequency: import_zod24.z.enum(["MONTHLY", "BIMONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"]).optional(),
  dateStart: import_zod24.z.string().optional(),
  dateEnd: import_zod24.z.string().optional()
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

// src/integrations/pdf/pdf.service.ts
var import_pdfkit = __toESM(require("pdfkit"), 1);

// src/integrations/storage/storage.service.ts
var import_supabase_js = require("@supabase/supabase-js");
function validateImageMime(buffer) {
  if (buffer.length < 4) return null;
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return "jpeg";
  if (buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71) return "png";
  if (buffer[0] === 82 && buffer[1] === 73 && buffer[2] === 70 && buffer[3] === 70) return "webp";
  return null;
}
function createClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return (0, import_supabase_js.createClient)(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}
async function uploadFile(bucket, path3, buffer, mimeType) {
  const client = createClient();
  if (!client) {
    throw new AppError("Storage n\xE3o configurado", 500, "STORAGE_NOT_CONFIGURED");
  }
  const ext = validateImageMime(buffer);
  if (ext) {
    mimeType = ext === "jpeg" ? "image/jpeg" : ext === "png" ? "image/png" : "image/webp";
  }
  const { data, error } = await client.storage.from(bucket).upload(path3, buffer, {
    contentType: mimeType,
    upsert: true
  });
  if (error) {
    throw new AppError(`Erro no upload: ${error.message}`, 500, "STORAGE_UPLOAD_ERROR");
  }
  const { data: urlData } = client.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

// src/integrations/pdf/templates/service-report.ts
var REPORT_CONFIG_BY_NICHE = {
  AIR_CONDITIONING: {
    title: "Relat\xF3rio de Manuten\xE7\xE3o \u2014 PMOC",
    equipmentLabel: "Equipamentos Atendidos",
    showEquipmentTable: true,
    regulatoryFooter: "Documento elaborado em conformidade com a Portaria GM/MS n\xBA 3.523/1998, que institui o Plano de Manuten\xE7\xE3o, Opera\xE7\xE3o e Controle (PMOC) de sistemas de climatiza\xE7\xE3o."
  },
  PEST_CONTROL: {
    title: "Certificado de Dedetiza\xE7\xE3o",
    equipmentLabel: "\xC1reas Tratadas",
    showEquipmentTable: false,
    regulatoryFooter: "Produtos utilizados registrados na ANVISA conforme legisla\xE7\xE3o vigente. Procedimento realizado conforme RDC n\xBA 52/2009."
  },
  WATER_TANK: {
    title: "Certificado de Limpeza de Caixa d'\xC1gua",
    equipmentLabel: "Reservat\xF3rios Atendidos",
    showEquipmentTable: true,
    regulatoryFooter: "Procedimento realizado conforme Portaria de Consolida\xE7\xE3o n\xBA 5/2017 (Anexo XX), que disp\xF5e sobre o controle de qualidade da \xE1gua para consumo humano."
  },
  BUILDING_MAINTENANCE: {
    title: "Relat\xF3rio de Manuten\xE7\xE3o Predial",
    equipmentLabel: "Itens Atendidos",
    showEquipmentTable: true
  },
  ELEVATOR: {
    title: "Relat\xF3rio de Manuten\xE7\xE3o de Elevadores",
    equipmentLabel: "Equipamentos Atendidos",
    showEquipmentTable: true,
    regulatoryFooter: "Manuten\xE7\xE3o realizada em conformidade com a NBR 16083 (inspe\xE7\xE3o predial) e normas t\xE9cnicas vigentes para equipamentos de transporte vertical."
  },
  GENERAL: {
    title: "Ordem de Servi\xE7o",
    equipmentLabel: "Itens Atendidos",
    showEquipmentTable: true
  }
};
function getReportConfig(niche) {
  if (!niche) return REPORT_CONFIG_BY_NICHE.GENERAL;
  return REPORT_CONFIG_BY_NICHE[niche] ?? REPORT_CONFIG_BY_NICHE.GENERAL;
}
function renderServiceReport(doc, serviceId, data) {
  const config2 = getReportConfig(data.companyNiche);
  const regularFont = "Helvetica";
  const boldFont = "Helvetica-Bold";
  doc.fontSize(10).font(regularFont);
  const pageWidth = doc.page?.width ? doc.page.width - 100 : 400;
  const drawLine = () => {
    const y = doc.y;
    doc.moveTo(50, y).lineTo(pageWidth + 50, y).stroke();
    doc.moveDown(0.5);
  };
  doc.fontSize(20).font(boldFont).text(data.companyName, { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(16).font(boldFont).text(config2.title, { align: "center" });
  doc.fontSize(11).font(regularFont).text(`OS N\xBA ${data.serviceNumber}`, { align: "center" });
  doc.moveDown(1);
  drawLine();
  doc.fontSize(12).font(boldFont).text("Dados do Servi\xE7o");
  doc.moveDown(0.3);
  doc.fontSize(10).font(regularFont);
  doc.text(`Tipo: ${data.serviceType || "\u2014"}`);
  doc.text(`Data agendada: ${data.scheduledAt.toLocaleDateString("pt-BR")}`);
  doc.text(
    `Data de execu\xE7\xE3o: ${data.completedDate ? data.completedDate.toLocaleDateString("pt-BR") : "\u2014"}`
  );
  doc.text(
    `Dura\xE7\xE3o: ${data.durationMinutes ? `${data.durationMinutes} min` : "\u2014"}`
  );
  doc.text(`T\xE9cnico: ${data.technicianName || "\u2014"}`);
  doc.moveDown(1);
  drawLine();
  doc.fontSize(12).font(boldFont).text("Dados do Cliente");
  doc.moveDown(0.3);
  doc.fontSize(10).font(regularFont);
  doc.text(`Nome: ${data.customerName}`);
  if (data.customerAddress) {
    const addr = data.customerAddress;
    doc.text(
      `Endere\xE7o: ${addr.street || ""}, ${addr.number || ""}${addr.neighborhood ? ` - ${addr.neighborhood}` : ""}${addr.city ? ` - ${addr.city}` : ""}${addr.state ? `/${addr.state}` : ""}`
    );
  }
  doc.moveDown(1);
  drawLine();
  if (data.equipment.length > 0 && config2.showEquipmentTable) {
    doc.fontSize(12).font(boldFont).text(config2.equipmentLabel);
    doc.moveDown(0.3);
    doc.fontSize(10).font(regularFont);
    for (const eq of data.equipment) {
      const brandModel = [eq.brand, eq.model].filter(Boolean).join(" / ");
      doc.text(`Tipo: ${eq.type}`);
      doc.text(`Marca/Modelo: ${brandModel || "\u2014"}`);
      doc.text(`Localiza\xE7\xE3o: ${eq.location || "\u2014"}`);
      if (eq.notes) doc.text(`Observa\xE7\xF5es: ${eq.notes}`);
      doc.moveDown(0.3);
    }
  } else if (data.equipment.length > 0 && !config2.showEquipmentTable) {
    doc.fontSize(12).font(boldFont).text(config2.equipmentLabel);
    doc.moveDown(0.3);
    doc.fontSize(10).font(regularFont);
    const locations = data.equipment.map((eq) => eq.location || eq.type).join(", ");
    doc.text(locations);
  }
  if (data.executionNotes) {
    doc.moveDown(1);
    drawLine();
    doc.fontSize(12).font(boldFont).text("Observa\xE7\xF5es do T\xE9cnico");
    doc.moveDown(0.3);
    doc.fontSize(10).font(regularFont).text(data.executionNotes);
  }
  doc.moveDown(1);
  drawLine();
  doc.fontSize(12).font(boldFont).text("Assinatura Digital");
  doc.moveDown(0.3);
  doc.fontSize(10).font(regularFont);
  if (data.confirmedAt) {
    doc.text(`Confirmado por: ${data.confirmedName || "\u2014"}`);
    if (data.confirmedDocument) {
      const docLabel = data.confirmedDocumentType === "CNPJ" ? "CNPJ" : "CPF";
      doc.text(`${docLabel}: ${data.confirmedDocument}`);
    }
    doc.text(
      `Data e hora: ${data.confirmedAt.toLocaleDateString("pt-BR")} \xE0s ${data.confirmedAt.toLocaleTimeString("pt-BR")}`
    );
    doc.text(`IP: ${data.confirmedIp || "\u2014"}`);
    if (data.confirmedUserAgent) {
      doc.text(`Dispositivo: ${data.confirmedUserAgent}`);
    }
  } else {
    doc.text("Aguardando confirma\xE7\xE3o do cliente");
  }
  if (config2.regulatoryFooter) {
    doc.moveDown(1);
    drawLine();
    doc.fontSize(8).font(regularFont).fillColor("#444").text(config2.regulatoryFooter, { align: "justify" });
    doc.fillColor("#000");
  }
  doc.moveDown(2);
  doc.fontSize(8).font(regularFont).fillColor("#666");
  doc.text(`Gerado pelo Ciclus em ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")}`, {
    align: "center"
  });
  doc.text(`ID da OS: ${serviceId}`, { align: "center" });
}

// src/integrations/pdf/pdf.service.ts
async function generateServiceReportBuffer(serviceId, data) {
  const doc = new import_pdfkit.default({ margin: 50 });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  return new Promise((resolve, reject) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);
    renderServiceReport(doc, serviceId, data);
    doc.end();
  });
}
async function generateServiceReport(serviceId, data) {
  const doc = new import_pdfkit.default({ margin: 50 });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  return new Promise((resolve, reject) => {
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);
      try {
        const url = await uploadFile(
          env.SUPABASE_STORAGE_BUCKET,
          `companies/${data.companyId}/reports/${serviceId}.pdf`,
          pdfBuffer,
          "application/pdf"
        );
        resolve(url);
      } catch (err) {
        console.error("[generateServiceReport] Upload failed:", err);
        resolve("");
      }
    });
    doc.on("error", reject);
    renderServiceReport(doc, serviceId, data);
    doc.end();
  });
}

// src/modules/services/services.helpers.ts
async function buildServiceReportData(serviceId) {
  const service = await prisma.service.findUniqueOrThrow({
    where: { id: serviceId },
    include: {
      company: { select: { id: true, name: true, niche: true, logoUrl: true } },
      customer: { select: { name: true, address: true } },
      employee: { select: { name: true } },
      equipment: {
        include: {
          equipment: { select: { type: true, brand: true, model: true, location: true } }
        }
      }
    }
  });
  return {
    serviceNumber: service.serviceNumber,
    serviceType: service.serviceType,
    scheduledAt: service.scheduledAt,
    completedDate: service.completedDate,
    durationMinutes: service.durationMinutes,
    status: service.status,
    technicianName: service.employee?.name ?? null,
    companyId: service.company.id,
    companyName: service.company.name,
    companyNiche: service.company.niche,
    companyLogo: service.company.logoUrl,
    customerName: service.customer.name,
    customerAddress: service.customer.address,
    equipment: service.equipment.map((se) => ({
      id: se.equipmentId,
      type: se.equipment.type,
      brand: se.equipment.brand,
      model: se.equipment.model,
      location: se.equipment.location,
      notes: se.notes
    })),
    executionNotes: service.executionNotes,
    confirmedAt: service.confirmedAt,
    confirmedName: service.confirmedName,
    confirmedDocument: service.confirmedDocument,
    confirmedDocumentType: service.confirmedDocumentType,
    confirmedIp: service.confirmedIp,
    confirmedUserAgent: service.confirmedUserAgent
  };
}

// src/modules/services/dtos/create-service.dto.ts
var import_zod25 = require("zod");
var DEFAULT_DURATION_MINUTES = {
  PREVENTIVE_MAINTENANCE: 60,
  CORRECTIVE_MAINTENANCE: 90,
  PMOC: 180,
  INSTALLATION: 120,
  UNINSTALLATION: 60,
  GAS_RECHARGE: 45,
  CLEANING: 90,
  INSPECTION: 30
};
var createServiceSchema = import_zod25.z.object({
  contractId: import_zod25.z.string().uuid().optional(),
  customerId: import_zod25.z.string().uuid("Cliente \xE9 obrigat\xF3rio"),
  serviceType: import_zod25.z.string().min(1, "Tipo de servi\xE7o \xE9 obrigat\xF3rio"),
  scheduledDate: import_zod25.z.string().min(1, "Data agendada \xE9 obrigat\xF3ria"),
  employeeId: import_zod25.z.string().uuid().optional(),
  estimatedDurationMinutes: import_zod25.z.number().int().min(1).optional(),
  equipmentIds: import_zod25.z.array(import_zod25.z.string().uuid()).optional().default([])
}).strict();
function getDefaultDuration(serviceType) {
  return DEFAULT_DURATION_MINUTES[serviceType] ?? 60;
}

// src/modules/services/services.service.ts
var import_node_crypto2 = __toESM(require("crypto"), 1);
var import_promises = __toESM(require("fs/promises"), 1);
var import_node_path = __toESM(require("path"), 1);

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

// src/modules/services/services.service.ts
async function checkScheduleConflict(companyId, employeeId, scheduledAt, estimatedDurationMinutes, excludeServiceId) {
  const dayStart = startOfDay(scheduledAt);
  const dayEnd = endOfDay(scheduledAt);
  const newEnd = new Date(scheduledAt.getTime() + estimatedDurationMinutes * 6e4);
  const where = {
    companyId,
    employeeId,
    deletedAt: null,
    status: { notIn: ["CANCELLED", "CONFIRMED"] },
    scheduledAt: { gte: dayStart, lte: dayEnd }
  };
  if (excludeServiceId) {
    where.id = { not: excludeServiceId };
  }
  const existing = await prisma.service.findMany({
    where,
    select: {
      id: true,
      serviceNumber: true,
      scheduledAt: true,
      estimatedDurationMinutes: true,
      customer: { select: { name: true } }
    }
  });
  const conflicts = [];
  for (const os of existing) {
    const osEnd = new Date(os.scheduledAt.getTime() + (os.estimatedDurationMinutes ?? 60) * 6e4);
    if (scheduledAt < osEnd && newEnd > os.scheduledAt) {
      conflicts.push({
        id: os.id,
        serviceNumber: os.serviceNumber,
        scheduledAt: os.scheduledAt,
        estimatedDurationMinutes: os.estimatedDurationMinutes,
        customerName: os.customer.name
      });
    }
  }
  return conflicts;
}
function formatAddress(address) {
  if (!address) return "";
  const parts = [];
  if (address.street) parts.push(String(address.street));
  if (address.number) parts.push(String(address.number));
  if (address.neighborhood) parts.push(String(address.neighborhood));
  if (address.city) parts.push(String(address.city));
  if (address.state) parts.push(String(address.state));
  return parts.join(", ");
}
function formatServiceResponse(service) {
  const customer = service.customer ?? {};
  const employee = service.employee ?? {};
  const equipmentIds = (service.equipment ?? []).map((se) => se.equipmentId);
  const equipmentDetails = (service.equipment ?? []).map((se) => {
    const eq = se.equipment ?? {};
    return {
      id: eq.id,
      type: eq.type,
      brand: eq.brand,
      model: eq.model,
      location: eq.location,
      capacity: eq.capacity,
      status: eq.status
    };
  });
  const photoUrls = (service.photos ?? []).map((p) => p.url);
  const execution = service.completedDate ? {
    notes: service.executionNotes ?? "",
    photoUrls,
    completedAt: service.completedDate instanceof Date ? service.completedDate.toISOString() : String(service.completedDate)
  } : void 0;
  const confirmationStatus = service.confirmedAt ? "CONFIRMED" : "PENDING";
  const confirmationLink = service.confirmationToken ? `/confirmar/${service.confirmationToken}` : null;
  return {
    id: service.id,
    companyId: service.companyId,
    contractId: service.contractId ?? "",
    customerId: service.customerId,
    customerName: customer.name ?? "",
    customerAddress: formatAddress(customer.address),
    customerPhone: customer.phone ?? null,
    serviceType: service.serviceType ?? "",
    scheduledDate: service.scheduledAt instanceof Date ? service.scheduledAt.toISOString() : String(service.scheduledAt),
    employeeId: service.employeeId ?? null,
    employeeName: employee.name ?? null,
    status: service.status,
    equipmentIds,
    equipmentDetails: equipmentDetails.length > 0 ? equipmentDetails : void 0,
    execution,
    reportPdfUrl: service.reportUrl ?? null,
    confirmationStatus,
    confirmationToken: service.confirmationToken ?? null,
    confirmationLink,
    confirmationExpiresAt: service.confirmationTokenExpiresAt instanceof Date ? service.confirmationTokenExpiresAt.toISOString() : service.confirmationTokenExpiresAt ?? null,
    confirmedAt: service.confirmedAt instanceof Date ? service.confirmedAt.toISOString() : service.confirmedAt ?? null,
    confirmedName: service.confirmedName ?? null,
    confirmedDocument: service.confirmedDocument ?? null,
    confirmedDocumentType: service.confirmedDocumentType ?? null,
    estimatedDurationMinutes: service.estimatedDurationMinutes ?? null,
    durationMinutes: service.durationMinutes ?? null,
    createdAt: service.createdAt instanceof Date ? service.createdAt.toISOString() : String(service.createdAt),
    updatedAt: service.updatedAt instanceof Date ? service.updatedAt.toISOString() : String(service.updatedAt)
  };
}
async function create11(companyId, data) {
  const scheduledAt = new Date(data.scheduledDate);
  if (isNaN(scheduledAt.getTime())) {
    throw new AppError("Data agendada inv\xE1lida", 400, "INVALID_DATE");
  }
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, companyId, deletedAt: null },
    select: { id: true }
  });
  if (!customer) throw new AppError("Cliente n\xE3o encontrado", 404, "NOT_FOUND");
  if (data.contractId) {
    const contract = await prisma.contract.findFirst({
      where: { id: data.contractId, companyId, deletedAt: null },
      select: { id: true }
    });
    if (!contract) throw new AppError("Contrato n\xE3o encontrado", 404, "NOT_FOUND");
  }
  const estimatedDurationMinutes = data.estimatedDurationMinutes ?? getDefaultDuration(data.serviceType);
  if (data.employeeId) {
    const conflicts = await checkScheduleConflict(companyId, data.employeeId, scheduledAt, estimatedDurationMinutes);
    if (conflicts.length > 0) {
      throw new AppError(
        `T\xE9cnico j\xE1 possui OS agendada neste hor\xE1rio`,
        409,
        "SCHEDULE_CONFLICT",
        { conflicts }
      );
    }
  }
  const serviceNumber = await getNextServiceNumber(companyId);
  const amount = data.contractId ? await prisma.contract.findFirst({
    where: { id: data.contractId },
    select: { amount: true }
  }).then((c) => c?.amount ?? null) : null;
  const service = await prisma.service.create({
    data: {
      serviceNumber,
      companyId,
      contractId: data.contractId ?? null,
      customerId: data.customerId,
      scheduledAt,
      estimatedDurationMinutes,
      status: "SCHEDULED",
      amount,
      employeeId: data.employeeId ?? null,
      serviceType: data.serviceType
    },
    include: {
      customer: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true } }
    }
  });
  if (data.equipmentIds && data.equipmentIds.length > 0) {
    await prisma.serviceEquipment.createMany({
      data: data.equipmentIds.map((equipmentId) => ({
        serviceId: service.id,
        equipmentId
      }))
    });
  }
  await createAuditLog({
    companyId,
    entityType: "Service",
    entityId: service.id,
    action: "CREATE",
    newData: { serviceNumber, customerId: data.customerId, serviceType: data.serviceType }
  });
  return formatServiceResponse(service);
}
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
  return {
    data: services.map(formatServiceResponse),
    meta: buildMeta(total, pagination)
  };
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
  let masked;
  if (userRole === "TECHNICIAN") {
    masked = maskCustomerForTechnician(customer);
  } else {
    masked = {
      ...customer,
      document: customer.document ? maskDocument(customer.document, customer.documentType || "CNPJ") : null
    };
  }
  return formatServiceResponse({ ...service, customer: masked });
}
async function update11(companyId, serviceId, data) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  if (service.status !== "SCHEDULED") {
    throw new AppError("Apenas servi\xE7os agendados podem ser editados", 400, "INVALID_STATUS");
  }
  const updateData = {};
  if (data.customerId !== void 0) {
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, companyId, deletedAt: null },
      select: { id: true }
    });
    if (!customer) throw new AppError("Cliente n\xE3o encontrado", 404, "NOT_FOUND");
    updateData.customerId = data.customerId;
  }
  if (data.contractId !== void 0) {
    if (data.contractId) {
      const contract = await prisma.contract.findFirst({
        where: { id: data.contractId, companyId, deletedAt: null },
        select: { id: true, amount: true }
      });
      if (!contract) throw new AppError("Contrato n\xE3o encontrado", 404, "NOT_FOUND");
      updateData.contractId = data.contractId;
      updateData.amount = contract.amount;
    } else {
      updateData.contractId = null;
      updateData.amount = null;
    }
  }
  if (data.serviceType !== void 0) updateData.serviceType = data.serviceType;
  if (data.scheduledDate !== void 0) {
    const scheduledAt = new Date(data.scheduledDate);
    if (isNaN(scheduledAt.getTime())) {
      throw new AppError("Data agendada inv\xE1lida", 400, "INVALID_DATE");
    }
    updateData.scheduledAt = scheduledAt;
  }
  if (data.employeeId !== void 0) updateData.employeeId = data.employeeId;
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: updateData,
    include: {
      customer: true,
      employee: { select: { id: true, name: true, phone: true } },
      equipment: { include: { equipment: true } },
      photos: true
    }
  });
  if (data.equipmentIds !== void 0) {
    await prisma.serviceEquipment.deleteMany({ where: { serviceId } });
    if (data.equipmentIds.length > 0) {
      await prisma.serviceEquipment.createMany({
        data: data.equipmentIds.map((equipmentId) => ({
          serviceId,
          equipmentId
        }))
      });
    }
  }
  await createAuditLog({
    companyId,
    entityType: "Service",
    entityId: serviceId,
    action: "UPDATE",
    oldData: { status: "SCHEDULED" },
    newData: { ...updateData }
  });
  const final = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
    include: {
      customer: true,
      employee: { select: { id: true, name: true, phone: true } },
      equipment: { include: { equipment: true } },
      photos: true
    }
  });
  return formatServiceResponse(final);
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
async function revert(companyId, serviceId) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  if (service.status !== "IN_PROGRESS") {
    throw new AppError("Apenas servi\xE7os em andamento podem ser revertidos", 400, "INVALID_STATUS");
  }
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { status: "SCHEDULED" }
  });
  await createAuditLog({
    companyId,
    entityType: "Service",
    entityId: serviceId,
    action: "UPDATE",
    oldData: { status: "IN_PROGRESS" },
    newData: { status: "SCHEDULED" }
  });
  return updated;
}
async function reopen(companyId, serviceId) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  if (service.status !== "COMPLETED") {
    throw new AppError("Apenas servi\xE7os conclu\xEDdos podem ser reabertos", 400, "INVALID_STATUS");
  }
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      status: "IN_PROGRESS",
      completedDate: null,
      executionNotes: null,
      durationMinutes: null,
      reportUrl: null
    }
  });
  await createAuditLog({
    companyId,
    entityType: "Service",
    entityId: serviceId,
    action: "UPDATE",
    oldData: { status: "COMPLETED" },
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
  const confirmationToken = import_node_crypto2.default.randomUUID();
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
  let reportPdfUrl = null;
  try {
    const reportData = await buildServiceReportData(serviceId);
    const reportUrl = await generateServiceReport(serviceId, reportData);
    if (reportUrl) {
      await prisma.service.update({
        where: { id: serviceId },
        data: { reportUrl }
      });
      reportPdfUrl = reportUrl;
    }
  } catch (error) {
    console.error(`[complete] Falha ao gerar PDF na conclus\xE3o da OS ${serviceId}:`, error);
  }
  return { ...result, confirmationToken, confirmationLink: `/confirmar/${confirmationToken}`, reportPdfUrl };
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
  const estimatedDurationMinutes = data.estimatedDurationMinutes ?? service.estimatedDurationMinutes ?? 60;
  if (service.employeeId) {
    const conflicts = await checkScheduleConflict(companyId, service.employeeId, newDate, estimatedDurationMinutes, serviceId);
    if (conflicts.length > 0) {
      throw new AppError(
        `T\xE9cnico j\xE1 possui OS agendada neste hor\xE1rio`,
        409,
        "SCHEDULE_CONFLICT",
        { conflicts }
      );
    }
  }
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      scheduledAt: newDate,
      estimatedDurationMinutes,
      status: "SCHEDULED"
    }
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
  const newToken = import_node_crypto2.default.randomUUID();
  const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1e3);
  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { confirmationToken: newToken, confirmationTokenExpiresAt: newExpiry }
  });
  return { ...updated, confirmationToken: newToken };
}
async function generatePdf(companyId, serviceId) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  if (service.status !== "COMPLETED") {
    throw new AppError("Apenas servi\xE7os conclu\xEDdos podem gerar PDF", 400, "INVALID_STATUS");
  }
  const reportData = await buildServiceReportData(serviceId);
  const reportUrl = await generateServiceReport(serviceId, reportData);
  if (!reportUrl) {
    throw new AppError("Falha ao gerar o PDF. Verifique a configura\xE7\xE3o do storage.", 500, "PDF_GENERATION_FAILED");
  }
  await prisma.service.update({
    where: { id: serviceId },
    data: { reportUrl }
  });
  return { reportPdfUrl: reportUrl };
}
async function previewReport(companyId, serviceId, overrides) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null }
  });
  if (!service) throw new AppError("Servi\xE7o n\xE3o encontrado", 404, "NOT_FOUND");
  const reportData = await buildServiceReportData(serviceId);
  if (overrides) {
    if (overrides.executionNotes !== void 0) {
      reportData.executionNotes = overrides.executionNotes;
    }
    if (overrides.durationMinutes !== void 0) {
      reportData.durationMinutes = overrides.durationMinutes;
    }
    if (overrides.equipmentNotes && overrides.equipmentNotes.length > 0) {
      for (const eq of overrides.equipmentNotes) {
        const target = reportData.equipment.find((e) => e.id === eq.equipmentId);
        if (target) {
          target.notes = eq.note;
        }
      }
    }
  }
  return generateServiceReportBuffer(serviceId, reportData);
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
  const uploadDir = import_node_path.default.join(process.cwd(), "uploads", "services", serviceId);
  await import_promises.default.mkdir(uploadDir, { recursive: true });
  const createdPhotos = [];
  for (const file of files) {
    const buffer = await file.toBuffer();
    const ext = import_node_path.default.extname(file.filename) || ".jpg";
    const filename = `${import_node_crypto2.default.randomUUID()}${ext}`;
    const filepath = import_node_path.default.join(uploadDir, filename);
    await import_promises.default.writeFile(filepath, buffer);
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
var import_zod26 = require("zod");
var equipmentNoteSchema = import_zod26.z.object({
  equipmentId: import_zod26.z.string().uuid(),
  note: import_zod26.z.string().max(500)
});
var completeServiceSchema = import_zod26.z.object({
  executionNotes: import_zod26.z.string().min(1, "Observa\xE7\xF5es s\xE3o obrigat\xF3rias").max(2e3).optional(),
  durationMinutes: import_zod26.z.number().int().positive().optional(),
  equipmentNotes: import_zod26.z.array(equipmentNoteSchema).optional()
}).strict();

// src/modules/services/dtos/cancel-service.dto.ts
var import_zod27 = require("zod");
var cancelServiceSchema = import_zod27.z.object({
  reason: import_zod27.z.string().min(1, "Motivo do cancelamento \xE9 obrigat\xF3rio").max(500)
}).strict();

// src/modules/services/dtos/reschedule-service.dto.ts
var import_zod28 = require("zod");
var rescheduleServiceSchema = import_zod28.z.object({
  scheduledAt: import_zod28.z.string().min(1, "Nova data \xE9 obrigat\xF3ria"),
  estimatedDurationMinutes: import_zod28.z.number().int().min(1).optional()
}).strict();

// src/modules/services/dtos/service-filters.dto.ts
var import_zod29 = require("zod");
var serviceFiltersSchema = import_zod29.z.object({
  page: import_zod29.z.coerce.number().int().positive().optional(),
  pageSize: import_zod29.z.coerce.number().int().min(1).max(100).optional(),
  status: import_zod29.z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CONFIRMED", "CANCELLED"]).optional(),
  employeeId: import_zod29.z.string().uuid().optional(),
  customerId: import_zod29.z.string().uuid().optional(),
  contractId: import_zod29.z.string().uuid().optional(),
  dateStart: import_zod29.z.string().optional(),
  dateEnd: import_zod29.z.string().optional()
}).strict();

// src/modules/services/dtos/link-equipment.dto.ts
var import_zod30 = require("zod");
var linkEquipmentSchema = import_zod30.z.object({
  equipmentIds: import_zod30.z.array(import_zod30.z.string().uuid()).min(1, "Selecione pelo menos um equipamento")
}).strict();

// src/modules/services/dtos/update-service.dto.ts
var import_zod31 = require("zod");
var updateServiceSchema = import_zod31.z.object({
  contractId: import_zod31.z.string().min(1).optional(),
  customerId: import_zod31.z.string().min(1).optional(),
  serviceType: import_zod31.z.string().min(1).optional(),
  scheduledDate: import_zod31.z.string().min(1).optional(),
  employeeId: import_zod31.z.string().nullable().optional(),
  equipmentIds: import_zod31.z.array(import_zod31.z.string()).optional()
}).strict();

// src/modules/services/services.controller.ts
async function create12(request, reply) {
  const user = request.user;
  const body = validateOrThrow(createServiceSchema, request.body);
  const service = await create11(user.companyId, body);
  return reply.status(201).send({ data: service });
}
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
async function revert2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const updated = await revert(user.companyId, id);
  return reply.status(200).send({ data: updated });
}
async function reopen2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const updated = await reopen(user.companyId, id);
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
async function previewReport2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const body = request.body;
  const buffer = await previewReport(user.companyId, id, body);
  return reply.header("Content-Type", "application/pdf").send(buffer);
}
async function generatePdf2(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const result = await generatePdf(user.companyId, id);
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
async function update12(request, reply) {
  const user = request.user;
  const { id } = request.params;
  const body = validateOrThrow(updateServiceSchema, request.body);
  const updated = await update11(user.companyId, id, body);
  return reply.status(200).send({ data: updated });
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
  app2.post(
    "/",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    create12
  );
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
    "/:id/revert",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    revert2
  );
  app2.patch(
    "/:id/reopen",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    reopen2
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
  app2.post(
    "/:id/preview-report",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    previewReport2
  );
  app2.get(
    "/:id/report",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    getReport2
  );
  app2.post(
    "/:id/generate-pdf",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    generatePdf2
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
    "/:id",
    { preHandler: [app2.authenticate, authorize("OWNER", "ADMIN")] },
    update12
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
async function confirm(token, ip, userAgent, name, document, documentType) {
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
        confirmedName: name,
        confirmedDocument: document ?? null,
        confirmedDocumentType: documentType ?? null,
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
  try {
    const reportData = await buildServiceReportData(service.id);
    const reportUrl = await generateServiceReport(service.id, reportData);
    if (reportUrl) {
      await prisma.service.update({
        where: { id: service.id },
        data: { reportUrl }
      });
    }
  } catch (error) {
    console.error(`[confirm] Falha ao regenerar PDF na confirma\xE7\xE3o da OS ${service.id}:`, error);
  }
  return {
    success: true,
    serviceNumber: service.serviceNumber,
    confirmedAt: now
  };
}

// src/modules/confirm/confirm.schema.ts
var import_zod32 = require("zod");
var confirmParamsSchema = import_zod32.z.object({
  token: import_zod32.z.string()
});
var confirmBodySchema = import_zod32.z.object({
  name: import_zod32.z.string().max(255).optional().default(""),
  document: import_zod32.z.string().regex(/^\d+$/, "Documento deve conter apenas n\xFAmeros").min(11, "Documento deve ter no m\xEDnimo 11 d\xEDgitos").max(14, "Documento deve ter no m\xE1ximo 14 d\xEDgitos").optional(),
  documentType: import_zod32.z.enum(["CPF", "CNPJ"]).optional(),
  consent: import_zod32.z.boolean().optional().default(true).refine((v) => v === true, { message: "Consentimento \xE9 obrigat\xF3rio" })
});

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
  const { name, document, documentType } = confirmBodySchema.parse(request.body ?? {});
  const result = await confirm(token, ip, userAgent, name, document, documentType);
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
    prisma.service.count({ where: { companyId, deletedAt: null, status: { in: ["COMPLETED", "CONFIRMED"] }, completedDate: { gte: monthStart, lte: monthEnd } } }),
    prisma.service.count({ where: { companyId, deletedAt: null, confirmedAt: { not: null }, completedDate: { gte: monthStart, lte: monthEnd } } }),
    prisma.$queryRaw`
      SELECT AVG(
        EXTRACT(EPOCH FROM (s.completed_date - s.scheduled_at)) / 3600
      ) as avg
      FROM services s
      WHERE s.company_id = ${companyId}
        AND s.deleted_at IS NULL
        AND s.status IN ('COMPLETED', 'CONFIRMED')
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
    include: {
      customer: { select: { id: true, name: true } },
      services: {
        where: { deletedAt: null },
        orderBy: { scheduledAt: "desc" },
        take: 1,
        select: { serviceType: true }
      }
    },
    orderBy: { endDate: "asc" }
  });
  return contracts.map((c) => {
    const lastService = c.services?.[0];
    return {
      id: c.id,
      customerId: c.customerId,
      customerName: c.customer.name,
      serviceType: lastService?.serviceType ?? "MAINTENANCE",
      expiresAt: c.endDate.toISOString(),
      daysRemaining: Math.ceil((c.endDate.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24)),
      value: Number(c.amount)
    };
  });
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
    const completedToday = todayServices.filter((s) => s.status === "COMPLETED" || s.status === "CONFIRMED").length;
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
      AND s.status IN ('COMPLETED', 'CONFIRMED')
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
    {
      preHandler: [app2.authenticate],
      config: { rateLimit: { max: 1, timeWindow: 864e5 } }
    },
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
  const app2 = (0, import_fastify.default)({ logger: loggerConfig });
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
  app2.register(import_multipart.default, {
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
var import_node_cron = __toESM(require("node-cron"), 1);

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

// src/jobs/cleanup-deleted.job.ts
async function cleanupDeletedJob() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3);
  const where = { deletedAt: { lt: ninetyDaysAgo } };
  const results = {};
  const photos = await prisma.servicePhoto.deleteMany({
    where: {
      service: { deletedAt: { lt: ninetyDaysAgo } }
    }
  });
  results.ServicePhoto = photos.count;
  const serviceEquipment = await prisma.serviceEquipment.deleteMany({
    where: {
      service: { deletedAt: { lt: ninetyDaysAgo } }
    }
  });
  results.ServiceEquipment = serviceEquipment.count;
  const services = await prisma.service.deleteMany({ where });
  results.Service = services.count;
  const equipment = await prisma.equipment.deleteMany({ where });
  results.Equipment = equipment.count;
  const contracts = await prisma.contract.deleteMany({ where });
  results.Contract = contracts.count;
  const customers = await prisma.customer.deleteMany({ where });
  results.Customer = customers.count;
  const employees = await prisma.employee.deleteMany({ where });
  results.Employee = employees.count;
  const users = await prisma.user.deleteMany({ where });
  results.User = users.count;
  const counts = Object.entries(results).filter(([, count]) => count > 0).map(([entity, count]) => `${entity}: ${count}`).join(", ");
  console.log(`[cleanup-deleted] ${counts || "Nenhum registro removido"}`);
}

// src/jobs/index.ts
function registerJobs() {
  import_node_cron.default.schedule("1 0 * * *", () => {
    generateServicesJob().catch((err) => console.error("[generate-services] Erro:", err));
  });
  import_node_cron.default.schedule("0 1 * * *", () => {
    expireContractsJob().catch((err) => console.error("[expire-contracts] Erro:", err));
  });
  import_node_cron.default.schedule("0 2 * * *", () => {
    cleanupTokensJob().catch((err) => console.error("[cleanup-tokens] Erro:", err));
  });
  import_node_cron.default.schedule("0 3 * * *", () => {
    cleanupDeletedJob().catch((err) => console.error("[cleanup-deleted] Erro:", err));
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
