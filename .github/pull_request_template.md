## 📌 Pull Request: BorderGuard AI

### 1. PR Title Format
> Use: `<type>(<module>): <short summary>`  
> Example: `feat(ai-detection): add YOLOv8 person filter and NMS threshold`

---

### 2. Description & Context
Provide a clear, concise summary of what this Pull Request introduces, changes, or fixes. Explain the *why* behind this implementation.

---

### 3. Key Changes & Features
- [ ] Feature 1: 
- [ ] Feature 2: 
- [ ] Refactor / Fix: 

---

### 4. Linked Issue / Task
- Closes Issue # (e.g., `Closes #14`)
- Relates to Milestone: `Phase 3 - Core AI and Backend Integration`

---

### 5. Local Testing Completed
Please specify exactly how you verified this code on Windows before creating the PR:
- [ ] Backend test suite passed (`pytest` with 0 failures)
- [ ] Frontend build succeeded (`npm run build` with 0 errors)
- [ ] AI inference runs smoothly at target FPS
- [ ] Verified API endpoint in Swagger UI (`http://localhost:8000/docs`)
- [ ] Tested with mock video / camera stream

---

### 6. Screenshots or Visual Evidence (UI / AI Detections)
*Paste screenshots, terminal logs, or GIF recordings showing the feature working:*

---

### 7. Breaking Changes & Module Impact
- [ ] **No breaking changes** (backward-compatible).
- [ ] **Breaking changes introduced** (explain impact on other teammates' branches below):
  > *Example: Changed JSON webhook schema field `track_id` from string to integer.*

---

### 8. Reviewer Assignment
- **Primary Reviewer (Required)**: `@Neel` (Team Leader & System Architect)
- **Secondary Reviewer**: `@Vivek` (for AI/DB) or `@Earm` (for UI)

---

### 9. Author Pre-Merge Checklist
Before requesting review from Neel, confirm the following:
- [ ] My branch is up to date with the latest `develop` branch (`git pull origin develop`).
- [ ] I have not committed any `.env` files, API secrets, or passwords.
- [ ] Code follows project conventions (PEP 8 for Python, ESLint/Prettier for React).
- [ ] New functions and endpoints have clear docstrings or comments.
- [ ] All tests are passing locally.
