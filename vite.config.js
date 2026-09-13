import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    server: {
        port: 3000,
        open: true,
        host: true
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true
    },
    optimizeDeps: {
        include: ['three', 'cannon-es']
    },
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['tests/**/*.test.js']
    }
});
