import { z } from 'zod';

export function parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  return schema.parse(value) as z.infer<T>;
}
