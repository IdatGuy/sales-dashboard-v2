const isDev = import.meta.env.DEV;

export const logger = {
  error(message: string, error?: unknown): void {
    if (isDev) {
      if (error !== undefined) {
        console.error(message, error);
      } else {
        console.error(message);
      }
    }
  },
  warn(message: string, data?: unknown): void {
    if (isDev) {
      if (data !== undefined) {
        console.warn(message, data);
      } else {
        console.warn(message);
      }
    }
  },
};
