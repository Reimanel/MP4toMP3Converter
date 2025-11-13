import { Plugin } from 'vite';

export default function corsPlugin(): Plugin {
  return {
    name: 'vite-plugin-cors',
    configResolved(config) {
      // Plugin configurado
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        // Adiciona headers necessários ao HTML
        return html.replace(
          '<head>',
          `<head>
    <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin">
    <meta http-equiv="Cross-Origin-Embedder-Policy" content="require-corp">`
        );
      },
    },
  };
}
