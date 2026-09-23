# BorderGuard AI: Complete GitHub Workflow & Repository Management Plan
**Project Name**: `border-surveillance-ai`  
**Target Platform**: Smart India Hackathon (SIH)  
**Team Leader & Primary Reviewer**: Neel  
**Team Members**: Neel, Vivek, Dax, Rajveer, Earm, Shubham  

---

## 1. Repository Structure

```
border-surveillance-ai/
├── frontend/                  # React.js + Tailwind CSS Security Operations Center (SOC)
├── backend/                   # FastAPI REST API, WebSocket Gateway & Business Logic
├── ai-engine/                 # Python Computer Vision, YOLOv8, ByteTrack & Zone Math
├── database/                  # PostgreSQL DDL Schemas, Migrations & Seed Data
├── docs/                      # Technical Architecture, API Specs, and Workflow Guides
├── tests/                     # End-to-End Integration & Multi-Service System Tests
├── storage/                   # Local Forensic Evidence Store (Snapshots & Clips)
├── .github/                   # PR Templates & GitHub Actions CI Workflows
├── .gitignore                 # Exclusion Rules for Python, Node, OS & Secrets
├── .env.example               # Environment Variables Template
└── README.md                  # Master Project Overview & SIH Jury Summary
```

### Purpose of Every Folder & Root File
1. **`frontend/`**:
   - Contains the single-page application built with React, Vite, and Tailwind CSS.
   - Houses UI components, interactive HTML5 polygon zone canvas, live surveillance matrix player, real-time alert triage feed, and forensic audit viewers.
   - Handled primarily by **Earm** (UI/UX) and **Shubham** (API & WebSocket integration).
2. **`backend/`**:
   - Contains the FastAPI core application.
   - Manages asynchronous database operations (SQLAlchemy + asyncpg/aiosqlite), JWT authentication, camera and zone CRUD, evidence file serving, and the low-latency WebSocket connection manager (`/ws/alerts`).
   - Handled primarily by **Neel** (Architecture & Endpoints) and **Vivek** (Integration).
3. **`ai-engine/`**:
   - Contains the computer vision pipeline.
   - Manages multi-threaded RTSP frame ingestion, synthetic video simulations, YOLOv8 object detection, ByteTrack multi-object tracking, Shapely polygon containment calculations, and incident snapshot generation.
   - Handled primarily by **Dax** (Detection) and **Rajveer** (Tracking & Zone Breaches).
4. **`database/`**:
   - Contains `init.sql` (table definitions, UUID extensions, and B-tree indexes) and `seed_data.sql` (sample border surveillance outposts, restricted zones, and officer logins).
   - Handled by **Neel** and supported by **Vivek**.
5. **`docs/`**:
   - Contains documentation including architecture specifications, OpenAPI REST contracts, AI pipeline logic, deployment guides, and SIH jury presentation pitch scripts.
6. **`tests/`**:
   - Houses cross-module integration tests verifying the full event lifecycle: `CCTV -> AI -> Webhook -> Backend -> WebSocket -> Dashboard`.
7. **`storage/`**:
   - Houses generated forensic snapshots (`/snapshots`) and video clips (`/clips`).
   - Automatically ignored by git except for sample evidence test assets.
8. **`.gitignore`**:
   - Prevents virtual environments, `node_modules`, sensitive `.env` files, local SQLite databases, and large model weights from polluting the GitHub repository.
9. **`README.md`**:
   - Central document explaining the project problem statement, architecture, team roster, and 3-step setup instructions for SIH evaluators.

---

## 2. Branch Structure

To maintain extreme stability for hackathon evaluation while enabling 6 developers to write code simultaneously without blocking one another, we use a structured **GitHub Flow with Integration Branch (`develop`)**.

```
[main] ─────────────────────────────────────────────────────────────► (STABLE DEMO READY)
  │                                                              ▲
  └──► [develop] ───────────────────────────────────────────┐    │ (Neel Merges via PR)
         │                                                  ▼    │
         ├──► [feature/ai-detection]        (Dax)      ───► PR ──┤
         ├──► [feature/ai-tracking]         (Rajveer)  ───► PR ──┤
         ├──► [feature/backend-api]         (Neel)     ───► PR ──┤
         ├──► [feature/database]            (Neel)     ───► PR ──┤
         ├──► [feature/frontend-ui]         (Earm)     ───► PR ──┤
         └──► [feature/frontend-integration](Shubham)  ───► PR ──┘
```

