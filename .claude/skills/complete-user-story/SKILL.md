---
name: complete-user-story
description: Use when the user provides a user story or development ticket that needs to be completed. Finish the work and give a clear summary of what changed.
---

# Complete the user story / ticket

1. **Read the task and plan** — Read the ticket, analyze the acceptance criteria (AC), and produce a plan. If there is no AC or the task is vague or underspecified, ask for clarity and restate the task and AC together. While planning, skim `./types` for database shape and relationships; comments above the types explain their role. The plan should list implementation steps and any RLS policies to create, update, or remove.
2. **RLS first** — Add or change Row Level Security policies so they are secure and match the intended behavior. Call out anything that looks risky. Use the **audit-policy** skill to review policies, apply its feedback, then summarize which policies changed and why.
3. **Implement logic and UI** — After the required RLS is in place, execute the plan: application logic and UI. Summarize what you built and why it fits the AC.
4. **Review and test** — Manually or automatically verify behavior against the AC. Note what you tested and any gaps.

## Keep it simple

Prefer the smallest change that satisfies the ticket. Do not overcomplicate the solution.

## Know which product you are changing

If it is unclear whether work targets **ActivCampus** or **Basketball**, ask before implementing.
