export type StorageProvider = "local" | "r2" | "s3";

export interface PutObjectInput {
  readonly key: string;
  readonly body: Buffer;
  readonly contentType: string;
  readonly contentLength: number;
  readonly metadata?: Record<string, string>;
}

export interface StoredObject {
  readonly key: string;
  readonly uri: string;
  readonly provider: StorageProvider;
}

export interface StorageService {
  putObject(input: PutObjectInput): Promise<StoredObject>;
  deleteObject(key: string): Promise<void>;
}
