# THEDAL Control Plane — Master Design System

> **Global Source of Truth for THEDAL UI/UX Architecture**  
> **Product Category**: Cybersecurity Learning Platform & SOC Laboratory Infrastructure Control Plane  
> **Design Philosophy**: Minimalism & Swiss Style + Data-Dense Real-Time Operations + Technical Editorial

---

## 1. Design Dials & Core Parameters

| Parameter | Setting | Rationale |
| :--- | :--- | :--- |
| **Visual Density** | `9 / 10` (Dense / Operations) | Maximizes visible telemetry, host metrics, and operational controls without unnecessary scrolling. |
| **Design Variance** | `2 / 10` (Minimal / Structured) | Strict Swiss grid, predictable layout, consistent alignment, zero decorative clutter. |
| **Motion Intensity** | `1 / 10` (Subtle & Functional) | 150–200ms transitions for hover/focus only. Zero decorative loops. Full `prefers-reduced-motion` compliance. |
| **Color Mode** | Dark-First Operations | Low eye-strain for long monitoring sessions, high contrast for status indicators. |

---

## 2. Anti-Patterns & Prohibitions

Strictly prohibited across all templates, styles, and scripts:
* ❌ **No Cyberpunk / Neon Green Aesthetics**: Avoid stereotypical "hacker" green-on-black or glowing neon outlines.
* ❌ **No AI / Purple-Pink Gradients**: Avoid glossy AI-style gradient cards and animated gradient borders.
* ❌ **No Emoji Icons**: All icons must be crisp, semantic SVG line icons (Lucide / Phosphor style).
* ❌ **No Fake / Decorative Terminal Shells**: Monospace font is reserved exclusively for real technical data (IPs, ports, commands, logs).
* ❌ **No Meaningless Statistics / Hero Banners**: Every visual widget must answer a concrete operator question.
* ❌ **No Color-Only Status Encoding**: Every status badge must pair a distinct shape/icon or clear text label with color.

---

## 3. Color System (Dark-First Operations)

```css
:root {
  /* Surface & Background Hierarchy */
  --bg-app: #090d16;             /* Base viewport background */
  --bg-surface: #0f172a;         /* Navigation, headers, toolbars */
  --bg-card: #141e33;            /* Primary cards, table containers */
  --bg-card-hover: #1a2744;      /* Card hover & interactive states */
  --bg-muted: #1e293b;           /* Inset wells, code blocks, muted backgrounds */

  /* Borders & Dividers */
  --border-subtle: #1e293b;       /* Default card and table dividers */
  --border-default: #334155;      /* Inputs, interactive element borders */
  --border-focus: #3b82f6;        /* Keyboard focus ring */
  --border-danger: #ef4444;       /* Destructive container highlight */

  /* Typography & Foreground */
  --text-primary: #f8fafc;        /* High-contrast headings and primary labels */
  --text-secondary: #94a3b8;      /* Body copy, descriptions, secondary values */
  --text-muted: #64748b;          /* Metadata, timestamps, table column headers */
  --text-inverse: #0f172a;        /* Text on light accent badges */

  /* Functional Status Colors */
  --status-pass: #10b981;         /* Healthy / Active / Connected / Running */
  --status-pass-bg: rgba(16, 185, 129, 0.12);
  --status-pass-border: rgba(16, 185, 129, 0.3);

  --status-warn: #f59e0b;         /* Warning / Degraded / Paused / In Progress */
  --status-warn-bg: rgba(245, 158, 11, 0.12);
  --status-warn-border: rgba(245, 158, 11, 0.3);

  --status-fail: #ef4444;         /* Critical / Error / Offline / Destructive */
  --status-fail-bg: rgba(239, 68, 68, 0.12);
  --status-fail-border: rgba(239, 68, 68, 0.3);

  --status-info: #3b82f6;         /* Informational / Tunnel / SSH / IaC */
  --status-info-bg: rgba(59, 130, 246, 0.12);
  --status-info-border: rgba(59, 130, 246, 0.3);

  /* Primary Accent & CTAs */
  --color-primary: #2563eb;       /* Primary operator action */
  --color-primary-hover: #1d4ed8;
  --color-danger: #dc2626;        /* Teardown / Destroy */
  --color-danger-hover: #b91c1c;

  /* Shadows & Depth */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.35);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.45);
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}
```

