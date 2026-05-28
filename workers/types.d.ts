// Minimal Cloudflare Workers type stubs so Next.js build doesn't need @cloudflare/workers-types
// Real Cloudflare workers builds get the real types automatically.

declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement
  }
  interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement
    first<T = any>(): Promise<T | null>
    all<T = any>(): Promise<{ results: T[] }>
    run(): Promise<any>
  }

  interface KVNamespace {
    get(key: string, options?: any): Promise<string | null>
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: any): Promise<void>
  }

  interface R2Bucket {
    get(key: string): Promise<any>
    put(key: string, value: any, options?: any): Promise<any>
    delete(key: string): Promise<void>
  }

  interface DurableObjectState {
    storage: DurableObjectStorage
    waitUntil(promise: Promise<any>): void
  }

  interface DurableObjectStorage {
    get<T = unknown>(key: string): Promise<T | undefined>
    put(key: string, value: any): Promise<void>
    delete(key: string): Promise<void>
    setAlarm(timestamp: number): Promise<void>
  }

  interface DurableObject {
    fetch(req: Request, env: any, ctx: any): Promise<Response> | Response
  }

  interface DurableObjectId {
    toString(): string
  }

  interface DurableObjectNamespace {
    idFromName(name: string): DurableObjectId
    get(id: DurableObjectId): any
  }

  interface Env {
    DB: D1Database
    KV: KVNamespace
    IMAGES: R2Bucket
    REVIEW_AGGREGATOR: DurableObjectNamespace
    LEADERBOARD: DurableObjectNamespace
  }
}

export {}
