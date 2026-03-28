import { load } from "cheerio";
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const workspaceRoot = path.resolve(siteRoot, "..");
const postsOutputDir = path.join(siteRoot, "src/content/posts");
const assetsOutputDir = path.join(siteRoot, "public/legacy-assets");

const sourceConfigs = [
  {
    name: "shequ123.github.io",
    rootDir: path.join(workspaceRoot, "shequ123.github.io"),
    domains: ["j1nse.cool"],
    isPostPath(relativePath) {
      return /^\d{4}\/\d{2}\/\d{2}\/.+\/index\.html$/u.test(relativePath);
    },
    async parse(relativePath, absolutePath) {
      const html = await readFile(absolutePath, "utf8");
      const $ = load(html);

      return {
        title: cleanText($(".post-title").first().text()),
        description: cleanText($('meta[name="description"]').attr("content")),
        publishDate:
          $('meta[property="article:published_time"]').attr("content") ??
          dateFromPath(relativePath),
        updatedDate: $('meta[property="article:modified_time"]').attr("content"),
        categories: unique(
          $('.post-meta [itemprop="about"] [itemprop="name"]')
            .map((_, node) => cleanText($(node).text()))
            .get()
        ),
        tags: unique(
          $('meta[property="article:tag"]')
            .map((_, node) => cleanText($(node).attr("content")))
            .get()
        ),
        contentHtml: $(".post-body").html() ?? "",
        legacyUrl:
          $('link[rel="canonical"]').attr("href") ??
          `https://j1nse.cool/${relativePath.replace(/index\.html$/u, "")}`
      };
    }
  },
  {
    name: "old_blog",
    rootDir: path.join(workspaceRoot, "old_blog"),
    domains: ["jinse666.cn"],
    isPostPath(relativePath) {
      return /^\d{4}\/\d{2}\/\d{2}\/.+\/index\.html$/u.test(relativePath);
    },
    async parse(relativePath, absolutePath) {
      const html = await readFile(absolutePath, "utf8");
      const $ = load(html);
      const infoTexts = $(".copyright p")
        .map((_, node) => cleanText($(node).text()))
        .get();

      return {
        title: cleanText($(".article-title").first().text()),
        description: cleanText($('meta[name="description"]').attr("content")),
        publishDate: parseChineseDate(findByPrefix(infoTexts, "发布时间")) ?? dateFromPath(relativePath),
        updatedDate: parseChineseDate(findByPrefix(infoTexts, "最后更新")),
        categories: unique(
          $(".article-category-link")
            .map((_, node) => cleanText($(node).text()))
            .get()
        ),
        tags: unique(
          $(".article-tag-list-link")
            .map((_, node) => cleanText($(node).text()))
            .get()
        ),
        contentHtml: $(".article-entry").html() ?? "",
        legacyUrl: absolutizeLegacyUrl(
          $(".post-url").first().attr("href"),
          "https://jinse666.cn"
        )
      };
    }
  },
  {
    name: "old_blog_2",
    rootDir: path.join(workspaceRoot, "old_blog_2"),
    domains: ["j1nse.xyz"],
    isPostPath(relativePath) {
      return /^blog\/.+\/index\.html$/u.test(relativePath) && relativePath !== "blog/index.html";
    },
    async parse(relativePath, absolutePath, taxonomyMap) {
      const html = await readFile(absolutePath, "utf8");
      const $ = load(html);
      const legacyUrl =
        $('link[rel="canonical"]').attr("href") ??
        `https://j1nse.xyz/${relativePath.replace(/index\.html$/u, "")}`;
      const key = normalizeLookupKey(legacyUrl);

      return {
        title: cleanText($(".strong-post-title").first().text()),
        description: cleanText($('meta[name="description"]').attr("content")),
        publishDate: parseEnglishDate($(".post-data").first().text()) ?? taxonomyMap.dates.get(key),
        updatedDate: undefined,
        categories: taxonomyMap.categories.get(key) ?? [],
        tags: taxonomyMap.tags.get(key) ?? [],
        contentHtml: $(".markdown").html() ?? "",
        legacyUrl
      };
    }
  }
];