### The Branches & Their Purpose

| Branch Name | Primary Owner | Scope & Permitted Code | Exit / Merge Trigger |
|---|---|---|---|
| **`main`** | **Neel** | **Production & Live SIH Demo Only.** Must always build, run with 0 errors, and pass all tests. Direct commits strictly forbidden. | Merged only before team milestones and final hackathon evaluation. |
| **`develop`** | **Neel** | **Central Team Integration Branch.** Feature branches merge here after Neel's code review. | Merges into `main` after end-to-end integration tests pass. |
| **`feature/ai-detection`** | **Dax** | YOLOv8 model loading, frame preprocessing, confidence thresholds, target class filtering (person, vehicle, animal), detection unit tests. | Merged into `develop` once detection returns accurate bounding boxes. |
| **`feature/ai-tracking`** | **Rajveer** | ByteTrack integration, persistent track ID assignment, Shapely polygon zone containment math, dwell time hysteresis, snapshot capture. | Merged into `develop` once tracking and zone breach detection are verified. |
| **`feature/backend-api`** | **Neel** | FastAPI application setup, REST routes (auth, cameras, zones, alerts, events, stats), WebSocket alert gateway, internal AI webhook ingestion. | Merged into `develop` once backend REST & WebSocket endpoints are tested. |
| **`feature/database`** | **Neel** | PostgreSQL SQLAlchemy async models, migration scripts, connection pooling, seed data, database query optimization. | Merged into `develop` once database models and seed scripts are verified. |
| **`feature/frontend-ui`** | **Earm** | React components, Tailwind dark mode design system, interactive HTML5 `ZoneCanvas` polygon drawer, responsive camera matrix layout. | Merged into `develop` once UI layouts and canvas draw components are built. |
| **`feature/frontend-integration`** | **Shubham** | Axios/Fetch API client, WebSocket state provider, real-time alert triage feed, acknowledge/resolve action handlers, telemetry charts. | Merged into `develop` once UI successfully communicates with API & WebSockets. |

### When to Create Additional Short-Lived Branches
- **Bug Fixes**: When an urgent bug is found on `develop` during testing, create `fix/<bug-name>` (e.g. `fix/websocket-reconnect-loop`).
- **Documentation**: For updates to jury presentations or architecture docs, create `docs/<name>` (e.g. `docs/demo-pitch-script`).
- **Feature Additions**: After the core branches merge, any new feature gets a clean branch branched off the latest `develop` (e.g. `feature/export-pdf-report`).

---

## 3. Branch Ownership & Team Role Division

```
                          NEEL (Team Leader)
     - Overall Repository Architect & PR Gatekeeper
     - Manages: main, develop, feature/backend-api, feature/database
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
     AI ENGINE                 BACKEND                  FRONTEND
    ───────────              ───────────              ────────────
    Dax: Detection           Neel: Core APIs          Earm: UI/UX & Canvas
    Rajveer: Tracking/Zones  Vivek: AI Integration   Shubham: API/WebSockets
    Vivek: Architecture
```

### Team Member Responsibilities

1. **Neel (Team Leader & System Architect)**:
   - Branch Ownership: `main`, `develop`, `feature/backend-api`, `feature/database`.
   - Responsibilities: Final reviewer for all Pull Requests, sets branch protection rules, handles backend database schema, coordinates merging, resolves merge conflicts, and performs system-level integration.
   - *Coordination Strategy for Managing Multiple Backend Branches*: Neel works on `feature/database` first to ensure SQLAlchemy models and migrations are stable. Once merged into `develop`, Neel creates or updates `feature/backend-api` using the completed database layer. This prevents circular dependencies.
2. **Vivek (AI Architect & Backend Integrator)**:
   - Co-leads AI system design with Neel.
   - Bridges the AI pipeline with the FastAPI backend: validates that the internal webhook endpoint (`POST /api/v1/internal/events`) properly parses the payloads generated by Dax and Rajveer.
   - Assists Neel with database performance tuning and review of AI-to-backend dataflows.
3. **Dax (Computer Vision & Detection Specialist)**:
   - Branch Ownership: `feature/ai-detection`.
   - Focus: Video frame ingestion (`stream_reader.py`), YOLOv8 model initialization, confidence threshold tuning, and COCO class filtering.
