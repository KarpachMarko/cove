# Project conventions

- Use pnpm for JavaScript package management and scripts. Do not use npm or npx.
- Prefer TypeScript equivalents for configuration and application files whenever supported.
- Use nuqs for URL query state and serialization.
- Use TanStack React Query for API reads, mutations, pagination, polling, and cache management.
- Use TanStack Form with Zod validation for forms, including search and autosave editors. Reuse typed field components around shadcn controls.
- Use other TanStack libraries, such as Table, when they suit the feature.
- Avoid the TypeScript `any` type. Use explicit domain types, generics, or `unknown` with narrowing.
- Keep Tailwind styling in React component `className` values. Extract shared typography, form, and layout components to reduce duplication. Avoid global component selectors or `@apply` recipes; global CSS should contain only framework imports, theme tokens, document defaults, and animation definitions.
