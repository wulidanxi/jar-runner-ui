declare global {
  interface Window {
    electron: {
      selectJarFile: () => Promise<string | null>;
      selectDirectory: () => Promise<string | null>;
      startJar: (jarPath: string, args?: string[]) => void;
      stopJar: () => void;
      getSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<boolean>;
      saveLog: (text: string) => Promise<boolean>;
      openExternal: (url: string) => Promise<boolean>;
      dumpLog: (text: string, jarPath?: string, tag?: string) => Promise<string | null>;
      send: (channel: "window-min" | "window-max" | "window-close", data?: any) => void;
      on: (channel: "jar-output" | "settings-updated", callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: "jar-output" | "settings-updated") => void;
      getRuntimeVersions?: () => { electron: string; node?: string; chrome?: string };
    };
  }
}

export {};
