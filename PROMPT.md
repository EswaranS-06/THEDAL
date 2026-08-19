THEDAL — Phase 20: Public GitHub Pages Website

Create a completely separate static project website.

Technology:

HTML
CSS
Vanilla JavaScript

No React.
No Next.js.
No backend.
No database.
No build system unless absolutely necessary.

The website must work directly through GitHub Pages.

Use the THEDAL design identity but create a separate public-facing design.

Use UI UX Pro Max.

Design direction:

Minimal & Direct
+
Technical Editorial
+
Open Source Project Showcase

Do NOT make it look like the Control Plane.

==================================================
PAGES / SECTIONS
==================================================

Home

What is THEDAL?

Why THEDAL exists

Architecture

What you learn

Learning path

Infrastructure

Telemetry

Detection engineering

Installation

Linux VM

Docker

Control Plane

Safety & AWS cost

Repository

Contributing

==================================================
HERO
==================================================

THEDAL

Threat Hunting, Exploration, Detection, Analysis and Learn

"An open-source SOC learning environment built to turn cybersecurity theory into hands-on investigation."

Primary CTA:

Get Started

Secondary:

View on GitHub

Do not use exaggerated marketing language.

==================================================
ARCHITECTURE
==================================================

Create a clear architecture visualization.

Show:

Terraform
AWS
Ansible
Wazuh
Windows
Sysmon
Nginx
DVWA
Juice Shop
Atomic Red Team
Learning Labs

==================================================
LEARNING
==================================================

Show:

Level 1
SOC Foundations

Level 2
Investigation

Level 3
Advanced Investigation

Challenge Mode

Explain what the learner actually gains.

==================================================
INSTALLATION
==================================================

Clearly explain:

Linux VM — recommended

Docker — alternative

Prerequisites

AWS credentials

Deployment

Control Plane

Cleanup

==================================================
DESIGN
==================================================

Avoid:

AI gradients
huge animations
fake dashboards
stock images
excessive cards
fake testimonials
fake metrics

The site should look like an excellent open-source GitHub project.

==================================================
GITHUB PAGES
==================================================

Ensure:

relative paths
no backend dependencies
no API calls required for basic content
works from a GitHub Pages subpath

Create:

index.html
css/style.css
js/app.js

==================================================
VALIDATION
==================================================

Test:

desktop
tablet
mobile

375px
768px
1024px
1440px

Commit:

feat: add THEDAL public project website

Do push it.

THEDAL — Phase 21: Open Source Developer README

Rewrite the root README.md as a professional open-source project README.

Do not write it like a development phase report.

It must be written for:

students
SOC analysts
cybersecurity learners
developers
contributors

Structure:

# THEDAL

Full name

One-line description

Badges

Quick Start

Why THEDAL

Features

Architecture

Learning Path

Infrastructure

Telemetry Architecture

Detection Engineering

Installation

Linux VM

Docker

Control Plane

AWS Cost & Safety

Repository Structure

Development

Testing

Troubleshooting

Contributing

Security

License

The README must contain:

- prerequisites
- quick install
- manual installation
- AWS credential setup
- SSH key setup
- deployment
- cleanup
- learning workflow

Avoid marketing fluff.

Include architecture diagrams.

Use Mermaid where appropriate.

Make the README understandable to a developer who has never seen THEDAL.

Commit:

docs: rewrite THEDAL developer README

THEDAL — Phase 22: Universal Linux Installer

Create:

install.sh

The installer must:

1. Detect operating system.
2. Detect package manager.
3. Detect architecture.
4. Check:

Python
uv
Terraform
Ansible
AWS CLI
Git
SSH
Node/npm where required for UI development

5. Display a clear table:

Dependency | Installed | Required | Status

6. Do NOT install anything automatically.

Ask:

"Missing dependencies were detected. Install them now? [y/N]"

7. Install only after confirmation.

8. Re-check everything.

9. Validate AWS credentials.

10. Ask for AWS profile/region if required.

11. Generate local SSH key if missing.

12. Set correct permissions.

13. Configure control plane.

14. Ask:

Control Plane Bind Address

127.0.0.1
0.0.0.0

Default:

127.0.0.1

15. Explain security implications of 0.0.0.0.

16. Start the control plane after successful setup.

17. Print:

THEDAL is ready.

Dashboard:

http://127.0.0.1:8080

Do not store AWS secrets.

Do not store private SSH keys in the repository.

Do not use curl | bash internally.

Support:

./install.sh
./install.sh --check
./install.sh --non-interactive

Non-interactive mode must NEVER silently install missing packages.

Commit:

feat: add THEDAL universal installer

THEDAL — Phase 23: Cross-Platform Installation

