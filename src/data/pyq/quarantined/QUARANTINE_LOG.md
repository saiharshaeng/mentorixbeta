# Quarantine Log

| File | Reason | Date Quarantined | Action Required |
|------|--------|------------------|-----------------|
| jee_chemistry_bank.json | AI-generated: 92.3% answer 'a', truncated words ("pyruv acid", "lactic aci") | 2026-07-27 | Replace with real NTA data |
| jee_maths_bank.json | AI-generated: 93.7% answer 'a', truncated words ("equilater", "isoscel") | 2026-07-27 | Replace with real NTA data |
| NEET_biology_bank.json | 100% answer 'a' — corrupt OCR | 2026-07-27 | Full re-scrape needed |
| JEE_PYQ_2.json | 2594 questions, 100% missing answers | 2026-07-27 | Source answer keys |

**Quarantine policy**: Files in this log must NEVER be loaded by pyqService.js. Adding `quarantined: true` in master_index_v3.json is sufficient, but this log provides the human-readable audit trail.
