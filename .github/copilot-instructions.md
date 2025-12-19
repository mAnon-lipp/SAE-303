# SAE-303 - Programme National BUT MMI Visualization

## Architecture Overview

This is a **Single Page Application (SPA)** visualizing the BUT MMI program structure using SVG and GSAP animations. The app uses vanilla JavaScript with an **MVC-like pattern** (M/V/C objects) and a custom router.

### Key Components

- **Pages** (`src/pages/*/page.js`): Route handlers with M/V/C pattern - M holds data, V manages DOM, C handles initialization
- **UI Components** (`src/ui/*/`): Reusable components with `dom()` method, template.html, and style.css
- **Layouts** (`src/layouts/*/`): Slot-based page wrappers (not used in current routes - all pages are fullscreen)
- **Router** (`src/lib/router.js`): Custom SPA router with dynamic routes, auth guards, and layout support
- **Animation** (`src/lib/animation.js`): Centralized GSAP animation utilities

## Critical File Patterns

### Page Structure (M/V/C Pattern)
```javascript
// M = Model (data)
let M = { pnData: await fetch('/src/data/pn.json').then(r => r.json()) };

// V = View (DOM references)
let V = { graph: null, detailPanel: null };
V.init = function() { /* create and wire components */ };

// C = Controller (initialization)
C.init = function() { return V.init(); };

export function PageName() { return C.init(); }
```

### UI Component Pattern
```javascript
class ComponentName {
  constructor() { this.root = htmlToDOM(template); }
  dom() { return this.root; }
  // Public methods for interaction
}
export { ComponentName };
```

## Data Structure

**`src/data/pn.json`**: Hierarchical structure - `competences` → `niveaux` → `acs`
- Each AC has: `code`, `libelle`, `heures_formation`, `sae`, `ressources`, `progression` (0-100)

## SVG Graph Architecture

**Main component**: `GraphView` (`src/ui/Graph/index.js`)
- Inline SVG with IDs matching AC codes (e.g., `AC11.01`)
- Groups: competences (long hash IDs) → `niveau_1/2/3` → AC polygons
- Dynamic data injection via `injectACData()` adds labels and colors

## State Management via CSS Classes

**AC Progression States** (applied by `updateACProgress()`):
- `.ac-color-c1` through `.ac-color-c5`: Competence-specific colors
- `.ac-has-progress`: Enables transitions
- `.ac-complete`: Applied at 100% for glow effect
- Opacity calculated: `0.3 + (progress / 100) * 0.7`

**Active State**: `.ac-active` with `[data-color]` attribute for glow color

## GSAP Animations (v3.13.0)

**Use GSAP 3 conventions**:
- `drawSVG: "0%"` not `0` for DrawSVGPlugin
- Use function callbacks `() =>` for dynamic/random values with `repeatRefresh: true`
- `clearProps` to remove inline styles after animation: `clearProps: "opacity,scale"`
- Timeline positioning: `"<"` = same time as previous, `"-=0.4"` = overlap by 0.4s

**Permanent animations**: Use `repeat: -1` with `yoyo: true` for continuous effects

## Event-Driven Communication

**CustomEvents** for component communication:
- `detailpanel:open` - DetailPanel opened with AC data
- `detailpanel:close` - DetailPanel closed
- `detailpanel:progresschange` - AC progression updated (detail: `{acCode, progress, couleur}`)

Listen on `document`:
```javascript
document.addEventListener('detailpanel:progresschange', (e) => {
  V.graph.updateACProgress(e.detail.acCode, e.detail.progress, e.detail.couleur);
});
```

## Development Workflow

**Commands**:
- `npm run dev` - Start Vite dev server
- `npm run build` - Production build
- `npm run preview` - Preview production build

**Path alias**: `@/` resolves to `src/` (configured in vite.config.js)

**Import patterns**:
- Templates: `import template from "./template.html?raw"`
- Styles: `import "./style.css"` (auto-injected)
- Utils: `import { htmlToDOM } from "@/lib/utils.js"`

## Component Wiring Pattern

Pages connect components via references:
```javascript
V.detailPanel.setGraphView(V.graph); // Link for bidirectional updates
V.graph.enableACInteractions((acData) => {
  V.detailPanel.open(acData); // Callback pattern
});
```

## User Stories Implementation

- **US001-003**: SVG structure, data loading, labels
- **US004**: DetailPanel display with AC info
- **US005**: Progression slider (0-100%) with CSS class-based visual feedback
- **US006**: Entrance animations (revealGraph) + continuous molecular motion

## Key Files to Reference

- `docs/ARCHITECTURE.md` - Complete architecture guide
- `docs/router.md` - Router API and patterns
- `src/pages/svg-final/page.js` - Complete M/V/C example
- `src/ui/Graph/index.js` - SVG manipulation patterns
- `src/lib/animation.js` - GSAP animation utilities
