# 📂 Multi-Markdown Specification Scanner

Unlike standard tools that only inspect `README.md`, GitPulse recursively discovers and audits **all markdown files (`.md`)** across every repository.

---

## 📑 Supported Document Categories

The scanner categorizes markdown files into distinct functional contexts:

| Category | Typical Filenames | Purpose |
| :--- | :--- | :--- |
| 📋 **TODO & Tasks** | `TODO.md`, `TASKS.md`, `todos.md` | Extracts `- [ ]` and `- [x]` task lists |
| 💡 **Context & Specs** | `CONTEXT.md`, `NOTES.md`, `SPEC.md` | Architectural overviews & developer intent |
| ⚠️ **Errors & Bugs** | `ERRORS.md`, `BUGS.md`, `ISSUES.md` | Known issues, stack traces, and workarounds |
| 📜 **Logs & Changelog** | `LOGS.md`, `CHANGELOG.md`, `HISTORY.md` | Release history and version updates |
| 🗺️ **Roadmap** | `ROADMAP.md`, `PLAN.md` | Future development milestones |
| 📖 **Documentation** | `README.md`, `CONTRIBUTING.md`, `docs/*.md` | Public repository documentation |

---

## ⚙️ How the Scanner Works

1. **Tree Discovery**:
   - Queries repository contents at the root level and inside subdirectories (`docs/`, `.github/`, `notes/`).
   - Identifies all files matching `*.md` or `*.markdown`.
2. **Task Extraction**:
   - Parses each line for task list syntax:
     - `- [ ]` or `* [ ]` ➔ Incomplete task
     - `- [x]` or `- [X]` ➔ Completed task
   - Tags each task with its source file path (`sourceFile`) and functional category.
3. **In-App Document Reader**:
   - Inside the Project Detail Modal, a dedicated **"Docs, Context & TODOs"** tab provides a two-panel reader:
     - Left column: List of discovered markdown files with task counts and category badges.
     - Right column: Interactive checklist and scrollable full markdown text viewer.