4. **Rajveer (Tracking & Event Specialist)**:
   - Branch Ownership: `feature/ai-tracking`.
   - Focus: Multi-object tracking (`byte_tracker.py`), Shapely ground-point zone intersection (`polygon_engine.py`), hysteresis dwell timer (`hysteresis.py`), and saving annotated evidence frames (`snapshot_saver.py`).
5. **Earm (Frontend UI/UX Designer)**:
   - Branch Ownership: `feature/frontend-ui`.
   - Focus: Tactical dark mode design tokens in Tailwind CSS, sidebar and top header layouts, camera grid matrix, and the interactive `ZoneCanvas` polygon drawer.
6. **Shubham (Frontend Integration Engineer)**:
   - Branch Ownership: `feature/frontend-integration`.
   - Focus: API client (`api.js`), global `WebSocketContext`, real-time alert triage feed, acknowledge/resolve modal flows, and Recharts metric graphs.

---

## 4. GitHub Setup Commands (Windows PowerShell / CMD)

### Part A: Commands for NEEL (Team Leader) — One-Time Setup

#### Step 1: Verify Git Installation
```powershell
git --version
# Expected: git version 2.x.x.windows.x
```

#### Step 2: Configure Git Identity
```powershell
git config --global user.name "Neel"
git config --global user.email "neel@yourcollege.edu.in"
# Configure line endings for Windows (CRLF to LF conversion)
git config --global core.autocrlf true
```

#### Step 3: Initialize Repository & Commit Initial Structure
```powershell
cd "c:\Users\smitp\OneDrive\Desktop\SIH PROJECT"
git init -b main

# Add all project files
git add .
git commit -m "chore: initial project scaffold for BorderGuard AI"
```

#### Step 4: Link to GitHub Remote Repository
*Neel creates an empty repository named `border-surveillance-ai` on GitHub, then runs:*
```powershell
git remote add origin https://github.com/your-org-or-username/border-surveillance-ai.git
git push -u origin main
```

#### Step 5: Create and Push the `develop` Branch
```powershell
# Create develop branch branched off main
git checkout -b develop
git push -u origin develop
```

#### Step 6: Create the Backend and Database Feature Branches
```powershell
# Create database branch
git checkout -b feature/database
git push -u origin feature/database

# Return to develop and create backend API branch
git checkout develop
git checkout -b feature/backend-api
git push -u origin feature/backend-api
```

---

### Part B: Commands for Team Members (Dax, Rajveer, Earm, Shubham, Vivek)

#### Step 1: Configure Git Identity on Windows Laptop
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@college.edu.in"
git config --global core.autocrlf true
```

#### Step 2: Clone the Repository
```powershell
git clone https://github.com/your-org-or-username/border-surveillance-ai.git
cd border-surveillance-ai
```

#### Step 3: Check Out the `develop` Branch
```powershell
git checkout develop
```

#### Step 4: Create and Switch to Your Assigned Feature Branch

**For DAX (Detection)**:
```powershell
git checkout -b feature/ai-detection
git push -u origin feature/ai-detection
```

**For RAJVEER (Tracking & Zones)**:
```powershell
git checkout -b feature/ai-tracking
git push -u origin feature/ai-tracking
```

**For EARM (Frontend UI)**:
```powershell
git checkout -b feature/frontend-ui
git push -u origin feature/frontend-ui
```

**For SHUBHAM (Frontend Integration)**:
```powershell
git checkout -b feature/frontend-integration
git push -u origin feature/frontend-integration
```

#### Step 5: Daily Work Routine (Saving & Pushing Work)
```powershell
# Check what files you modified
git status

# Stage modified files
git add .

# Commit with conventional commit message
git commit -m "feat(ai-detection): integrate YOLOv8n confidence filtering"

# Push your branch to GitHub
git push
```

#### Step 6: Pulling Latest Updates from Teammates
When Neel merges someone else's PR into `develop`, pull their changes into your feature branch:
```powershell
# 1. Commit or stash your local work first
git status

# 2. Fetch all changes from GitHub
git fetch origin

# 3. Merge the latest develop into your current branch
git merge origin/develop
```

---

## 5. Collaboration Workflow (Git Flow)

```
[Team Member on Feature Branch]
       │ Write code, test locally on Windows
       ▼
[git push origin feature/<name>]
       │
       ▼
[Create Pull Request on GitHub targeting 'develop']
       │
       ▼
