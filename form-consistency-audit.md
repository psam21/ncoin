# Form & Layout Consistency Audit

## Critical Issues Found:

### 1. Form Widths - INCONSISTENT
- **ContributionForm**: Uses `bg-white rounded-lg shadow-sm border p-6` wrapper (card style)
- **WorkForm**: Uses `max-w-4xl mx-auto` wrapper (centered max-width)
- **ProductForm**: Uses `bg-white rounded-lg shadow-sm border p-6` wrapper (card style)
- **FIX**: All forms should use card wrapper style like Contribution/Product

### 2. Form Section Headers - INCONSISTENT
- **ContributionForm**: Has section dividers (`border-b border-gray-200 pb-2` + `text-xl font-serif font-bold text-purple-800`)
  - "Basic Information"
  - "Details & Location"
  - "Media & Tags"
- **WorkForm**: NO section headers at all - flat form
- **ProductForm**: Has section dividers matching ContributionForm
  - "Basic Information"
  - "Product Details"
  - "Media & Tags"
- **FIX**: WorkForm needs sections: "Job Details", "Location & Contact", "Additional Details"

### 3. Input Padding - INCONSISTENT
- **ContributionForm**: `px-4 py-3` on ALL inputs/selects
- **WorkForm**: `px-3 py-2` on selects, `px-4 py-2` on text inputs (MIXED)
- **ProductForm**: `px-4 py-3` on ALL inputs/selects
- **FIX**: WorkForm needs `px-4 py-3` everywhere

### 4. Focus Rings - INCONSISTENT
- **ContributionForm**: Uses `focus:ring-purple-500`
- **WorkForm**: Uses `focus:ring-primary-500`
- **ProductForm**: Uses `focus:ring-purple-500`
- **FIX**: All should use `focus:ring-primary-500` (brand color)

### 5. Form Spacing - INCONSISTENT
- **ContributionForm**: `space-y-8` for form, `space-y-6` inside sections
- **WorkForm**: `space-y-6` for entire form (no sections)
- **ProductForm**: `space-y-8` for form, `space-y-6` inside sections
- **FIX**: WorkForm needs matching structure

### 6. Page Header Padding - INCONSISTENT
- **my-contributions**: Header uses `py-8` ✓
- **my-contributions/edit**: Header uses `py-8` ✓
- **my-work**: Header uses `py-8` ✓
- **my-work/edit**: Header uses `py-8` ✓
- **my-shop**: Header uses `py-8` ✓
- **my-shop/edit**: Error state uses `py-16` (should be header with `py-8`)
- **FIX**: my-shop/edit error state header needs `py-8`

### 7. Form Fieldset Disabled - INCONSISTENT
- **ContributionForm**: Uses `<fieldset disabled={isPublishing}>` ✓
- **WorkForm**: NO fieldset wrapper
- **ProductForm**: Uses `<fieldset disabled={isPublishing}>` ✓
- **FIX**: WorkForm needs fieldset for consistency

## Summary:
WorkForm is the outlier - needs complete restructuring to match Contribution/ProductForm patterns.
