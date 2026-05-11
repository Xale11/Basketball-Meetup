---
name: audit-policy
description: Use when checking what Row Level Security (RLS) policies enforce. Audit policies and report on their security and intended behavior.
---

# Audit RLS policies

Verify that each RLS policy is secure and supports the desired functionality. If the user does not state desired behavior, summarize what the policy actually allows and denies.

## What to deliver

1. **Behavior** — What the policy does (roles, operations, `USING` / `WITH CHECK`, and how it interacts with related policies).
2. **Security** — Whether the rules are tight enough, common gaps (over-broad `USING`, missing `WITH CHECK`, privilege escalation via joins, etc.), and concrete feedback.
3. **Alignment** — If behavior does not match what the user expects, explain whether their goal is safe and how to implement it without weakening other rules.

## Scope and cross-impact

- Read related policies on the same table and policies on tables that are referenced in conditions or that reference this table.
- Before recommending changes, consider how a change to one policy affects others (including inserts/updates that depend on multiple policies).
- Do not assess a policy in isolation: account for relationships, foreign keys, and helper tables used in policy expressions.

## When proposing changes

Always check other policies first. Prefer minimal, targeted changes that preserve the security posture of the rest of the schema.
