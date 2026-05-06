# Technical specifications

All the general technical specification are contained here [technical-specifications.md](../backlog/technical-specs.md). 
When you need to run scripts prefer powershell core that can work both in windows and unix systems.
All features are contained into backlog/Features folder. Features are ordered, each feature contains a series of sub tasks to implement the feature. 

# MUST TO FOLLOW RULES

- After each task ensure that all the tests are passing
- Always try to write tests for each new piece of code so we have all code testable.
- If you change the code outside the feature you are working on, always check the ./backlog/Features folder to understand if you need to update the feature reflecting the new changes

## Definition of done — a task is NOT complete until all of these pass

1. **Compile** — `npx tsc` exits with no errors
2. **Tests** — `npx jest` shows 0 failing tests
3. **Lint** — `npx eslint src tests --ext .ts` exits with no errors

Run them in this order after every code change. Do not report a task as done if any of these steps fail.

## Feature layout 

- backlog/featurelist.md: A list of all the features
- backlog/Features: Contains all features, one directory for each feature, with the number of the feature as first part of directory names
- backlog/Features/X. Feature name: Contains task files that implement that features, ordered by the number at the beginning of the file name

## MCP documentation rules

Every MCP tool exposed by this extension must be documented in **two places**:

### 1. Technical reference — `docs/tools/<tool_name>.md`

Created/updated for every tool add, change, or removal. Must include:

- **Name** — the tool identifier as registered with `server.registerTool`
- **Description** — what the tool does in plain language
- **Input schema** — every parameter, its type, whether required or optional, and what it means
- **Return value** — what the tool returns and in what format
- **Example** — at least one concrete request/response pair
- Any behavioral quirks, edge cases, or known limitations

Keep `docs/clients.md` up to date if the change affects how clients connect or discover the server.

### 2. Wiki how-to — `wiki/<tool_name>.md`

Created/updated alongside the technical reference. The wiki page is user-facing
and must explain **how to invoke** the tool. It must include:

- The full MCP tool identifier (`mcp__vscode-mcp-hook__<name>`)
- How to call it from Claude Code (natural-language prompts that trigger it)
- How to call it via raw HTTP / curl with at least one concrete `curl` example per parameter combination
- How to call it from a TypeScript/JS MCP SDK client
- The response format with a sample output
- Practical tips (filters, edge cases the user will hit)
- A link back to the technical reference in `docs/tools/<tool_name>.md`

### 3. README tools table

When a tool is added or removed, update the **Tools** table in `README.md`:

- Add a row with the tool name, a one-line description, a link to `wiki/<tool_name>.md`, and a link to `docs/tools/<tool_name>.md`.
- Remove the row when the tool is deleted.
- Keep the **Wiki** section table in `README.md` in sync (one row per wiki page).

The definition of done (compile + tests + lint) is not satisfied until both the
technical reference and the wiki page have been created or updated, and the
README tables reflect the current tool set.

## Implementation rules

When you are asked to implement a feature you must follow these rules:

- locate the feature number into the folder backlog/Features as for previous layout 
- Inside the feature folder there are task instruction files.
- Each task is a markdown file with instruction of what to do
- Proceed to the implementation
- After each single feature you should stop and let the user refine the code
- once the user commit the changes he/she will give you the go-ahead to proceed with the next feature
- If you added new npm or script or other command, please run to verify that they can run correctly