import { AsyncLocalStorage } from "node:async_hooks";
import fp from "fastify-plugin";

export interface RequestContext {
  companyId: string;
  userId: string;
  role: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error("RequestContext não disponível");
  }
  return ctx;
}

export function getOptionalRequestContext(): RequestContext | null {
  return storage.getStore() ?? null;
}

export default fp(async (app) => {
  app.addHook("onRequest", (request, _reply, done) => {
    const user = request.user as
      | { sub?: string; companyId?: string; role?: string }
      | undefined;

    if (!user) {
      storage.run({ companyId: "", userId: "", role: "" }, done);
      return;
    }

    storage.run(
      {
        companyId: user.companyId ?? "",
        userId: user.sub ?? "",
        role: user.role ?? "",
      },
      done,
    );
  });
});
