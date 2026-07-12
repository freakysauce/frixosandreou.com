# CLAUDE.md

Static hand-built site, no build step. Open index.html directly.

- Identity geometry: one parametric golden-spiral (assets/js/main.js, tools/export-brand.mjs) — change it in BOTH or extract before editing.
- Screenshots: append ?snap to the URL for deterministic final-state rendering; add &menu to open the mobile nav disclosure.
- FACTS.md (untracked) is the only source of biographical claims. Never invent bio details.
- Sentys numbers must match sentys.ai docs verbatim.
- Regenerate brand PNGs: node tools/export-brand.mjs, then screenshot tools/og.html (1200x630) and tools/banner.html (1584x396).
