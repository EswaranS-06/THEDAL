# THEDAL — Project Rebrand & Migration Impact Matrix

> **From**: SOCForge &bull; **To**: **THEDAL** (*Threat Hunting, Exploration, Detection, Analysis and Learn*)  
> **Classification**: Controlled Safe Rebrand & Migration Mapping  
> **Status**: APPROVED & APPLIED

---

## Executive Summary

This document defines the comprehensive repository-wide rebranding audit from **SOCForge** to **THEDAL** (*Threat Hunting, Exploration, Detection, Analysis and Learn*).

Because the AWS infrastructure may be running live, this rebrand is executed under a **Strict State-Preservation Policy**:
1. **Zero Unintended Resource Replacement**: No Terraform resource addresses or IAM/Security Group names are destructively modified in a way that forces AWS recreation.
2. **Dual-Mode Compatibility**: Control plane, inventory generators, and telemetry pipelines support both `THEDAL` and `SOCForge` identifiers concurrently.
3. **Seamless Transition**: Documentation, UI, scripts, and human-facing interfaces are fully updated to THEDAL.

---

## 1. Rebrand Taxonomy & Standards

| Attribute | Old Value | New Value |
| :--- | :--- | :--- |
| **Product Name** | `SOCForge` | **`THEDAL`** |
| **Full Project Name**| `SOCForge Security Operations Lab` | **`THEDAL: Threat Hunting, Exploration, Detection, Analysis and Learn`** |
| **Short Description**| A cloud-native SOC detection & investigation lab | **`An open-source, reproducible SOC learning environment for threat hunting, detection engineering and incident investigation.`** |
| **Control Plane Name**| `SOCForge Control Plane` | **`THEDAL Control Plane`** |
| **CLI / Makefile** | `SOCForge Developer CLI` | **`THEDAL Developer CLI`** |
| **Default SSH Key** | `~/.ssh/socforge_key` | `~/.ssh/thedal_key` *(with `~/.ssh/socforge_key` fallback)* |
| **Destroy Phrase** | `DESTROY SOCFORGE` | `DESTROY THEDAL` *(with `DESTROY SOCFORGE` alias)* |
| **Rule Prefix** | `SOCForge (DET-XXX)` | `THEDAL (DET-XXX)` |
| **Index Namespace** | `socforge-<source>-*` | `thedal-<source>-*` & `socforge-<source>-*` *(dual-mapped)* |

---

## 2. Comprehensive 13-Category Occurrence Audit & Migration Map

### Category 1: UI & Display Branding

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Web UI Title** | `SOCForge Control Center` | `THEDAL Control Center` | **YES** | None | No | Update HTML templates in `control-plane/app/templates/`. |
| **Navbar Brand** | `SOCForge Control Plane` | `THEDAL Control Plane` | **YES** | None | No | Update `base.html`. |
| **Destroy Modal** | `DESTROY SOCFORGE` | `DESTROY THEDAL` | **YES** | None | No | Update `base.html` and `app.js`. |
| **Footer Text** | `SOCForge Control Plane` | `THEDAL Control Plane` | **YES** | None | No | Update `base.html`. |
| **Dashboards UI** | `SOCForge — Overview` | `THEDAL — Overview` | **YES** | None | No | Update OpenSearch dashboard definitions. |

---

