# src/pages/ - Feature Pages & Routes

## Package Identity

All user-facing pages organized by feature module. Each feature (Products, Merchants, Users, etc.) has its own folder with List, Add, and Edit pages. Pages are protected by role-based routes defined in `src/App.tsx`.

## Setup & Run

```bash
# Type check pages
npm run build

# Lint pages
npm run lint -- src/pages

# View routes that use these pages
grep -n "import.*from.*pages" src/App.tsx
```

## Page Organization Pattern

```
src/pages/
├─ Landing.tsx              # Public landing page
├─ Login.tsx                # Public login form
├─ Overview.tsx             # Manager dashboard
├─ OverviewMerchant.tsx     # Keeper dashboard
├─ [feature]/
│  ├─ [Feature]List.tsx     # Display all items (table/grid)
│  ├─ Add[Feature].tsx      # Create form
│  └─ Edit[Feature].tsx     # Update form
```

### Feature Folder Examples

```
products/
├─ ProductList.tsx          # Route: /products (GET all)
├─ AddProduct.tsx           # Route: /products/add
└─ EditProduct.tsx          # Route: /products/edit/:id

merchants/
├─ MerchantList.tsx         # Route: /merchants
├─ AddMerchant.tsx          # Route: /merchants/add
└─ EditMerchant.tsx         # Route: /merchants/edit/:id

transactions/
├─ TransactionList.tsx      # Route: /transactions
├─ AddTransaction.tsx       # Route: /transactions/add
├─ TransactionDetails.tsx   # Route: /transactions/details/:id
├─ TransactionSuccess.tsx   # Route: /transactions/success
└─ components/              # Sub-components for transaction UI
   ├─ ProductSelector.tsx
   ├─ CartSummary.tsx
   └─ ConfirmOrder.tsx
```

## List Page Pattern

**Location**: `src/pages/[feature]/[Feature]List.tsx`

```typescript
// src/pages/products/ProductList.tsx - GOOD: Full list view
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useFetchProducts } from "../../hooks/useProducts";
import { useState } from "react";
import UserProfileCard from "../../components/UserProfileCard";

const ProductList = () => {
  const { data: products, isPending, isError, error } = useFetchProducts();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Show loading
  if (isPending) return <p>Loading products...</p>;

  // Show errors
  if (isError) {
    return (
      <p className="text-red-500">
        Error fetching products: {error.message}
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-1">
        {/* Left sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-col flex-1 p-6 pt-0">

          {/* Top bar: Title + controls */}
          <div className="flex items-center w-full gap-6 mt-6 mb-6">
            <div className="flex items-center gap-6 h-24 bg-white rounded-3xl p-4 flex-1">
              <div className="flex flex-col gap-2">
                <h1 className="font-bold text-2xl">Manage Products</h1>
              </div>

              {/* Search, notification, pro badge */}
              <div className="flex items-center gap-3 ml-auto">
                <button className="p-3 rounded-full bg-gray-200 hover:bg-gray-300">
                  <img src="assets/images/icons/search-normal-black.svg" alt="search" />
                </button>
              </div>
            </div>

            {/* Profile card */}
            <UserProfileCard />
          </div>

          {/* Main section: Products table */}
          <main className="flex flex-col gap-6 flex-1">
            <section className="flex flex-col gap-6 rounded-3xl p-4 bg-white">

              {/* Header with count + add button */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-2xl">
                    {products?.length || 0} Total Products
                  </p>
                  <p className="font-semibold text-gray-600">
                    View and update your product list.
                  </p>
                </div>

                {/* Add button */}
                <Link
                  to="/products/add"
                  className="btn btn-primary font-semibold"
                >
                  Add New
                </Link>
              </div>

              {/* Table/Grid */}
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Name</th>
                    <th className="text-left py-2 px-4">Price</th>
                    <th className="text-left py-2 px-4">Category</th>
                    <th className="text-right py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{product.name}</td>
                      <td className="py-2 px-4">${product.price}</td>
                      <td className="py-2 px-4">{product.category_id}</td>
                      <td className="text-right py-2 px-4">
                        <Link to={`/products/edit/${product.id}`}>
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </main>
        </div>
      </div>
    </>
  );
};

export default ProductList;
```

**DO**:

- Use custom hook to fetch data: `useFetchProducts()`
- Show loading state: `if (isPending) return <Loading />`
- Show error state: `if (isError) return <ErrorMessage />`
- Display count of items
- Link "Add New" to create page
- Link table rows to edit page with ID

**DON'T**:

- Fetch data inside component (use hooks)
- Skip error handling
- Hardcode "Add New" URL (use React Router Link)

## Add/Create Page Pattern

