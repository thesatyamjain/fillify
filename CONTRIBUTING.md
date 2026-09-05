# Contributing to Fillify

Thank you for your interest in contributing to Fillify. This guide provides instructions for setting up your development environment and submitting contributions.

---

## Code of Conduct

All contributors and participants are expected to adhere to the project's [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git

### Initial Steps

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/fillify.git
   cd fillify
   ```
3. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   # or for bug fixes:
   git checkout -b fix/issue-description
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## Development Guidelines

### TypeScript & Code Quality

- Ensure strict TypeScript compliance. Avoid the use of `any` types wherever possible.
- Re-use existing data interfaces located in `src/types/template.ts`.
- When creating or modifying state utility functions, preserve pure function signatures and update `src/utils/storage.ts` or `src/utils/blankDetector.ts` accordingly.
- Keep components modular, focused, and organized within their designated subdirectories in `src/components/`.

### Testing & Verification

Before opening a pull request, run the production build script locally to ensure TypeScript compilation and asset bundling pass cleanly:

```bash
npm run build
```

Verify that no type errors, unused imports, or build warnings are emitted.

---

## Pull Request Process

1. Commit your changes with clear, imperative commit messages (e.g. `Fix blank detector regex for multi-line brackets`).
2. Push your branch to your GitHub fork:
   ```bash
   git push origin feature/your-feature-name
   ```
3. Open a Pull Request against the `main` branch.
4. Fill out the provided pull request template with a concise summary of changes and verification steps.
5. Address any review feedback or continuous integration test findings.