### Category 2: Documentation

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Root README** | `# SOCForge` | `# THEDAL` | **YES** | None | No | Update `README.md` with new acronym, title, and short description. |
| **START-HERE.md**| `SOCForge Beginner's Guide` | `THEDAL Beginner's Guide` | **YES** | None | No | Update `docs/START-HERE.md`. |
| **Learning Path** | `SOCForge Learning Path` | `THEDAL Learning Path` | **YES** | None | No | Update `docs/learning-path.md`. |
| **Labs 01–14** | `SOCForge Lab XX` | `THEDAL Lab XX` | **YES** | None | No | Update `docs/labs/**/*.md`. |
| **Mystery Challenges**| `SOCForge Challenges` | `THEDAL Challenges` | **YES** | None | No | Update `docs/labs/challenges/*.md`. |
| **Runbooks** | `SOCForge Runbooks` | `THEDAL Runbooks` | **YES** | None | No | Update `docs/runbooks/*.md`. |
| **Templates** | `SOCForge Incident Report`| `THEDAL Incident Report` | **YES** | None | No | Update `docs/templates/*.md`. |
| **Subsystem READMEs**| `SOCForge Terraform/Ansible`| `THEDAL Terraform/Ansible`| **YES** | None | No | Update `control-plane/README.md`, `terraform/README.md`, `ansible/README.md`. |

---

### Category 3: Terraform Resource Names

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **State Resource IDs**| `aws_instance.bastion`, `aws_instance.wazuh`, etc. | Unchanged | **YES** | None | No | Internal resource identifiers are already generic (`bastion`, `wazuh`, `windows`, `web`, `attack`). |
| **File Headers / Comments**| `# SOCForge — Terraform ...` | `# THEDAL — Terraform ...` | **YES** | None | No | Update comments across all `terraform/*.tf` files. |
| **Variable Defaults**| `project_name = "SOCForge"` | `project_name = "THEDAL"` | **CAUTION** | Tag update in-place | Optional | Tag updates on live EC2/VPC are non-destructive in-place updates. Keep backwards-compatible. |

---

### Category 4: Terraform Tags

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Project Tag** | `Project = "SOCForge"` | `Project = "THEDAL"` | **YES** | In-place update | No | AWS EC2 and VPC tags update in-place without destroying instances. |
| **Name Tag** | `Name = "SOCForge-node"` | `Name = "THEDAL-node"` | **YES** | In-place update | No | In-place tag update. Control plane matches both prefixes. |

---

### Category 5: AWS Resource Names (IAM, SGs, VPC)

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **IAM Role Name** | `SOCForge-ec2-base-role` | Preserved / Aliased | **NO (if live)** | Destructive if renamed in state | Yes (if recreating) | Preserve existing IAM role name for live deployments; support `THEDAL-` for fresh deployments. |
| **Security Groups** | `SOCForge-bastion-sg` | Preserved / Aliased | **NO (if live)** | Destructive if renamed in state | Yes (if recreating) | Preserve SG resource names in state; update descriptions and tags safely. |

---

### Category 6: Ansible Variables & Playbooks

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Inventory Hostnames**| `SOCForge-bastion` | `THEDAL-bastion` / `SOCForge-bastion` | **YES** | None | No | Inventory parser accepts both `SOCForge-*` and `THEDAL-*` host patterns. |
| **Log Directory** | `/var/log/socforge/` | `/var/log/thedal/` | **YES** | None | No | Playbooks create `/var/log/thedal/` with symlink from `/var/log/socforge/`. |
| **Playbook Comments** | `# SOCForge Playbook` | `# THEDAL Playbook` | **YES** | None | No | Update comments and playbook descriptions. |

---

### Category 7: Wazuh Configuration & Decoders

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Rules Template** | `socforge_rules.xml.j2` | `thedal_rules.xml.j2` | **YES** | None | No | Wazuh Manager loads all `.xml` rules in `/var/ossec/etc/rules/`. |
| **Decoder Names** | `socforge-juice-shop` | `thedal-juice-shop` | **YES** | None | No | Support both decoder names or alias to maintain backward compatibility. |
| **Alert Labels** | `data.labels.socforge.source` | `data.labels.thedal.source` | **YES** | None | No | Filebeat pipeline checks both labels for routing. |

---

