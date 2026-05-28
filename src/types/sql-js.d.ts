declare module 'sql.js' {
  interface Database {
    prepare(sql: string): Statement
    exec(sql: string): any[]
    export(): Uint8Array
    run(sql: string, params?: any[]): any
    close(): void
  }
  interface Statement {
    bind(params?: any[]): boolean
    step(): boolean
    getAsObject(): Record<string, unknown>
    free(): boolean
  }
  export default function initSqlJs(): Promise<{ Database: new (data?: ArrayLike<number>) => Database }>
}