---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

## graphify

This project has a graphify knowledge graph at graphify-out/. Navigation order and limits follow `AGENTS.md` → "Golden Rule Efisiensi Token & Anti Over-Engineering" (section A). Summary:

- Location already known → targeted read (offset/limit) of that part only.
- Location or relationships unknown → run the CLI directly: `graphify query "<question>"`, `graphify path "<A>" "<B>"`, `graphify explain "<concept>"`. Output is capped (~2k tokens); narrow the query instead of raising the budget.
- Exact literal (column name, text key, symbol) → targeted grep (`files_with_matches`/`count` first); cheaper and exact.
- Full-file reads / broad grep → last resort. Read graphify-out/GRAPH_REPORT.md only for broad architecture review.
- Graph results are hints, not proof: confirm against the real code before concluding or editing. The graph can lag behind edits made in the current session.
- After modifying code files, run `graphify update .` (AST-only, no API cost).
