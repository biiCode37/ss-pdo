# Graph Report - SS_PDO  (2026-08-06)

## Corpus Check
- 141 files · ~146,885 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1386 nodes · 1610 edges · 128 communities (109 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d17498e3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- server.cjs
- design_system.py
- analytics.ts
- Test-Driven Development (TDD)
- plugins
- compilerOptions
- dependencies
- compilerOptions
- Testing Skills With Subagents
- helper.js
- render-graphs.js
- stop-server.sh
- phantom-ui.d.ts
- start-server.sh
- tsconfig.json
- review-package
- sdd-workspace
- task-brief
- find-polluter.sh
- Subagent-Driven Development
- ui-ux-pro-max
- 🟠 SEDANG
- 🟠 SEDANG
- 🟡 MINOR / Keanehan
- 🟡 MINOR
- Using Git Worktrees
- Visual Companion Guide
- Creation Log: Systematic Debugging Skill
- Changelog
- Code Review Reception
- The Process
- Systematic Debugging
- Testing CLAUDE.md Skills Documentation
- Dispatching Parallel Agents
- Root Cause Tracing
- Persuasion Principles for Skill Design
- Writing Skills
- Writing Plans
- caveman/SKILL.md
- Defense-in-Depth Validation
- Verification Before Completion
- [Analysis Title]
- Executing Plans
- Returns: "OK" or lists conflicts
- Design Specification: Mobile Analytics Dashboard (SS_PDO)
- Aturan & Ketentuan Kerja untuk AI Coding Agent — Proyek SS_PDO
- Roadmap Menuju Aplikasi Production-Grade — Proyek SS_PDO
- Condition-Based Waiting
- Skill structure
- ADR 0001: Refactoring Antrean Sync Offline, Autentikasi, dan Dynamic UX Card
- ⚡ 2. Fitur & Keputusan Teknis Utama yang Telah Selesai (Completed)
- Core Architecture
- SS_PDO (Sistem Pencatatan Shift Bus)
- Brainstorming Ideas Into Designs
- Skill authoring best practices
- Core Architecture & Changes
- Supabase Route Registry & Metadata Architecture Design
- Aturan & Ketentuan Kerja untuk AI Coding Agent v2 — Proyek SS_PDO
- 🛡️ Aturan, Ketetapan, & Batasan Proyek SS_PDO
- Core Architecture
- Human-Friendly Error Handling & Sanitization Design
- Global Constraints
- Global Constraints
- Global Constraints
- Global Constraints
- Improvement v1.3 Design Spec: Offline Auto-Save & Skeleton Loaders
- Design Specification: Executive SSOT Analytics Dashboard (SS_PDO)
- Design Specification: Smooth Morphing Route Selector (SS_PDO)
- using-superpowers/SKILL.md
- Skill Discovery Optimization (SDO)
- Bulletproofing Skills Against Rationalization
- Global Constraints
- Global Constraints
- Daily TOA Trend Chart Design
- Desain Arsitektur Persistensi & Caching Komponen Tren TOA Harian (`DailyToaTrendCard`)
- Pressure Test 1: Emergency Production Fix
- Pressure Test 2: Sunk Cost + Exhaustion
- Pressure Test 3: Authority + Social Pressure
- anthropic-best-practices.md
- Anti-Patterns
- Testing All Skill Types
- RED-GREEN-REFACTOR for Skills
- Global Constraints
- Global Constraints
- Global Constraints
- Global Constraints
- codex-tools.md
- Pi Tool Mapping
- Evaluation and iteration
- Checklist for effective Skills
- Core principles
- File Organization
- Skill Types
- Global Constraints
- Global Constraints
- Antigravity CLI (`agy`) Tool Mapping
- Implementation Plan - Persistensi & Caching Komponen Tren TOA Harian
- spec-document-reviewer-prompt.md
- test-academic.md
- plan-document-reviewer-prompt.md
- rules/graphify.md
- workflows/graphify.md
- Subagent-Driven Development Progress Ledger
- routeService.ts
- Supabase Integration & Metadata Catalog Design Specification
- Global Constraints
- devDependencies
- Daftar Masalah v3 — Proyek SS_PDO / SPUM (Sistem Pencatatan Shift Bus)
- Rekomendasi Solusi v3 — Proyek SS_PDO / SPUM
- Design Spec: Mobile Touch Swipe & Infinite Navigation
- Aturan & Ketentuan Kerja untuk AI Coding Agent v3 — Proyek SS_PDO / SPUM
- Global Constraints
- scripts
- package.json
- @types/react-dom
- vite
- vite-plugin-pwa
- vitest
- BusData
- googleSheets.ts
- UnitSummaryDashboard.tsx
- App.tsx
- Dashboard.tsx
- Design Specification: Halaman Ringkasan Per Unit (Read-Only Unit Dashboard)
- Global Constraints
- @types/gapi.auth2

## God Nodes (most connected - your core abstractions)
1. `Writing Skills` - 23 edges
2. `BusData` - 19 edges
3. `compilerOptions` - 18 edges
4. `react` - 17 edges
5. `Testing Skills With Subagents` - 16 edges
6. `compilerOptions` - 15 edges
7. `Code Review Reception` - 15 edges
8. `Subagent-Driven Development` - 15 edges
9. `Test-Driven Development (TDD)` - 15 edges
10. `handleRequest()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Props` --references--> `BusData`  [EXTRACTED]
  src/components/AnalyticsDashboard.tsx → src/services/googleSheets.ts
- `Props` --references--> `BusData`  [EXTRACTED]
  src/components/UnitDetailModal.tsx → src/services/googleSheets.ts
- `Props` --references--> `BusData`  [EXTRACTED]
  src/components/UnitSummaryDashboard.tsx → src/services/googleSheets.ts
- `App()` --calls--> `checkSignedIn()`  [EXTRACTED]
  src/App.tsx → src/services/googleSheets.ts
- `BusCardComponent()` --calls--> `formatUserError()`  [EXTRACTED]
  src/components/BusCard.tsx → src/utils/errorFormatter.ts

## Import Cycles
- None detected.

## Communities (128 total, 19 thin omitted)

### Community 0 - "server.cjs"
Cohesion: 0.06
Nodes (55): bootstrapPage(), brandMarkup(), broadcast(), browserLauncherForPlatform(), chmodOwnerOnly(), clients, companionUrl(), computeAcceptKey() (+47 more)

### Community 1 - "design_system.py"
Cohesion: 0.06
Nodes (42): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+34 more)

