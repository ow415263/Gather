import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'
import 'dotenv/config'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // Handle image extraction
          if (req.url?.startsWith('/api/extract-recipe') && !req.url.includes('url') && req.method === 'POST') {
            try {
              let body = '';
              for await (const chunk of req) {
                body += chunk;
              }
              const { imageDataUrl } = JSON.parse(body);

              const { extractRecipeFromImageServer } = await import('./src/server/extract');
              const result = await extractRecipeFromImageServer(imageDataUrl);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (error: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
            return;
          }

          // Handle URL extraction - proxy to Cloud Function
          if (req.url?.startsWith('/api/extract-recipe-url') && req.method === 'POST') {
            try {
              let body = '';
              for await (const chunk of req) {
                body += chunk;
              }

              // In development,forward to deployed Cloud Function
              // User needs to set VITE_API_BASE_URL to their Cloud Function URL
              const cloudFunctionUrl = process.env.VITE_CLOUD_FUNCTION_URL || process.env.VITE_API_BASE_URL;

              if (!cloudFunctionUrl) {
                res.statusCode = 503;
                res.end(JSON.stringify({
                  error: 'Cloud Function URL not configured. Set VITE_CLOUD_FUNCTION_URL in .env to your deployed extractRecipeFromUrl function URL.'
                }));
                return;
              }

              // Forward the request to the Cloud Function
              const response = await fetch(`${cloudFunctionUrl}/extractRecipeFromUrl`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': req.headers.authorization || ''
                },
                body
              });

              const result = await response.text();
              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(result);
            } catch (error: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
            return;
          }
          next();
        });
      }
    }
  ],
  build: {
    chunkSizeWarningLimit: 1500,
  },
  base: './', // Use relative paths for Capacitor mobile apps
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
});
