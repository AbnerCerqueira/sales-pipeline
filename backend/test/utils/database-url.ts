export function withDatabase(connectionUri: string, database: string) {
  const url = new URL(connectionUri);
  url.pathname = `/${database}`;
  return url.toString();
}
