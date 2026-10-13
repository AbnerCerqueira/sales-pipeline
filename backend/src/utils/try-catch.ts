export type TryCatchResult<T, E = unknown> =
  | { data: T; ok: true }
  | { error: E; ok: false };

export function tryCatch<T, E = unknown>(
  promise: Promise<T>
): Promise<TryCatchResult<T, E>> {
  return promise.then(
    (data): TryCatchResult<T, E> => ({ data, ok: true }),
    (error: E): TryCatchResult<T, E> => ({ error, ok: false })
  );
}
