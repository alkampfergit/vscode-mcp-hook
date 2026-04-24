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

Every MCP tool exposed by this extension must be documented. Documentation lives in the `docs/` folder as markdown files.

When you add, remove, or change an MCP tool you must:

- Document the tool in the appropriate `docs/` file (create a new file if no suitable one exists).
- Each tool entry must include:
  - **Name** — the tool identifier as registered with `server.registerTool`
  - **Description** — what the tool does in plain language
  - **Input schema** — every input parameter, its type, whether it is required or optional, and what it means
  - **Return value** — what the tool returns and in what format
  - **Example** — at least one concrete request/response pair showing the tool in use
- If a tool has behavioral quirks, edge cases, or known limitations, document them explicitly.
- Keep `docs/clients.md` up to date if the new tool changes how clients should connect or discover the server.

The definition of done (compile + tests + lint) is not satisfied until the documentation has also been updated.

## Implementation rules

When you are asked to implement a feature you must follow these rules:

- locate the feature number into the folder backlog/Features as for previous layout 
- Inside the feature folder there are task instruction files.
- Each task is a markdown file with instruction of what to do
- Proceed to the implementation
- After each single feature you should stop and let the user refine the code
- once the user commit the changes he/she will give you the go-ahead to proceed with the next feature
- If you added new npm or script or other command, please run to verify that they can run correctly