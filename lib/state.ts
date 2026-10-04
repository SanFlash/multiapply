export type MemoryJobResult = {
  email: string;
  status: string;
  messageId?: string;
  error?: string;
};

export type MemoryJob = {
  total: number;
  sent: number;
  failed: number;
  status: string;
  results: MemoryJobResult[];
};

export const memoryJobs = new Map<string, MemoryJob>();
