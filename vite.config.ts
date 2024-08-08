import { join, resolve } from 'path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

import pkg from './package.json';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      name: pkg.name,
      fileName: pkg.name,
    },
  },

  plugins: [nodePolyfills(), dts(), react()],

  resolve: {
    alias: [
      {
        find: /@\//,
        replacement: resolve(__dirname, 'src'),
      },
      {
        find: /~(.+)/,
        replacement: join(process.cwd(), 'node_modules/$1'),
      },
    ],
  },

  test: {
    globals: true,
    environment: 'jsdom',
  },
});
