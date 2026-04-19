# src/ - React Components, Hooks, Types & API Layer

## Package Identity

Core React application layer: components, custom hooks (business logic), type definitions, API client configuration, and authentication logic. This is where 90% of development happens.

## Setup & Run

```bash
# From project root

# Type check src/
npm run build  # TypeScript check

# Find type errors
npx tsc --noEmit

# Lint src/ files
npm run lint -- src/

# Run development server
npm run dev
# Accessible at http://localhost:5173
```

## Patterns & Conventions

### Custom Hooks (Business Logic Layer)

**Location**: `src/hooks/use*.ts`  
**Pattern**: React Query + Axios for all API operations

#### Fetch Hook Pattern (useQuery)

```typescript
// src/hooks/useProducts.ts - GOOD: Read-only queries
export const useFetchProducts = () => {
  return useQuery<Product[], AxiosError>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await apiClient.get("/products");
      return response.data;
    },
  });
};

// Usage in component:
const { data: products, isPending, isError } = useFetchProducts();
```

**DO**:

- Use `useQuery` for GET operations
- Name hook `useFetch*` for queries
- Return typed response: `useQuery<ProductType, ErrorType>`
- Cache key matches API endpoint: `["products"]` for `/products`

**DON'T**:

- Fetch data in components directly (use hooks)
- Skip error types: always provide ErrorType and ResponseType
- Ignore React Query docs for advanced patterns

#### Mutation Hook Pattern (useMutation)

```typescript
// src/hooks/useProducts.ts - GOOD: Create/update/delete with callbacks
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<
    CreateProductPayload, // Response type
    AxiosError<ApiErrorResponse>, // Error type
    CreateProductPayload // Payload type
  >({
    mutationFn: async (payload) => {
      const formData = new FormData();
      formData.append("name", payload.name);
      formData.append("thumbnail", payload.thumbnail); // File upload

      const response = await apiClient.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Refresh list
      navigate("/products"); // Redirect on success
    },
  });
};

// Usage:
const { mutate: createProduct, isPending } = useCreateProduct();
createProduct({ name: "Widget", ... });
```

**DO**:

- Use `useMutation` for POST/PUT/DELETE
- Name hook `useCreate*`, `useUpdate*`, `useDelete*`
- Invalidate cache on success: `queryClient.invalidateQueries()`
- Navigate after success
- Use FormData for file uploads

**DON'T**:

- Mix queries and mutations
- Forget to invalidate related cache keys
- Handle errors silently (let them bubble up)

#### Special Hooks

```typescript
// src/hooks/useAuth.ts - GOOD: Auth context access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Usage in any component:
const { user, login, logout } = useAuth();
```

### Components (UI Layer)

**Location**: `src/components/` (shared), `src/pages/*/` (feature-specific)  
**Pattern**: Functional components with hooks, TypeScript props

#### Shared Component Pattern

```typescript
// src/components/UserProfileCard.tsx - GOOD: Exported, reusable
import { User } from "../types/types";

interface UserProfileCardProps {
  user?: User;
  onLogout?: () => void;
}

export const UserProfileCard = ({ user, onLogout }: UserProfileCardProps) => {
  return (
    <div className="rounded-3xl p-4 bg-white">
      <h2>{user?.name}</h2>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
};

// Usage in pages:
import UserProfileCard from "../components/UserProfileCard";
<UserProfileCard user={user} onLogout={logout} />
```

**DO**:

- Define props interface explicitly
- Use named exports
- Keep components under 300 lines
- Use Tailwind classes: `className="rounded-3xl p-4 bg-white"`
- Pass data as props (not global state)

**DON'T**:

- Use default exports for components (except pages)
- Fetch data inside component (use custom hooks)
- Duplicate UI code (extract to components)

#### Page Component Pattern

```typescript
// src/pages/products/ProductList.tsx - GOOD: Feature page with full layout
const ProductList = () => {
  const { data: products, isPending } = useFetchProducts();

  return (
    <>
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex flex-col flex-1 p-6">
          {/* Top bar with title, icons, profile */}
          <div className="flex items-center gap-6 bg-white rounded-3xl p-4">
            <h1 className="font-bold text-2xl">Manage Products</h1>
            <UserProfileCard />
          </div>

          {/* Main content */}
          <main className="flex flex-col gap-6 flex-1">
            {/* Table, form, or grid */}
          </main>
        </div>
      </div>
    </>
  );
};

export default ProductList;
```

**DO**:

- Default export for page components
- Include Sidebar + top bar layout
- Use `isPending` to show loaders
- Show error states: `if (isError) return <ErrorBanner />`

**DON'T**:

- Put business logic in pages (use hooks)
- Fetch data with new queries (centralize with custom hooks)

### Types & Interfaces

**Location**: `src/types/[feature].ts`  
**Pattern**: Feature-based organization

```typescript
// src/types/product.ts - GOOD: Clear, feature-specific types
export interface Product {
  id: number;
  name: string;
  price: number;
  thumbnail: string;
  category_id: number;
  is_popular: boolean;
  about: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductPayload {
  name: string;
  price: number;
  about: string;
  category_id: number;
  is_popular: boolean;
  thumbnail: File;
}

export interface UpdateProductPayload extends CreateProductPayload {
  id: number;
}
```

**DO**:

- Define both response type AND payload type
- Include timestamps: `created_at`, `updated_at`
- Separate read (Product) from write (CreateProductPayload)
- Use unions for complex states: `type Status = 'pending' | 'success' | 'error'`

**DON'T**:

- Mix API response with form payload in single type
- Use `any` type (use `unknown` + type guard if needed)
- Put types in components (centralize in `src/types/`)

