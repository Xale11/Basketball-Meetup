---
name: complete-notion-epic
description: Use when trying to complete an epic from notion. Complete all the user stories found within the epic or epics that I provide
---

# Complete the Epic and all the user stories found within the epic

Complete the user stories within the epic. Update the supabase db and policies accordingly. Make sure the policies are secure. I'd the a policy be too restrictive than lenient
Make sure you pass all the acceptance criteria and requirement.
You don't need to pass anything about pushing to github or deployment.

## Only work on the epic/epic's I specify

I will state which epics I want you to work on. You must only work on these epics. You feel the need to change other epics you must tell me and ask for my approval first.
If I don't specify an epic you MUST ask me for one. If you are not sure which epic I am referring you MUST ask me to clarify.

## Only interact with data from this notion entity, id: "30c9b9f2-e434-80f1-a84b-f68ab0bfac8c". NEVER TOUCH ANYTHING ELSE

Make sure you only interact with this notion entity. It contains a data source, database, and pages that come together create my agile dev board which has all the user stories and epics related to this project. Only touch this data. 

You can NEVER interact with anything else.

## Report on the work you have done

Always provide a summary of what you have done for each epic in an md file name epic-{number}-summary.md.
This md file should detail how you completed each user story, the outcome and how i can test your work. Label each user story with the title I used in notion.
Don't make it too verbose, highlight key details.

## Sync Supabase to the types in this codebase if you update supabase

Use the /sync-supbase skill to sync the db when you make updates to supabase