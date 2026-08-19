/**
 * THEDAL Control Plane — Frontend Interactive Logic
 * Minimalism & Swiss Style UI / Data-Dense Operations
 */

document.addEventListener('DOMContentLoaded', () => {
    // Auto-refresh status if on dashboard or resources page
    const autoRefreshElements = document.querySelectorAll('[data-auto-refresh]');
    if (autoRefreshElements.length > 0) {
        setInterval(() => {
            fetchSystemStatus();
        }, 12000);
    }

    // Modal keyboard and input listeners
    const phraseInput = document.getElementById('destroy-phrase-input');
    const checkInput = document.getElementById('destroy-check-input');

    if (phraseInput && checkInput) {
        const validateDestroyInputs = () => {
            const btn = document.getElementById('confirm-destroy-btn');
            if (!btn) return;
            const phrase = phraseInput.value.trim();
            const checked = checkInput.checked;
            const valid = (phrase === "DESTROY THEDAL" || phrase === "DESTROY SOCFORGE") && checked;
            btn.disabled = !valid;
        };

        phraseInput.addEventListener('input', validateDestroyInputs);
        checkInput.addEventListener('change', validateDestroyInputs);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDestroyModal();
        }
    });
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
            const dot = envBadge.previousElementSibling;
            if (dot && dot.classList.contains('status-dot')) {
                dot.className = 'status-dot';
                if (data.environment_health === 'DEGRADED') dot.classList.add('amber');
                if (data.environment_health === 'OFFLINE') dot.classList.add('red');
            }
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
                window.location.href = `/logs?file=${encodeURIComponent(data.log_file.split('/').pop())}`;
            }, 1200);
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
    if (modal) {
        modal.classList.add('active');
        const phraseInput = document.getElementById('destroy-phrase-input');
        const checkInput = document.getElementById('destroy-check-input');
        const btn = document.getElementById('confirm-destroy-btn');
        if (phraseInput) phraseInput.value = '';
        if (checkInput) checkInput.checked = false;
        if (btn) btn.disabled = true;
        if (phraseInput) phraseInput.focus();
    }
}

function closeDestroyModal() {
    const modal = document.getElementById('destroy-modal');
    if (modal) modal.classList.remove('active');
}

async function executeDestroy() {
    const phraseInput = document.getElementById('destroy-phrase-input');
    const checkInput = document.getElementById('destroy-check-input');
    if (!phraseInput || !checkInput) return;

    const phrase = phraseInput.value.trim();
    const confirmCheck = checkInput.checked;

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
