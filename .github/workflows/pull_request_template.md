# Summary
Start with a concise summary of the PR. The first three sections are required. The questions in each section are there to guide you; overwrite them with your comments.

## Why
- Why are you making the change?
- What is the underlying issue that you are trying to fix (in case of a bug)?
- Why is it needed by the feature you are working on?
- What is the intent behind making the change?

## Goal
- What is the intended outcome?
- What part of the feature should start working?
- What are the non-goals or will be covered in future PRs?

## Testing
- How was the code tested?
- If you haven't written unit tests, why?
- What more testing is needed? Do you intend to manually test it after deployment?
- Do you have any concerns if this changed is released to prod?

## Tech Debt
- Is the PR adding to tech debt in any way?
- Are you addressing some tech debt in this PR?
- If both are false, you can remove this section.

---

## PR Checklist
Every PR must answer all items (mark with `[x]` for Yes, `[ ]` for No, or `[N/A]`):

| Check list Items                                                                      | Yes | No  | N/A |
| ------------------------------------------------------------------------------------- | --- | --- | --- |
| Core functionality: New changes work as expected without breaking existing logic      | [ ] | [ ] | [ ] |
| Regression check: No unintended side effects on existing features                     | [ ] | [ ] | [ ] |
| UI/UX Testing: Ensured UI updates meet design standards                               | [ ] | [ ] | [ ] |
| Responsiveness: Verified on desktop & tablet views (if applicable)                    | [ ] | [ ] | [ ] |
| Cross-browser Testing (if applicable): Verified on Chrome, Firefox, Safari, and Edge  | [ ] | [ ] | [ ] |
| Access Control: Role-based access verified (Accadmin, VaultCreator…etc)               | [ ] | [ ] | [ ] |
| Error-free: No console errors / console logs                                          | [ ] | [ ] | [ ] |
| Unit Testing: Unit tests updated & passing locally                                    | [ ] | [ ] | [ ] |
| Integration & Regression Testing: Cypress/Karate tests updated & passing in pipelines| [ ] | [ ] | [ ] |
| Multi-account check: Verified on dedicated/tenant account & parent account            | [ ] | [ ] | [ ] |
| Performance: No significant degradation (load time, response time)                    | [ ] | [ ] | [ ] |
| Cross-service impact: Verified no impact on other dependent services or APIs          | [ ] | [ ] | [ ] |
| Security basics: No hardcoded secrets / sensitive data                                | [ ] | [ ] | [ ] |

---

## Merge Rules (for reference)
- **Branch name:** `githubusername/ticketId-short-description`  
- **PR title:** same as branch name  
- **Reviewers:** At least 2 approvals required  
- **CI checks:** All must pass before merging