### Community 2 - "analytics.ts"
Cohesion: 0.16
Nodes (16): AnalyticsDashboard(), Props, CompletionStatusCard(), Props, KPICard(), Props, Props, ShiftComparisonCard() (+8 more)

### Community 3 - "Test-Driven Development (TDD)"
Cohesion: 0.05
Nodes (38): Common Rationalizations, Debugging Integration, Example: Bug Fix, Final Rule, Good Tests, GREEN - Minimal Code, Overview, Red Flags - STOP and Start Over (+30 more)

### Community 4 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 5 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx (+15 more)

### Community 6 - "dependencies"
Cohesion: 0.13
Nodes (15): @aejkatappaja/phantom-ui, gapi-script, lucide-react, dependencies, @aejkatappaja/phantom-ui, gapi-script, lucide-react, react (+7 more)

### Community 7 - "compilerOptions"
Cohesion: 0.10
Nodes (19): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+11 more)

### Community 8 - "Testing Skills With Subagents"
Cohesion: 0.06
Nodes (29): 1. Explicit Negation in Rules, 2. Entry in Rationalization Table, 3. Red Flag Entry, 4. Update description, Common Mistakes (Same as TDD), Example: TDD Skill Bulletproofing, GREEN Phase: Write Minimal Skill (Make It Pass), Initial Test (Failed) (+21 more)

### Community 9 - "helper.js"
Cohesion: 0.42
Nodes (7): connect(), nextReconnectDelay(), reloadAfterRecovery(), sessionKey(), setStatus(), showTombstone(), websocketUrl()

### Community 10 - "render-graphs.js"
Cohesion: 0.33
Nodes (8): combineGraphs(), { execSync }, extractDotBlocks(), extractGraphBody(), fs, main(), path, renderToSvg()

### Community 11 - "stop-server.sh"
Cohesion: 0.43
Nodes (4): command_has_server_id(), is_brainstorm_server(), mark_stopped(), stop-server.sh script

### Community 13 - "phantom-ui.d.ts"
Cohesion: 0.50
Nodes (3): IntrinsicElements, JSX, react/jsx-runtime

### Community 21 - "Subagent-Driven Development"
Cohesion: 0.07
Nodes (25): Code Reviewer Prompt Template, Example Output, Example, How to Request, Integration with Workflows, Red Flags, Requesting Code Review, When to Request Review (+17 more)

### Community 22 - "ui-ux-pro-max"
Cohesion: 0.07
Nodes (29): Accessibility, Available Domains, Available Stacks, Common Rules for Professional UI, Example Workflow, How to Use This Skill, Icons & Visual Elements, Interaction (+21 more)

### Community 23 - "🟠 SEDANG"
Cohesion: 0.08
Nodes (25): BUG-18 — ❌ DICABUT (retracted): "KM Awal/Akhir tidak pernah tersimpan", BUG-19 — Race condition saat berpindah tab/tanggal dengan cepat, BUG-20 — `calculateAnalytics` salah mem-parsing angka berformat Indonesia, BUG-21 — `getMonthlyToaTrend` membulatkan nilai TOA, melanggar aturan emas SSOT, BUG-22 — "Gunakan Data Server" tidak benar-benar memuat ulang data terbaru, BUG-23 — `onAuthError` tidak pernah dihubungkan, kegagalan auth saat sync tetap senyap, BUG-24 — Tidak ada penjadwalan retry otomatis untuk item yang gagal sementara, BUG-25 — Delay retry tetap dieksekusi meski item sudah ditandai 'failed' (+17 more)

### Community 24 - "🟠 SEDANG"
Cohesion: 0.08
Nodes (24): Kelompok Perbaikan (untuk perencanaan implementasi v2), 🔴 KRITIS, 🟡 MINOR, Rekomendasi Solusi v2 — Proyek SS_PDO (Sistem Pencatatan Shift Bus), 🟠 SEDANG, Solusi BUG-18 — ❌ DICABUT, tidak perlu tindakan, Solusi BUG-19 — Race condition ganti tab/tanggal, Solusi BUG-20 — Parsing angka salah di `calculateAnalytics` (+16 more)

