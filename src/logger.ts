export interface Logger {
    log(message: string): void;
    error(message: string, err?: unknown): void;
}

export const nullLogger: Logger = {
    log: () => undefined,
    error: () => undefined,
};
