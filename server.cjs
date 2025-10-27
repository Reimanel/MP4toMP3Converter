const express = require('express');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

// Quando empacotado com pkg, __dirname aponta para um diretório temporário
// Precisamos usar process.execPath para encontrar o diretório do executável
const isDevelopment = !process.pkg;
const baseDir = isDevelopment ? __dirname : path.dirname(process.execPath);
const distPath = path.join(baseDir, 'dist');

console.log(`📂 Diretório base: ${baseDir}`);
console.log(`📁 Servindo arquivos de: ${distPath}`);

// Servir arquivos estáticos da pasta dist
app.use(express.static(distPath));

app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`🎉 Abra o navegador e acesse: http://localhost:${PORT}\n`);
  
  // Abrir o navegador automaticamente
  if (!isDevelopment) {
    const url = `http://localhost:${PORT}`;
    const command = process.platform === 'win32' ? `start ${url}` : 
                    process.platform === 'darwin' ? `open ${url}` : 
                    `xdg-open ${url}`;
    exec(command);
  }
});
