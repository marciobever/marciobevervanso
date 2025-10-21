// lib/postUrl.ts
export function postUrl(post: { category: string; slug: string }) {
  return `/posts/${post.category}/${post.slug}`;
}
