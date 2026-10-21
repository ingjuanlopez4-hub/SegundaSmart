import type { Client } from "@libsql/client";

export function migrateWithClient(client: Pick<Client, "execute" | "executeMultiple">): Promise<{ changed: boolean }>;
