---
description: |
  Defines how every AI prototype must be laid out in the repository.
alwaysApply: true

cursor:
  retrieval-strategy: always
---

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