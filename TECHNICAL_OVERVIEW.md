# Technical Overview: Gudang Toko Management System (Frontend)

## Project Information

- **Name**: Inventario Frontend
- **Type**: React + TypeScript SPA (Single Page Application)
- **Version**: 0.0.0
- **Build Tool**: Vite
- **Package Manager**: npm

---

## 1. Core Architecture & Tech Stack

### Technology Stack

| Layer                | Technology                      | Version        |
| -------------------- | ------------------------------- | -------------- |
| **Framework**        | React                           | 19.0.0         |
| **Language**         | TypeScript                      | ~5.7.2         |
| **Build Tool**       | Vite                            | 6.2.0          |
| **Router**           | React Router DOM                | 7.5.0          |
| **State Management** | React Context API + React Query | 5.72.0         |
| **HTTP Client**      | Axios                           | 1.8.4          |
| **Form Handling**    | React Hook Form + Zod           | 5.0.1 + 3.24.2 |
| **Notifications**    | React Hot Toast                 | 2.5.2          |
| **Styling**          | CSS (Tailwind compatible)       | Custom classes |
| **Authentication**   | Laravel Sanctum                 | -              |

### High-Level Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         React SPA Application (Vite)             │
├─────────────────────────────────────────────────┤
│  Pages Layer (UI Components)                     │
│  ├─ Login, Profile, Overview                     │
│  ├─ Categories, Products, Warehouses             │
│  ├─ Users, Roles, Merchants                      │
│  └─ Transactions, Assignments                    │
├─────────────────────────────────────────────────┤
│  Hooks Layer (Business Logic)                    │
│  ├─ useAuth, useProducts, useMerchants           │
│  ├─ useWarehouses, useTransactions               │
│  └─ useCategories, useRoles, useUsers            │
├─────────────────────────────────────────────────┤
│  Context & Providers                            │
│  ├─ AuthProvider (Authentication state)         │
│  ├─ TransactionProvider (Cart/Transaction)      │
│  └─ React Query (Server state cache)            │
├─────────────────────────────────────────────────┤
│  API Layer (Axios + Sanctum)                    │
│  └─ axiosConfig: Configured instance            │
│     authService: Authentication operations      │
├─────────────────────────────────────────────────┤
│  Backend: Laravel 12 API (http://localhost:8000) │
│  ├─ REST endpoints (/api/...)                    │
│  └─ Authentication (Laravel Sanctum)             │
└─────────────────────────────────────────────────┘
```

---

## 2. Core Components & Modules

### 2.1 Providers (State Management)

#### AuthProvider (`src/providers/AuthProvider.tsx`)

- **Purpose**: Manages global authentication state
- **Key Features**:
  - Initializes user on app load (skips login pages)
  - Provides `login()` and `logout()` operations
  - Handles user state (`user`, `loading`)
  - Location-aware: Avoids unnecessary API calls on login page
- **Context**: `AuthContext` with `AuthContextType` interface
- **Flow**:
  1. On mount/location change: Calls `authService.fetchUser()`
  2. User data stored in context
  3. Child components access via `useAuth()` hook

#### TransactionProvider (`src/providers/TransactionProvider.tsx`)

- **Purpose**: Manages transaction/cart state for the checkout flow
- **Scope**: Wrapper for add transaction pages only
- **Responsibility**: Maintains products selected for transaction

#### React Query (QueryClient)

- **Config**: Created in `App.tsx`
- **Purpose**: Server state management and caching
- **Benefits**: Automatic caching, deduplication, refetching

### 2.2 Routing & Protection

#### App Routes (`src/App.tsx`)

- **Root path**: `/` → Login
- **Protected routes**: Wrapped in `<ProtectedRoute>` component with role checks

#### ProtectedRoute (`src/routes/ProtectedRoute.ts`)

- **Logic**:
  1. Checks if user is authenticated
  2. Validates user roles against allowed roles
  3. Redirects to `/unauthorized` if role mismatch
  4. Returns `null` during loading to prevent flashing
- **Props**: `children: JSX.Element`, `roles?: string[]`

### 2.3 API Layer

#### Axios Configuration (`src/api/axiosConfig.ts`)

- **Base URL**: `http://localhost:8000/api`
- **Features**:
  - CSRF token handling for Sanctum
  - Credentials included for session auth
  - Interceptor: Fetches CSRF token before login/register
- **Headers**:
  ```typescript
  {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
  ```

#### Auth Service (`src/api/authService.ts`)

- **Methods**:
  - `fetchUser()`: GET `/user` - retrieves authenticated user
  - `login(email, password)`: POST `/login` - authenticates user
  - `logout()`: POST `/logout` - logs out user
- **Error Handling**: Throws descriptive errors from API responses

### 2.4 Custom Hooks (Business Logic)

Each hook encapsulates CRUD operations using React Query:

#### Data Fetching Hooks

| Hook                    | Purpose              |
| ----------------------- | -------------------- |
| `useFetchProducts`      | GET all products     |
| `useFetchProduct(id)`   | GET single product   |
| `useFetchWarehouses`    | GET all warehouses   |
| `useFetchWarehouse(id)` | GET single warehouse |
| `useFetchMerchants`     | GET all merchants    |
| `useFetchMerchant(id)`  | GET single merchant  |
| `useFetchCategories`    | GET all categories   |
| `useFetchCategory(id)`  | GET single category  |
| `useFetchUsers`         | GET all users        |
| `useFetchUser(id)`      | GET single user      |
| `useFetchRoles`         | GET all roles        |
| `useFetchTransactions`  | GET all transactions |

#### Mutation Hooks

| Hook                                                 | Purpose                                       |
| ---------------------------------------------------- | --------------------------------------------- |
| `useCreateProduct`                                   | POST create product (with FormData for image) |
| `useUpdateProduct`                                   | PUT update product (with image upload)        |
| `useDeleteProduct`                                   | DELETE product                                |
| `useCreateMerchant`                                  | POST create merchant                          |
| `useUpdateMerchant`                                  | PUT update merchant                           |
| `useDeleteMerchant`                                  | DELETE merchant                               |
| `useCreateWarehouse`                                 | POST create warehouse                         |
| `useUpdateWarehouse`                                 | PUT update warehouse                          |
| `useDeleteWarehouse`                                 | DELETE warehouse                              |
| + Similar for Categories, Users, Roles, Transactions |

#### Special Hooks

- `useAuth()`: Access authentication context
- `useRoleRedirect()`: Handle role-based navigation
- `useAssignRoles()`: Assign roles to users
- `useMerchantProducts()`: Get products for merchant
- `useWarehouseProducts()`: Get products for warehouse
- `useTransactions()`: Get/manage transactions

**Pattern**: All hooks follow React Query conventions:

```typescript
useMutation<ResponseType, ErrorType, PayloadType>({
  mutationFn: async (payload) => {
    /* API call */
  },
  onSuccess: () => {
    /* Invalidate cache, navigate */
  },
});
```

### 2.5 Type Definitions (`src/types/`)

#### Core Types

- **`auth.ts`**: `User`, `Role`, `CreateUserPayload`, `UpdateRolePayload`
- **`merchant.ts`**: `Merchant`, `CreateMerchantPayload`
- **`product.ts`**: `Product`, `CreateProductPayload`
- **`warehouse.ts`**: `Warehouse`, `CreateWarehousePayload`
- **`transaction.ts`**: `Transaction`, `TransactionItem`
- **`cart.ts`**: `CartItem`, `Cart`
- **`shared.ts`**: Common interfaces like `ApiErrorResponse`

---

## 3. Page Structure & Feature Modules

### Organized by Feature (Feature-First Approach)

#### Authentication Pages

- `Login.tsx` - Login form with credentials
- `Profile.tsx` - User profile management
- `Unauthorized.tsx` - 403 error page

#### Admin/Manager Features (Role: `manager`)

1. **Overview** (`Overview.tsx`) - Dashboard with statistics
2. **Categories** - CRUD management
   - `CategoryList.tsx` - List with search/filter
   - `AddCategory.tsx` - Form to create
   - `EditCategory.tsx` - Form to update

3. **Products** - CRUD with image upload
   - `ProductList.tsx` - List with pagination
   - `AddProduct.tsx` - Form with file upload
   - `EditProduct.tsx` - Update form

4. **Warehouses** - CRUD management
   - Similar structure: List, Add, Edit pages

5. **Users** - CRUD user management
   - `UserList.tsx` - List users
   - `AddUser.tsx` - Create user
   - `EditUser.tsx` - Update user

6. **Roles** - CRUD role management
   - `RoleList.tsx`, `AddRole.tsx`, `EditRole.tsx`

7. **Assign User Roles** - Many-to-many assignment
   - `AssignUserRoles.tsx` - Assign roles to users

8. **Merchants** - CRUD merchant management
   - Basic CRUD operations

9. **Merchant Products** - Product assignments to merchants
   - `MerchantProductList.tsx` - Show products assigned to merchant
   - `AssignProduct.tsx` - Assign product to merchant
   - `EditAssignProduct.tsx` - Edit assignment

10. **Warehouse Products** - Product assignments to warehouses
    - Similar structure to merchant products

#### Keeper Features (Role: `keeper`)

1. **Overview Merchant** (`OverviewMerchant.tsx`) - Dashboard for keepers
2. **My Merchant Profile** (`MyMerchantProfile.tsx`) - Profile of assigned merchant
3. **Transactions** - Transaction management
   - `TransactionList.tsx` - View all transactions
   - `AddTransaction.tsx` - Create new transaction (with cart)
   - `TransactionDetails.tsx` - View transaction details
   - `TransactionSuccess.tsx` - Success confirmation page
   - Nested components for transaction workflow

### Page Structure Pattern

Each CRUD page follows:

```
Page Component
├─ Sidebar (navigation)
├─ Top Bar (title, search, notifications, profile)
├─ Main Content (table, form, or details)
└─ UserProfileCard (quick profile access)
```

---

## 4. Data Flow & Communication

### Authentication Flow

```
1. User visits app
2. AuthProvider initializes (skips on /login path)
3. Calls authService.fetchUser()
4. API returns user with roles
5. User state set in Context
6. Child components can access via useAuth()
7. ProtectedRoute validates roles
```

### CRUD Operations Flow

```
Page Component
  ↓
useForm Hook (React Hook Form + Zod validation)
  ↓
Custom Mutation Hook (useCreateProduct, etc.)
  ↓
Axios API call to Laravel backend
  ↓
React Query caches response
  ↓
onSuccess: Invalidate cache + Navigate
```

### Real-time State Updates

- **React Query**: Automatic cache invalidation on mutations
- **Context API**: Manual updates for auth state
- **Local State**: Component-level state for UI (loading, filters)

### API Request/Response Pattern

```
Request:
POST /api/products
Body: FormData (for file uploads) or JSON
Headers: Content-Type, Accept, X-CSRF-TOKEN (auto-set)

Response:
200 OK: { id, name, price, ... }
400 Bad Request: { message: "...", errors: { field: ["error"] } }
401 Unauthorized: Redirect to /login
403 Forbidden: Redirect to /unauthorized
```

---

## 5. Validation & Error Handling

### Form Validation (Zod Schemas)

Located in `src/schemas/`:

- `productSchema.ts` - Validates product creation/update
- `merchantSchema.ts` - Validates merchant data
- `userSchema.ts` - Validates user data
- `roleSchema.ts` - Validates role names
- `categorySchema.ts` - Validates categories
- `warehouseSchema.ts` - Validates warehouse data
- `transactionSchema.ts` - Validates transactions
- And more...

**Integration**: Used with React Hook Form:

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(productSchema),
});
```

### Error Handling Strategy

1. **API Errors**: Caught in Axios interceptors + thrown in services
2. **Validation Errors**: Displayed inline on forms from Zod
3. **UI Errors**: Displayed using React Hot Toast notifications
4. **Protected Routes**: Redirect to `/unauthorized` on role mismatch

---

## 6. Deployment Architecture

### Build Process

```bash
npm run build  # tsc -b && vite build
npm run dev    # vite (dev server on port 5173)
npm run lint   # eslint .
npm run preview # Preview production build
```

### Environment Setup

- **Backend API**: `http://localhost:8000/api`
- **CSRF**: Laravel Sanctum handles CSRF token exchange
- **Authentication**: Token + Session-based (Sanctum)
- **Credentials**: Included in all requests via `withCredentials: true`

