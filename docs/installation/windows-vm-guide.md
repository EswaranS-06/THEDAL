# Windows VM Installation Guide (Debian 13)

> **Recommended Deployment Path**: Running THEDAL from an isolated Linux Virtual Machine on Windows ensures 100% native compatibility with Ansible, Terraform, SSH ProxyJump tunnels, and Linux terminal tooling.

---

## Architecture Flow

```text
[ Windows Host (Windows 10/11) ]
       │
       ▼ (VMware Workstation / Oracle VirtualBox / Hyper-V)
[ Debian 13 (Trixie) Linux VM ]
       │
       ▼ (Terraform & Ansible via Bastion ProxyJump)
[ THEDAL Cloud Environment (AWS VPC 10.10.0.0/16) ]
```

---

## Step 1: Hypervisor Selection & Installation

Select one of the following hypervisors for Windows:
* **VMware Workstation Pro / Player** (Recommended for performance): [Download VMware](https://www.vmware.com/products/workstation-pro.html)
* **Oracle VM VirtualBox** (Free & Open Source): [Download VirtualBox](https://www.virtualbox.org/)
* **Microsoft Hyper-V** (Built into Windows Pro / Enterprise / Education)

---

## Step 2: Download & Install Debian 13 (Trixie)

1. Download the official Debian Netinst ISO: [Debian ISO Downloads](https://www.debian.org/distrib/)
2. Create a new Virtual Machine in your hypervisor:
   * **RAM**: 4 GB minimum (8 GB recommended)
   * **CPU**: 2–4 vCPUs
   * **Disk**: 30 GB dynamic virtual disk
   * **Network Adapter**: **Bridged** or **NAT** (NAT is standard; Bridged gives the VM its own LAN IP)
3. Complete standard Debian installation:
   * Select your preferred desktop environment (XFCE or GNOME) or standard console.
   * Add your user account to the `sudo` group:
     ```bash
     su -
     usermod -aG sudo <your-username>
     exit
     ```

---

## Step 3: Install THEDAL Inside the Debian VM

Log into your Debian 13 VM and open a terminal:

```bash
# 1. Update package lists
sudo apt-get update && sudo apt-get install -y git curl

# 2. Clone THEDAL
git clone https://github.com/EswaranS-06/THEDAL.git
cd THEDAL

# 3. Run the Universal Installer
chmod +x install.sh
./install.sh
```

---

## Step 4: Configure AWS Credentials & Deploy

1. Configure your AWS credentials:
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, and Region (default: ap-south-1)
   ```
2. Verify AWS connectivity:
   ```bash
   aws sts get-caller-identity
   ```
3. Deploy the environment:
   ```bash
   make deploy
   make inventory
   make provision
   ```

---

## Step 5: Accessing the Control Plane from Windows

If you want to view the Control Plane UI directly in your Windows web browser:
1. In the Debian VM, check your VM's IP address:
   ```bash
   ip a
   ```
2. Launch the Control Plane bound to your VM IP or all interfaces:
   ```bash
   cd control-plane
   uv run uvicorn app.main:app --host 0.0.0.0 --port 8080
   ```
3. In your Windows browser, navigate to: `http://<VM_IP_ADDRESS>:8080`

> [!NOTE]
> To access the Wazuh Dashboard (`https://localhost:8443`) from Windows, run `make tunnel` inside the Debian VM and use an SSH local port-forward from Windows to the VM.
