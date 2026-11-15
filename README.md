# Entrevistas · Recife Fitness

Roteiro de entrevista em campo do Controle Fitness (feira Recife Fitness 2026), em forma de app para celular (PWA).

- **Abrir/instalar:** https://gleibson-crn.github.io/entrevistas-recife-fitness/ → no Chrome do Android, menu ⋮ → "Instalar app" / "Adicionar à tela inicial".
- **Sem internet:** depois de aberto uma vez com internet, o app funciona offline.
- **Dados:** ficam só no celular (localStorage). Nada é enviado para servidor. A entrevista em andamento é salva a cada toque (pode pausar e retomar).
- **Backup:** "Enviar backup completo" gera um `.txt` (JSON) para mandar ao WhatsApp/e-mail/Drive; "Restaurar backup" importa em outro aparelho. "Planilha" gera CSV (abre no Excel/Sheets).

## Publicar nova versão
Commit + push na `main` **e incrementar `VERSION` em `sw.js`** (arquivo novo → incluir em `ASSETS`). O celular mostra "Nova versão disponível" e atualiza ao tocar; as entrevistas salvas não são afetadas.

Ícones: `node tools/make-icons.mjs`.
