# SOCForge — Detection Test Results Matrix (Phase 13)

> **Status**: All 18 curated detection rules and custom decoders verified offline against positive and negative test fixtures. Live validation remains pending cloud infrastructure provisioning in Phase 14.

---

## 1. Test Verification Summary

* **Total Detections Evaluated**: 18
* **Positive Test Samples**: 20 fixtures (`tests/detections/*_positive.log`)
* **Negative Test Samples**: 20 fixtures (`tests/detections/*_negative.log`)
* **Rule ID Namespace**: `100100 – 100699` (0 collisions detected)
* **XML Syntax Verification**: PASS
* **Offline Detection Quality**: 100% PASS across all defined test fixtures

---

## 2. Detailed Test Results Matrix

| Detection ID | Rule ID | Decoder | Data Source | ATT&CK Technique | Positive Fixture | Negative Fixture | Expected Severity | Test Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`DET-WEB-001`** | `100101` | `web-access` | `nginx_access` | `T1190` | `dvwa_sqli_positive.log` | `dvwa_sqli_negative.log` | Level 8 | **PASS** |
| **`DET-WEB-002`** | `100102` | `web-access` | `nginx_access` | `T1059.004` | `dvwa_cmdi_positive.log` | `dvwa_cmdi_negative.log` | Level 9 | **PASS** |
| **`DET-WEB-003`** | `100103` | `web-access` | `nginx_access` | `T1083` | `dvwa_lfi_positive.log` | `dvwa_lfi_negative.log` | Level 7 | **PASS** |
| **`DET-WEB-004`** | `100104` | `web-access` | `nginx_access` | `T1505.003` | `dvwa_upload_positive.log` | `dvwa_upload_negative.log` | Level 8 | **PASS** |
| **`DET-JS-001`** | `100201` | `socforge-juice-shop` | `juice_shop` | `T1087` / `T1595.002` | `js_apienum_positive.log` | `js_apienum_negative.log` | Level 6 | **PASS** |
| **`DET-JS-002`** | `100202` | `socforge-juice-shop` | `juice_shop` | `T1110.001` | `js_auth_positive.log` | `js_auth_negative.log` | Level 8 | **PASS** |
| **`DET-JS-003`** | `100203` | `socforge-juice-shop` | `juice_shop` | `T1190` | `js_sqli_positive.log` | `js_sqli_negative.log` | Level 8 | **PASS** |
| **`DET-JS-004`** | `100204` | `socforge-juice-shop` | `juice_shop` | `T1083` | `js_admin_positive.log` | `js_admin_negative.log` | Level 7 | **PASS** |
| **`DET-JS-005`** | `100205` | `socforge-juice-shop` | `juice_shop` | `T1592.002` | `js_error_positive.log` | `js_error_negative.log` | Level 7 | **PASS** |
| **`DET-NGX-001`** | `100301` | `web-access` | `nginx_access` | `T1595.002` | `ngx_scan_positive.log` | `ngx_scan_negative.log` | Level 7 | **PASS** |
| **`DET-NGX-002`** | `100302` | `web-access` | `nginx_access` | `T1071.001` | `ngx_method_positive.log` | `ngx_method_negative.log` | Level 6 | **PASS** |
| **`DET-NGX-003`** | `100303` | `web-access` | `nginx_access` | `T1595` | `ngx_scanner_ua_positive.log` | `ngx_scanner_ua_negative.log` | Level 7 | **PASS** |
| **`DET-WIN-001`** | `100401` | `windows-eventchannel`| `sysmon` | `T1059.001` | `win_ps_cradle_positive.log` | `win_ps_cradle_negative.log` | Level 7 | **PASS** |
| **`DET-WIN-002`** | `100402` | `windows-eventchannel`| `powershell` | `T1027.013` | `win_ps_encoded_positive.log` | `win_ps_encoded_negative.log` | Level 8 | **PASS** |
| **`DET-WIN-003`** | `100403` | `windows-eventchannel`| `sysmon` | `T1059.003` | `win_parent_child_positive.log` | `win_parent_child_negative.log` | Level 9 | **PASS** |
| **`DET-WIN-004`** | `100404` | `windows-eventchannel`| `sysmon` / `sec`| `T1082` / `T1016` | `win_recon_positive.log` | `win_recon_negative.log` | Level 6 | **PASS** |
| **`DET-WIN-005`** | `100405` | `windows-eventchannel`| `sysmon` | `T1003.001` | `win_lsass_positive.log` | `win_lsass_negative.log` | Level 10 | **PASS** |
| **`DET-WIN-006`** | `100406` | `windows-eventchannel`| `sysmon` | `T1053.005` | `win_schtasks_positive.log` | `win_schtasks_negative.log` | Level 7 | **PASS** |
| **`DET-LNX-001`** | `100501` | `auditd` | `auditd` | `T1082` / `T1059.004` | `lnx_auditd_positive.log` | `lnx_auditd_negative.log` | Level 7 | **PASS** |
| **`DET-LNX-002`** | `100502` | `syslog` | `linux_auth` | `T1548.003` | `lnx_sudo_positive.log` | `lnx_sudo_negative.log` | Level 8 | **PASS** |

---

## 3. Correlation Test Scenarios

### `DET-COR-001` — Web Command Injection & Immediate Auditd Execution
* **Trigger Sequence**:
  1. `100102` (`DET-WEB-002`): Nginx access log receives `POST /vulnerabilities/exec/` with payload `127.0.0.1; whoami`.
  2. `100501` (`DET-LNX-001`): Auditd log records `/usr/bin/whoami` executed by `www-data` (UID 33) within 30 seconds.
* **Correlated Alert Generated**: Rule `100601` (Severity 11, Critical).
* **Verdict**: **PASS** (Logic verified).

---

### `DET-COR-002` — Web Shell Upload & Web Root File Modification
* **Trigger Sequence**:
  1. `100104` (`DET-WEB-004`): Nginx access log records access/upload to `/hackable/uploads/shell.php`.
  2. Wazuh FIM (`syscheck`): Detects file creation in `/var/www/dvwa/hackable/uploads/` within 30 seconds.
* **Correlated Alert Generated**: Rule `100602` (Severity 10, Critical).
* **Verdict**: **PASS** (Logic verified).

---

### `DET-COR-003` — Multiple Failed Logins Followed by Success
* **Trigger Sequence**:
  1. `100202` (`DET-JS-002`): 5 failed login attempts on `/rest/user/login` (401 Unauthorized) within 60 seconds.
  2. Juice Shop container log records successful authentication (HTTP 200) from the same source IP within 120 seconds.
* **Correlated Alert Generated**: Rule `100603` (Severity 9, High).
* **Verdict**: **PASS** (Logic verified).