async function main() {
  const taxonomyMap = await buildOldBlog2TaxonomyMap();
  const discovered = [];

  for (const source of sourceConfigs) {
    const relativePaths = await walkHtmlFiles(source.rootDir);
    const postPaths = relativePaths.filter((relativePath) => source.isPostPath(relativePath));

    for (const relativePath of postPaths) {
      const absolutePath = path.join(source.rootDir, relativePath);
      const parsed = await source.parse(relativePath, absolutePath, taxonomyMap);
      if (!parsed.title || !parsed.publishDate || !parsed.contentHtml) {
        console.warn(`skip incomplete post: ${source.name}/${relativePath}`);
        continue;
      }

      discovered.push({
        sourceName: source.name,
        sourceRootDir: source.rootDir,
        domains: source.domains,
        relativePath,
        absolutePath,
        ...parsed
      });
    }
  }

  const slugUsage = new Map();
  const entries = discovered
    .sort((left, right) => {
      const leftDate = new Date(left.publishDate).getTime();
      const rightDate = new Date(right.publishDate).getTime();
      return leftDate - rightDate;
    })
    .map((entry) => ({
      ...entry,
      slug: uniqueSlug(buildBaseSlug(entry), slugUsage)
    }));

  const routeLookup = new Map();
  for (const entry of entries) {
    const route = `/blog/${entry.slug}/`;
    routeLookup.set(normalizeLookupKey(entry.legacyUrl), route);
    routeLookup.set(normalizeLookupKey(`/${entry.relativePath}`), route);
    routeLookup.set(
      normalizeLookupKey(`/${entry.relativePath.replace(/index\.html$/u, "")}`),
      route
    );
  }

  await mkdir(postsOutputDir, { recursive: true });
  await mkdir(assetsOutputDir, { recursive: true });

  for (const entry of entries) {
    const rewrittenHtml = await rewriteContentHtml(entry, routeLookup);
    const frontmatter = [
      "---",
      `title: ${yamlString(entry.title)}`,
      `description: ${yamlString(entry.description || summarizeHtml(rewrittenHtml))}`,
      `publishDate: ${yamlString(new Date(entry.publishDate).toISOString())}`,
      entry.updatedDate
        ? `updatedDate: ${yamlString(new Date(entry.updatedDate).toISOString())}`
        : null,
      `categories: ${yamlArray(entry.categories)}`,
      `tags: ${yamlArray(entry.tags)}`,
      `sourceSite: ${yamlString(entry.sourceName)}`,
      `legacyPath: ${yamlString(entry.relativePath)}`,
      entry.legacyUrl ? `legacyUrl: ${yamlString(entry.legacyUrl)}` : null,
      "---",
      "",
      rewrittenHtml.trim(),
      ""
    ]
      .filter(Boolean)
      .join("\n");

    await writeFile(path.join(postsOutputDir, `${entry.slug}.md`), frontmatter, "utf8");
  }

  console.log(`migrated ${entries.length} posts`);
}

async function buildOldBlog2TaxonomyMap() {
  const baseDir = path.join(workspaceRoot, "old_blog_2");
  const categories = new Map();
  const tags = new Map();
  const dates = new Map();
  const blogFeedPath = path.join(baseDir, "blog/index.xml");

  await collectTaxonomy(path.join(baseDir, "categories"), categories);
  await collectTaxonomy(path.join(baseDir, "tags"), tags);

  if (await exists(blogFeedPath)) {
    const feed = load(await readFile(blogFeedPath, "utf8"), { xmlMode: true });
    feed("item").each((_, node) => {
      const link = cleanText(feed(node).find("link").first().text());
      const pubDate = cleanText(feed(node).find("pubDate").first().text());
      if (link && pubDate) {
        dates.set(normalizeLookupKey(link), new Date(pubDate).toISOString());
      }
    });
  }

  return { categories, tags, dates };
}

async function collectTaxonomy(baseDir, targetMap) {
  if (!(await exists(baseDir))) {
    return;
  }

  const items = await readdir(baseDir, { withFileTypes: true });
  for (const item of items) {
    if (!item.isDirectory()) {
      continue;
    }

    const xmlPath = path.join(baseDir, item.name, "index.xml");
    if (!(await exists(xmlPath))) {
      continue;
    }

    const feed = load(await readFile(xmlPath, "utf8"), { xmlMode: true });
    feed("item").each((_, node) => {
      const link = cleanText(feed(node).find("link").first().text());
      if (!link) {
        return;
      }

      const key = normalizeLookupKey(link);
      const current = targetMap.get(key) ?? [];
      current.push(item.name);
      targetMap.set(key, unique(current));
    });
  }
}

async function rewriteContentHtml(entry, routeLookup) {
  const $ = load(`<article>${entry.contentHtml}</article>`, {
    decodeEntities: false
  });
  const root = $("article");

  root.find("a.headerlink").remove();
  root.find("a#more").remove();
  root.find("script").remove();

  for (const element of root.find("a[href]").toArray()) {
    const node = $(element);
    const href = node.attr("href");
    if (!href) {
      continue;
    }

    const rewrittenHref = rewriteLink(href, entry, routeLookup);
    if (rewrittenHref) {
      node.attr("href", rewrittenHref);
    }
  }

  for (const element of root.find("[src]").toArray()) {
    const node = $(element);
    const src = node.attr("src");
    if (!src) {
      continue;
    }

    const rewrittenSrc = await rewriteAssetSource(src, entry);
    if (rewrittenSrc) {
      node.attr("src", rewrittenSrc);
    }
  }

  return root.html() ?? "";
}

function rewriteLink(href, entry, routeLookup) {
  if (isExternalNonLegacyLink(href, entry.domains)) {
    return href;
  }

  const articleRoute = resolveArticleRoute(href, entry, routeLookup);
  if (articleRoute) {
    return articleRoute;
  }

  return href;
}

