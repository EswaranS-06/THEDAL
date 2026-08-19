# Page Specification: Audit Logs

> **Route**: `/logs`  
> **Purpose**: Searchable, historical audit log viewer for all control plane actions and operator executions.

---

## 1. Information Hierarchy

1. **Log List Sidebar (Left Column, ~340px)**:
   - Chronological list of recent `.log` execution files.
   - Operation name, timestamp, file size.
   - Selected log highlight.
2. **Log Content Viewer (Right Column, Flexible)**:
   - Header with filename, download action.
   - High-contrast monospace log window with fixed font size (`0.75rem`), clean line wrapping, and scrollbar.
   - Zero extraneous terminal animations or decorations.

---

## 2. Page Layout Structure

```text
+-----------------------------------------------------------------------------------+
| Page Header: Operation Audit Logs                                                 |
+-----------------------------------------------------------------------------------+
| 2-Column Split (340px / 1fr):                                                     |
| [ Recent Logs List ]              | [ Log Viewer Panel ]                          |
| - 20260819_1632_terraform_plan    | - Header: Filename + [Download Log]           |
| - 20260819_1625_ansible_wazuh     | - Monospace Log Stream Window                 |
| - 20260819_1610_generate_inv      |   (Sanitized, credentials scrubbed)           |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Integrity & Security
* All sensitive credentials (`AWS_SECRET_ACCESS_KEY`, private SSH keys, passwords) are scrubbed before display.
* Direct download endpoint (`/api/logs/download?file=...`) strictly validates against path traversal.
