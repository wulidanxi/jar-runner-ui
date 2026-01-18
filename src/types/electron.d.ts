declare global {
  interface Window {
    electron: {
      selectJarFile: () => Promise<string | null>;
      selectDirectory: () => Promise<string | null>;
      startJar: (jarPath: string, args?: string[]) => void;
      stopJar: () => void;
      getSettings: () => Promise<{
        brandColor?: string;
        outputHeight?: number;
        darkMode?: boolean;
        alwaysOnTop?: boolean;
        autoScrollDefault?: boolean;
        defaultHighlight?: string;
        defaultFilter?: string;
        exportDir?: string;
      }>;
      saveSettings: (settings: {
        brandColor?: string;
        outputHeight?: number;
        darkMode?: boolean;
        alwaysOnTop?: boolean;
        autoScrollDefault?: boolean;
        defaultHighlight?: string;
        defaultFilter?: string;
        exportDir?: string;
      }) => Promise<boolean>;
      saveLog: (text: string) => Promise<boolean>;
      openExternal: (url: string) => Promise<boolean>;
      send: (channel: string, data?: any) => void;
      on: (channel: "jar-output" | "settings-updated", callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: "jar-output" | "settings-updated") => void;
    };
  }
}

export {};
