import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const tunnelHost = process.env.VITE_TUNNEL_HOST;
const useTunnel = Boolean(tunnelHost);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    ...(useTunnel
      ? {
          allowedHosts: [tunnelHost],
          hmr: {
            host: tunnelHost,
            protocol: 'wss',
            clientPort: 443,
          },
        }
      : {
          hmr: {
            host: 'localhost',
            protocol: 'ws',
            clientPort: 5173,
            port: 5173,
          },
        }),
  },
});
