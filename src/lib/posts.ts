import { getCollection, type CollectionEntry } from "astro:content";

export type PostEntry = CollectionEntry<"posts">;

export async function getSortedPosts() {
  const posts = await getCollection("posts");
  return posts.sort(
    (left, right) =>
      right.data.publishDate.getTime() - left.data.publishDate.getTime()
  );
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function groupPostsByYear(posts: PostEntry[]) {
  return posts.reduce<Map<string, PostEntry[]>>((groups, post) => {
    const year = String(post.data.publishDate.getFullYear());
    const current = groups.get(year) ?? [];
    current.push(post);
    groups.set(year, current);
    return groups;
  }, new Map());
}

export function groupPostsByField(
  posts: PostEntry[],
  field: "categories" | "tags"
) {
  const groups = new Map<string, PostEntry[]>();

  for (const post of posts) {
    for (const value of post.data[field]) {
      const current = groups.get(value) ?? [];
      current.push(post);
      groups.set(value, current);
    }
  }

  return [...groups.entries()].sort((left, right) => {
    if (right[1].length !== left[1].length) {
      return right[1].length - left[1].length;
    }
    return left[0].localeCompare(right[0], "zh-CN");
  });
}

export function getPostSlug(post: Pick<PostEntry, "id">) {
  return post.id.replace(/\.[^.]+$/u, "");
}

export function getPostUrl(post: Pick<PostEntry, "id">) {
  return `/blog/${getPostSlug(post)}/`;
}
