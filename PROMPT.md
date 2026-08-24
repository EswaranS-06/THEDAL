Below is a **single implementation prompt** you can give to your coding agent for the THEDAL project.

---

# THEDAL — Authentication, Credential Single Source of Truth, Provisioning Validation & Wazuh Zero-Error Fix

You are working on the **THEDAL** project. The previous project name **SOCForge** has been replaced by **THEDAL**. Audit the entire codebase and replace legacy project naming where appropriate, while being careful not to rename AWS resources, existing identifiers, indexes, or data that would break compatibility unless migration is handled safely.

Your task is to redesign the credential/configuration architecture and audit the Terraform + Ansible + Wazuh deployment so that a new student can install THEDAL and have an **error-free, reproducible experience**.

Do not make superficial UI-only changes. Trace credentials from the initial application setup through the Control Plane, backend, Terraform, Ansible, AWS resources, Wazuh, SSH/tunneling, and validation.

---

## 1. Core Requirement: Single Source of Truth for User Credentials

THEDAL must have one central credential/configuration source.

On the **first-ever launch after a fresh installation**, before the user can access the Control Plane, show a one-time initial setup page.

The page should collect:

```text
Display Name
Username
Password
```

### Display Name

The Display Name is used for the THEDAL UI.

For example:

```text
Welcome, Rex
```

or show the name in the top-right profile area.

This does not necessarily need to be the Linux username, AWS username, or Wazuh internal username.

### Username and Password

The user enters one primary:

```text
username
password
```

These credentials become the **central credential source for THEDAL-controlled services wherever technically compatible**.

The architecture should conceptually be:

```text
                    THEDAL Initial Setup
                            │
                            ▼
                 Central Credential Store
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
      App Login         Terraform         Ansible
          │                 │                  │
          └─────────────────┼──────────────────┘
                            │
                            ▼
                  Provisioned Services
```

Do not hardcode passwords independently in:

* Terraform files
* Ansible playbooks
* Ansible variables
* shell scripts
* Wazuh configuration
* Docker configuration
* backend source code
* frontend source code

The central credential configuration must be injected securely into the provisioning workflow.

---

# 2. First-Run Setup Must Only Appear Once

Implement persistent first-run detection.

Expected behavior:

### Fresh THEDAL installation

```text
Open THEDAL
      ↓
No setup state exists
      ↓
Show Initial Setup Wizard
      ↓
User enters:
    • Display Name
    • Username
    • Password
      ↓
Validate
      ↓
Securely save configuration
      ↓
Mark setup_complete = true
      ↓
Redirect to THEDAL Control Plane
```

### Every future application launch

```text
Open THEDAL
      ↓
Setup state exists
      ↓
Skip setup wizard
      ↓
Go directly to Login / Control Plane
```

The setup page must **not repeatedly appear**.

If the application is deliberately reset or the configuration is deleted, then the setup wizard may appear again.

---

# 3. Central Credential Architecture

Create a clear credential/configuration abstraction.

For example:

```text
THEDAL Configuration
│
├── profile
│   └── display_name
│
├── application
│   ├── username
│   └── password_reference
│
├── provisioning
│   └── credential variables
│
└── generated_service_credentials
```

Do **not** blindly force the same username/password into every service.

This is extremely important.

Some components, including Wazuh and OpenSearch, may require:

* predefined usernames
* system accounts
* reserved account names
* specific password policies
* credentials that are created or hashed internally
* service-specific authentication mechanisms

Therefore:

> Use the user's initial username/password as the central source wherever compatible, but preserve mandatory service usernames or authentication requirements where changing them would break the installation.

For example, if Wazuh requires a specific API account such as:

```text
wazuh-wui
```

then do not rename that account merely to force the user's username everywhere.

Instead, derive or configure its password from the central credential source if supported and safe.

The goal is:

```text
ONE CENTRAL CREDENTIAL SOURCE
```

not:

```text
BLINDLY CHANGE EVERY SYSTEM ACCOUNT NAME
```

The student must receive a working deployment.

---

# 4. Credentials Must Be Available in Settings

Add a **Settings → Profile / Credentials** section.

The user must be able to see:

```text
Display Name
Username
Password
```

Because this is a local educational lab and the user explicitly wants password recovery/viewing.

However, do not expose passwords accidentally in:

* logs
* browser console
* API responses unnecessarily
* Terraform output
* Ansible stdout
* Git repositories
* process lists

The password should normally be masked:

```text
Password: ••••••••••••
```

Provide an explicit:

