export {};

declare global {
  interface Window {
    ysyDesktop?: {
      platform: string;
      selectAttachments?: () => Promise<Array<{ name: string; path: string }>>;
      getFilePath?: (file: File) => string;
      openFile?: (filePath: string) => Promise<void>;
    };
  }
}
