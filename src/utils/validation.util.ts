import { ZodSchema } from 'zod';

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

export function stringifyBigInts(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? v.toString() : v)
  );
}