```text
Show Password
```

control that requires deliberate user interaction.

If appropriate for the application's architecture, require the current application session/authentication before revealing it.

Also provide:

```text
Change Password
```

When the password changes, clearly define whether it updates:

1. only the THEDAL application login, or
2. future infrastructure deployments, or
3. existing provisioned services.

Do not silently claim that changing the password automatically updates already-deployed AWS/Wazuh infrastructure unless that synchronization is actually implemented.

Prefer an explicit model such as:

```text
Change Credential
        ↓
Update Central Source
        ↓
Choose:
[ Update THEDAL Login Only ]
[ Apply to Future Deployments ]
[ Rotate Existing Lab Credentials ]
```

Only implement options that can actually work reliably.

---

# 5. Remove Existing Hardcoded Credentials

Perform a complete repository audit.

Search for:

```text
SOCForge
SOCForgeWuiPass2026
SOCForge_Adm1n_Lab2026
wazuh-wui
password
passwd
secret
username
admin
credential
55000
9200
```

Also inspect:

```text
*.tf
*.tfvars
*.yml
*.yaml
*.json
*.env
*.sh
Dockerfile
docker-compose.yml
backend source
frontend source
installation scripts
templates
systemd files
```

Identify all credential definitions.

Create a credential flow map.

Example:

```text
Initial Setup
    ↓
THEDAL Secure Config
    ↓
Provisioning Variables
    ↓
Terraform / Ansible Runtime Variables
    ↓
Service Configuration
```

There must not be multiple unrelated passwords silently defined in different files.

---

# 6. Fix the Wazuh Credential Mismatch

A previously identified issue occurred during deployment.

The Dashboard configuration contained:

```yaml
hosts:
  - default:
      url: https://127.0.0.1
      port: 55000
      user: wazuh-wui
      password: SOCForgeWuiPass2026!
      run_as: true
```

But the actual Wazuh API accepted:

```text
Username: wazuh-wui
Password: wazuh-wui
```

Testing showed:

```bash
curl -k \
-u wazuh-wui:wazuh-wui \
https://127.0.0.1:55000/security/user/authenticate
```

successfully returned:

```json
{
  "error": 0
}
```

While the configured custom password caused:

```text
401 Unauthorized
ERROR3099 - Invalid credentials
```

This mismatch must be eliminated.

### Required implementation

Before the deployment is marked successful:

1. Configure the Wazuh API credentials correctly.
2. Configure the Wazuh Dashboard plugin with the exact credentials that actually exist in the Wazuh API.
3. Restart the necessary service.
4. Test authentication programmatically.

For example:

```bash
curl -sk \
-u "${WAZUH_API_USER}:${WAZUH_API_PASSWORD}" \
https://127.0.0.1:55000/security/user/authenticate
```

The validation must verify that:

```json
"error": 0
```

If authentication fails:

```text
THEDAL deployment = FAILED
```

Do not report a successful installation.

### Important

Investigate the correct supported method for changing Wazuh API credentials for the installed Wazuh version.

Do not merely:

```yaml
password: SOME_PASSWORD
```

inside the Dashboard configuration and assume that this changes the actual Wazuh API password.

The provisioning must either:

* correctly change the Wazuh API credential using the supported mechanism, then configure the Dashboard with it,

or:

* retain the required working Wazuh credential and use that consistently.

The final state must be tested, not assumed.

---

# 7. Fix and Validate the Wazuh API Connection

The Wazuh Dashboard showed:

```text
The API connections could be down or inaccessible
```

and:

```text
ERROR3099 - Invalid credentials
```

However, the API itself was proven reachable:

```bash
curl -k \
-u wazuh-wui:wazuh-wui \
https://127.0.0.1:55000/security/user/authenticate
```

Therefore THEDAL must distinguish between:

```text
API service is down
```

and:

```text
API is running but Dashboard credentials are incorrect
```

Implement automated diagnostics.

Example logic:

```text
Check TCP/API reachability
        │
        ├── FAIL
        │     └── API unavailable / network issue
        │
        └── PASS
              ↓
       Test authentication
              │
              ├── FAIL
              │     └── Invalid credentials / credential mismatch
              │
              └── PASS
                    ↓
             API connection healthy
```

The Control Plane should show a meaningful diagnostic rather than only a generic error.

---

# 8. Wazuh Dashboard Port Must Be Correct

A previous troubleshooting attempt incorrectly tested:

```text
127.0.0.1:5601
```

but the Wazuh Dashboard configuration actually uses:

