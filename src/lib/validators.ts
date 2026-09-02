import { z } from "zod";

const optionalUrl = z.union([z.url(), z.literal(""), z.null()]).optional();

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export const registerSchema = z.object({
  email: z.email(),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9._]+$/),
  displayName: z.string().min(2).max(48),
  password: z.string().min(8).max(72),
});

export const commentSchema = z.object({
  postId: z.string().min(1),
  body: z.string().min(1).max(2000),
  parentId: z.string().optional().nullable(),
});

export const likeSchema = z.object({
  postId: z.string().min(1),
});

export const bookmarkSchema = z.object({
  postId: z.string().min(1),
});

export const postInputSchema = z.object({
  type: z.enum(["BLOG", "VIDEO", "SHORT"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  title: z.string().min(2).max(180),
  slug: z
    .string()
    .min(2)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().max(400).optional().nullable(),
  body: z.string().optional().nullable(),
  coverImage: optionalUrl,
  videoUrl: optionalUrl,
  thumbnailUrl: optionalUrl,
  duration: z.number().int().positive().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  seoTitle: z.string().max(180).optional().nullable(),
  seoDescription: z.string().max(300).optional().nullable(),
  productIds: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  scheduledAt: z.string().optional().nullable(),
});

export const productInputSchema = z.object({
  title: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().optional().nullable(),
  price: z.number().int().nonnegative(),
  comparePrice: z.number().int().positive().optional().nullable(),
  discountPercent: z.number().int().min(0).max(90).optional().default(0),
  stock: z.number().int().min(0).max(100_000).optional().default(0),
  imageUrl: optionalUrl,
  inStock: z.boolean().default(true),
  sku: z.string().optional().nullable(),
  featured: z.boolean().default(false),
});

const cmsLinkSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(300),
});

export const siteCmsSchema = z.object({
  hero: z
    .object({
      title: z.string().min(1).max(120),
      subtitle: z.string().max(400),
      ctaPrimary: z.string().max(80),
      ctaPrimaryHref: z.string().max(200),
      ctaSecondary: z.string().max(80),
      ctaSecondaryHref: z.string().max(200),
    })
    .optional(),
  about: z
    .object({
      title: z.string().min(1).max(120),
      bio: z.string().max(2000),
      avatarUrl: z.string().max(500),
    })
    .optional(),
  footer: z.object({ links: z.array(cmsLinkSchema).max(12) }).optional(),
  seo: z
    .object({
      title: z.string().min(1).max(180),
      description: z.string().max(400),
      ogImage: z.string().max(500),
    })
    .optional(),
  socials: z.array(cmsLinkSchema).max(12).optional(),
  startHere: z
    .object({
      title: z.string().max(120),
      description: z.string().max(400),
      slugs: z.array(z.string().max(180)).max(6),
    })
    .optional(),
});

export const bulkPostsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50),
  action: z.enum(["delete", "publish", "draft"]),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  note: z.string().max(400).optional(),
});