### Community 25 - "🟡 MINOR / Keanehan"
Cohesion: 0.09
Nodes (21): BUG-01 — Race condition di antrean sync menghapus edit terbaru, BUG-02 — Antrean offline tidak punya deteksi konflik/collision, BUG-03 — Head-of-line blocking: satu error memblokir seluruh antrean permanen, BUG-04 — Tombol login macet permanen (infinite spinner) jika popup Google ditutup, BUG-05 — Kegagalan silent per-kolom saat header sheet tidak terdeteksi, BUG-06 — False positive "Tabrakan Data" untuk perubahan milik sendiri, BUG-07 — Field Manual Shift 1/2 & Keterangan tak bisa diedit dalam mode filter kategori, BUG-08 — Badge antrean sinkronisasi duplikat, salah satunya rusak tampilannya (+13 more)

### Community 26 - "🟡 MINOR"
Cohesion: 0.09
Nodes (21): Kelompok Perbaikan (untuk perencanaan implementasi), 🔴 KRITIS, 🟡 MINOR, Rekomendasi Solusi — Proyek SS_PDO (Sistem Pencatatan Shift Bus), 🟠 SEDANG, Solusi BUG-01 — Race condition di antrean sync, Solusi BUG-02 — Tidak ada deteksi konflik di jalur antrean offline, Solusi BUG-03 — Head-of-line blocking (+13 more)

### Community 27 - "Using Git Worktrees"
Cohesion: 0.10
Nodes (20): 1a. Native Worktree Tools (preferred), 1b. Git Worktree Fallback, Assuming directory location, Common Mistakes, Create the Worktree, Directory Selection, Fighting the harness, Overview (+12 more)

### Community 28 - "Visual Companion Guide"
Cohesion: 0.10
Nodes (19): Browser Events Format, Cards (visual designs), Cleaning Up, CSS Classes Available, Design Tips, File Naming, How It Works, Mock elements (wireframe building blocks) (+11 more)

### Community 29 - "Creation Log: Systematic Debugging Skill"
Cohesion: 0.10
Nodes (19): Bulletproofing Elements, Creation Log: Systematic Debugging Skill, Enhancement 1: TDD Reference, Extraction Decisions, Final Outcome, Initial Version, Iterations, Key Insight (+11 more)

### Community 30 - "Changelog"
Cohesion: 0.11
Nodes (18): [1.0.0] - Initial Release, [1.2.0] - (Earlier), [1.3.0] - 2026-07-14, [1.4.0] - 2026-07-14, [1.5.0] - 2026-07-26, [1.6.0] - 2026-08-02, Added, Added (+10 more)

### Community 31 - "Code Review Reception"
Cohesion: 0.11
Nodes (17): Acknowledging Correct Feedback, Code Review Reception, Common Mistakes, Forbidden Responses, From External Reviewers, From your human partner, GitHub Thread Replies, Gracefully Correcting Your Pushback (+9 more)

### Community 32 - "The Process"
Cohesion: 0.12
Nodes (16): Common Mistakes, Finishing a Development Branch, Option 1: Merge Locally, Option 2: Push and Create PR, Option 3: Keep As-Is, Option 4: Discard, Overview, Quick Reference (+8 more)

### Community 33 - "Systematic Debugging"
Cohesion: 0.12
Nodes (16): Common Rationalizations, Overview, Phase 1: Root Cause Investigation, Phase 2: Pattern Analysis, Phase 3: Hypothesis and Testing, Phase 4: Implementation, Quick Reference, Real-World Impact (+8 more)

### Community 34 - "Testing CLAUDE.md Skills Documentation"
Cohesion: 0.12
Nodes (16): Documentation Variants to Test, Expected Results, Next Steps, NULL (Baseline - no skills doc), Scenario 1: Time Pressure + Confidence, Scenario 2: Sunk Cost + Works Already, Scenario 3: Authority + Speed Bias, Scenario 4: Familiarity + Efficiency (+8 more)

### Community 35 - "Dispatching Parallel Agents"
Cohesion: 0.12
Nodes (15): 1. Identify Independent Domains, 2. Create Focused Agent Tasks, 3. Dispatch in Parallel, 4. Review and Integrate, Agent Prompt Structure, Common Mistakes, Dispatching Parallel Agents, Key Benefits (+7 more)

### Community 36 - "Root Cause Tracing"
Cohesion: 0.12
Nodes (15): 1. Observe the Symptom, 2. Find Immediate Cause, 3. Ask: What Called This?, 4. Keep Tracing Up, 5. Find Original Trigger, Adding Stack Traces, Finding Which Test Causes Pollution, Key Principle (+7 more)

### Community 37 - "Persuasion Principles for Skill Design"
Cohesion: 0.12
Nodes (15): 1. Authority, 2. Commitment, 3. Scarcity, 4. Social Proof, 5. Unity, 6. Reciprocity, 7. Liking, Ethical Use (+7 more)

### Community 38 - "Writing Skills"
Cohesion: 0.12
Nodes (16): Code Examples, Common Rationalizations for Skipping Testing, Directory Structure, Discovery Workflow, Flowchart Usage, Match the Form to the Failure, Overview, Skill Creation Checklist (TDD Adapted) (+8 more)

### Community 39 - "Writing Plans"
Cohesion: 0.15
Nodes (12): Bite-Sized Task Granularity, Execution Handoff, File Structure, No Placeholders, Overview, Plan Document Header, Remember, Scope Check (+4 more)

### Community 40 - "caveman/SKILL.md"
Cohesion: 0.17
Nodes (10): caveman, Example output, How to invoke, See also, What it does, Auto-Clarity, Boundaries, Intensity (+2 more)