```yaml
server.port: 443
server.host: 0.0.0.0
```

Therefore, THEDAL must not assume port `5601`.

Detect or define the actual configured Dashboard port and use it consistently.

Current architecture:

```text
Wazuh Dashboard on AWS
        │
        │ :443
        ▼
Bastion SSH tunnel
        │
        │ local port 8443
        ▼
https://localhost:8443
```

The Control Plane tunnel should correctly create:

```bash
ssh -N \
-L 8443:WAZUH_PRIVATE_IP:443 \
ubuntu@BASTION_PUBLIC_IP
```

Do not hardcode a Wazuh internal IP such as:

```text
10.10.10.33
```

unless it is dynamically discovered from Terraform state or the AWS API.

The Control Plane must determine:

```text
Current Bastion Public IP
Current Wazuh Private IP
Dashboard Port
```

dynamically.

---

# 9. Wazuh Dashboard Launch Validation

After provisioning, THEDAL must perform an end-to-end validation.

The validation sequence should be:

```text
Terraform Infrastructure
        ↓
Wait for EC2
        ↓
Ansible Provisioning
        ↓
Wazuh Manager
        ↓
Wazuh Indexer
        ↓
Wazuh Dashboard
        ↓
API Authentication Test
        ↓
Indexer Health Test
        ↓
Create/Verify SSH Tunnel
        ↓
Open/Test Dashboard
        ↓
Check Logs
        ↓
Deployment Result
```

Validate:

### Services

```bash
systemctl is-active wazuh-manager
systemctl is-active wazuh-indexer
systemctl is-active wazuh-dashboard
```

All expected services must be:

```text
active
```

### Wazuh API

Test authentication against:

```text
https://127.0.0.1:55000
```

### Indexer

Test:

```text
https://127.0.0.1:9200
```

Validate cluster health appropriately for the deployment topology.

Do not blindly require `green` if the supported single-node configuration can legitimately show `yellow` due to replicas.

### Dashboard

Validate the actual configured port.

For the current configuration:

```text
https://127.0.0.1:443
```

Do not test `5601` unless the configuration actually uses that port.

---

# 10. Automated SSH Tunnel Testing

THEDAL must automatically manage SSH tunneling.

The user should not have to manually type:

```bash
ssh -i ~/.ssh/socforge_key \
-N \
-L 8443:10.10.10.33:443 \
ubuntu@13.232.202.163
```

The Control Plane should:

1. obtain the current bastion public IP
2. obtain the current Wazuh private IP
3. identify the SSH key
4. check whether a tunnel already exists
5. terminate or reuse stale tunnels safely
6. create the required tunnel
7. verify local port availability
8. test connectivity
9. launch or provide access to:

```text
https://localhost:8443
```

The implementation must work for:

* Native Linux
* Virtual Machines
* Docker deployment

The Docker user must not be required to open a terminal and manually run SSH tunnel commands.

---

# 11. Docker Compatibility

THEDAL's Control Plane must manage operations through the UI/API.

The target experience is:

| Feature              | VM / Native Linux | Docker   |
| -------------------- | ----------------- | -------- |
| Control Plane        | Yes               | Yes      |
| Terminal commands    | Yes               | Optional |
| Terraform operations | CLI + UI          | UI       |
| AWS start/stop       | CLI + UI          | UI       |
| IP synchronization   | CLI + UI          | UI       |
| SSH tunnel           | CLI + UI          | UI       |
| Wazuh access         | Browser           | Browser  |
| Lab simulations      | CLI + UI          | UI       |

The Docker architecture must correctly handle the difference between:

```text
localhost on host
```

and:

```text
localhost inside the container
```

Do not assume that:

```text
localhost:8443
```

inside a Docker container refers to the user's host.

Design the tunnel/control-plane architecture correctly.

Possible valid architectures include:

```text
Host-managed tunnel
```

or:

```text
Container-managed tunnel with published ports
```

Choose the architecture that provides the simplest reliable experience for students.

Document the networking model clearly.

---

# 12. IP Synchronization and Dynamic AWS State

THEDAL must not depend on hardcoded public IP addresses.

A student's public IP can change between sessions.

Implement an IP synchronization feature.

The Control Plane should:

1. detect the current public IPv4
2. read the configured management CIDR
3. compare the detected IP with the existing AWS Security Group rule
4. show the mismatch
5. allow the user to synchronize/update it

Default:

```text
CURRENT_PUBLIC_IP/32
```

The user may manually change the CIDR.

For beginner-friendly use, allow:

```text
0.0.0.0/0
```

