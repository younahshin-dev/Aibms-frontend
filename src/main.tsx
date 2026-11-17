import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { loadRuntimeConfig } from './config/runtimeConfig';
import './styles/tutorial.css';

const root = createRoot(document.getElementById('root')!);

loadRuntimeConfig()
  .then(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((e: unknown) => {
    root.render(<p style={{ padding: 24 }}>설정을 불러오지 못했습니다: {String(e)}</p>);
  });
