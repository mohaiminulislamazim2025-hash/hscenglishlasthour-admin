# Database schema (as used by the dashboard)

The dashboard does **not** own the schema. It reads and writes the tables
created and migrated by the website repo (`bookproject/supabase/migrations`).
Never add migrations here without owner approval.

## `books`

Catalog entries. Key columns used:

| Column | Notes |
| --- | --- |
| `id` (text, PK) | Stable slug, e.g. `hscenglishlasthour`. Immutable. |
| `title`, `author`, `description` | Display fields. |
| `price`, `offer_price`, `delivery_charge`, `currency` | Pricing. `offer_price` may be null. |
| `content_mode` | `page-images` or `pdf`. |
| `default_mode` | `flip` or `pdf`. |
| `preview_page_count` | Number of free preview pages. |
| `page_aspect_ratio`, `min_zoom`, `max_zoom` | Reader layout. |
| `flip_enabled`, `pdf_enabled` | Reader toggles. |
| `is_published` | Visibility on the website. |
| `cover_image_path` | **Internal** storage path (hidden from `authenticated`). |
| `pdf_storage_path` | **Internal** storage path (hidden from `authenticated`). |
| `market_country`, `phone_region` | Checkout metadata. |
| `created_at`, `updated_at` | `updated_at` is touched to notify the website. |

## `book_pages`

Page images for the flip reader.

| Column | Notes |
| --- | --- |
| `id` (uuid, PK) | |
| `book_id` (text, FK → books, on delete restrict) | |
| `storage_path` | **Internal** path (hidden from `authenticated`). |
| `page_number` (int, > 0) | Unique per `(book_id, page_number)`. |
| `is_available` | Whether readers may see the page. |
| `alt` | Optional alt text. |

Reordering respects the unique `(book_id, page_number)` constraint using a
two-phase update (see `docs/ROADMAP.md`).

## `orders`

| Column | Notes |
| --- | --- |
| `id` (uuid, PK) | |
| `book_id` (FK → books, on delete restrict) | A book with orders cannot be deleted. |
| `book_title` | Denormalized snapshot at purchase time. |
| `customer_name`, `customer_phone`, `customer_address` | Collected at checkout. |
| `book_price`, `delivery_charge`, `total_amount`, `currency` | Amounts. |
| `payment_method` | e.g. `cash_on_delivery`. |
| `status` | `pending, confirmed, packed, shipped, delivered, cancelled`. |
| `created_at`, `updated_at` | |

## `admin_users`

Allow-list of administrators.

| Column | Notes |
| --- | --- |
| `user_id` (uuid, FK → auth.users) | Supabase Auth user id. |
| `created_at` | |

No PostgREST access for `authenticated`; read via the service-role client.

## Derived data

- **Customers** are aggregated from `orders` by phone number
  (`lib/orders/customers.ts`). There is no `customers` table.
- **Revenue** = sum of `total_amount` over all non-cancelled orders.
