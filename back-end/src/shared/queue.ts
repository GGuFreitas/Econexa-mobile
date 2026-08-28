export interface QueueJob<T = unknown> {
  name: string;
  payload: T;
}

export interface Queue {
  enqueue<T>(job: QueueJob<T>): Promise<void>;
}

class SyncQueue implements Queue {
  async enqueue<T>(job: QueueJob<T>): Promise<void> {
    console.warn(`[queue] worker ausente - job "${job.name}" não será processado fora do processo`, job.payload);
  }
}

export const queue: Queue = new SyncQueue();