### Community 41 - "Defense-in-Depth Validation"
Cohesion: 0.17
Nodes (11): Applying the Pattern, Defense-in-Depth Validation, Example from Session, Key Insight, Layer 1: Entry Point Validation, Layer 2: Business Logic Validation, Layer 3: Environment Guards, Layer 4: Debug Instrumentation (+3 more)

### Community 42 - "Verification Before Completion"
Cohesion: 0.17
Nodes (11): Common Failures, Key Patterns, Overview, Rationalization Prevention, Red Flags - STOP, The Bottom Line, The Gate Function, The Iron Law (+3 more)

### Community 43 - "[Analysis Title]"
Cohesion: 0.17
Nodes (12): Advanced: Skills with executable code, [Analysis Title], Anti-patterns to avoid, Avoid offering too many options, Avoid Windows-style paths, Conditional workflow pattern, Examples pattern, Executive summary (+4 more)

### Community 44 - "Executing Plans"
Cohesion: 0.18
Nodes (10): Executing Plans, Integration, Overview, Remember, Step 1: Load and Review Plan, Step 2: Execute Tasks, Step 3: Complete Development, The Process (+2 more)

### Community 45 - "Returns: "OK" or lists conflicts"
Cohesion: 0.18
Nodes (11): Avoid assuming tools are installed, Create verifiable intermediate outputs, MCP tool references, Next steps, Package dependencies, Returns: "OK" or lists conflicts, Runtime environment, Technical notes (+3 more)

### Community 46 - "Design Specification: Mobile Analytics Dashboard (SS_PDO)"
Cohesion: 0.18
Nodes (10): 1. Ringkasan Fitur (Feature Overview), 2.1 Struktur Komponen Baru, 2.2 Alur Data (Data Flow), 2. Arsitektur Komponen & Alur Data (Architecture & Component Hierarchy), 3.1 Bottom Navigation Bar (`BottomNav.tsx`), 3.2 Halaman Dashboard (`AnalyticsDashboard.tsx`), 3. Spesifikasi UI & Layout Mobile-First, 4. Penanganan Edge Cases & Keandalan (Edge Cases & Error Handling) (+2 more)

### Community 47 - "Aturan & Ketentuan Kerja untuk AI Coding Agent — Proyek SS_PDO"
Cohesion: 0.18
Nodes (10): 1. Tujuan, 2. Urutan Prioritas Pengerjaan, 3. Prinsip Kerja Utama, 4. Batasan Teknis (Wajib Dipatuhi), 5. Standar Konsistensi Kode, 6. Larangan Eksplisit, 7. Definition of Done per Bug, 8. Kapan Harus Berhenti dan Bertanya ke Manusia (+2 more)

### Community 48 - "Roadmap Menuju Aplikasi Production-Grade — Proyek SS_PDO"
Cohesion: 0.18
Nodes (10): 1. Keamanan, 2. Arsitektur & Backend, 3. Kualitas Kode & Proses Rekayasa, 4. Frontend & UX, 5. Observability & Operasional, 6. Kelengkapan Fitur Produk, Jika hanya bisa mulai dari 3 hal, Peta Jalan Bertahap (+2 more)

### Community 49 - "Condition-Based Waiting"
Cohesion: 0.20
Nodes (9): Common Mistakes, Condition-Based Waiting, Core Pattern, Implementation, Overview, Quick Patterns, Real-World Impact, When Arbitrary Timeout IS Correct (+1 more)

### Community 50 - "Skill structure"
Cohesion: 0.20
Nodes (10): Avoid deeply nested references, Naming conventions, Pattern 1: High-level guide with references, Pattern 2: Domain-specific organization, Pattern 3: Conditional details, Progressive disclosure patterns, Skill structure, Structure longer reference files with table of contents (+2 more)

### Community 51 - "ADR 0001: Refactoring Antrean Sync Offline, Autentikasi, dan Dynamic UX Card"
Cohesion: 0.20
Nodes (9): 1. Atomic Queue Operations & Collision Guard, 2. Robust Google API Auth Lifecycle, 3. Fallback Parsing `KM 1` & `KM 2`, 4. Visual UX Redesign: Subtitle Dinamis per-Tab Kategori, ADR 0001: Refactoring Antrean Sync Offline, Autentikasi, dan Dynamic UX Card, Keputusan Arsitektur & Teknikal, Konsekuensi, Konteks (+1 more)

### Community 52 - "⚡ 2. Fitur & Keputusan Teknis Utama yang Telah Selesai (Completed)"
Cohesion: 0.20
Nodes (9): 🏗️ 1. Gambaran Umum Proyek, ⚡ 2. Fitur & Keputusan Teknis Utama yang Telah Selesai (Completed), 📁 3. File Utama & Struktur Kode, 🎯 4. Cara Penggunaan Dokumen Ini dalam Sesi Baru, A. Autentikasi & Sesi Pengguna (Persistent Auth Session), B. Form Pemilihan Rute & Tanggal (Morphing Selector Card - iOS Style), C. Kartu Analitik & Nilai Rangkuman Murni (Pure SSOT Summary), D. Kartu Status Kelengkapan Armada & Auto-Scroll Highlight (+1 more)

### Community 53 - "Core Architecture"
Cohesion: 0.20
Nodes (9): 1. Data Structure (Queue), 2. Failure Catching, 3. Sync Engine (Auto-Execution), 4. UI Components, Context & Purpose, Core Architecture, Error Handling & Edge Cases, Offline Auto-Sync Design Spec (+1 more)

