import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "../../config/env";
import { AppError } from "../../lib/app-error";

function validateImageMime(buffer: Buffer): "jpeg" | "png" | "webp" | null {
  if (buffer.length < 4) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return "webp";
  return null;
}

function createClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

export const LOGOS_BUCKET = "ciclus-logos";

export async function ensureLogosBucket(): Promise<void> {
  const client = createClient();
  if (!client) return;

  const { data: existing } = await client.storage.getBucket(LOGOS_BUCKET);
  if (existing) return;

  await client.storage.createBucket(LOGOS_BUCKET, {
    public: true,
    allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
  });
}

export async function uploadFile(
  bucket: string,
  path: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const client = createClient();
  if (!client) {
    throw new AppError("Storage não configurado", 500, "STORAGE_NOT_CONFIGURED");
  }

  const { data, error } = await client.storage.from(bucket).upload(path, buffer, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) {
    throw new AppError(`Erro no upload: ${error.message}`, 500, "STORAGE_UPLOAD_ERROR");
  }

  const { data: urlData } = client.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const client = createClient();
  if (!client) {
    throw new AppError("Storage não configurado", 500, "STORAGE_NOT_CONFIGURED");
  }

  const { error } = await client.storage.from(bucket).remove([path]);
  if (error) {
    throw new AppError(`Erro ao deletar: ${error.message}`, 500, "STORAGE_DELETE_ERROR");
  }
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number,
): Promise<string> {
  const client = createClient();
  if (!client) {
    throw new AppError("Storage não configurado", 500, "STORAGE_NOT_CONFIGURED");
  }

  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    throw new AppError(`Erro ao gerar URL: ${error.message}`, 500, "STORAGE_SIGNED_URL_ERROR");
  }

  return data.signedUrl;
}

export { validateImageMime };
