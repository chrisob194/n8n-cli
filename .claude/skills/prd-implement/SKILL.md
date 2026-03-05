---
name: prd-implement
description: >
  Implementa automaticamente tutti i task del prd.json del progetto n8n-cli.
  TRIGGER quando l'utente chiede di: implementare il PRD, eseguire i task del prd.json,
  lavorare sui requisiti del progetto, completare l'implementazione pendente.
compatibility: claude-code
---

## Workflow di Implementazione

Esegui le 4 fasi in sequenza senza richiedere approvazione utente tra le fasi.

### Fase 1 — Lettura PRD

Leggi `prd.json` con il Read tool. Identifica tutti i task con `"passes": false`.
Elenca i task pendenti all'utente (solo informativo, non attendere risposta).

### Fase 2 — Pianificazione (Plan sub-agent)

Lancia un sub-agent con `subagent_type=Plan` usando il file `.claude/skills/prd-implement/agents/prd-planner.md` come prompt, passando:
- La lista completa dei task pendenti da prd.json
- Istruzione di leggere `src/cli.ts`, `CLAUDE.md`, e le sezioni rilevanti di `api-1.json`

Presenta brevemente il piano risultante, poi **procedi immediatamente alla fase 3**.

### Fase 3 — Implementazione (general-purpose sub-agent)

Lancia un sub-agent con `subagent_type=general-purpose` usando `.claude/skills/prd-implement/agents/prd-implementer.md` come prompt, passando:
- Il piano prodotto nella fase 2
- Tutti i task da prd.json con i loro `steps`
- Percorsi file chiave: `src/cli.ts`, `prd.json`, `api-1.json`, `CLAUDE.md`

L'agent implementa i task e aggiorna `prd.json` impostando `"passes": true` per ogni task completato.

### Fase 4 — Test e Build (general-purpose sub-agent)

Lancia un sub-agent con `subagent_type=general-purpose` usando `.claude/skills/prd-implement/agents/prd-tester.md` come prompt.

Riporta i risultati finali: task completati, test passati/falliti, stato build.