but show a clear security warning.

Example:

```text
⚠ This allows SSH access from any IPv4 address.
Recommended for temporary learning labs only.
```

The Control Plane must dynamically update the AWS Security Group.

Do not leave old temporary IP rules accumulating indefinitely.

Implement safe rule reconciliation.

---

# 13. Terraform Audit

Perform a full Terraform review.

Check for:

* hardcoded IP addresses
* hardcoded credentials
* dependency problems
* incorrect subnet routing
* security group mistakes
* missing egress
* stale instance IP assumptions
* race conditions
* remote-exec dependency problems
* key path assumptions
* hardcoded AWS region where unnecessary
* resources not destroyed correctly
* missing outputs
* incorrect instance references

Ensure Terraform exposes required dynamic outputs such as:

```text
bastion_public_ip
bastion_instance_id
wazuh_private_ip
wazuh_instance_id
management_security_group_id
dashboard_port
```

The Control Plane should use these outputs or AWS API discovery rather than duplicate values manually.

---

# 14. Ansible Audit

Perform a full Ansible review.

Check for:

* credential mismatch
* variables defined in multiple places
* hardcoded service passwords
* wrong file paths
* incorrect service ordering
* missing retries
* missing waits
* tasks that succeed even though the resulting service is broken
* incorrect ownership or permissions
* wrong Wazuh configuration
* restart timing problems
* lack of post-configuration verification

Ansible tasks must be idempotent.

Do not consider:

```text
TASK SUCCESS
```

equivalent to:

```text
SYSTEM WORKING
```

After configuration, explicitly validate the resulting system.

---

# 15. Fix the Update Check / Network Error

A browser error was observed:

```text
Error checking available updates:
NetworkError when attempting to fetch resource.
```

Also:

```text
NetworkError when attempting to fetch resource.
```

Investigate the exact Wazuh Dashboard update-check mechanism for the installed Wazuh version.

Determine whether the failure is caused by:

* no outbound internet access
* private subnet routing
* missing NAT
* proxy configuration
* DNS failure
* TLS/certificate problems
* browser/CORS behavior
* Wazuh Dashboard plugin behavior
* upstream update service failure

The Wazuh server is deployed in a private network architecture.

Terraform networking must allow the connectivity actually required by the lab.

If internet access is intentionally restricted, then the UI must not falsely present update checking as a deployment failure.

Either:

1. provide the required controlled outbound connectivity,

or:

2. disable/suppress the update check using a supported configuration if external update checking is not required.

Do not weaken inbound security merely to fix outbound update checks.

---

# 16. Known Errors That Must Be Included in Automated Diagnostics

THEDAL must specifically recognize and diagnose these previously encountered failures.

### Invalid Wazuh API credentials

```text
ERROR3099 - Invalid credentials
```

Diagnosis:

```text
Wazuh API reachable
Authentication failed
Likely Dashboard/API credential mismatch
```

### Dashboard plugin background 401

Logs contained:

```text
AxiosError: Request failed with status code 401
```

under:

```text
plugins/wazuh/cron-scheduler
plugins/wazuh/monitoring
```

The validator should inspect this condition after deployment.

### API connections inaccessible warning

```text
The API connections could be down or inaccessible
```

The diagnostic must differentiate:

```text
API DOWN
```

from:

```text
API reachable but authentication/configuration failed
```

### Update check error

```text
Error checking available updates:
NetworkError when attempting to fetch resource
```

### Wrong Dashboard port assumption

Do not test:

```text
5601
```

when the deployed configuration uses:

```text
443
```

### Legacy project naming

Replace inappropriate references to:

```text
SOCForge
```

with:

```text
THEDAL
```

Examples requiring review:

```text
comments
UI labels
configuration headers
documentation
deployment names
resource tags
generated filenames
index prefixes
credentials
```

However, do not blindly rename existing deployed AWS resources or OpenSearch indexes if doing so would break compatibility. Provide migration logic where required.

---

# 17. Build a THEDAL Health Validator

Implement a dedicated validation module.

Example:

```text
THEDAL Health Validator
│
├── Infrastructure
│   ├── AWS connectivity
│   ├── Bastion reachable
│   └── Wazuh instance reachable
│
├── Network
│   ├── Security Group
│   ├── SSH connectivity
│   ├── Private connectivity
│   └── Required outbound connectivity
│
├── Wazuh
│   ├── Manager active
│   ├── Indexer active
│   ├── Dashboard active
│   └── API reachable
│
├── Authentication
│   ├── API credential test
│   └── Dashboard/API integration
│
├── Indexer
│   └── Cluster health
│
├── Tunnel
│   ├── Tunnel exists
│   ├── Local port listening
│   └── Dashboard reachable
│
└── Logs
    ├── 401 errors
    ├── authentication failures
    ├── fatal errors
    └── repeated startup failures
```

