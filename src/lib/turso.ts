/**
 * Turso/libSQL Client
 * Singleton client for accessing the Turso database
 */

import { createClient, Client } from '@libsql/client';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

let tursoClient: Client | null = null;

export function getTursoClient(): Client | null {
  if (!tursoClient && TURSO_DATABASE_URL && TURSO_AUTH_TOKEN) {
    tursoClient = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
  }
  return tursoClient;
}

export function isTursoConfigured(): boolean {
  return !!(TURSO_DATABASE_URL && TURSO_AUTH_TOKEN);
}
