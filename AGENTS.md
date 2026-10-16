## Project Restrictions

- Should use as few libraries as possible.
- Any fix, new feature or code refactor MUST have backwards compatibility. Only if a feature or refactor extremely needs to break some existing API,
stop and ask me with this: "THIS NEW [FEATURE/FIX/REFACTOR] CAN'T BE POSSIBLE WITHOUT A BREAKING CHANGE, THIS MAY LEAD INTO A MAYOR VERSION, ARE YOU SURE TO CONTINUE?"
- Keep API's as simple as possible, we don't want to complicate the developer/agents to implement a new feature in their project with DayOS.
- Prioritize code readability over code complexity.

### @dayos/core

- ALWAYS keep it framework agnostic, NEVER use framework specific API's from NextJS, Tanstack Start, Tanstack Router, React Router, Remix, Gatsby, or other React framework

### @dayos/next

- This packages CAN use NextJS specific API's for functionality.

## Dependencies

- For every dependency installation for node, ALWAYS use `pnpm`.

### pnpm

- Always install exact version for npm packages, installation commands SHOULD use `@latest` and `-E`, if a dependency fails on install due pnpm `minimumReleaseAge` use the previous version. E.g. `pnpm add react@latest -E`.
- For specific app/package install use `--filter` from root. E.g. `pnpm add react@latest -E --filter=@dayos/core`

## Git

- ALWAYS ask me if you want to change branch.

## Code styling

- Code can have max 4 indent deep, if a piece of code exceded this, must be extracted into a separated function. This rule doesn't apply on markup languajes like `html` or `tsx/jsx`. 

### Typescript

- Files MUST be named with `kebab-case`. E.g. `my-function.ts`.
- Avoid barrel files (`index.ts`, `index.tsx`), use it only when its extremely necessary (most of the cases aren't)
- Exports MUST be named, NEVER defaults:
  - ALWAYS `export function myFunction(){}`.
  - NEVER `export default function myFunction(){}`.
- Exported constants must be on `CONSTANT_CASE`. E.g. `export const MY_CONSTANT_VALUE = 18`

### React

- Files MUST be named with `kebab-case`. E.g. `my-file.tsx`.
- Compound components are the default to build reusable and extensible UI's

## Refactoring

- Mesure, don't guess: 
  - Refactors about performance, ALWAYS mesure before and after the refactoring. 
  - If the time between changes are insignificant (less than 10% of improvement), keep the one that's more readable.
- ALWAYS try to avoid microoptimizations. If some change its a microoptimization, ALWAYS ask before making a change with the text: "THIS IS A MICROOPTIMIZATION, you sure to continue with this change?"

## New Features

- New features ALWAYS need a test that protects them.