### Community 54 - "SS_PDO (Sistem Pencatatan Shift Bus)"
Cohesion: 0.20
Nodes (9): 📄 Dokumentasi Tambahan, 🌟 Fitur Utama, 🔑 Konfigurasi Lingkungan (Environment Variables), 💻 Menjalankan Aplikasi, Mode Development, 🚀 Prasyarat & Instalasi, SS_PDO (Sistem Pencatatan Shift Bus), 🛠️ Teknologi (Tech Stack) (+1 more)

### Community 55 - "Brainstorming Ideas Into Designs"
Cohesion: 0.22
Nodes (8): After the Design, Anti-Pattern: "This Is Too Simple To Need A Design", Brainstorming Ideas Into Designs, Checklist, Key Principles, Process Flow, The Process, Visual Companion

### Community 56 - "Skill authoring best practices"
Cohesion: 0.22
Nodes (9): Avoid time-sensitive information, Common patterns, Content guidelines, Implement feedback loops, Skill authoring best practices, Template pattern, Use consistent terminology, Use workflows for complex tasks (+1 more)

### Community 57 - "Core Architecture & Changes"
Cohesion: 0.22
Nodes (8): 1. Validasi Logika Input (Mencegah *Human Error*), 2. Pencegahan Spam & Kuota API (*System Rate Limiting*), 3. Keamanan Sesi & Kredensial (*Security*), 4. Resolusi Konflik Sinkronisasi Offline (*Data Integrity*), Context & Purpose, Core Architecture & Changes, Improvement v1.2 Design Spec (Keamanan & Validasi), Scope Check

### Community 58 - "Supabase Route Registry & Metadata Architecture Design"
Cohesion: 0.22
Nodes (8): 1. Overview & Objectives, 2. Database Schema (Supabase PostgreSQL), 3. Architecture & Offline Caching Policy, 4. UI/UX Component Specifications, A. Katalog Rute & File SS (`routes` & `route_sheets`), B. Profil Pengguna & Audit Log (`user_profiles` & `activity_logs`), C. Cadangan Antrean Offline & Log Error (`sync_queue_backups` & `error_logs`), Supabase Route Registry & Metadata Architecture Design

### Community 59 - "Aturan & Ketentuan Kerja untuk AI Coding Agent v2 — Proyek SS_PDO"
Cohesion: 0.22
Nodes (8): 1. Tujuan, 2. Catatan: BUG-18 Dicabut, 3. Urutan Prioritas, 4. Prinsip Kerja Utama (melanjutkan v1), 5. Batasan Teknis Tambahan, 6. Kapan Harus Berhenti dan Bertanya ke Manusia (tambahan), 7. Pelaporan Progres, Aturan & Ketentuan Kerja untuk AI Coding Agent v2 — Proyek SS_PDO

### Community 60 - "🛡️ Aturan, Ketetapan, & Batasan Proyek SS_PDO"
Cohesion: 0.22
Nodes (8): 📱 1. Layout & Tampilan (Mobile-First Priority), 📊 2. Integritas Data (Single Source of Truth - SSOT), 🔐 3. Autentikasi & Sesi Login, 🛠️ 4. Tooling & Paket Manager (Wajib PNPM), 🎨 5. Standar UI/UX & Animasi Fluid (iOS Style), 💬 6. Komunikasi & Workflow Kerja, ⚡ 7. Penggunaan Skill Wajib (Ponytail & Graphify), 🛡️ Aturan, Ketetapan, & Batasan Proyek SS_PDO

### Community 61 - "Core Architecture"
Cohesion: 0.25
Nodes (7): 1. Manual Theme Toggle, 2. Global Offline Banner, 3. Pull-to-Refresh, Context & Purpose, Core Architecture, PDO Mobile v1.1 - UX & Reliability Improvements, Scope Check

### Community 62 - "Human-Friendly Error Handling & Sanitization Design"
Cohesion: 0.25
Nodes (7): 1. `src/utils/errorFormatter.ts` [NEW], Affected Files, Component Design, Human-Friendly Error Handling & Sanitization Design, Overview, Requirements & Constraints, Verification Plan

### Community 63 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Global Constraints, Task 1: Validasi Data (Pencegahan Typo), Task 2: Progres Harian & Filter Pintar, Task 3: UI/UX Polish & Animasi, User Review Required, UX, Validation, and Polish Implementation Plan

### Community 64 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Executive SSOT Analytics Dashboard Implementation Plan, Global Constraints, Task 1: Google Sheets Summary Parser (`src/services/googleSheets.ts`), Task 2: SSOT Analytics Calculator (`src/utils/analytics.ts`), Task 3: Executive Formatting UI (`KPICard.tsx`, `ShiftComparisonCard.tsx`), Task 4: Integration in `src/components/Dashboard.tsx` and `AnalyticsDashboard.tsx`

### Community 65 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Global Constraints, Mobile Analytics Dashboard Implementation Plan, Task 1: Analytics Calculation Utility (`src/utils/analytics.ts`), Task 2: Mobile Bottom Navigation Bar (`src/components/BottomNav.tsx`), Task 3: Analytics Display Cards & Container (`AnalyticsDashboard.tsx`), Task 4: Main Dashboard Integration (`src/components/Dashboard.tsx`)

### Community 66 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Global Constraints, Human-Friendly Error Handling & Sanitization Implementation Plan, Task 1: Create Centralized Error Sanitizer Utility (`errorFormatter.ts`), Task 2: Refactor `src/App.tsx` Error Handling, Task 3: Refactor `src/components/LoginScreen.tsx` Error Handling, Task 4: Refactor `src/components/Dashboard.tsx` Error Handling

