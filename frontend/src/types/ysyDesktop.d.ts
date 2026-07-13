export {};

declare global {
  interface Window {
    ysyDesktop?: {
      platform: string;
      selectAttachments?: () => Promise<Array<{ name: string; path: string }>>;
      getFilePath?: (file: File) => string;
      selectDirectory?: (title?: string) => Promise<string | null>;
      selectFile?: (title?: string) => Promise<string | null>;
      openFile?: (filePath: string) => Promise<void>;
      requestEnvironment?: (request: unknown) => Promise<{ status: number; data: unknown }>;
    };
  }
}
