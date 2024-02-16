import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import { viteStaticCopy } from "vite-plugin-static-copy"

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/onnxruntime-web/dist/*.wasm",
          dest: "/"
        }
        // {
        //   src: "model",
        //   dest: "model"
        // },
        // {
        //   src: "src/assets",
        //   dest: "assets"
        // }
      ]
    })
  ],
  optimizeDeps: {
    include: ["onnxruntime-web"]
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless"
    }
  },
  build: {
    sourcemap: true
  }
})