[Neel Reviews Code in GitHub PR View]
  ├── If changes needed: Neel requests revision -> Member pushes fixes
  └── If approved: Neel clicks "Squash and merge" into 'develop'
       │
       ▼
[Integration Verification on 'develop']
       │ All 6 members pull latest develop
       ▼
[Pre-Milestone / Pitch: Neel Merges 'develop' into 'main']
```

### Why `main` Must Remain 100% Stable
During hackathon evaluations, judges may walk up to your team booth unannounced and ask to see the platform running. If a developer pushes broken code directly to `main`, the demo will crash. Therefore:
- **`main` is protected**: Code only enters `main` when an entire phase is thoroughly tested and guaranteed to work.
- **`develop` is the staging area**: All new features land in `develop` first.

### How Neel Reviews Pull Requests
1. **Checks the PR Template Checklist**: Verifies that local tests passed and no `.env` files were added.
2. **Inspects the "Files Changed" Tab on GitHub**:
   - Ensures no unexpected files (like `venv/` or `node_modules/`) were committed.
   - Validates that JSON schemas match agreed contracts.
3. **Approve & Merge**: Neel selects **"Squash and merge"** to combine messy incremental commits into one clean, readable commit on `develop`.

---

## 6. Branch Naming Conventions

All branches created by any team member must follow the standard format: `<prefix>/<descriptive-name-in-kebab-case>`

| Prefix | Purpose | Practical Project Examples |
|---|---|---|
| `feature/` | New functionality or system components | `feature/zone-intrusion`, `feature/bytetrack-kalman`, `feature/alert-sound-player` |
| `fix/` | Bug fixes on existing features | `fix/camera-reconnection`, `fix/websocket-token-auth`, `fix/bounding-box-offset` |
| `docs/` | Documentation and pitch preparation | `docs/update-api-contract`, `docs/sih-presentation-script`, `docs/deployment-cuda` |
| `test/` | Test suites and synthetic test feeds | `test/detection-pipeline`, `test/websocket-concurrency`, `test/zone-math-edge-cases` |
| `refactor/` | Code cleanup with no functional changes | `refactor/event-service`, `refactor/tailwind-classes`, `refactor/opencv-reader-thread` |

---

## 7. Commit Message Conventions (Conventional Commits)

Format: `<type>(<scope>): <short description in present tense>`

### Types
- **`feat`**: A new feature (e.g. `feat(ai-detection): add YOLOv8 person filter`)
- **`fix`**: A bug fix (e.g. `fix(capture): handle RTSP stream timeout reconnection`)
- **`docs`**: Documentation only (e.g. `docs(api): update OpenAPI spec for alert acknowledge`)
- **`style`**: Formatting, CSS adjustments (e.g. `style(ui): update critical alert badge color to crimson`)
- **`test`**: Adding or fixing tests (e.g. `test(backend): add pytest for camera registration API`)
- **`refactor`**: Code restructuring without changing behavior (e.g. `refactor(database): extract sessionmaker to async factory`)
- **`chore`**: Maintenance, package updates (e.g. `chore(deps): install shapely and numpy`)

### What Makes a Good Commit?
1. **Atomic**: Focuses on one specific change (don't bundle UI changes and AI detection fixes into one commit).
2. **Present Tense**: Use `feat: add camera endpoint` instead of `feat: added camera endpoint`.
3. **Descriptive**: Explain *what* was done so teammates reading `git log` immediately understand.

---

## 8. Pull Request Template

A standardized PR template has been created at [`.github/pull_request_template.md`](file:///c:/Users/smitp/OneDrive/Desktop/SIH%20PROJECT/.github/pull_request_template.md). GitHub automatically uses this template whenever any team member clicks **"New Pull Request"**.

---

## 9. GitHub Branch Protection Configuration

Neel must configure Branch Protection Rules on the GitHub repository:

### For the `main` Branch:
1. Go to repository on GitHub -> **Settings** -> **Branches** (under Code and automation) -> Click **"Add branch ruleset"** or **"Add rule"**.
2. **Branch name pattern**: `main`.
3. Check **"Require a pull request before merging"**:
   - Check **"Require approvals"** -> Set to **1** (Neel approves).
   - Check **"Dismiss stale pull request approvals when new commits are pushed"**.
4. Check **"Require status checks to pass before merging"** (if GitHub Actions CI is enabled).
5. Check **"Do not allow bypassing the above settings"** (applies even to administrators).
6. Click **"Save changes"**.

### For the `develop` Branch:
1. Click **"Add rule"** -> **Branch name pattern**: `develop`.
2. Check **"Require a pull request before merging"**.
3. Check **"Require approvals"** -> Set to **1**.
4. Allow force pushes: **Disabled**.

*(Note: Exact UI options depend on whether using a Free GitHub personal account or GitHub Organization; on free individual accounts, basic PR requirements apply).*

---

## 10. Shared JSON Contracts & Module Integration

```
[AI Engine (Dax & Rajveer)]
           │
           │ POST /api/v1/internal/events (JSON Webhook + X-Internal-Secret)
           ▼
