# Gudang Toko Management System - Frontend

## Project Snapshot

**Inventario Frontend** is a React 19 + TypeScript SPA using Vite for fast builds, managing a warehouse/merchant product inventory system. Features role-based access control (RBAC) with two roles: `manager` (admin) and `keeper` (merchant staff). Authentication via Laravel Sanctum. See [TECHNICAL_OVERVIEW.md](TECHNICAL_OVERVIEW.md) for detailed architecture.

## Root Setup Commands

```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Type check
npm run build  # First part: tsc -b

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Universal Conventions

### Code Style

- **TypeScript**: Strict mode enabled, all types defined
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Imports**: Relative imports for local files
- **Components**: Named exports, functional components with hooks
- **Hooks**: Custom hooks in `src/hooks/` follow `use*` pattern

### Commit Strategy

- Clear, descriptive commit messages
- Reference feature/bug being fixed
- Keep commits focused on single changes

### PR Requirements

- All TypeScript errors resolved
- Lint passes (`npm run lint`)
- Updated types if API changes made
- Update AGENTS.md if new patterns introduced

## Security & Secrets

**NEVER** commit:

- `.env` files with API credentials
- Authentication tokens
- Database passwords
- Private API keys

**Pattern**:

- Create `.env.local` for development (in .gitignore)
- Backend URL: `http://localhost:8000/api` (hardcoded, local dev only)
- Production: Use environment variables

## JIT Index

### Feature Modules

- **Authentication**: `src/providers/AuthProvider.tsx`, `src/api/authService.ts` → [see src/AGENTS.md](src/AGENTS.md)
- **CRUD Operations**: `src/hooks/use*.ts` hooks → [see src/AGENTS.md](src/AGENTS.md)
- **Pages**: `src/pages/**` organized by feature → [see src/pages/AGENTS.md](src/pages/AGENTS.md)
- **Types & Validation**: `src/types/`, `src/schemas/` → [see src/AGENTS.md](src/AGENTS.md)

### Quick Find Commands

```bash
# Find a component by name
rg -n "export.*ProductList" src/pages

# Find a custom hook
rg -n "export const use" src/hooks

# Find API calls (mutations/queries)
rg -n "useMutation|useQuery" src/hooks

# Find page routes
rg -n "<Route" src/App.tsx

# Find type definitions
rg -n "export interface|export type" src/types

# Find validation schemas
rg -n "z\.object\|z\.string\|z\.number" src/schemas
```

## Definition of Done

Before submitting a PR:

1. ✅ All TypeScript errors resolved: `npm run build`
2. ✅ Linting passes: `npm run lint`
3. ✅ New API calls wrapped in custom hooks
4. ✅ New pages protected by `<ProtectedRoute>` with appropriate roles
5. ✅ New types defined in `src/types/[feature].ts`
6. ✅ New validation schemas in `src/schemas/[featureName]Schema.ts`
7. ✅ Routes added to `src/App.tsx` with role-based access

---

See detailed patterns and commands in:

- [src/AGENTS.md](src/AGENTS.md) - React components, hooks, types
- [src/pages/AGENTS.md](src/pages/AGENTS.md) - Page component patterns
