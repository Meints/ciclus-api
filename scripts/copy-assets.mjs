import { cpSync } from "node:fs";

cpSync("src/integrations/pdf/templates", "dist/templates", { recursive: true });
