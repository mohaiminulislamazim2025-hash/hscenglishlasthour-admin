import "server-only";

import { getSupabaseAdminClient } from "./admin";
import { getSupabaseBookBucket } from "./config";

export interface StorageObject {
  name: string;
  path: string;
  size: number | null;
  updatedAt: string | null;
  contentType: string | null;
}

/**
 * Create a short-lived signed upload URL + token for a private object. The
 * browser uploads directly to Storage with this token, so the service-role key
 * never reaches the client and Next.js body limits do not apply.
 */
export async function createSignedUploadUrl(
  path: string,
): Promise<{ path: string; token: string; signedUrl: string } | null> {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .storage.from(getSupabaseBookBucket())
      .createSignedUploadUrl(path, { upsert: true });
    if (error || !data) return null;
    return { path, token: data.token, signedUrl: data.signedUrl };
  } catch {
    return null;
  }
}

/** Create a short-lived signed download URL for previewing a private object. */
export async function createSignedUrl(
  path: string,
  ttlSeconds = 60 * 60,
): Promise<string | null> {
  if (!path) return null;
  try {
    const { data, error } = await getSupabaseAdminClient()
      .storage.from(getSupabaseBookBucket())
      .createSignedUrl(path, ttlSeconds);
    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

/** Batch-sign several objects into a path -> URL map. */
export async function createSignedUrls(
  paths: string[],
  ttlSeconds = 60 * 60,
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};
  try {
    const { data, error } = await getSupabaseAdminClient()
      .storage.from(getSupabaseBookBucket())
      .createSignedUrls(unique, ttlSeconds);
    if (error || !data) return {};
    const map: Record<string, string> = {};
    for (const entry of data) {
      if (entry.signedUrl && entry.path) map[entry.path] = entry.signedUrl;
    }
    return map;
  } catch {
    return {};
  }
}

/** Download a private object into memory (server only). */
export async function downloadObject(path: string): Promise<Uint8Array | null> {
  if (!path) return null;
  try {
    const { data, error } = await getSupabaseAdminClient()
      .storage.from(getSupabaseBookBucket())
      .download(path);
    if (error || !data) return null;
    return new Uint8Array(await data.arrayBuffer());
  } catch {
    return null;
  }
}

/** Server-side upload (used for small derived assets such as the cover thumbnail). */
export async function uploadObject(
  path: string,
  data: Uint8Array | ArrayBuffer | Blob,
  contentType: string,
  upsert = true,
): Promise<boolean> {
  try {
    const { error } = await getSupabaseAdminClient()
      .storage.from(getSupabaseBookBucket())
      .upload(path, data, { contentType, upsert });
    return !error;
  } catch {
    return false;
  }
}

/** Remove one or more objects (best effort; returns the paths that were removed). */
export async function removeObjects(paths: string[]): Promise<string[]> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return [];
  try {
    const { data, error } = await getSupabaseAdminClient()
      .storage.from(getSupabaseBookBucket())
      .remove(unique);
    if (error || !data) return [];
    return data.map((item) => item.name);
  } catch {
    return [];
  }
}

/** True when an object exists in the bucket. */
export async function objectExists(path: string): Promise<boolean> {
  if (!path) return false;
  const folder = path.slice(0, path.lastIndexOf("/"));
  const name = path.slice(path.lastIndexOf("/") + 1);
  try {
    const { data, error } = await getSupabaseAdminClient()
      .storage.from(getSupabaseBookBucket())
      .list(folder, { search: name, limit: 1 });
    if (error || !data) return false;
    return data.some((item) => item.name === name);
  } catch {
    return false;
  }
}

/** Fetch metadata for a single object, or null when missing. */
export async function statObject(path: string): Promise<StorageObject | null> {
  if (!path) return null;
  const folder = path.slice(0, path.lastIndexOf("/"));
  const name = path.slice(path.lastIndexOf("/") + 1);
  try {
    const { data, error } = await getSupabaseAdminClient()
      .storage.from(getSupabaseBookBucket())
      .list(folder, { search: name, limit: 1 });
    if (error || !data) return null;
    const item = data.find((entry) => entry.name === name);
    if (!item) return null;
    const meta = (item.metadata ?? {}) as { size?: number; mimetype?: string };
    return {
      name,
      path,
      size: typeof meta.size === "number" ? meta.size : null,
      updatedAt: item.updated_at ?? null,
      contentType: meta.mimetype ?? null,
    };
  } catch {
    return null;
  }
}

/** List the files directly inside a folder (not recursive). */
export async function listFolder(folder: string): Promise<StorageObject[]> {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .storage.from(getSupabaseBookBucket())
      .list(folder, { limit: 1000, sortBy: { column: "name", order: "asc" } });
    if (error || !data) return [];
    return data
      .filter((item) => item.id) // skip folder placeholders (no id)
      .map((item) => {
        const meta = (item.metadata ?? {}) as { size?: number; mimetype?: string };
        return {
          name: item.name,
          path: `${folder}/${item.name}`,
          size: typeof meta.size === "number" ? meta.size : null,
          updatedAt: item.updated_at ?? null,
          contentType: meta.mimetype ?? null,
        } satisfies StorageObject;
      });
  } catch {
    return [];
  }
}

/**
 * Delete the cached trimmed preview so the website re-generates it from the
 * current full PDF after a replacement. Best effort.
 */
export async function invalidatePreviewCache(bookId: string): Promise<void> {
  const { buildPreviewPdfPath } = await import("@/lib/storage/paths");
  await removeObjects([buildPreviewPdfPath(bookId)]);
}
