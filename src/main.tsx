import ReactDOM from 'react-dom/client';
import { App } from './App';
import 'antd/dist/reset.css';
import { ConfigProvider, theme } from 'antd';
import React, { useEffect, useState } from 'react';

const Root = () => {
  const [brandColor, setBrandColor] = useState<string>('#2563eb');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  useEffect(() => {
    window.electron.getSettings().then((s) => {
      if (s?.brandColor) setBrandColor(s.brandColor);
      if (typeof s?.darkMode === 'boolean') setDarkMode(s.darkMode);
    });
    window.electron.on('settings-updated', (s) => {
      if (s?.brandColor) setBrandColor(s.brandColor);
      if (typeof s?.darkMode === 'boolean') setDarkMode(s.darkMode);
    });
    return () => {
      window.electron.removeAllListeners('settings-updated');
    };
  }, []);
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: brandColor,
          colorSuccess: '#10b981',
          colorError: '#ef4444',
          colorWarning: '#f59e0b',
          borderRadius: 8,
          fontSize: 14,
        },
        components: {
          Button: {
            borderRadius: 8
          },
          Card: {
            borderRadius: 10
          },
          Input: {
            controlHeight: 32,
            borderRadius: 8
          }
        }
      }}
    >
      <App />
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
