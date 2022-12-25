import { defineConfig, normalizePath } from 'vite'
import * as path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const dist = path.resolve(__dirname, 'dist')

export default defineConfig({
  base: './',
  build: {
    outDir: dist,
    assetsDir: 'src',
    sourcemap: true,
    minify: false,
    emptyOutDir: false,
    watch: {
      buildDelay: 500,
      clearScreen: true,
      exclude: ['node_modules/**', 'dist/*', 'src/css/*']
    },
    rollupOptions: {
      // to prevent create hashed file name for auto-reloading
      output: {
        entryFileNames: `src/[name].js`,
        chunkFileNames: `src/[name].js`,
        assetFileNames: `src/[name].[ext]`,
      },
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(path.resolve(__dirname, './src-electron/*')),
          dest: '.'
        }
      ],
      flatten: true
    })
  ]
})