### Community 67 - "Improvement v1.3 Design Spec: Offline Auto-Save & Skeleton Loaders"
Cohesion: 0.29
Nodes (6): 1. Auto-save Drafts (Pendekatan Per-Component LocalStorage), 2. UX Visibilitas Offline (Kombinasi Floating Badge & Modal), 3. Skeleton Loader (Menggunakan Phantom UI), Context & Purpose, Improvement v1.3 Design Spec: Offline Auto-Save & Skeleton Loaders, Verifikasi dan Test Plan

### Community 68 - "Design Specification: Executive SSOT Analytics Dashboard (SS_PDO)"
Cohesion: 0.29
Nodes (6): 1. Ringkasan Fitur (Feature Overview), 2.1 Peta Rumus Baku Excel, 2.2 Alur Data Hybrid SSOT, 2. Arsitektur Data & Rumus Baku Excel, 3. Rencana Verifikasi (Verification Plan), Design Specification: Executive SSOT Analytics Dashboard (SS_PDO)

### Community 69 - "Design Specification: Smooth Morphing Route Selector (SS_PDO)"
Cohesion: 0.29
Nodes (6): 1. Ringkasan Fitur (Feature Overview), 2.1 Komponen Baru: `src/components/RouteSelectorCard.tsx`, 2.2 Spesifikasi Animasi & CSS Morphing, 2. Arsitektur Komponen & Efek Morphing, 3. Rencana Verifikasi (Verification Plan), Design Specification: Smooth Morphing Route Selector (SS_PDO)

### Community 70 - "using-superpowers/SKILL.md"
Cohesion: 0.33
Nodes (5): Platform Adaptation, Red Flags, Skill Priority, The Rule, User Instructions

### Community 71 - "Skill Discovery Optimization (SDO)"
Cohesion: 0.33
Nodes (6): 1. Rich Description Field, 2. Keyword Coverage, 3. Descriptive Naming, 4. Token Efficiency (Critical), 5. Cross-Referencing Other Skills, Skill Discovery Optimization (SDO)

### Community 72 - "Bulletproofing Skills Against Rationalization"
Cohesion: 0.33
Nodes (6): Address "Spirit vs Letter" Arguments, Build Rationalization Table, Bulletproofing Skills Against Rationalization, Close Every Loophole Explicitly, Create Red Flags List, Update SDO for Violation Symptoms

### Community 73 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Global Constraints, Improvement v1.2 Implementation Plan, Task 1: Environment Variables & Security Cleanup, Task 2: Offline Auto-Sync Debouncing, Task 3: Input Validations & "Salin KM" Feature

### Community 74 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Global Constraints, Smooth Morphing Route Selector Implementation Plan, Task 1: Add Morphing CSS Animations (`src/index.css`), Task 2: Morphing Route Selector Component (`src/components/RouteSelectorCard.tsx`), Task 3: Integration into `src/components/Dashboard.tsx`

### Community 75 - "Daily TOA Trend Chart Design"
Cohesion: 0.33
Nodes (5): 1. Overview, 2. Requirements & Constraints, 3. Architecture & Affected Files, 4. Verification Plan, Daily TOA Trend Chart Design

### Community 76 - "Desain Arsitektur Persistensi & Caching Komponen Tren TOA Harian (`DailyToaTrendCard`)"
Cohesion: 0.33
Nodes (5): 1. Ringkasan Latar Belakang & Masalah, 2. Solusi Desain (_Persistent & Decoupled State_), 3. Komponen & Alur Data, 4. Rencana Verifikasi, Desain Arsitektur Persistensi & Caching Komponen Tren TOA Harian (`DailyToaTrendCard`)

### Community 77 - "Pressure Test 1: Emergency Production Fix"
Cohesion: 0.40
Nodes (4): Choose A, B, or C, Pressure Test 1: Emergency Production Fix, Scenario, Your Options

### Community 78 - "Pressure Test 2: Sunk Cost + Exhaustion"
Cohesion: 0.40
Nodes (4): Choose A, B, or C, Pressure Test 2: Sunk Cost + Exhaustion, Scenario, Your Options

### Community 79 - "Pressure Test 3: Authority + Social Pressure"
Cohesion: 0.40
Nodes (4): Choose A, B, or C, Pressure Test 3: Authority + Social Pressure, Scenario, Your Options

### Community 80 - "anthropic-best-practices.md"
Cohesion: 0.40
Nodes (4): [Analysis Title], Executive summary, Key findings, Recommendations

### Community 81 - "Anti-Patterns"
Cohesion: 0.40
Nodes (5): Anti-Patterns, ❌ Code in Flowcharts, ❌ Generic Labels, ❌ Multi-Language Dilution, ❌ Narrative Example

### Community 82 - "Testing All Skill Types"
Cohesion: 0.40
Nodes (5): Discipline-Enforcing Skills (rules/requirements), Pattern Skills (mental models), Reference Skills (documentation/APIs), Technique Skills (how-to guides), Testing All Skill Types

### Community 83 - "RED-GREEN-REFACTOR for Skills"
Cohesion: 0.40
Nodes (5): GREEN: Write Minimal Skill, Micro-Test Wording Before Full Scenarios, RED-GREEN-REFACTOR for Skills, RED: Write Failing Test (Baseline), REFACTOR: Close Loopholes

