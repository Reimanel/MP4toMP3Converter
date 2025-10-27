# 🚀 INÍCIO RÁPIDO - PROJETO OFFLINE

## ✅ TUDO PRONTO! SERVIDOR JÁ ESTÁ RODANDO

Seu conversor está funcionando em:
👉 **http://localhost:3000/**

---

## 📱 TESTANDO AGORA

1. Abra o navegador em: http://localhost:3000/
2. Arraste um arquivo MP4 ou clique para selecionar
3. Escolha o formato (MP3 ou WAV)
4. Clique em "Convert File"
5. Aguarde a conversão
6. Baixe seu arquivo de áudio!

---

## 🔴 PARAR O SERVIDOR

No terminal PowerShell, pressione:
```
Ctrl + C
```

---

## ▶️ INICIAR NOVAMENTE

```powershell
npm run dev
```

---

## 📦 BUILD PARA PRODUÇÃO

```powershell
npm run build
npm run preview
```

Os arquivos finais ficam na pasta `dist/`

---

## 🌐 FUNCIONA OFFLINE?

✅ **SIM!** Após a primeira execução:
- Todos os arquivos CSS/JS são locais
- FFmpeg fica em cache do navegador
- Funciona sem internet

⚠️ **Primeira vez**: Baixa ~31MB do FFmpeg (depois fica em cache)

---

## 💡 DICAS

### Testar em outro dispositivo na mesma rede:
Acesse: http://192.168.1.3:3000/

### Limpar cache e reinstalar:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Recarregar VS Code (se houver erros):
`Ctrl+Shift+P` → "Developer: Reload Window"

---

## 📄 MAIS INFORMAÇÕES

- `README-OFFLINE.md` - Documentação completa
- `MUDANCAS-OFFLINE.md` - Resumo das mudanças

---

**🎉 DIVIRTA-SE CONVERTENDO VÍDEOS!**
