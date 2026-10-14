# SchemeSetu: Government Scheme-Matching Assistant
**Capabl Agentic AI Hackathon (Track A · A4: Conversational & RAG-Powered Assistants)**

A conversational, rule-based, and RAG-powered government scheme matching assistant with explainability, near-miss detection, multi-language support (English, Hindi, Kannada), and required documents checklists.

---

## Key Features

1. **Adaptive Profile Intake (5–8 Questions) & Dynamic Early-Exit**:
   - Collects age, income, occupation, category, state, gender, education, plus conditional fields (e.g. land holding for farmers or enterprise type for entrepreneurs).
   - Continuous possibility space tracking: clean early exit to universal welfare schemes if targeted schemes are eliminated.
2. **Rule-Based Deterministic Eligibility Engine**:
   - Explicit Python rules evaluate age, income caps, categories, genders, states, occupations.
   - Per-criterion ternary logic: `PASS`, `FAIL`, `UNKNOWN`.
   - 4-Tier verdicts: `ELIGIBLE`, `POSSIBLE`, `NEAR-MISS`, `NOT_ELIGIBLE`.
3. **100% Uptime Explainability with Jinja2**:
   - Deterministic explanation templates format exact criterion audit ticks (`✓` or `✗`) comparing user values to requirements.
   - Stylistic Gemini LLM wrapper with invariant guard (preserves exact amounts and scheme names; 100% offline fallback).
4. **Quantitative Near-Miss Detection**:
   - For schemes with exactly one failed criterion, reveals exact numeric gap (e.g. "₹50,000 above the ₹8L cap") or immutable barrier.
5. **Multi-Factor Ranking Formula**:
   - `0.5 · log10(Benefit ₹) + 0.3 · Specificity + 0.2 · Ease (fewer documents)`.
6. **Grounding & RAG Retrieval**:
   - BM25 (`rank-bm25`) + exact acronym keyword boosting over scheme dataset chunks.
   - Strict fallback to official portal URLs if confidence is low.
7. **Compulsory Add-on (Feature 7): Required Documents Checklist**:
   - Explicit checklist rendered on all result cards, follow-up RAG queries, and printable reports.

---

## Verified Scheme Dataset (19 Schemes)

1. **PMEGP** (Prime Minister's Employment Generation Programme) [verify: true]
2. **MUDRA - Shishu**
3. **MUDRA - Kishor**
4. **MUDRA - Tarun**
5. **Stand-Up India**
6. **PM Vishwakarma Scheme** [verify: true]
7. **PM SVANidhi** [verify: true]
8. **CGTMSE**
9. **Post-Matric Scholarship for SC Students** [verify: true]
10. **National Means-cum-Merit Scholarship (NMMSS)**
11. **Pradhan Mantri Uchchatar Shiksha Protsahan (PM-USP)**
12. **AICTE Pragati Scholarship for Girl Students** [verify: true]
13. **PM-KISAN** (Pradhan Mantri Kisan Samman Nidhi)
14. **Kisan Credit Card (KCC)**
15. **PM Fasal Bima Yojana (PMFBY)** [verify: true]
16. **Atal Pension Yojana (APY)**
17. **Sukanya Samriddhi Yojana (SSY)**
18. **PM Ujjwala Yojana (PMUY)**
19. **Ayushman Bharat (PM-JAY)**
20. **Karnataka Yuva Nidhi Scheme** [verify: true]

---

## Running the Application

### 1. Run Python Unit & E2E Tests
```bash
PYTHONPATH=backend pytest backend/tests/
```
All 27 test cases will execute and pass:
- `test_dataset_schema.py`
- `test_eligibility.py`
- `test_near_miss.py`
- `test_ranking.py`
- `test_conversation_flow.py`
- `test_rag.py`
- `test_api_endpoints.py`
- `test_e2e_scenarios.py`

### 2. Start the Backend Server
```bash
PYTHONPATH=backend python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 3. Start the Frontend
```bash
npm run dev
```
Open `http://localhost:3000` to interact with SchemeSetu.
