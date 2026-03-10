import { Pool } from 'pg';
declare const pool: Pool;
export declare const query: (text: string, params?: any[]) => Promise<import("pg").QueryResult<any>>;
export declare const transaction: <T>(callback: (client: any) => Promise<T>) => Promise<T>;
export default pool;
//# sourceMappingURL=db.d.ts.map