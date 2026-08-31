/* Logger ringan ke console. Bisa diganti pino bila perlu. */

const prefix = (level: string) => `[${level}] ${new Date().toISOString()} `;

export const logger = {
  info: (...args: unknown[]) => console.log(prefix("INFO"), ...args),
  warn: (...args: unknown[]) => console.warn(prefix("WARN"), ...args),
  error: (...args: unknown[]) => console.error(prefix("ERROR"), ...args),
};
