# Challenge 02: Suspicious Administrative Process & Obfuscation

---

## 1. Challenge Prompt
> **Alert Notice**: At 16:05:12 UTC, Wazuh generated High-Severity Alert ID `100402` on Windows Server 2022 endpoint `SOCForge-windows`.

Investigate the endpoint telemetry across Sysmon and PowerShell logs to unravel the mystery.

---

## 2. Investigative Objectives
Answer the following core questions in your notes:

1. **What executable was launched on the Windows endpoint?**
2. **What command-line arguments were supplied to the executable?**
3. **What is the decoded, plain-text script that was executed in memory?**
4. **What was the parent process (`parentImage`) and Parent PID?**
5. **What user security context did the command run under?**
6. **What was the target of the query (what system resource or process was being investigated by the attacker)?**
7. **What is your final classification (True Positive vs. False Positive) and assigned confidence level?**

---

## 3. Hints & Solution
- If you get stuck, refer to **Hint 2** in [Challenge Solutions & Keys](file:///home/rex/Documents/Projects/docs/labs/challenges/solutions.md#challenge-02-hints).
- Once finished, compare your findings with the full solution key in [Challenge Solutions & Keys](file:///home/rex/Documents/Projects/docs/labs/challenges/solutions.md#challenge-02-solution).