**Location**: `src/pages/[feature]/Add[Feature].tsx`

```typescript
// src/pages/products/AddProduct.tsx - GOOD: Create form
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormData } from "../../schemas/productSchema";
import { useCreateProduct } from "../../hooks/useProducts";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";

const AddProduct = () => {
  const { mutate: createProduct, isPending } = useCreateProduct();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = async (data: ProductFormData) => {
    if (!thumbnail) {
      toast.error("Please select an image");
      return;
    }

    // Add file to payload since Zod validates File type
    createProduct({
      ...data,
      thumbnail,
    });
  };

  return (
    <>
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex flex-col flex-1 p-6">

          {/* Top bar with title */}
          <div className="flex items-center gap-6 h-24 bg-white rounded-3xl p-4 mb-6">
            <h1 className="font-bold text-2xl">Add New Product</h1>
          </div>

          {/* Form section */}
          <main className="bg-white rounded-3xl p-6 max-w-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Name field */}
              <div>
                <label className="block font-semibold mb-2">Product Name</label>
                <input
                  {...register("name")}
                  placeholder="Enter product name"
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Price field */}
              <div>
                <label className="block font-semibold mb-2">Price</label>
                <input
                  {...register("price", { valueAsNumber: true })}
                  type="number"
                  placeholder="0.00"
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.price.message}
                  </p>
                )}
              </div>

              {/* Image upload */}
              <div>
                <label className="block font-semibold mb-2">Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setThumbnail(file);
                  }}
                  className="w-full border rounded-lg px-3 py-2"
                />
                {errors.thumbnail && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.thumbnail.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary"
                >
                  {isPending ? "Creating..." : "Create Product"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/products")}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </>
  );
};

export default AddProduct;
```

**DO**:

- Use `useForm()` with `zodResolver(schema)`
- Use `register()` for all inputs
- Show validation errors inline from `errors` object
- Disable submit button during `isPending`
- Show loading text: "Creating..." vs "Create Product"
- Handle file uploads separately: state + onChange
- Include Cancel button to go back

**DON'T**:

- Skip validation (use schemas)
- Forget to handle file uploads
- Use direct API calls (use custom hooks)
- Show generic form errors (be specific per field)

## Edit Page Pattern

**Location**: `src/pages/[feature]/Edit[Feature].tsx`

```typescript
// src/pages/products/EditProduct.tsx - GOOD: Update form
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormData } from "../../schemas/productSchema";
import { useFetchProduct, useUpdateProduct } from "../../hooks/useProducts";
import Sidebar from "../../components/Sidebar";
import toast from "react-hot-toast";

const EditProduct = () => {
  const { id } = useParams(); // Get ID from URL
  const productId = parseInt(id || "0", 10);
  const { data: product, isPending: isLoading } = useFetchProduct(productId);
  const { mutate: updateProduct, isPending } = useUpdateProduct();
  const navigate = useNavigate();
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  // Populate form with existing data
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        price: product.price,
        about: product.about,
        category_id: product.category_id,
        is_popular: product.is_popular,
        // thumbnail: don't pre-fill, let user upload new or skip
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: ProductFormData) => {
    updateProduct({
      id: productId,
      ...data,
      thumbnail: thumbnail || product?.thumbnail, // Keep old if not changed
    });
  };

  if (isLoading) return <p>Loading product...</p>;

  return (
    <>
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex flex-col flex-1 p-6">
          <div className="bg-white rounded-3xl p-4 mb-6">
            <h1 className="font-bold text-2xl">Edit Product</h1>
          </div>

          <main className="bg-white rounded-3xl p-6 max-w-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Same fields as Add, but pre-filled */}
              {/* ... form fields ... */}

              <button type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update Product"}
              </button>
            </form>
          </main>
        </div>
      </div>
    </>
  );
};

export default EditProduct;
```

**DO**:

- Get ID from URL params: `const { id } = useParams()`
- Fetch current data: `useFetchProduct(id)`
- Populate form on load: `useEffect(() => reset(product))`
- Set mutation ID: `updateProduct({ id: productId, ...data })`
- Keep existing file if not changed: `thumbnail || product.thumbnail`

**DON'T**:

- Show empty form (pre-fill with data)
- Forget to re-fetch on ID change
- Force file re-upload (make it optional)

## Special Page Types

### Dashboard/Overview Page

```typescript
// src/pages/Overview.tsx - GOOD: Manager dashboard
const Overview = () => {
  const { user } = useAuth();
  const { data: stats, isPending } = useOverviewStats(); // Custom hook for stats

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1>Welcome, {user?.name}</h1>

        {/* Key metrics cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <StatsCard label="Total Products" value={stats.productCount} />
          <StatsCard label="Total Merchants" value={stats.merchantCount} />
          <StatsCard label="Total Warehouses" value={stats.warehouseCount} />
          <StatsCard label="Today Sales" value={stats.todaySales} />
        </div>

        {/* Charts, tables, etc. */}
      </div>
    </div>
  );
};
```

