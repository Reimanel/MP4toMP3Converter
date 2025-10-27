const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Expor funções seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Ler arquivo FFmpeg do sistema de arquivos
  readFFmpegFile: async (filename) => {
    try {
      // Determinar caminho base
      const isDev = process.env.NODE_ENV === 'development';
      let basePath;
      
      if (isDev) {
        // Modo dev: arquivos na pasta public
        basePath = path.join(__dirname, 'public');
      } else {
        // Modo produção: tentar múltiplos caminhos possíveis
        const possiblePaths = [
          path.join(process.resourcesPath, 'public'),
          path.join(process.resourcesPath, 'app.asar.unpacked', 'public'),
          path.join(__dirname, 'public'),
          path.join(__dirname, '..', 'public'),
        ];
        
        // Encontrar o primeiro caminho que existe
        basePath = possiblePaths.find(p => {
          const testPath = path.join(p, filename);
          return fs.existsSync(testPath);
        });
        
        if (!basePath) {
          throw new Error(`Could not find public folder. Tried: ${possiblePaths.join(', ')}`);
        }
      }
      
      const filePath = path.join(basePath, filename);
      
      console.log(`[Preload] Trying to read: ${filePath}`);
      console.log(`[Preload] File exists: ${fs.existsSync(filePath)}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const buffer = fs.readFileSync(filePath);
      console.log(`[Preload] File loaded: ${filename} (${buffer.length} bytes)`);
      
      return new Uint8Array(buffer);
    } catch (error) {
      console.error('[Preload] Error reading FFmpeg file:', error);
      throw error;
    }
  },
  
  // Verificar se arquivo existe
  fileExists: async (filename) => {
    try {
      const isDev = process.env.NODE_ENV === 'development';
      const basePath = isDev 
        ? path.join(__dirname, 'public')
        : path.join(process.resourcesPath, 'public');
      
      const filePath = path.join(basePath, filename);
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }
});