### Community 84 - "Global Constraints"
Cohesion: 0.40
Nodes (4): Global Constraints, Offline Auto-Sync Implementation Plan, Task 1: Create `useOfflineSync` Hook, Task 2: Implement Queue in Components

### Community 85 - "Global Constraints"
Cohesion: 0.40
Nodes (4): Global Constraints, Raw Pure SSOT Summary Metrics Implementation Plan, Task 1: Preserve Raw Floating-Point Precision (`src/services/googleSheets.ts` & `src/utils/analytics.ts`), Task 2: Display Pure Raw Decimal Values in UI (`src/components/KPICard.tsx`)

### Community 86 - "Global Constraints"
Cohesion: 0.40
Nodes (4): Global Constraints, Supabase Route Registry & Metadata Implementation Plan, Task 1: Setup Supabase Database Schema & Client Service, Task 2: Refactor RouteSelectorCard for Hierarchical Selection

### Community 87 - "Global Constraints"
Cohesion: 0.40
Nodes (4): Daily TOA Trend Chart Implementation Plan, Global Constraints, Task 1: Create Google Sheets Helper for Monthly Daily TOA Summaries, Task 2: Create `DailyToaTrendCard.tsx` Component

### Community 88 - "codex-tools.md"
Cohesion: 0.50
Nodes (3): Codex App Finishing, Environment Detection, Subagent dispatch requires multi-agent support

### Community 89 - "Pi Tool Mapping"
Cohesion: 0.50
Nodes (3): Pi Tool Mapping, Subagents, Task lists

### Community 90 - "Evaluation and iteration"
Cohesion: 0.50
Nodes (4): Build evaluations first, Develop Skills iteratively with the agent, Evaluation and iteration, Observe how agents navigate Skills

### Community 91 - "Checklist for effective Skills"
Cohesion: 0.50
Nodes (4): Checklist for effective Skills, Code and scripts, Core quality, Testing

### Community 92 - "Core principles"
Cohesion: 0.50
Nodes (4): Concise is key, Core principles, Set appropriate degrees of freedom, Test with all models you plan to use

### Community 93 - "File Organization"
Cohesion: 0.50
Nodes (4): File Organization, Self-Contained Skill, Skill with Heavy Reference, Skill with Reusable Tool

### Community 94 - "Skill Types"
Cohesion: 0.50
Nodes (4): Pattern, Reference, Skill Types, Technique

### Community 95 - "Global Constraints"
Cohesion: 0.50
Nodes (3): Global Constraints, Task 1: Update BusCard.tsx (Auto-Focus & Enter-to-Save), UI/UX Enter-to-Save & Auto-Focus Implementation Plan

### Community 96 - "Global Constraints"
Cohesion: 0.50
Nodes (3): Global Constraints, Persistent Auth Session Implementation Plan, Task 1: Update Auth Session Persistence (`src/services/googleSheets.ts`)

### Community 105 - "routeService.ts"
Cohesion: 0.17
Nodes (19): FlatRouteSheet, flattenRoutes(), MONTH_NAMES_ID, Props, RouteSelectorCard(), extractSheetId(), backupSyncQueue(), createRouteWithSheet() (+11 more)

### Community 106 - "Supabase Integration & Metadata Catalog Design Specification"
Cohesion: 0.17
Nodes (11): 1. Types & Client Initialization, 2. Service Layer (`src/services/routeService.ts`), 3. UI Component Layer, Application Architecture & Services Layer, Automated Verification, Database Schema (PostgreSQL / Supabase DDL), Goal, Manual Verification (+3 more)

### Community 107 - "Global Constraints"
Cohesion: 0.25
Nodes (7): Global Constraints, Supabase Integration Implementation Plan, Task 1: Install `@supabase/supabase-js` & Define TypeScript Types, Task 2: Implement Supabase Client & Route Service Layer, Task 3: Integrate User Profile Sync in Login Flow, Task 4: Connect RouteSelectorCard & Dashboard to Metadata Service, Task 5: Final Verification & Clean Build

### Community 108 - "devDependencies"
Cohesion: 0.13
Nodes (15): happy-dom, oxlint, devDependencies, happy-dom, oxlint, @types/gapi.client.sheets, @types/node, @types/react (+7 more)

### Community 109 - "Daftar Masalah v3 — Proyek SS_PDO / SPUM (Sistem Pencatatan Shift Bus)"
Cohesion: 0.13
Nodes (14): BUG-37 — Allowlist Supabase *fail-open*: user tak terdaftar tetap bisa login, BUG-38 — Auto re-auth tanpa gesture klik user, kemungkinan besar diblokir browser, BUG-39 — Swipe halaman memicu di area scroll kategori kolom, BUG-40 — Swipe halaman memicu di area scroll grafik tren TOA harian, BUG-41 — Rute+Bulan+Tahun digabung dalam satu dropdown teks, BUG-42 — Tidak ada penyimpanan rute & tanggal terakhir yang dikunjungi, BUG-43 — Skema & kebijakan RLS Supabase tidak ter-*version control*, BUG-44 — `.env.example` melabeli variabel Supabase sebagai "opsional" (+6 more)