The Control Plane should display:

```text
THEDAL Lab Health

Infrastructure      ✓ Healthy
AWS Connectivity    ✓ Healthy
Security Group      ✓ Healthy
Wazuh Manager       ✓ Running
Wazuh Indexer       ✓ Running
Wazuh API           ✓ Authenticated
Wazuh Dashboard     ✓ Running
SSH Tunnel          ✓ Connected
Dashboard Access    ✓ Available

Warnings:
Update check unavailable due to restricted outbound connectivity
```

Do not show a green/healthy result when authentication is actually failing.

---

# 18. Required End-to-End Test

After implementing the changes, perform an actual end-to-end test.

The test should simulate a fresh student installation.

### Test flow

```text
1. Fresh THEDAL installation

2. Open THEDAL

3. Verify Initial Setup Wizard appears

4. Enter:
   Display Name
   Username
   Password

5. Complete setup

6. Restart THEDAL

7. Verify setup wizard does NOT appear again

8. Verify Display Name appears in profile UI

9. Verify credentials are available in Settings

10. Verify Terraform receives the required configuration

11. Verify Ansible receives the correct configuration

12. Deploy infrastructure

13. Verify no credential mismatch occurs

14. Verify:
      wazuh-manager active

15. Verify:
      wazuh-indexer active

16. Verify:
      wazuh-dashboard active

17. Authenticate to Wazuh API

18. Verify Dashboard → API integration

19. Create SSH tunnel automatically

20. Access Wazuh Dashboard through:
      https://localhost:8443

21. Launch the Wazuh Dashboard in a browser

22. Verify the Wazuh application loads

23. Check Dashboard logs

24. Check Wazuh API logs

25. Confirm there are no unresolved:
      401
      ERROR3099
      Invalid credentials
      API inaccessible
      repeated service failures

26. Test stop/start of AWS instances.

27. Verify changed public/private IP addresses are dynamically rediscovered.

28. Test Security Group IP synchronization.

29. Verify Docker deployment works without requiring manual SSH commands.
```

---

# 19. Definition of Done

Do not mark this task complete until all of the following are true:

```text
[ ] THEDAL branding replaces inappropriate SOCForge references

[ ] Initial Setup Wizard appears only on first launch

[ ] Display Name appears in the profile area

[ ] One central credential source exists

[ ] Credentials are not independently hardcoded across the project

[ ] Mandatory service-specific usernames are preserved where required

[ ] Credential mappings are documented

[ ] Wazuh API credentials are actually validated

[ ] No Dashboard/API credential mismatch exists

[ ] ERROR3099 is resolved

[ ] Dashboard plugin does not produce unresolved authentication errors

[ ] Correct Wazuh Dashboard port is dynamically respected

[ ] SSH tunnel is dynamically created

[ ] No hardcoded Bastion public IP is required

[ ] No hardcoded Wazuh private IP is required

[ ] Terraform has been audited

[ ] Ansible has been audited

[ ] Post-deployment validation exists

[ ] THEDAL does not report deployment success until validation passes

[ ] Wazuh Dashboard is successfully opened through the Control Plane

[ ] Docker users do not need to manually run SSH tunnel commands

[ ] AWS stop/start and IP changes are handled dynamically

[ ] Security Group IP synchronization works

[ ] Update-check NetworkError has been investigated and either fixed or intentionally handled

[ ] All sensitive values are prevented from leaking into logs or repository files

[ ] A fresh student installation has been tested end-to-end
```

## Final implementation principle

The goal is not merely to make Terraform and Ansible execute successfully.

The required success condition is:

```text
Terraform succeeds
        +
Ansible succeeds
        +
AWS networking works
        +
Credentials are consistent
        +
Wazuh API authenticates
        +
Dashboard connects to API
        +
SSH tunnel works
        +
Dashboard actually opens
        +
Logs show no unresolved critical errors
        =
THEDAL DEPLOYMENT SUCCESS
```

Implement this as a robust student-friendly system. Before changing any mandatory Wazuh, OpenSearch, Linux, or AWS credentials, verify the component's requirements and preserve required internal usernames. The priority is **single-source configuration without sacrificing a reliable, error-free deployment**.