[FastAPI Backend (Neel & Vivek)]
           │
           │ Saves to PostgreSQL & Fan-outs via WebSockets
           ▼
[React Dashboard (Earm & Shubham)]
```

To enable Earm and Shubham to build the React dashboard before Dax and Rajveer finish training AI models, the team shares fixed JSON contracts:

### Contract 1: Zone Intrusion Event (Webhook & WebSocket Push)
```json
{
  "event_type": "zone_intrusion",
  "camera_id": "b1a23e54-7890-4c12-a345-6789abcdef01",
  "camera_name": "Watchtower 04 - Zero Line",
  "zone_id": "9f8e7d6c-5b4a-3210-fedc-ba9876543210",
  "zone_name": "Zero-Line Barbed Wire Buffer",
  "track_id": 104,
  "target_class": "person",
  "confidence_score": 0.89,
  "severity": "critical",
  "bounding_box": {
    "x_min": 510,
    "y_min": 340,
    "width": 80,
    "height": 185
  },
  "ground_point": {
    "x_norm": 0.492,
    "y_norm": 0.510
  },
  "dwell_duration_seconds": 2.4,
  "timestamp": "2026-09-20T22:31:05.120Z",
  "evidence": {
    "snapshot_filename": "ev_b1a2_104_1726867865.jpg",
    "relative_path": "snapshots/sample_evidence_104.jpg",
    "sha256_hash": "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0"
  }
}
```

### Contract 2: Camera Disconnection / Stream Drop
```json
{
  "event_type": "camera_status_change",
  "camera_id": "b1a23e54-7890-4c12-a345-6789abcdef01",
  "status": "offline",
  "error_code": "RTSP_SOCKET_TIMEOUT",
  "error_message": "Stream timeout after 5000ms. Sentry cable severed or power down.",
  "timestamp": "2026-09-20T22:32:00.000Z"
}
```

### Mock JSON Strategy
In `frontend/src/services/api.js`, mock arrays for cameras, zones, and alerts are already pre-loaded. If the backend is offline, the React dashboard seamlessly falls back to mock data, allowing Earm and Shubham to develop and polish UI components independently.

---

## 11. Merge Conflict Handling on Windows

Merge conflicts happen when two developers edit the same lines of code in the same file. Follow these steps:

### Scenario: Your feature branch is behind `develop` and GitHub says "Cannot automatically merge"

#### Step 1: Switch to Your Feature Branch on Windows
```powershell
git checkout feature/frontend-integration
```

#### Step 2: Fetch and Merge `develop` into Your Local Branch
```powershell
git fetch origin
git merge origin/develop
```
*Git will output: `CONFLICT (content): Merge conflict in ... Automatic merge failed; fix conflicts and then commit the result.`*

#### Step 3: Open the Conflicting File in VS Code / Editor
VS Code will highlight the conflict with markers:
```
<<<<<<< HEAD (Current Change - Your code)
const alertColor = 'crimson';
=======
const alertColor = 'red';
>>>>>>> origin/develop (Incoming Change - Teammate's code)
```
Click **"Accept Current Change"**, **"Accept Incoming Change"**, or combine both appropriately.

#### Step 4: Save, Stage, and Commit the Resolved File
```powershell
git add .
git commit -m "fix(merge): resolve conflict with develop branch"
git push
```
The Pull Request on GitHub will automatically turn green and become mergeable!

#### Emergency Reset (If you made a mistake during merge resolution):
```powershell
# Aborts the merge and restores your branch to its clean previous state
git merge --abort
```

---

## 12. Daily Team Workflow (10 Steps)

Every team member follows this 10-step routine every single working day:

```
[Step 1: Pull Latest Develop]
  git checkout develop && git pull origin develop

[Step 2: Switch to Feature Branch & Sync]
  git checkout feature/<your-branch> && git merge develop

[Step 3: Write Code & Test Locally]
  Write code in your module (backend/frontend/ai-engine)

[Step 4: Run Tests on Windows]
  Backend: .\venv\Scripts\python -m pytest
  Frontend: npm run build
  AI: python -m pytest tests/test_zone_math.py

[Step 5: Stage and Commit]
  git add .
  git commit -m "feat(<scope>): descriptive action summary"

[Step 6: Push to GitHub]
  git push

[Step 7: Create Pull Request]
  Open GitHub -> Compare 'develop' <- 'feature/<your-branch>' -> Submit PR using template

[Step 8: Neel Reviews Code]
  Neel inspects changes, tests locally if needed, provides feedback or approves

[Step 9: Squash and Merge into Develop]
  Neel merges the PR into 'develop'

[Step 10: Sync & Verify]
  All members pull the updated 'develop' branch
```

---

## 13. GitHub Issues & Projects Management

### Issue Labels
- `ai`: Tasks relating to YOLO, ByteTrack, OpenCV (`#10B981`)
- `backend`: Tasks relating to FastAPI, endpoints, websockets (`#38BDF8`)
- `frontend`: Tasks relating to React, Tailwind, Canvas (`#6366F1`)
- `database`: Tasks relating to PostgreSQL, models, seed data (`#EC4899`)
- `bug`: Critical errors or broken tests (`#EF4444`)
- `high-priority`: Blocking items needed for the SIH demo (`#F59E0B`)
- `documentation`: README, API guides, pitch scripts (`#64748B`)

### Example GitHub Issues

| Issue Title | Labels | Assignee | Milestone |
|---|---|---|---|
| Ingest RTSP stream and extract frames at 25 FPS | `ai`, `high-priority` | Dax | Phase 2: Core Pipeline |
| Implement ByteTrack Kalman tracking with persistent IDs | `ai` | Rajveer | Phase 2: Core Pipeline |
| Create interactive HTML5 canvas for polygon zone drawing | `frontend`, `high-priority` | Earm | Phase 3: Dashboard UI |
| Build WebSocket client hook and alert audio chime | `frontend` | Shubham | Phase 3: Dashboard UI |
| Create JWT login endpoint and camera CRUD APIs | `backend` | Neel | Phase 2: Core Pipeline |
| Bridge internal AI webhook with WebSocket broadcaster | `backend`, `ai` | Vivek & Neel | Phase 4: Integration |

### Definition of Done (DoD)
A GitHub Issue can only be closed when:
1. Code compiles and runs with 0 errors.
2. Unit tests pass locally.
3. PR is reviewed and approved by Neel.
4. Feature is demonstrated running on `develop`.

---

## 14. Security Rules

1. **NEVER Commit `.env` Files**: The `.gitignore` explicitly blocks `.env` and `.env.*`. Always configure new variables in `.env.example` with dummy values.
2. **Never Commit Passwords or Private Keys**: Use environment variables or hashes.
3. **Mask RTSP Credentials**: RTSP URLs with embedded passwords (`rtsp://admin:pass@ip...`) must be handled securely in the backend and never exposed directly to the public frontend DOM.
4. **Internal Secret Protection**: The `X-Internal-Secret` header shared between `ai-engine` and `backend` must be loaded from environment settings.

---

## 15. Summary & First-Day Setup Checklist

### First-Day Checklist for the 6 Developers

- [ ] **Neel**: Create GitHub repo `border-surveillance-ai`, push initial code to `main`, create `develop` branch, configure branch protection rules.
- [ ] **All Members**: Install Git for Windows, configure `user.name` and `user.email`, clone repository.
- [ ] **Dax & Rajveer**: Set up Python virtual environment in `ai-engine/`, test `python src/main.py`.
- [ ] **Neel & Vivek**: Set up Python virtual environment in `backend/`, test `pytest` (verify 6/6 tests pass).
- [ ] **Earm & Shubham**: Run `npm install` and `npm run dev` in `frontend/`, verify the tactical SOC dark mode dashboard opens at `http://localhost:5173`.
- [ ] **All Members**: Check out your assigned feature branch, commit a test comment or small improvement, and test the PR workflow.
