export type RunExclusive = <T>(operation: () => Promise<T>) => Promise<T>;

export function createRunExclusive(): RunExclusive {
  let queue: Promise<unknown> = Promise.resolve();

  return function runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const next = queue.then(operation, operation);
    queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  };
}