### Validation Schemas (Zod)

**Location**: `src/schemas/[featureName]Schema.ts`  
**Pattern**: Mirror types, used with React Hook Form

```typescript
// src/schemas/productSchema.ts - GOOD: Zod validation
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  price: z.number().min(0, "Price must be positive"),
  about: z.string().min(10, "Description too short"),
  category_id: z.number().min(1, "Category required"),
  is_popular: z.boolean(),
  thumbnail: z.instanceof(File),
});

export type ProductFormData = z.infer<typeof productSchema>;
```

**DO**:

- Export both schema and inferred type
- Use descriptive error messages
- Validate file types and sizes
- Match TypeScript types exactly

**DON'T**:

- Skip validation on optional fields
- Use generic error messages
- Forget to validate file types/sizes

### Authentication Flow

**Location**: `src/providers/AuthProvider.tsx`, `src/api/authService.ts`

#### AuthProvider Pattern

```typescript
// src/providers/AuthProvider.tsx - GOOD: Initialization logic
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation(); // Skip login/register pages

  useEffect(() => {
    // Don't fetch user on login page (prevents infinite redirects)
    if (location.pathname === "/login" || location.pathname === "/") {
      setLoading(false);
      return;
    }

    const initializeUser = async () => {
      try {
        const userData = await authService.fetchUser();
        setUser(userData || null);
      } catch (error) {
        console.error("Auth init error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [location]);

  const login = async (email: string, password: string) => {
    const userData = await authService.login(email, password);
    setUser(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**DO**:

- Skip fetch on login pages (prevents redirects)
- Set loading during initialization
- Catch errors and set user to null
- Always provide roles array: `{ ...user, roles: user.roles ?? [] }`

**DON'T**:

- Fetch user on every location change (only paths should trigger re-fetch)
- Store tokens in localStorage (Sanctum handles sessions)

### API Client Configuration

**Location**: `src/api/axiosConfig.ts`

```typescript
// src/api/axiosConfig.ts - GOOD: Centralized config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Send cookies (Sanctum sessions)
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Interceptor for CSRF token (Sanctum requirement)
apiClient.interceptors.request.use(async (config) => {
  if (config.url?.includes("/login") || config.url?.includes("/register")) {
    // Fetch CSRF token before login attempt
    await axios.get(import.meta.env.VITE_SANCTUM_CSRF_URL, {
      withCredentials: true,
    });
  }
  return config;
});

export default apiClient;
```

**DO**:

- Use `withCredentials: true` for session auth
- Fetch CSRF token before login (Sanctum requirement)
- Centralize all API config
- Use single instance across app

## Key Files

- **Auth**: `src/api/authService.ts` - Login, logout, fetch user operations
- **Auth Context**: `src/context/AuthContext.tsx`, `src/providers/AuthProvider.tsx`
- **API Client**: `src/api/axiosConfig.ts` - Axios configuration + interceptors
- **Custom Hooks**: `src/hooks/use*.ts` - All data fetching and mutations
- **Types**: `src/types/*.ts` - Type definitions for each feature
- **Schemas**: `src/schemas/*Schema.ts` - Zod validation schemas

## JIT Index Hints

```bash
# Find all custom hooks
rg -n "export const use" src/hooks

# Find useMutation calls (data-changing)
rg -n "useMutation" src/hooks

# Find useQuery calls (read-only)
rg -n "useQuery" src/hooks

# Find React Query cache keys
rg -n 'queryKey: \["' src/hooks

# Find type definitions for a feature
rg -n "export interface|export type" src/types | grep -i "product"

# Find validation schemas
rg -n "z\.object\|z\.string\|z\.number" src/schemas

# Find API endpoints in use
rg -n 'get\("|post\("|put\("|delete\(' src/api

# Find invalid imports (should not exist)
rg -n "import.*from.*components.*components" src/hooks
```

## Common Gotchas

1. **Infinite redirect loops**: AuthProvider tries to fetch user on login page → Skip with `location.pathname` check
2. **Cache invalidation fails**: Use exact queryKey name, e.g., `invalidateQueries({ queryKey: ["products"] })`
3. **FormData breaks types**: Always set header `"Content-Type": "multipart/form-data"` for file uploads
4. **Sanctum CSRF errors**: Must call `/sanctum/csrf-cookie` BEFORE first POST to `/login`
5. **Type mismatches**: Keep `CreateProductPayload` separate from `Product` response type
6. **Missing roles**: Always provide default: `roles: user.roles ?? []` to prevent `undefined` errors

## Pre-PR Checks

```bash
# From project root - Copy and paste this:
npm run build && npm run lint
```

Should complete with no errors. If TypeScript or lint fails, fix before pushing.

### Adding a New Hook

**Template**:

```typescript
// src/hooks/useMyFeature.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/axiosConfig";
import { MyFeature, CreateMyFeaturePayload } from "../types/myFeature";
import { useNavigate } from "react-router-dom";

// Read operation
export const useFetchMyFeatures = () => {
  return useQuery<MyFeature[]>({
    queryKey: ["myFeatures"],
    queryFn: async () => {
      const { data } = await apiClient.get("/my-features");
      return data;
    },
  });
};

// Create operation
export const useCreateMyFeature = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (payload: CreateMyFeaturePayload) => {
      const { data } = await apiClient.post("/my-features", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFeatures"] });
      navigate("/my-features");
    },
  });
};
```

**Steps**:

1. Create `src/hooks/useMyFeature.ts`
2. Create `src/types/myFeature.ts` with types
3. Create `src/schemas/myFeatureSchema.ts` if has form
4. Use hook in page component
5. Add route to `src/App.tsx`
