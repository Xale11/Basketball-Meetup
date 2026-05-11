---
name: sync-supabase
description: Read the supabase database structure and sync each table and relationship with the corresponding typescript type in this codebase. Use when types need to be aligned with supabase database
---

# Sync Types with Supabase Tables and Relationship

Ensure the types in ./types folder are inline with the Supabase. Some of these types are not related to supabase to can leave them, however you believe a type is represents one the tables in supabase or one of the relationships, please make sure they are in sync.

## Add Comments To The Supabase Related Types

For the types that are heavily related to supabase, add comments stating it's relationship. For example you what state a type is Table in supabase and what sort of data it is storing and how it relates to other tables. Do the same for type represent relationships.

## Never Change Supabase

Never under any circumstance change anything in supabase. You can only read from supabase. You can never make any changes to Supabase. You can only read from supabase!