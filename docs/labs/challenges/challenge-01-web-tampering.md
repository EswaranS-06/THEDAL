# Challenge 01: Unauthorized Web Application Tampering

---

## 1. Challenge Prompt
> **Alert Notice**: At 14:22:00 UTC, the SIEM triggered Alert ID `100101` on host `SOCForge-web`. 

As the on-duty SOC analyst, your task is to independently investigate this alert using OpenSearch Dashboards without guided step-by-step instructions.

---

## 2. Investigative Objectives
Answer the following core questions in your notes:

1. **What was the exact HTTP method, target URI, and query parameter received?**
2. **What was the client source IP and User-Agent?**
3. **What specific vulnerability type was being targeted?**
4. **What HTTP status code was returned by the Nginx server?**
5. **Did this request trigger any subsequent system executions in `socforge-auditd-*`?**
6. **What is your final classification (True Positive vs. False Positive) and assigned confidence level?**
7. **What is the corresponding MITRE ATT&CK technique?**

---

## 3. Hints & Solution
- If you get stuck, refer to **Hint 1** in [Challenge Solutions & Keys](file:///home/rex/Documents/Projects/docs/labs/challenges/solutions.md#challenge-01-hints).
- Once finished, compare your findings with the full solution key in [Challenge Solutions & Keys](file:///home/rex/Documents/Projects/docs/labs/challenges/solutions.md#challenge-01-solution).