### Transaction Workflow Page

```typescript
// src/pages/transactions/AddTransaction.tsx - GOOD: Multi-step flow
const AddTransaction = () => {
  const { cart, addToCart, removeFromCart } = useTransactionContext();
  const { mutate: submitTransaction } = useCreateTransaction();
  const [step, setStep] = useState<"product" | "confirm" | "success">("product");

  const handleConfirm = () => {
    submitTransaction(cart); // Will redirect on success
  };

  return (
    <div>
      {step === "product" && (
        <ProductSelector onAdd={() => setStep("confirm")} />
      )}
      {step === "confirm" && (
        <CartSummary
          cart={cart}
          onConfirm={handleConfirm}
          onEdit={() => setStep("product")}
        />
      )}
    </div>
  );
};
```

## Key Files in src/pages/

- **List pages**: See `src/pages/[feature]/[Feature]List.tsx` pattern
- **Add pages**: See `src/pages/[feature]/Add[Feature].tsx` pattern
- **Edit pages**: See `src/pages/[feature]/Edit[Feature].tsx` pattern
- **Dashboards**: `src/pages/Overview.tsx`, `src/pages/OverviewMerchant.tsx`
- **Transaction flow**: `src/pages/transactions/` with sub-components

## Role-Based Access in App.tsx

```typescript
// src/App.tsx - Protected route examples
<Route
  path="/products"
  element={
    <ProtectedRoute roles={['manager']}>
      <ProductList />
    </ProtectedRoute>
  }
/>

<Route
  path="/transactions"
  element={
    <ProtectedRoute roles={['keeper']}>
      <TransactionList />
    </ProtectedRoute>
  }
/>
```

## JIT Index Hints

```bash
# Find all pages (feature modules)
ls -la src/pages/

# Find list pages
find src/pages -name "*List.tsx"

# Find add pages
find src/pages -name "Add*.tsx"

# Find edit pages
find src/pages -name "Edit*.tsx"

# Find route definitions
grep -n "<Route" src/App.tsx

# Find protected routes
grep -n "ProtectedRoute roles" src/App.tsx

# Find form usage
rg -n "useForm\|zodResolver" src/pages

# Find data fetching in pages
rg -n "useFetch|useMutation" src/pages
```

## Common Gotchas

1. **Forgot to add route**: Create page but don't add to `App.tsx` → no way to navigate
2. **Wrong parameter name**: `useParams()` returns key name from URL, e.g., `:id` → `const { id }`
3. **Form not submitting**: Check Zod schema errors, use browser DevTools to see validation errors
4. **Data not updating**: Forget to call `invalidateQueries()` in hook's `onSuccess`
5. **Can't edit (form empty)**: Forget `useEffect(() => reset(data))` to populate form
6. **File upload loses file**: Don't store in form state, manage separately with `useState`
7. **Redirect not working**: Role check or authentication state not ready, check `loading` flag

## Adding a New Feature (CRUD Module)

**Template - Follow This for Every New Feature**:

### 1. Create Types

```typescript
// src/types/myFeature.ts
export interface MyFeature {
  id: number;
  name: string;
  // ... other fields
}

export interface CreateMyFeaturePayload {
  name: string;
}
```

### 2. Create Validation Schema

```typescript
// src/schemas/myFeatureSchema.ts
import { z } from "zod";

export const myFeatureSchema = z.object({
  name: z.string().min(3, "Name required"),
});
```

### 3. Create Custom Hook

```typescript
// src/hooks/useMyFeature.ts
// Use pattern from src/AGENTS.md
```

### 4. Create Pages

```
src/pages/my_features/
├─ MyFeatureList.tsx    (copy ProductList pattern)
├─ AddMyFeature.tsx     (copy AddProduct pattern)
└─ EditMyFeature.tsx    (copy EditProduct pattern)
```

### 5. Add Routes to App.tsx

```typescript
<Route path="/my-features" element={<ProtectedRoute roles={['manager']}><MyFeatureList /></ProtectedRoute>} />
<Route path="/my-features/add" element={<ProtectedRoute roles={['manager']}><AddMyFeature /></ProtectedRoute>} />
<Route path="/my-features/edit/:id" element={<ProtectedRoute roles={['manager']}><EditMyFeature /></ProtectedRoute>} />
```

### 6. Pre-PR Checks

```bash
npm run build && npm run lint
```

Done! ✅
