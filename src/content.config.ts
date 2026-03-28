import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    sourceSite: z.enum(["shequ123.github.io", "old_blog", "old_blog_2"]),
    legacyPath: z.string(),
    legacyUrl: z.string().url().optional()
  })
});

export const collections = {
  posts
};