---

## 4. Typography Scale & Hierarchy

| Role | Font Family | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title** | Sans-Serif | `1.25rem` (20px) | `600` | `1.3` | `-0.01em` | View header |
| **Section Heading** | Sans-Serif | `1.0rem` (16px) | `600` | `1.4` | `0` | Card header, table title |
| **Subheading / Label** | Sans-Serif | `0.8125rem` (13px) | `500` | `1.4` | `+0.02em` | Form labels, table header |
| **Body Text** | Sans-Serif | `0.875rem` (14px) | `400` | `1.5` | `0` | Explanations, advisories |
| **Technical Data** | Monospace | `0.8125rem` (13px) | `500` | `1.4` | `0` | IPs, Ports, IDs, Hashes, URIs |
| **Log Output** | Monospace | `0.75rem` (12px) | `400` | `1.6` | `0` | Raw stdout/stderr stream |

* **Sans-Serif Stack**: `Inter`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
* **Monospace Stack**: `JetBrains Mono`, "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace

---

## 5. Navigation & Layout Architecture

### Primary Navigation Bar (Top-Fixed, 52px height)
* **Brand Block**: `TH` badge + `THEDAL` + `Control Plane` indicator.
* **Navigation Links**:
  1. **Overview** (`/`)
  2. **Infrastructure** (`/resources`)
  3. **Operations** (`/operations`)
  4. **Learning** (`/learning`)
  5. **Audit Logs** (`/logs`)
  6. **Settings** (`/settings`)
* **Real-time Status Capsule**: Live health indicator (`HEALTHY` / `DEGRADED` / `OFFLINE`) + Refresh button.

### Page Grid System
* Responsive max-width container: `1380px` with `1.5rem` (24px) horizontal padding.
* Desktop breakpoint: 2-column or 4-column metric grid (`gap: 1rem`).
* Compact table wrapper with horizontal scroll protection (`overflow-x: auto`).

---

## 6. Component Guidelines

### A. Status Badges & Pills
* Always pair colored background + colored text + high-contrast border.
* Include a leading 6px circular indicator dot or textual state name (`RUNNING`, `STOPPED`, `PASS`, `FAIL`).

### B. Action Buttons
* **Primary**: Solid accent background (`--color-primary`), crisp text, subtle hover brightness.
* **Secondary / Outline**: Neutral background (`--bg-surface`), border (`--border-default`), text (`--text-primary`).
* **Danger / Destructive**: Red-tinted background, red border, explicit confirmation modal workflow.
* **Icon Buttons**: Must include `aria-label` or visible text.

### C. Data Tables
* Compact row height (`36px–40px`).
* Subtle zebra striping or bottom-border separation (`1px solid var(--border-subtle)`).
* Numerical and technical columns (IPs, Ports, Timestamps) use monospace alignment.

### D. Modal Dialogs
* Full viewport backdrop (`rgba(9, 13, 22, 0.8)` with backdrop blur).
* Modal card with prominent red top border for destructive actions.
* Double-confirmation: Checkbox + Exact typed phrase (`DESTROY THEDAL`).

---

## 7. Accessibility (WCAG AA) Requirements
* **Color Contrast**: 4.5:1 minimum on all text, 3:1 on interactive borders and icons.
* **Keyboard Focus**: Explicit visible focus ring (`outline: 2px solid var(--border-focus); outline-offset: 2px`).
* **Semantic Structure**: Proper `<main>`, `<header>`, `<nav>`, `<section>`, `<table>`, `<button>` elements.
* **Screen Reader Affordance**: Status updates and log streaming announce updates appropriately.