### File Structure (Output)

```
dist/
├─ index.html
├─ assets/
│  ├─ js (JavaScript bundles)
│  ├─ css (Stylesheets)
│  └─ images (Static assets)
└─ favicon.ico
```

### Static Assets

Located in `public/assets/`:

- `images/backgrounds/` - Background images
- `images/icons/` - SVG icons (search, notifications, etc.)
- `images/logos/` - Brand logos

---

## 7. Development Workflow

### Development Server

```bash
npm run dev
# Starts Vite dev server (hot reload)
# Access at http://localhost:5173
```

### Type Safety

- **TypeScript**: Global type checking with `tsc -b`
- **ESLint**: Code quality linting
- **Zod**: Runtime validation

### Common Development Tasks

#### Adding a New CRUD Feature

1. Create types in `src/types/[feature].ts`
2. Create Zod schema in `src/schemas/[feature]Schema.ts`
3. Create custom hook in `src/hooks/use[Feature].ts`
4. Create page components in `src/pages/[feature]/`
5. Add routes to `App.tsx`
6. Protect routes with `<ProtectedRoute roles={['role']}>`

#### Adding a New API Endpoint

1. Ensure backend Laravel API is running
2. Update Axios base URL if needed in `axiosConfig.ts`
3. Create service function in appropriate hook
4. Integrate React Query mutation/query

