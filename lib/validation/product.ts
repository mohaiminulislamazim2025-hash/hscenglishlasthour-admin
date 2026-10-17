import { z } from "zod";

const money = z.coerce
  .number({ error: "Enter a valid number." })
  .finite("Enter a valid number.")
  .min(0, "Amount cannot be negative.");

const uuid = z.string().uuid("Invalid product id.");

const optionalText = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined) return null;
      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    })
    .refine((value) => value === null || value.length <= max, `Must be ${max} characters or fewer.`);

const requiredText = (max: number, label: string) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

const booleanish = z
  .union([z.boolean(), z.string(), z.null()])
  .optional()
  .transform((value) => value === true || value === "true" || value === "on" || value === "1");

const integerNonNegative = (min = 0) =>
  z.coerce.number().int("Must be a whole number.").min(min, "Cannot be negative.");

export const productCreateSchema = z.object({
  name: requiredText(200, "Name"),
  description: optionalText(5000),
  priceBdt: money.default(0),
  stockQuantity: integerNonNegative(0).default(0),
  isAvailable: booleanish,
  sortOrder: integerNonNegative(0).default(0),
});

export const productUpdateSchema = productCreateSchema;

export const productIdSchema = z.object({ id: uuid });

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export function formToProductObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      obj[key] = value;
    }
  }
  return obj;
}
