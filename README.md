# Fillify

<p align="center">
  <strong>Fast, Privacy-First Text-to-Interactive-Form Utility and Document Automation Engine</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-18.3-61dafb?style=flat-square&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/typescript-5.5-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/vite-5.4-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/tests-27%20passed-success?style=flat-square" alt="Tests 27 Passed" />
  <img src="https://img.shields.io/badge/privacy-100%25%20client--side-brightgreen?style=flat-square" alt="Privacy First" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License" />
</p>

---

Fillify turns static text templates containing raw placeholders into structured, interactive data-entry forms. It operates **100% client-side in the browser**—no server dependencies, no tracking, and zero data leaving your machine.

---

## Highlights

- **Automated Placeholder Detection**: Scans plain text for brackets `[Placeholder]`, angle brackets `<Field>`, parentheses `(Input)`, braces `{Variable}`, and underscore blanks `___`.
- **Contextual Field Typing**: Automatically detects text, dates, numbers, currency, and multi-line notes from variable names.
- **Triple Filling Workflows**:
  - **Wizard Mode**: Focused, one-field-at-a-time guided interface with rapid keyboard progression.
  - **Form Mode**: Complete single-page form view suited for quick multi-field review and editing.
  - **Bulk Spreadsheet Mode**: High-density data grid with CSV/TSV copy-paste import, pre-filled CSV template export, and batch document generation.
- **Bulk Batch Email & Mail Merge**:
  - One-click Gmail web compose links.
  - Standard RFC 822 `.eml` email draft files.
  - Native `mailto:` protocol deep links.
  - Programmatic batch dispatch via Resend API or webhook (Zapier/Make/n8n) with real-time rate limiting.
- **Live Document Preview & Print**:
  - Real-time side-by-side rendering with active highlight tracking.
  - Clean `@media print` stylesheets that isolate documents and eliminate UI chrome for physical print or PDF export.
- **Privacy & Offline Persistence**:
  - Templates, sample resets, and fill histories are securely persisted in browser `localStorage`.
  - Full JSON export and import for seamless backup and cross-device sharing.

---

## Keyboard Shortcuts

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>S</kbd> | Template Editor | Save current template immediately with toast feedback |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Z</kbd> | Template Editor | Undo canvas edits |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Y</kbd> / <kbd>Shift</kbd>+<kbd>Cmd</kbd>+<kbd>Z</kbd> | Template Editor | Redo canvas edits |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Navbar Brand | Return to Template Editor |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Wizard & Form Modes | Navigate between input fields |

---

## Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Bundler & Tooling**: [Vite 5](https://vitejs.dev/)
- **Testing**: Native Node.js test runner (`node:test` + `node:assert`)
- **Styling**: Tailored design tokens and native CSS variables (Zero bloated CSS framework runtime)
- **Storage**: Browser LocalStorage API with quota recovery

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0.0 or later)
- [npm](https://www.npmjs.com/) (version 9.0.0 or later)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/fillify.git
cd fillify

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Available Scripts

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with instant HMR. |
| `npm run build` | Compiles TypeScript (`tsc`) and bundles optimized production assets into `dist/`. |
| `npm run typecheck` | Validates TypeScript types across the entire project with `tsc --noEmit`. |
| `npm test` | Runs the 27 automated unit tests across 10 test suites. |
| `npm run preview` | Serves the production build locally to verify deployment readiness. |

---

## Project Structure

```
fillify/
├── .github/
│   ├── ISSUE_TEMPLATE/      # Structured bug report & feature request forms
│   ├── workflows/ci.yml     # Automated CI pipeline (lint, test, build)
│   └── PULL_REQUEST_TEMPLATE.md
├── public/                  # Favicons, webmanifest, sitemap, robots.txt
├── src/
│   ├── components/
│   │   ├── Common/          # ErrorBoundary, LoadingSkeleton, Modals
│   │   ├── Editor/          # TextEditor canvas, blank configuration panel
│   │   ├── Email/           # Bulk email modal, tabbed dispatch UI
│   │   ├── FillMode/        # Wizard, Form, and Bulk spreadsheet views
│   │   ├── History/         # Document history modal and records
│   │   ├── Preview/         # Live preview and document action toolbar
│   │   ├── Templates/       # Preloaded sample templates and picker modal
│   │   ├── Icons.tsx        # High-clarity inline SVG icons
│   │   ├── LandingPage.tsx  # Product hero and onboarding introduction
│   │   └── Navbar.tsx       # Mode switcher and JSON import/export bar
│   ├── context/             # React Contexts (Fill, Template, Toast)
│   ├── types/               # TypeScript interfaces (Template, Blank, FillHistory)
│   ├── utils/               # Pure functions and testable modules
│   │   ├── email/           # RFC 822 EML, Gmail, mailto, Resend dispatch
│   │   ├── blankDetector.ts # Regex patterns and type inference logic
│   │   ├── clipboard.ts     # Safe clipboard write & read fallback
│   │   ├── csvParser.ts     # RFC 4180 CSV/TSV parser & fuzzy header matcher
│   │   ├── storage.ts       # LocalStorage wrapper with QuotaExceeded protection
│   │   ├── templateParser.ts# Placeholder substitution & formatting engine
│   │   └── useUndoRedo.ts   # State history management hook
│   ├── App.tsx              # Root application state and lazy view router
│   ├── index.css            # Design tokens, typography, and print rules
│   └── main.tsx             # Application bootstrap entry point
├── test/                    # Automated unit tests for parsers, storage, and email
├── index.html               # Main HTML entry with SEO and PWA metadata
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript compiler configuration
└── vite.config.ts           # Vite build config with vendor code-splitting
```

---

## Privacy & Security

- **Zero Remote Storage**: Fillify stores all data strictly within your browser's `localStorage`.
- **No Third-Party Tracking**: No telemetry, analytics scripts, or cookies are loaded.
- **Safe Dispatch**: When using Resend API or webhook dispatch, API keys are kept in local memory only for the duration of the session and are never transmitted to any third party.

---

## Contributing

Contributions, bug reports, and suggestions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and review our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## License

Released under the [MIT License](LICENSE).