### Community 110 - "Rekomendasi Solusi v3 — Proyek SS_PDO / SPUM"
Cohesion: 0.14
Nodes (13): Kelompok Perbaikan (untuk perencanaan implementasi v3), 🔴 KRITIS, 🟠 Proses & Dokumentasi, Rekomendasi Solusi v3 — Proyek SS_PDO / SPUM, 🟠 SEDANG, Solusi BUG-37 — Allowlist Supabase *fail-open*, Solusi BUG-38 — Auto re-auth tanpa gesture klik, Solusi BUG-39 & BUG-40 — Swipe halaman memicu di area scroll (kategori kolom & grafik tren) (+5 more)

### Community 111 - "Design Spec: Mobile Touch Swipe & Infinite Navigation"
Cohesion: 0.18
Nodes (10): 1. Overview & Goal, 2. Arsitektur & Komponen, 3. Logika Deteksi Gestur & Infinite Navigation, 4. Keamanan Edge Case & Interaktivitas, 5. Standar UI/UX & Animasi, A. Algoritma Pembeda Horizontal vs Vertikal, B. Rumus Infinite Swipe (Modular Wrap-Around), Design Spec: Mobile Touch Swipe & Infinite Navigation (+2 more)

### Community 112 - "Aturan & Ketentuan Kerja untuk AI Coding Agent v3 — Proyek SS_PDO / SPUM"
Cohesion: 0.25
Nodes (7): 1. Prioritas Tertinggi: Keamanan Auth (BUG-37, BUG-38), 2. Urutan Prioritas Setelah Bagian 1, 3. Prinsip Kerja Tambahan Khusus Babak Ini, 4. Batasan Teknis Tambahan, 5. Kapan Harus Berhenti dan Bertanya ke Manusia (tambahan), 6. Pelaporan Progres, Aturan & Ketentuan Kerja untuk AI Coding Agent v3 — Proyek SS_PDO / SPUM

### Community 113 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Global Constraints, Mobile Touch Swipe & Infinite Navigation Implementation Plan, Task 1: Komponen `SwipeableContainer.tsx` & Unit Test, Task 2: Integrasi Infinite Swipe pada Tab Utama (`Dashboard.tsx`), Task 3: Integrasi Swipe Navigasi Tanggal pada `RouteSelectorCard.tsx`, Task 4: Verifikasi & Graphify Update

### Community 114 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test

### Community 115 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 121 - "BusData"
Cohesion: 0.20
Nodes (20): BusCard, BusCardComponent(), Props, Props, useDebounce(), detectCollision(), isAuthError(), isNetworkError() (+12 more)

### Community 122 - "googleSheets.ts"
Cohesion: 0.31
Nodes (13): checkSignedIn(), detectHeaderRowAndBuildComposite(), ensureValidToken(), findColumnIndex(), getBusData(), getMonthlyToaTrend(), HEADER_KEYWORDS, isAuthError() (+5 more)

### Community 123 - "UnitSummaryDashboard.tsx"
Cohesion: 0.21
Nodes (11): Props, UnitCard, Props, UnitDetailModal(), Props, UnitSummaryDashboard(), calculateUnitMetrics(), extractUnitList() (+3 more)

### Community 124 - "App.tsx"
Cohesion: 0.28
Nodes (11): App(), LoginScreen(), Props, getGoogleCreds(), hasGoogleCreds(), initGoogleApi(), signIn(), signOut() (+3 more)

### Community 125 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (16): react, BottomNav(), BottomNavProps, BusList(), DailyToaTrendCard(), Props, Dashboard(), Props (+8 more)

### Community 126 - "Design Specification: Halaman Ringkasan Per Unit (Read-Only Unit Dashboard)"
Cohesion: 0.20
Nodes (9): 1. Navigasi Utamanya (`BottomNav.tsx`), 2. Tampilan Halaman Utama "Per Unit" (`UnitSummaryDashboard.tsx`), 3. Tampilan Modal Detail Armada (`UnitDetailModal.tsx`), Data Layer & Calculation Logic (`unitAnalytics.ts`), Design Specification: Halaman Ringkasan Per Unit (Read-Only Unit Dashboard), Goal & Purpose, System Architecture & User Flow, UI/UX Standards & Aesthetics (iOS Style) (+1 more)

### Community 127 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Global Constraints, Implementation Plan: Halaman Ringkasan Per Unit (Read-Only Unit Dashboard), Task 1: `unitAnalytics.ts` Abstraksi Logic Rekapitulasi Data Unit, Task 2: Komponen `UnitCard.tsx` & `UnitSummaryDashboard.tsx`, Task 3: Komponen `UnitDetailModal.tsx` (iOS-Style 90% Bottom Sheet), Task 4: Integrasi Tab Navigasi `mainTab === "units"` di `BottomNav.tsx` & `Dashboard.tsx`

## Knowledge Gaps
- **814 isolated node(s):** `crypto`, `http`, `fs`, `path`, `OPCODES` (+809 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Writing Skills` connect `Writing Skills` to `Skill Discovery Optimization (SDO)`, `Testing Skills With Subagents`, `Bulletproofing Skills Against Rationalization`, `Anti-Patterns`, `Testing All Skill Types`, `RED-GREEN-REFACTOR for Skills`, `File Organization`, `Skill Types`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `react` connect `Dashboard.tsx` to `plugins`, `routeService.ts`, `BusData`, `UnitSummaryDashboard.tsx`, `App.tsx`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `crypto`, `http`, `fs` to the rest of the system?**
  _814 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `server.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05868118572292801 - nodes in this community are weakly interconnected._
- **Should `design_system.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05576441102756892 - nodes in this community are weakly interconnected._
- **Should `Test-Driven Development (TDD)` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._