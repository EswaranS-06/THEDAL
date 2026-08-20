/**
 * THEDAL — Interactive Public Showcase JavaScript
 * UI-UX Pro Max interactive layer: Copy engine, live log stream simulator, search & tabs
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Toast Notification Engine
  const toastContainer = document.getElementById('toast-container') || createToastContainer();

  function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = type === 'success' 
      ? '<svg class="icon icon-sm" style="color:#10b981" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<svg class="icon icon-sm" style="color:#38bdf8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2400);
  }

  // 2. Global Universal Copy Engine
  document.querySelectorAll('[data-copy-target], [data-copy-text]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      let textToCopy = '';

      const directText = btn.getAttribute('data-copy-text');
      const targetId = btn.getAttribute('data-copy-target');

      if (directText) {
        textToCopy = directText;
      } else if (targetId) {
        const targetElem = document.getElementById(targetId);
        if (targetElem) {
          textToCopy = targetElem.textContent.trim();
        }
      }

      if (!textToCopy) return;

      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalContent = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = `<svg class="icon icon-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> <span>Copied!</span>`;
        
        showToast(`Copied to clipboard: "${textToCopy.slice(0, 36)}${textToCopy.length > 36 ? '...' : ''}"`);

        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.classList.remove('copied');
        }, 2200);
      } catch (err) {
        console.error('Failed to copy text:', err);
        showToast('Failed to copy to clipboard', 'error');
      }
    });
  });

  // 3. Interactive Live Threat & Telemetry Simulator
  const streamBody = document.getElementById('live-stream-body');
  const simToggleBtn = document.getElementById('sim-toggle-btn');
  const simClearBtn = document.getElementById('sim-clear-btn');

  const SAMPLE_LOGS = [
    { source: 'SYSMON', class: 'source-sysmon', text: 'EID 1: Parent: powershell.exe (PID: 4820) -> Image: whoami.exe /priv [User: NT AUTHORITY\\SYSTEM]' },
    { source: 'WAZUH', class: 'source-wazuh', text: 'ALERT Level 12 [Rule: 100201]: Scheduled Task Persistence Created via schtasks /create /tn SecurityHealthCheck' },
    { source: 'NGINX', class: 'source-nginx', text: '10.10.20.114 - GET /vulnerabilities/sqli/?id=1%27%20OR%201=1--%20- HTTP/1.1 200 (DVWA)' },
    { source: 'AUDITD', class: 'source-auditd', text: 'SYSCALL 59 [execve]: comm="sh" exe="/bin/dash" ppid=944 (www-data spawned interactive shell)' },
    { source: 'ATOMIC', class: 'source-atomic', text: 'T1082 (System Info Discovery) executed against 10.10.10.254 via invoke-atomicredteam' },
    { source: 'SYSMON', class: 'source-sysmon', text: 'EID 3: Process cmd.exe initiated outbound TCP 10.10.10.254:5985 -> 10.10.20.114:4444' },
    { source: 'WAZUH', class: 'source-wazuh', text: 'ALERT Level 10 [Rule: 100350]: PowerShell ScriptBlock Obfuscation Detected (Base64 Cradle: IEX(New-Object Net.WebClient))' },
    { source: 'DOCKER', class: 'source-nginx', text: 'JuiceShop REST Container: POST /rest/user/login payload={"email":"\' OR 1=1--","password":""} 500 SQLite Error' }
  ];

  let simRunning = true;
  let simInterval = null;

  function addLogLine() {
    if (!streamBody) return;
    const now = new Date().toISOString().split('T')[1].slice(0, 8);
    const randomLog = SAMPLE_LOGS[Math.floor(Math.random() * SAMPLE_LOGS.length)];

    const row = document.createElement('div');
    row.className = 'stream-row';
    row.innerHTML = `
      <span class="stream-time">[${now}]</span>
      <span class="stream-source ${randomLog.class}">[${randomLog.source}]</span>
      <span class="stream-content">${randomLog.text}</span>
    `;

    streamBody.appendChild(row);

    // Keep max 25 rows in buffer
    while (streamBody.children.length > 25) {
      streamBody.removeChild(streamBody.firstChild);
    }

    streamBody.scrollTop = streamBody.scrollHeight;
  }

  function startSimulation() {
    if (simInterval) clearInterval(simInterval);
    simInterval = setInterval(addLogLine, 2200);
    simRunning = true;
    if (simToggleBtn) {
      simToggleBtn.innerHTML = `<svg class="icon icon-xs" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause Feed`;
    }
  }

  function pauseSimulation() {
    if (simInterval) clearInterval(simInterval);
    simRunning = false;
    if (simToggleBtn) {
      simToggleBtn.innerHTML = `<svg class="icon icon-xs" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume Feed`;
    }
  }

  if (simToggleBtn) {
    simToggleBtn.addEventListener('click', () => {
      if (simRunning) {
        pauseSimulation();
      } else {
        startSimulation();
      }
    });
  }

  if (simClearBtn) {
    simClearBtn.addEventListener('click', () => {
      if (streamBody) streamBody.innerHTML = '';
    });
  }

  // Start feed on page load if element exists
  if (streamBody) {
    // Add 4 initial lines
    for (let i = 0; i < 4; i++) {
      addLogLine();
    }
    startSimulation();
  }

  // 4. Command Hub Category Filters
  const cmdFilterButtons = document.querySelectorAll('.cmd-filter-btn');
  const cmdCards = document.querySelectorAll('.cmd-card');

  cmdFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');

      cmdFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      cmdCards.forEach(card => {
        const cardCat = card.getAttribute('data-category');
        if (category === 'all' || cardCat === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 5. Telemetry Live Table Search Filter
  const telemetrySearch = document.getElementById('telemetry-search');
  const telemetryTableBody = document.getElementById('telemetry-table-body');

  if (telemetrySearch && telemetryTableBody) {
    telemetrySearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const rows = telemetryTableBody.querySelectorAll('tr');

      rows.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        if (rowText.includes(query)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  // 6. Installation Tabs Switcher
  const installTabBtns = document.querySelectorAll('.install-tab-btn');
  const installTabPanes = document.querySelectorAll('.install-tab-pane');

  installTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      installTabBtns.forEach(b => b.classList.remove('active'));
      installTabPanes.forEach(pane => pane.style.display = 'none');

      btn.classList.add('active');
      const activePane = document.getElementById(`tab-${targetTab}`);
      if (activePane) {
        activePane.style.display = 'block';
      }
    });
  });

  // 7. Mobile Navigation Toggle
  const mobileNavBtn = document.getElementById('mobile-nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileNavBtn && navMenu) {
    mobileNavBtn.addEventListener('click', () => {
      const isVisible = navMenu.style.display === 'flex';
      navMenu.style.display = isVisible ? 'none' : 'flex';
      navMenu.style.flexDirection = 'column';
      navMenu.style.position = 'absolute';
      navMenu.style.top = '4.25rem';
      navMenu.style.left = '0';
      navMenu.style.right = '0';
      navMenu.style.background = 'var(--bg-surface-elevated)';
      navMenu.style.padding = '1.5rem';
      navMenu.style.borderBottom = '1px solid var(--border-default)';
    });
  }
});
