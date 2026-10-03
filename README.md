# Fillify

Text-to-interactive-form utility that converts static text templates with placeholders into structured, interactive data-entry forms.

Fillify runs entirely in the browser. It parses standard placeholder conventions directly from raw text, generates corresponding input controls, replaces variables in real time, and produces clean text output ready for copying or printing.

---

## Key Features

- **Automated Placeholder Detection**: Scans raw text for brackets `[Placeholder]`, angle brackets `<Field>`, parentheses `(Input)`, braces `{Variable}`, and underscore blanks `___`.
- **Intelligent Field Typing**: Automatically infers appropriate field inputs—including single-line text, multi-line textareas, dates, numeric inputs, and currency—based on contextual field naming.
- **Triple Filling Workflows**:
  - **Wizard Mode**: Guided step-by-step completion focused on one input at a time with rapid keyboard progression.
  - **Form Mode**: Comprehensive single-page form layout suited for rapid multi-field entry and review.
- **Bulk Batch Mail Merge & Direct Email Dispatch**:
  - High-density spreadsheet data-grid and CSV/TSV copy-paste import for batch mail-merging dozens of documents at once.
  - Multi-page batch printing and combined `.txt` document exporting.
  - **Zero-Config Browser Email Drafts**: One-click deep links for Gmail web compose, OS default `mailto:` protocol, and RFC 822 `.eml` draft downloads with auto-detected recipient columns and subject variable interpolation (`{{Client Name}}`).
  - **Direct Batch Email Sending**: Programmatic batch dispatch via Resend API or custom HTTP webhooks (Zapier/Make/n8n) with safe sequential rate-limiting, live progress bars, and zero server credentials stored outside the browser.
- **Live Document Preview**: Real-time rendering with active highlight tracking showing exact substitution positions in the final output.
- **Clean Export and Print Support**: Includes dedicated print styling that isolates the generated document and strips interface controls for physical printing or PDF export.
- **Client-Side Persistence**: Stores templates and filled instance histories in browser `localStorage` for privacy and offline reliability.
- **Data Portability**: Full JSON export and import capabilities for backup, sharing, and version archiving.
- **Preloaded Templates**: Built-in starter templates for agreements, offer letters, client intake forms, and invoice memos.

---

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Bundler & Dev Server**: Vite
- **Storage**: Browser LocalStorage API

---

## Quick Start

### Prerequisites

- Node.js 18.0.0 or later
- npm 9.0.0 or later

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/fillify.git
   cd fillify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches the local Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles TypeScript declarations and outputs optimized production assets to `dist/`. |
| `npm run preview` | Serves the local `dist/` production build for pre-deployment verification. |
| `npm run typecheck` | Validates TypeScript types across the entire project with `tsc --noEmit`. |
| `npm test` | Executes native Node.js automated unit and regression test suites. |

---

## Project Structure

```
fillify/
├── public/                  # Static assets (favicons, manifests)
├── src/
│   ├── components/          # React presentation & layout components
│   │   ├── Editor/          # Template editor and blank tagging interfaces
│   │   ├── Email/           # Bulk email modal, tabbed draft and dispatch UI
│   │   ├── FillMode/        # Wizard, Form, and Bulk spreadsheet mode interfaces
│   │   ├── History/         # Filled document records and viewing modal
│   │   ├── Preview/         # Live preview and document action toolbar
│   │   ├── Templates/       # Preloaded sample templates and selector modals
│   │   ├── Icons.tsx        # Inline SVG icon definitions
│   │   ├── LandingPage.tsx  # Product overview and onboarding hero view
│   │   └── Navbar.tsx       # Primary navigation and document status bar
│   ├── context/             # React Context providers (Toast notifications)
│   ├── types/               # TypeScript interfaces and data model definitions
│   │   └── template.ts      # Template, Blank, and FillHistory types
│   ├── utils/               # Helper utilities and storage management
│   │   ├── email/           # Email validation, draft builders & dispatch engines
│   │   ├── blankDetector.ts # Regex patterns and type inference logic
│   │   ├── csvParser.ts     # CSV/TSV parser, column fuzzy matcher & exporters
│   │   ├── storage.ts       # LocalStorage CRUD and JSON serialization
│   │   ├── templateParser.ts# Placeholder substitution & formatting engine
│   │   └── useUndoRedo.ts   # State history management hook
│   ├── App.tsx              # Root application state and view router
│   ├── index.css            # Base stylesheet, design tokens, and print rules
│   └── main.tsx             # Application bootstrap entry point
├── test/                    # Automated Node.js native test runner test suites
├── index.html               # Main HTML document shell
├── package.json             # Project dependencies and script declarations
├── tsconfig.json            # TypeScript compiler configuration
└── vite.config.ts           # Vite build configuration
```

---

## Template Syntax Guide

Fillify automatically recognizes placeholders formatted in standard patterns:

| Syntax Example | Inferred Type | Generated Input |
| :--- | :--- | :--- |
| `[Client Name]` | Text | Single-line text input |
| `[Effective Date]` | Date | Native date picker |
| `[Total Amount]` | Currency | Currency input with formatted indicator |
| `[Item Count]` | Number | Numeric stepper input |
| `[Project Scope]` | Long Text | Multi-line auto-resizing textarea |
| `__________` | Text | Fill-in-the-blank text field |

You can also explicitly define options and field settings using the built-in blank configuration panel in the Template Editor.

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on code standards, local verification steps, and pull request submission guidelines.

---

## License

This project is open source and available under the [MIT License](LICENSE).