---

## 8. Key Design Patterns

### Provider Pattern

- `AuthProvider` wraps entire app
- `TransactionProvider` wraps specific feature
- Provides centralized state management

### Hook Pattern

- Custom hooks encapsulate API logic
- Reusable across components
- Separation of concerns (logic from UI)

### Protected Route Pattern

- Role-based access control
- Automatically redirects unauthenticated users
- Prevents unauthorized access to features

### Form Pattern

- React Hook Form for form management
- Zod for validation
- Server-side error handling

### Query/Mutation Pattern

- React Query for server state
- Automatic caching and refetching
- Optimistic updates on mutations

---

## 9. Performance Considerations

### Optimization Strategies

1. **Code Splitting**: Vite automatically splits chunks
2. **Lazy Loading**: Routes can use React.lazy() (not currently used)
3. **Caching**: React Query caches API responses
4. **Image Optimization**: SVG icons for scalability
5. **Build Optimization**: Tree-shaking, minification via Vite

### Bundle Size

- React: 19.0.0 (optimized)
- React Router: 7.5.0
- React Query: 5.72.0 (selective imports)
- Axios: 1.8.4 (lightweight)
- Zod: 3.24.2 (runtime validation)

---

## 10. Security Aspects

### Authentication

- **Sanctum Sessions**: Secure cookie-based authentication
- **CSRF Protection**: Token automatically handled by Sanctum
- **Credentials**: `withCredentials: true` ensures cookies sent

