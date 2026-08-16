# SOCForge — Wazuh SIEM Ansible Role

> **Scope**: Deploys an all-in-one single-node Wazuh SIEM platform (Indexer, Manager, Filebeat, Dashboard) on the dedicated `SOCForge-wazuh` private EC2 instance.

---

## 1. Deployed Components

| Component | Service Name | Internal Port | Description |
| :--- | :--- | :--- | :--- |
| **Wazuh Indexer** | `wazuh-indexer` | `9200` (HTTPS) | OpenSearch-based distributed search and indexing engine |
| **Wazuh Manager** | `wazuh-manager` | `1514` (TCP/UDP), `1515` (TCP), `55000` (HTTPS API) | Telemetry analysis engine, agent registration, decoder/rules |
| **Filebeat** | `filebeat` | Internal socket / client | Forwards Wazuh Manager alert JSON logs to the Indexer |
| **Wazuh Dashboard** | `wazuh-dashboard` | `443` (HTTPS) | OpenSearch Dashboards web interface with Wazuh plugin |

---

## 2. Directory Layout & Key Files

* **Certificates Directory**: `/etc/wazuh-certs/` (Generated root CA and node certificates; keys protected with `0600` permissions).
* **Indexer Configuration**: `/etc/wazuh-indexer/opensearch.yml`
* **Manager Configuration**: `/var/ossec/etc/ossec.conf`
* **Filebeat Configuration**: `/etc/filebeat/filebeat.yml`
* **Dashboard Configuration**: `/etc/wazuh-dashboard/opensearch_dashboards.yml`
* **Wazuh App Plugin Configuration**: `/usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml`

---

## 3. Usage & Access

Deploy the role using the master playbook:

```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/wazuh.yml
```

### Accessing the Web Dashboard
Because the Wazuh instance resides in a private subnet, open an SSH tunnel via the Bastion:

```bash
./scripts/wazuh-tunnel.sh
```

Then navigate to: `https://localhost:8443` in your local browser.
