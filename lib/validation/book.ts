import { z } from "zod";
import { CONTENT_MODES, READING_MODES } from "@/types/admin";

const money = z.coerce
  .number({ error: "Enter a valid number." })
  .finite("Enter a valid number.")
  .min(0, "Amount cannot be negative.");

/** Book id: stable slug matching the DB `text` PK, safe for storage paths. */
const bookId = z
  .string()
  .trim()
  .min(1, "Book id is required.")
  .max(100, "Book id is too long.")
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Use lowercase letters, numbers and hyphens only.");

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

/**
 * Checkboxes are only present in FormData when checked, so an absent key means
 * `false` (not "missing"). Treat undefined/null as false instead of failing.
 */
const booleanish = z
  .union([z.boolean(), z.string(), z.null()])
  .optional()
  .transform((value) => value === true || value === "true" || value === "on" || value === "1");

export const bookCreateSchema = z.object({
  id: bookId,
  title: requiredText(200, "Title"),
  author: optionalText(200),
  description: optionalText(5000),
  price: money.default(0),
  offerPrice: z
    .union([z.literal(""), z.null(), z.undefined(), money])
    .transform((value) => (value === "" || value === null || value === undefined ? null : value)),
  deliveryCharge: money.default(0),
  currency: z.string().trim().min(1).max(10).default("BDT"),
  previewPageCount: z.coerce.number().int("Must be a whole number.").min(0, "Cannot be negative."),
  contentMode: z.enum(CONTENT_MODES),
  defaultMode: z.enum(READING_MODES),
  pageAspectRatio: z.coerce
    .number({ error: "Enter a valid aspect ratio." })
    .positive("Must be greater than zero.")
    .max(10, "Aspect ratio looks unrealistic."),
  flipEnabled: booleanish,
  pdfEnabled: booleanish,
  minZoom: z.coerce.number().positive("Must be greater than zero."),
  maxZoom: z.coerce.number().positive("Must be greater than zero."),
  marketCountry: z.string().trim().min(1).max(100).default("Bangladesh"),
  phoneRegion: z.string().trim().min(1).max(10).default("BD"),
  isPublished: booleanish,
});

export const bookUpdateSchema = bookCreateSchema
  .omit({ id: true })
  .extend({
    // id may be present but is not editable; it is stripped by callers.
  });

export type BookCreateInput = z.infer<typeof bookCreateSchema>;
export type BookUpdateInput = z.infer<typeof bookUpdateSchema>;

export function refineZoom<T extends { minZoom: number; maxZoom: number }>(
  value: T,
  ctx: z.RefinementCtx,
) {
  if (value.maxZoom < value.minZoom) {
    ctx.addIssue({
      code: "custom",
      path: ["maxZoom"],
      message: "Max zoom must be greater than or equal to min zoom.",
    });
  }
}

export const bookCreateFinalSchema = bookCreateSchema.superRefine(refineZoom);
export const bookUpdateFinalSchema = bookUpdateSchema.superRefine(refineZoom);
