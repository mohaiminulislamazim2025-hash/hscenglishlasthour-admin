# Database schema (Nuri)

The dashboard uses the existing Supabase schema — it adds **no** migrations and
does not reset/drop the database. Tables (verified):

## `products`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid, PK | database-generated |
| `name` | text | required |
| `description` | text | nullable |
| `price_bdt` | numeric | BDT |
| `image_path` | text | storage object path, nullable |
| `is_available` | boolean | shown/hidden on storefront |
| `stock_quantity` | integer | |
| `sort_order` | integer | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | touched on edits |

## `orders`

| Column | Type |
| --- | --- |
| `id` | uuid, PK |
| `customer_name` | text |
| `customer_mobile` | text |
| `customer_address` | text |
| `payment_method` | text |
| `status` | text |
| `delivery_charge_bdt` | numeric |
| `subtotal_bdt` | numeric |
| `total_bdt` | numeric |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

## `order_items`

| Column | Type |
| --- | --- |
| `id` | uuid, PK |
| `order_id` | uuid, FK → orders |
| `product_id` | uuid, FK → products (nullable) |
| `product_name` | text |
| `quantity` | integer |
| `unit_price_bdt` | numeric |
| `line_total_bdt` | numeric |
| `created_at` | timestamptz |

## `store_settings`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer, PK | single row `id = 1` |
| `delivery_charge_bdt` | numeric | applied at checkout |
| `currency` | text | e.g. `BDT` |
| `updated_at` | timestamptz | |

## Types

`types/database.ts` is a hand-maintained mirror of the schema used for typing
the Supabase clients. `types/admin.ts` holds domain types (`ProductSummary`,
`OrderListItem`, `OrderDetail`, `CustomerSummary`, `StoreSettings`,
`OverviewStats`, status machine helpers).
