# 1. Remove the breaking YAML frontmatter from root AGENTS.md
@"
# CampusBridge AI (PS-06) — Engineering Rules
- Consult ./campusbridge_ai_prd_v1_1.md for schemas, APIs, and architecture.
- Consult ./DESIGN.md for all UI work ("Warm Institutional Studio").
- Keep hard eligibility (MEETS/DOES_NOT_MEET/UNKNOWN) and fit scoring 100% deterministic in Python/SQL.
- Every skill or match claim must include source_document_id, source_span, and evidence_status.
"@ | Set-Content .\AGENTS.md

# 2. Move the heavy cloned skills out of .agents/skills temporarily (pdf & webapp-testing have binary/python sub-files that crash the indexer)
Move-Item .\.agents\skills\pdf "$env:TEMP\pdf-backup" -Force -ErrorAction SilentlyContinue
Move-Item .\.agents\skills\webapp-testing "$env:TEMP\webapp-testing-backup" -Force -ErrorAction SilentlyContinue