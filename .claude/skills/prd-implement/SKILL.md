---
name: prd-implement
description: >
  Implementa automaticamente tutti i task del prd.json del progetto n8n-cli.
  TRIGGER quando l'utente chiede di: implementare il PRD, eseguire i task del prd.json,
  lavorare sui requisiti del progetto, completare l'implementazione pendente.
compatibility: claude-code
---

## Workflow di Implementazione

Esegui le fasi in sequenza senza richiedere approvazione utente tra le fasi.
Ogni invocazione implementa UN SOLO task, poi si ferma.

### Fase 1 — Selezione task

Leggi `prd.json` con il Read tool. Trova il PRIMO task con `"passes": false`.
Mostra all'utente solo quel task (non elencare tutti i task pendenti).
Se non ci sono task pendenti, comunica che il PRD è completamente implementato e fermati.

### Fase 2 — Pianificazione (Plan sub-agent)

Lancia un sub-agent con `subagent_type=Plan` usando il file `.claude/skills/prd-implement/agents/prd-planner.md` come prompt, passando:
- Il singolo task selezionato nella Fase 1
- Istruzione di leggere `src/cli.ts`, `CLAUDE.md`, e le sezioni rilevanti di `api-1.json`

Presenta brevemente il piano risultante, poi **procedi immediatamente alla fase 3**.

### Fase 3 — Implementazione (general-purpose sub-agent)

Lancia un sub-agent con `subagent_type=general-purpose` usando `.claude/skills/prd-implement/agents/prd-implementer.md` come prompt, passando:
- Il piano prodotto nella fase 2
- Il singolo task da implementare (con i suoi `steps`)
- Percorsi file chiave: `src/cli.ts`, `prd.json`, `api-1.json`, `CLAUDE.md`

L'agent implementa il task e aggiorna `prd.json` impostando `"passes": true` per quel task.

### Fase 4 — Test e Build (general-purpose sub-agent)

Lancia un sub-agent con `subagent_type=general-purpose` usando `.claude/skills/prd-implement/agents/prd-tester.md` come prompt.

Se i test falliscono, riporta gli errori all'utente e fermati (non commitare).

### Fase 5 — Commit

Se i test passano, esegui:
```
git add -A && git commit -m "<descrizione del task implementato>"
```

Usa la `description` del task come messaggio di commit.

Riporta i risultati finali: task completato, test passati, commit effettuato.
**Fermati qui. Non passare al prossimo task.**
