import { defineConfig, normalizePath } from 'vite'
import * as path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const dist = path.resolve(__dirname, 'dist')

export default defineConfig({
  base: './',
  build: {
    assetsDir: 'src',
    sourcemap: false,
    outDir: dist,
    emptyOutDir: true,
    minify: true
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(path.resolve(__dirname, './res/raw/*')),
          dest: 'res'
        },
        {
          src: normalizePath(path.resolve(__dirname, './libs/*')),
          dest: 'libs'
        },
        {
          src: normalizePath(path.resolve(__dirname, './src-electron/*')),
          dest: '.'
        }
      ],
      flatten: true
    })
  ],
})