async function rewriteAssetSource(src, entry) {
  const resolved = resolveLocalAssetPath(src, entry);
  if (!resolved) {
    return src;
  }

  const destination = path.join(assetsOutputDir, entry.sourceName, resolved.relativePath);
  await mkdir(path.dirname(destination), { recursive: true });

  if (!(await exists(destination))) {
    await copyFile(resolved.absolutePath, destination);
  }

  return `/legacy-assets/${entry.sourceName}/${toPosixPath(resolved.relativePath)}`;
}

function resolveArticleRoute(value, entry, routeLookup) {
  const raw = value.trim();
  if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("javascript:")) {
    return null;
  }

  const absolute = absolutizeLegacyUrl(raw, entry.legacyUrl ?? `https://${entry.domains[0]}/`);
  if (!absolute) {
    return null;
  }

  const parsed = new URL(absolute);
  const withIndex = normalizeLookupKey(`${parsed.origin}${parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`}index.html`);
  const withoutIndex = normalizeLookupKey(`${parsed.origin}${parsed.pathname}`);

  return routeLookup.get(withoutIndex) ?? routeLookup.get(withIndex) ?? null;
}

function resolveLocalAssetPath(value, entry) {
  const raw = value.trim();
  if (!raw || raw.startsWith("data:")) {
    return null;
  }

  const absolute = absolutizeLegacyUrl(raw, entry.legacyUrl ?? `https://${entry.domains[0]}/`);
  if (!absolute) {
    return null;
  }

  const parsed = new URL(absolute);
  if (!entry.domains.includes(parsed.hostname)) {
    return null;
  }

  const relativePath = parsed.pathname.replace(/^\/+/u, "");
  const absolutePath = path.join(entry.sourceRootDir, relativePath);
  return { relativePath, absolutePath };
}

async function walkHtmlFiles(rootDir) {
  const results = [];

  async function visit(currentDir, prefix = "") {
    const items = await readdir(currentDir, { withFileTypes: true });
    for (const item of items) {
      if (item.name === ".git") {
        continue;
      }

      const absolutePath = path.join(currentDir, item.name);
      const relativePath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.isDirectory()) {
        await visit(absolutePath, relativePath);
      } else if (item.isFile() && item.name.endsWith(".html")) {
        results.push(relativePath);
      }
    }
  }

  await visit(rootDir);
  return results;
}

function buildBaseSlug(entry) {
  const date = new Date(entry.publishDate);
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
  const titlePart = slugify(entry.title || path.basename(path.dirname(entry.relativePath)));
  return `${datePart}-${titlePart}`.replace(/-+/gu, "-");
}

function uniqueSlug(base, usageMap) {
  const current = usageMap.get(base) ?? 0;
  usageMap.set(base, current + 1);
  return current === 0 ? base : `${base}-${current + 1}`;
}

function slugify(value) {
  const normalized = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/['"`]/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return normalized || "post";
}

function parseChineseDate(value) {
  if (!value) {
    return undefined;
  }

  const match = value.match(
    /(\d{4})年(\d{2})月(\d{2})日\s*-\s*(\d{2})时(\d{2})分/u
  );
  if (!match) {
    return undefined;
  }

  const [, year, month, day, hour, minute] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+08:00`).toISOString();
}

function parseEnglishDate(value) {
  if (!value) {
    return undefined;
  }

  const match = value.replace(/\s+/gu, " ").match(/[A-Z][a-z]{2} \d{1,2}, \d{4}/u);
  if (!match) {
    return undefined;
  }

  return new Date(match[0]).toISOString();
}

function dateFromPath(relativePath) {
  const match = relativePath.match(/^(\d{4})\/(\d{2})\/(\d{2})\//u);
  if (!match) {
    return undefined;
  }

  return new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00+08:00`).toISOString();
}

function summarizeHtml(html) {
  const text = cleanText(load(`<article>${html}</article>`)("article").text());
  return text.slice(0, 140);
}

function yamlString(value) {
  return JSON.stringify(value ?? "");
}

function yamlArray(values) {
  return `[${values.map((value) => yamlString(value)).join(", ")}]`;
}

function cleanText(value) {
  return (value ?? "").replace(/\s+/gu, " ").trim();
}

function findByPrefix(values, prefix) {
  return values.find((value) => value.startsWith(prefix));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function absolutizeLegacyUrl(value, base) {
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

function normalizeLookupKey(value) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value, "https://placeholder.local");
    const pathname = url.pathname.replace(/\/index\.html$/u, "/").replace(/\/+/gu, "/");
    const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
    return `${url.hostname}${normalizedPath}`.toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

function isExternalNonLegacyLink(value, domains) {
  if (!/^https?:\/\//iu.test(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    return !domains.includes(url.hostname);
  } catch {
    return false;
  }
}

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
