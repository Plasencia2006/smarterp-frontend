# ============================================
# ETAPA 1: BUILD
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================
# ETAPA 2: PRODUCTION
# ============================================
FROM node:20-alpine

WORKDIR /app

# Copiar build
COPY --from=build /app/dist ./dist

# Crear servidor simple
RUN echo "const http = require('http'); const fs = require('fs'); const path = require('path'); const PORT = process.env.PORT || 3000; const MIME = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'}; http.createServer((req, res) => { let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url); if (!fs.existsSync(filePath)) filePath = path.join(__dirname, 'dist', 'index.html'); const ext = path.extname(filePath); const contentType = MIME[ext] || 'application/octet-stream'; fs.readFile(filePath, (err, content) => { if (err) { res.writeHead(404); res.end('Not found'); } else { res.writeHead(200, {'Content-Type': contentType}); res.end(content); } }); }).listen(PORT, '0.0.0.0', () => console.log('Server running on port ' + PORT));" > server.js

EXPOSE 3000

CMD ["node", "server.js"]