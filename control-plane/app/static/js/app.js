/**
 * THEDAL Control Plane — Frontend Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Auto-refresh status if on dashboard or resources page
    const autoRefreshElements = document.querySelectorAll('[data-auto-refresh]');
    if (autoRefreshElements.length > 0) {
        setInterval(() => {
            fetchSystemStatus();
        }, 12000);
    }
});

/**
 * Fetch and update live status badges
 */
async function fetchSystemStatus() {
    try {
        const res = await fetch('/api/status');
        if (!res.ok) return;
        const data = await res.json();
        
        const envBadge = document.getElementById('nav-env-status');
        if (envBadge) {
            envBadge.textContent = data.environment_health;
            envBadge.className = `badge badge-${data.environment_health.toLowerCase()}`;
        }
        
        const tfBadge = document.getElementById('nav-tf-status');
        if (tfBadge) {
            tfBadge.textContent = data.terraform_status;
            tfBadge.className = `badge badge-${data.terraform_status.toLowerCase()}`;
        }
    } catch (e) {
        console.error("Failed to fetch system status:", e);
    }
}

/**
 * Trigger generic confirmed operation
 */
async function triggerOperation(endpoint, payload, requiresDoubleConfirm = false) {
    if (!requiresDoubleConfirm) {
        if (!confirm("Are you sure you want to execute this operation?")) {
            return;
        }
    }

    const outputContainer = document.getElementById('operation-output-container');
    const outputElem = document.getElementById('operation-output');
    if (outputContainer) outputContainer.style.display = 'block';
    if (outputElem) outputElem.textContent = "Executing operation in background, streaming output...";

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
            alert(`Error: ${data.detail || data.error || 'Operation failed'}`);
            if (outputElem) outputElem.textContent = `FAILED: ${data.detail || data.error}`;
            return;
        }

        if (outputElem && data.log_file) {
            outputElem.textContent = `Operation launched.\nLog file: ${data.log_file}\nMessage: ${data.message}\nRedirecting to logs...`;
            setTimeout(() => {
                window.location.href = '/logs';
            }, 1500);
        } else {
            alert(data.message || "Operation completed successfully.");
            window.location.reload();
        }
    } catch (e) {
        alert(`Network or Server Error: ${e.message}`);
    }
}

/**
 * Modal handlers for Destroy Operation
 */
function openDestroyModal() {
    const modal = document.getElementById('destroy-modal');
    if (modal) modal.classList.add('active');
}

function closeDestroyModal() {
    const modal = document.getElementById('destroy-modal');
    if (modal) modal.classList.remove('active');
}

async function executeDestroy() {
    const phrase = document.getElementById('destroy-phrase-input').value;
    const confirmCheck = document.getElementById('destroy-check-input').checked;

    if (!confirmCheck) {
        alert("You must check the confirmation box.");
        return;
    }

    if (phrase !== "DESTROY THEDAL" && phrase !== "DESTROY SOCFORGE") {
        alert("You must type the exact phrase 'DESTROY THEDAL'.");
        return;
    }

    closeDestroyModal();
    await triggerOperation('/api/terraform/destroy', {
        action: 'destroy',
        confirmation: true,
        confirmation_phrase: phrase
    }, true);
}

/**
 * Start Wazuh SSH Tunnel
 */
async function startWazuhTunnel() {
    const btn = document.getElementById('btn-wazuh-tunnel');
    if (btn) btn.disabled = true;

    try {
        const res = await fetch('/api/wazuh/tunnel/start', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            alert("SSH Tunnel Active! Opening https://localhost:8443 in a new tab.");
            window.open(data.url, '_blank');
        } else {
            alert(`Failed to start tunnel: ${data.error}`);
        }
    } catch (e) {
        alert(`Error: ${e.message}`);
    } finally {
        if (btn) btn.disabled = false;
    }
}