### Category 8: Detection Rules (`100100–100699`)

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Rule Numeric IDs** | `100100`–`100699` | `100100`–`100699` | **YES** | None | No | Retain exact numeric IDs for 100% detection telemetry continuity. |
| **Rule Descriptions**| `SOCForge (DET-XXX): ...` | `THEDAL (DET-XXX): ...` | **YES** | None | No | Update rule description text strings in rule templates. |
| **Rule Groups** | `socforge_web`, `socforge_correlation` | `thedal_web`, `thedal_correlation`, `socforge_*` | **YES** | None | No | Include both group tags to ensure existing filters continue matching. |

---

### Category 9: OpenSearch Indexes & Telemetry Routing

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Index Pattern** | `socforge-sysmon-*` | `thedal-sysmon-*` & `socforge-sysmon-*` | **YES** | None | No | Filebeat routes to `thedal-<source>-*`; OpenSearch index patterns match `*sysmon-*`. |
| **Filebeat Router** | Checks `socforge` labels | Checks `thedal` OR `socforge` | **YES** | None | No | Update Filebeat conditionals with `when.or` supporting both keys. |

---

### Category 10: Scripts & CLI Utilities

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Banner / Help** | `SOCForge Developer CLI` | `THEDAL Developer CLI` | **YES** | None | No | Update CLI headers in `Makefile` and `scripts/*.sh`. |
| **SSH Key Resolution**| `~/.ssh/socforge_key` | `~/.ssh/thedal_key` / `~/.ssh/socforge_key` | **YES** | None | No | Script checks for `thedal_key` first, falling back to `socforge_key`. |
| **Inventory Generator**| `generate-inventory.py` | Updated | **YES** | None | No | Matches instances with `THEDAL` or `SOCForge` names. |

---

### Category 11: Control Plane (Local Dashboard)

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **App Title / Config** | `SOCForge Control Plane` | `THEDAL Control Plane` | **YES** | None | No | Update `app/config.py` (`APP_NAME = "THEDAL Control Plane"`). |
| **Destroy Guardrail** | `DESTROY SOCFORGE` | `DESTROY THEDAL` | **YES** | None | No | Update config and UI; service accepts both phrases for safety. |
| **AWS Fleet Discovery**| Filters `tag:Project = SOCForge` | Filters `tag:Project in [THEDAL, thedal, SOCForge, socforge]` | **YES** | None | No | Dual filter guarantees live instances are discovered regardless of tag state. |
| **Role Name Parsing** | `.replace("socforge-", "")` | `.replace("thedal-", "").replace("socforge-", "")` | **YES** | None | No | Handles both naming prefixes cleanly. |

---

### Category 12: Git Metadata & Package Configuration

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Package Name** | `socforge-control-plane` | `thedal-control-plane` | **YES** | None | No | Update `control-plane/pyproject.toml`. |
| **License / Copyright**| `SOCForge Contributors` | `THEDAL Contributors` | **YES** | None | No | Update `LICENSE`. |
| **Makefile** | `SOCForge Makefile` | `THEDAL Makefile` | **YES** | None | No | Update `Makefile` header and target descriptions. |

---

### Category 13: Automated Test Suites

| Component | Old Value | New Value | Safe to Change? | State Impact? | Requires Migration? | Migration Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API Tests** | Asserts `SOCForge Control Center` | Asserts `THEDAL Control Center` | **YES** | None | No | Update `control-plane/tests/test_api.py`. |
| **Security Tests** | Tests `DESTROY SOCFORGE` | Tests `DESTROY THEDAL` | **YES** | None | No | Update `control-plane/tests/test_security.py`. |
| **Operations Tests**| Sanitizes `SOCForge@2026!Sec` | Sanitizes `THEDAL` & legacy secrets | **YES** | None | No | Update `control-plane/tests/test_operations.py`. |

---

## 3. Verification & Safety Summary

- **Live Fleet Preservation**: Fully preserved via dual-tag matching and non-destructive attribute updates.
- **Backwards Compatibility**: All legacy aliases, credentials, and index patterns remain resolvable.
- **Continuous Quality**: `make lint` and `make test-control-plane` verified 100% passing after rebrand.
