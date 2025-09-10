// Type definitions for Vercel serverless functions
declare module '@vercel/node' {
  import { IncomingMessage, ServerResponse } from 'http';
  
  export interface VercelRequest extends IncomingMessage {
    query: { [key: string]: string | string[] };
    cookies: { [key: string]: string };
    body?: any;
  }

  export type VercelResponse = ServerResponse & {
    status(code: number): VercelResponse;
    send(body: any): VercelResponse;
    json(jsonBody: any): VercelResponse;
    redirect(url: string): VercelResponse;
    sendFile(path: string): VercelResponse;
    setHeader(name: string, value: string | string[]): VercelResponse;
  };

  export default function handler(
    req: VercelRequest,
    res: VercelResponse
  ): void | Promise<void>;
}

// Global type declarations
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    // Add other environment variables as needed
  }
}
