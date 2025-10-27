# MP4 to Audio Converter - Modo Offline

## 🎯 Descrição
Este projeto foi transformado para funcionar 100% offline, sem dependências de CDNs externos.

## ✅ Mudanças Realizadas

### 1. **Tailwind CSS Local**
- ❌ Removido: `<script src="https://cdn.tailwindcss.com"></script>`
- ✅ Adicionado: Tailwind CSS como dependência npm
- Configuração em `tailwind.config.js` e `postcss.config.js`

### 2. **React Local**
- ❌ Removido: Import maps do React via CDN
- ✅ Usando: React instalado via npm (já estava no package.json)

### 3. **FFmpeg via NPM**
- ❌ Removido: Scripts embutidos longos no HTML
- ✅ Adicionado: `@ffmpeg/ffmpeg` e `@ffmpeg/util` via npm
- Os arquivos core do FFmpeg são baixados automaticamente do unpkg na primeira execução e mantidos em cache

### 4. **Estilos Customizados**
- ✅ Criado: `index.css` com todas as diretivas do Tailwind e estilos personalizados
- Scrollbar customizada mantida

## 🚀 Como Usar

### Primeira Vez (Com Internet):
```powershell
# 1. Instalar dependências
npm install

# 2. Executar em modo desenvolvimento
npm run dev
```

### Depois da Primeira Execução (Offline):
```powershell
# Apenas executar - tudo funcionará offline
npm run dev
```

### Build para Produção:
```powershell
npm run build
npm run preview
```

## 📦 Estrutura de Arquivos

```
mp4-to-audio-converter/
├── App.tsx                 # Componente principal
├── index.tsx              # Entry point
├── index.html             # HTML limpo sem CDNs
├── index.css              # Estilos Tailwind + customizados
├── tailwind.config.js     # Configuração do Tailwind
├── postcss.config.js      # Configuração do PostCSS
├── vite.config.ts         # Configuração do Vite
├── package.json           # Dependências (atualizadas)
└── tsconfig.json          # Configuração TypeScript
```

## 🔧 Dependências Adicionadas

```json
{
  "dependencies": {
    "@ffmpeg/ffmpeg": "^0.12.10",
    "@ffmpeg/util": "^0.12.1"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17"
  }
}
```

## 🌐 Modo Offline

### O que funciona offline:
- ✅ Interface completa (Tailwind CSS)
- ✅ React e toda a lógica da aplicação
- ✅ FFmpeg (após primeiro carregamento)
- ✅ Conversão de vídeos MP4 para áudio

### Primeira execução (precisa de internet):
- FFmpeg baixa os arquivos core (~31MB) do unpkg
- Esses arquivos são mantidos em cache do navegador
- Após isso, tudo funciona offline

### Para funcionar 100% offline desde o início:
Se você quiser que funcione offline desde a primeira vez, você pode baixar manualmente os arquivos do FFmpeg:

1. Baixar de: https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/
   - `ffmpeg-core.js`
   - `ffmpeg-core.wasm`

2. Criar pasta `public` e colocar os arquivos lá

3. Modificar `App.tsx` linha ~67:
```typescript
// De:
const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

// Para:
const baseURL = '/';
```

## 🎨 Customizações Mantidas

- Cores da marca (brand-*) 
- Scrollbar customizada
- Tema dark (slate)
- Animações e transições

## 🐛 Solução de Problemas

### Erro de CORS/SharedArrayBuffer:
O Vite já está configurado com os headers necessários:
```typescript
headers: {
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
}
```

### Erro ao instalar dependências:
```powershell
# Limpar cache e reinstalar
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

## 📝 Notas Importantes

1. **Cache do Navegador**: FFmpeg usa cache do navegador para armazenar os arquivos core
2. **Service Worker**: Considere adicionar um service worker para cache completo offline
3. **Tamanho**: A primeira carga baixa ~31MB de arquivos do FFmpeg
4. **Compatibilidade**: Requer navegadores modernos com suporte a WebAssembly

## 🔄 Próximos Passos (Opcional)

Para tornar 100% offline desde o início:
1. Adicionar Service Worker
2. Baixar arquivos FFmpeg core para a pasta `public/`
3. Implementar estratégia de cache offline-first

## 📄 Licença

Este projeto está configurado para uso pessoal e educacional.