### Authorization

- **Role-Based Access Control**: Enforced via `ProtectedRoute`
- **Frontend Validation**: Prevents unauthorized navigation
- **Backend Validation**: API should also validate (not shown)

### Input Validation

- **Zod Schemas**: Client-side validation prevents invalid data
- **FormData**: Used for file uploads with proper encoding

---

## 11. Dependencies & Integrations

### Direct Dependencies

```json
{
  "@hookform/resolvers": "^5.0.1", // React Hook Form validation
  "@tanstack/react-query": "^5.72.0", // Server state management
  "axios": "^1.8.4", // HTTP client
  "react": "^19.0.0", // UI library
  "react-dom": "^19.0.0", // DOM rendering
  "react-hot-toast": "^2.5.2", // Toast notifications
  "react-router-dom": "^7.5.0", // Routing
  "zod": "^3.24.2" // Schema validation
}
```

### External Services

- **Laravel Backend**: http://localhost:8000/api
- **Images**: Served from backend or public/assets/
- **Authentication**: Laravel Sanctum

---

## 12. Future Extensibility

### Potential Improvements

1. **Lazy Route Loading**: Use React.lazy() to split large routes
2. **State Management**: Consider Zustand/Redux for complex state
3. **Error Boundaries**: Add error boundary components
4. **Unit Tests**: Jest + React Testing Library
5. **E2E Tests**: Playwright/Cypress
6. **Monitoring**: Error tracking (Sentry)
7. **Internationalization**: i18n for multi-language support
8. **Accessibility**: ARIA labels, keyboard navigation
9. **Dark Mode**: Theme provider for dark/light modes
10. **Real-time**: WebSocket integration for live updates

---

## Summary

This is a **modern React SPA** with:

- ✅ TypeScript for type safety
- ✅ Vite for fast builds
- ✅ React Query for efficient server state
- ✅ Context API for authentication
- ✅ React Hook Form + Zod for robust forms
- ✅ Role-based route protection
- ✅ Laravel Sanctum authentication
- ✅ Modular, maintainable architecture

The application is structured for scalability and maintainability, with clear separation of concerns between UI, business logic (hooks), and API communication.
