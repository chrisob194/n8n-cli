---
name: prd-implement
description: >
  Implementa automaticamente tutti i task del prd.json del progetto n8n-cli.
  TRIGGER quando l'utente chiede di: implementare il PRD, eseguire i task del prd.json,
  lavorare sui requisiti del progetto, completare l'implementazione pendente.
compatibility: claude-code
---

## Loop di Implementazione

Esegui le fasi in loop finché tutti i task hanno `"passes": true`.
Procedi senza richiedere approvazione utente tra le fasi.

### Inizio

Leggi `prd.json` con il Read tool. Conta i task con `"passes": false`.
Mostra: "Trovati N task pendenti. Inizio implementazione automatica."
Se non ci sono task pendenti, comunica che il PRD è completamente implementato e termina.

### Loop (ripeti per ogni task pendente)

#### Fase 1 — Selezione task

Leggi `prd.json`. Trova il PRIMO task con `"passes": false`.
Se nessuno → vai a "Fine loop".

#### Fase 2 — Pianificazione (Plan sub-agent)

Lancia un sub-agent con `subagent_type=Plan` usando il file `.claude/skills/prd-implement/agents/prd-planner.md` come prompt, passando:
- Il singolo task selezionato nella Fase 1
- Istruzione di leggere `src/cli.ts`, `CLAUDE.md`, e le sezioni rilevanti di `api-1.json`

Presenta brevemente il piano risultante, poi **procedi immediatamente alla fase 3**.

#### Fase 3 — Implementazione (general-purpose sub-agent)

Lancia un sub-agent con `subagent_type=general-purpose` usando `.claude/skills/prd-implement/agents/prd-implementer.md` come prompt, passando:
- Il piano prodotto nella fase 2
- Il singolo task da implementare (con i suoi `steps`)
- Percorsi file chiave: `src/cli.ts`, `prd.json`, `api-1.json`, `CLAUDE.md`

L'agent implementa il task e aggiorna `prd.json` impostando `"passes": true` per quel task.

#### Fase 4 — Test e Build (general-purpose sub-agent)

Lancia un sub-agent con `subagent_type=general-purpose` usando `.claude/skills/prd-implement/agents/prd-tester.md` come prompt.

Se i test falliscono: riporta gli errori + stato parziale (X/N task completati), fermati senza commitare.

#### Fase 5 — Commit

Se i test passano, esegui:
```
git add -A && git commit -m "<descrizione del task implementato>"
```

Usa la `description` del task come messaggio di commit.
Dopo il commit, torna a **Fase 1** per il task successivo.

### Fine loop

Mostra: "Tutti i task completati! N/N implementati e committati."
