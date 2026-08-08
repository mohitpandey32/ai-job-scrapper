import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PutObjectInput, StoredObject, StorageService } from "./storage.service";

interface LocalStorageServiceOptions {
  readonly rootDir: string;
}

export class LocalStorageService implements StorageService {
  private readonly rootDir: string;

  constructor(options: LocalStorageServiceOptions) {
    this.rootDir = path.resolve(options.rootDir);
  }

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    const normalizedKey = normalizeStorageKey(input.key);
    const absolutePath = this.resolvePath(normalizedKey);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.body, { mode: 0o600 });

    return {
      key: normalizedKey,
      uri: `local://${normalizedKey}`,
      provider: "local",
    };
  }

  async deleteObject(key: string): Promise<void> {
    const absolutePath = this.resolvePath(normalizeStorageKey(key));

    try {
      await unlink(absolutePath);
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") return;
      throw error;
    }
  }

  private resolvePath(key: string) {
    const absolutePath = path.resolve(this.rootDir, ...key.split("/"));

    if (!absolutePath.startsWith(`${this.rootDir}${path.sep}`)) {
      throw new Error("Invalid storage key.");
    }

    return absolutePath;
  }
}

function normalizeStorageKey(key: string) {
  const normalized = key.replace(/\\/g, "/").replace(/\/+/g, "/").trim();

  if (!normalized || normalized.includes("\0") || normalized.startsWith("/") || normalized.split("/").includes("..")) {
    throw new Error("Invalid storage key.");
  }

  return normalized;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