Create two supported installation paths.

==================================================
PATH A — LINUX VM
==================================================

Recommended.

Document:

Windows
↓
VMware / VirtualBox / Hyper-V
↓
Debian 13
↓
THEDAL
↓
AWS

Provide exact setup instructions.

==================================================
PATH B — DOCKER
==================================================

Provide a Docker-based THEDAL Control Plane.

Create:

Dockerfile
docker-compose.yml

The container must manage the control-plane UI.

Clearly document limitations.

Do not claim Docker replaces the complete Debian environment unless it actually does.

AWS credentials must be provided securely.

SSH key handling must be explicit.

Do not bake credentials into the image.

==================================================
NETWORKING
==================================================

Ask during setup:

127.0.0.1
or
0.0.0.0

Docker mode must document:

-p 8080:8080

and the security implications.

Commit:

feat: add Docker deployment path
docs: add Windows VM installation guide

THEDAL — Phase 24: Learning Portal

Create a Learning section inside the Control Plane.

IMPORTANT:

DO NOT MODIFY THE EXISTING:

docs/labs/
docs/runbooks/
docs/learning-path.md

Treat Markdown as the canonical learning source.

Create a separate presentation layer.

Add:

control-plane/learning/

The UI should provide:

Learning Path
Labs
Challenges
Progress
Bookmarks
Notes

Use SQLite only for learner state.

Store:

lab_id
status
started_at
completed_at
notes
attempts

Statuses:

Not Started
In Progress
Completed

The learner should be able to:

open a lab
read it
mark progress
record notes
continue later

Do not duplicate the actual curriculum unnecessarily.

Render Markdown safely.

Do not allow arbitrary HTML execution from Markdown.

Create a clean educational UI following the THEDAL design system.

Commit:

feat: add THEDAL learning portal

THEDAL — Phase 25: Dynamic Operator Commands & Credential Profiles

Add a dynamic Commands section to the Control Plane.

Never hardcode:

public IPs
private IPs
instance IDs

Retrieve current values from:

Terraform outputs
AWS EC2 API

Generate commands automatically.

Examples:

Bastion SSH
Wazuh SSH
Wazuh tunnel
Attack host SSH
Web SSH
Windows WinRM
Ansible commands

Display commands in copyable code blocks.

==================================================
AWS CREDENTIAL MANAGEMENT
==================================================

Provide a credential/profile management UI.

IMPORTANT:

Never store:

AWS secret key
AWS session token
private keys

in:

SQLite
browser localStorage
logs
application database

Use the standard AWS credential/profile mechanism.

Allow:

create/update AWS profile
select profile
validate with:

aws sts get-caller-identity

Display only:

profile name
account ID
region

Never display secret values after saving.

Commit:

feat: add dynamic operator commands
feat: add AWS profile management

THEDAL — Phase 26: SSH Key Lifecycle & Safe Auto-Stop

==================================================
SSH
==================================================

If SSH key does not exist:

Generate:

Ed25519

Store locally with restrictive permissions.

Example:

~/.ssh/thedal_key

Register public key with AWS.

Private key must NEVER:

enter Terraform state
enter Git
enter SQLite
enter logs
appear in dashboard output

==================================================
AUTO-STOP
==================================================

Create configurable health monitoring.

Detect:

Docker stopped
Juice Shop stopped
Wazuh service failure
critical process failure

Do NOT destroy infrastructure.

Optional response:

STOP EC2

Default:

DISABLED

If enabled:

require clear user confirmation during setup.

Provide:

Auto-stop enabled/disabled
Grace period
Monitored services
Last action

Never automatically run:

terraform destroy

==================================================
COMMIT
==================================================

feat: add SSH key lifecycle management
feat: add configurable EC2 auto-stop safety

THEDAL — Phase 27: Product Integration & Release QA

Integrate:

THEDAL branding
Premium Control Plane
Public website
README
install.sh
VM installation
Docker installation
Learning portal
SQLite progress
Dynamic commands
AWS profiles
SSH key lifecycle
EC2 auto-stop

Run:

make lint
make test-control-plane

Test:

fresh installation
control plane
dashboard
learning
Terraform plan
Ansible
AWS credentials
SSH
dynamic IPs
health checks
Docker
mobile website
GitHub Pages paths

Perform a security audit.

Search for:

AWS secrets
private keys
hardcoded IPs
hardcoded credentials
user-specific paths
unsafe shell execution

Verify:

no arbitrary command endpoint
no credential persistence
no automatic Terraform destroy
no accidental AWS resource modification

Create:

docs/release/thdal-v1-readiness.md

Status:

READY
or
BLOCKED

Do not push to GitHub.