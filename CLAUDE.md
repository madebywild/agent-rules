## Meta-rule that instructs every LLM-powered agent how to write, store,
and compile new “source-of-truth” rules.  
- All new rules **must** live in `./agent-rules/` as Markdown files  
  with the same front-matter structure shown here.  
- After a rule is added or changed, the agent must run
  `./translate_rules.ts` to regenerate provider-specific rule files
  automatically.  
- Agents must **never** write or edit provider-specific rule files
  directly (e.g. “Cursor” rules); they are generated exclusively by
  the translation script.


# Meta-Rule: Authoring & Storing Agent Rules

## 1 · Where to Place New Rules

- Create every new rule as a **Markdown file** inside **`./agent-rules/`**.
- Name the file in **kebab-case**, summarising its intent  
  (e.g. `rate-limit-handling.md`).

## 2 · Mandatory Front-Matter

Each rule **must** begin with YAML front-matter exactly like this:

```yaml
---
description: |
  One-sentence summary of the rule’s purpose.
alwaysApply: false # or true, if the rule should always run
cursor:
  retrieval-strategy: always
---
```

## 3 · Compilation Workflow

After saving or modifying a rule inside this ./agent-rules folder:

```bash
npm run translate_rules
```

The script converts all Markdown rules in **`./agent-rules/`** into the
provider-specific formats expected by each agent type.

## 4 · Provider Files Are Read-Only

- **Do not** author, edit, or commit rule files that live inside provider
  folders (e.g. `./.cursor/rules/`, `./.clinerules/`).
- Treat those files as **generated artifacts**; regenerate them via the
  translation script whenever the source-of-truth rule changes.

## 5 · Good vs Bad Practice

### Good

```bash
# Create the source-of-truth rule
touch ./agent-rules/context-window.md
# (Add front-matter and content as described)
npm run translate_rules   # Regenerates provider files
```

### Bad

```bash
# Directly editing a Cursor-specific rule
vim ./cursor-rules/context-window.rule
# → Forbidden: this file will be overwritten by the translation script
```

---

Following this meta-rule keeps every provider in sync and preserves a
single, human-readable source of truth for all agent behaviour.


## Defines how every AI prototype must be laid out in the repository.


# Prototype Structure

## Organization Guidelines

- **Routes** go in **`/site/app/routes`**
- **All prototype‑specific code** (components, hooks, logic, utilities) lives in  
  **`/site/app/prototypes/[prototype-slug]`**

---

## Examples

### Good Example

```typescript
// File: /site/app/routes/my-prototype.tsx
import { MyComponent } from "/site/app/prototypes/[prototype-slug]/MyComponent";

export default function MyPrototypeRoute() {
  return <MyComponent />;
}
}
```

```typescript
// File: /site/app/prototypes/[prototype-slug]/MyComponent.tsx
export function MyComponent() {
  return <div>My prototype component</div>;
}
```

### Bad Example

```typescript
// File: /site/app/routes/my-prototype.tsx
// DON'T put component logic directly in the route file
export default function MyPrototypeRoute() {
  function MyComponent() {
    return <div>My prototype component</div>;
  }

  return <MyComponent />;
}
```

```typescript
// File: /site/app/components/MyPrototypeComponent.tsx
// DON'T place prototype‑specific components in the shared components directory
export function MyPrototypeComponent() {
  return <div>My prototype component</div>;
}
```

