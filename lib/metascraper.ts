import { VaultItemCategory } from "./types";

export interface ScrapedMetadata {
  url: string;
  title: string;
  description?: string;
  coverUrl?: string;
  authorOrCreator?: string;
  platform: string;
  category: VaultItemCategory;
}

/**
 * Clean decoded HTML entities (e.g. &amp;, &quot;, &#39;, &lt;, &gt;)
 */
function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return "";
      }
    })
    .replace(/&#([0-9]+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return "";
      }
    })
    .trim();
}

/**
 * Extracts attribute value from an HTML tag string
 */
function extractAttribute(tag: string, attrName: string): string | null {
  const regex = new RegExp(`${attrName}=["']([^"']*)["']`, "i");
  const match = tag.match(regex);
  return match ? decodeHtmlEntities(match[1]) : null;
}

/**
 * Validates that a target URL is public and not targeting local/internal network resources (SSRF protection).
 */
function isSafePublicUrl(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  // Block localhost, link-local, and cloud metadata hostnames
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname === "metadata.google.internal" ||
    hostname === "169.254.169.254" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "::"
  ) {
    return false;
  }

  // Check IPv4 ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const o1 = Number(ipv4Match[1]);
    const o2 = Number(ipv4Match[2]);
    const o3 = Number(ipv4Match[3]);
    const o4 = Number(ipv4Match[4]);
    if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) return false;

    // 127.0.0.0/8 (Loopback)
    if (o1 === 127) return false;
    // 10.0.0.0/8 (Private)
    if (o1 === 10) return false;
    // 172.16.0.0/12 (Private)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return false;
    // 192.168.0.0/16 (Private)
    if (o1 === 192 && o2 === 168) return false;
    // 169.254.0.0/16 (Link-local / Cloud metadata)
    if (o1 === 169 && o2 === 254) return false;
    // 0.0.0.0/8
    if (o1 === 0) return false;
  }

  // Check IPv6 ranges (fc00::/7 unique local, fe80::/10 link local)
  if (hostname.includes(":")) {
    if (
      hostname.startsWith("fc") ||
      hostname.startsWith("fd") ||
      hostname.startsWith("fe8") ||
      hostname.startsWith("fe9") ||
      hostname.startsWith("fea") ||
      hostname.startsWith("feb")
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Pure metadata scraper (OpenGraph / HTML Meta tags) without AI.
 * Fast, lightweight, zero token costs.
 */
export async function scrapeUrlMetadata(targetUrl: string): Promise<ScrapedMetadata> {
  let cleanUrl = targetUrl.trim();
  if (!cleanUrl) {
    throw new Error("URL vacía");
  }

  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`;
  }

  const parsedUrl = new URL(cleanUrl);
  if (!isSafePublicUrl(parsedUrl)) {
    throw new Error("URL no permitida");
  }
  const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");

  // Determine platform and default category
  let platform = "Web";
  let category: VaultItemCategory = "link";

  if (hostname.includes("letterboxd.com")) {
    platform = "Letterboxd";
    category = "video";
  } else if (hostname.includes("imdb.com")) {
    platform = "IMDb";
    category = "video";
  } else if (hostname.includes("filmaffinity.com")) {
    platform = "FilmAffinity";
    category = "video";
  } else if (hostname.includes("themoviedb.org") || hostname.includes("tmdb.org")) {
    platform = "TMDB";
    category = "video";
  } else if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    platform = "YouTube";
    category = "video";
  } else if (hostname.includes("vimeo.com")) {
    platform = "Vimeo";
    category = "video";
  } else if (hostname.includes("udemy.com")) {
    platform = "Udemy";
    category = "course";
  } else if (hostname.includes("platzi.com")) {
    platform = "Platzi";
    category = "course";
  } else if (hostname.includes("coursera.org")) {
    platform = "Coursera";
    category = "course";
  } else if (hostname.includes("frontendmasters.com")) {
    platform = "Frontend Masters";
    category = "course";
  } else if (hostname.includes("goodreads.com") || hostname.includes("books.google.")) {
    platform = "Libro";
    category = "book";
  } else if (hostname.includes("github.com")) {
    platform = "GitHub";
    category = "link";
  } else if (hostname.includes("notion.so") || hostname.includes("notion.site")) {
    platform = "Notion";
    category = "link";
  } else {
    // Capitalize first part of domain name
    const domainFirstPart = hostname.split(".")[0];
    platform = domainFirstPart.charAt(0).toUpperCase() + domainFirstPart.slice(1);
  }

  let html = "";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; BrioBot/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es,en-US,en;q=0.9",
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      // Limit read size to first 256KB to keep it fast
      const rawText = await response.text();
      html = rawText.slice(0, 300000);
    }
  } catch (err) {
    console.warn(`[Metascraper] Could not fetch HTML from ${cleanUrl}:`, err);
  }

  let title = "";
  let description = "";
  let coverUrl = "";
  let authorOrCreator = "";

  if (html) {
    // Collect all <meta ...> tags
    const metaTagRegex = /<meta\s+[^>]*>/gi;
    let match;
    const metaTags: string[] = [];

    while ((match = metaTagRegex.exec(html)) !== null) {
      metaTags.push(match[0]);
    }

    for (const tag of metaTags) {
      const property = (extractAttribute(tag, "property") || "").toLowerCase();
      const name = (extractAttribute(tag, "name") || "").toLowerCase();
      const content = extractAttribute(tag, "content") || "";

      if (!content) continue;

      // Title
      if (!title) {
        if (property === "og:title" || name === "twitter:title") {
          title = content;
        }
      }

      // Description
      if (!description) {
        if (
          property === "og:description" ||
          name === "twitter:description" ||
          name === "description"
        ) {
          description = content;
        }
      }

      // Cover / Image
      if (!coverUrl) {
        if (
          property === "og:image" ||
          property === "og:image:secure_url" ||
          name === "twitter:image" ||
          name === "twitter:image:src"
        ) {
          coverUrl = content;
        }
      }

      // Site Name / Author
      if (!authorOrCreator) {
        if (property === "og:site_name" || name === "author" || property === "article:author") {
          authorOrCreator = content;
        }
      }
    }

    // Fallback title from <title> tag
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        title = decodeHtmlEntities(titleMatch[1]);
      }
    }

    // Clean common site suffixes from title
    if (title) {
      title = title
        .replace(/\s*[|\-•–]\s*(Letterboxd|IMDb|YouTube|Wikipedia|GitHub|Filmaffinity|Platzi|Udemy)$/i, "")
        .trim();
    }

    // Resolve relative cover URL
    if (coverUrl && !/^https?:\/\//i.test(coverUrl)) {
      try {
        coverUrl = new URL(coverUrl, cleanUrl).toString();
      } catch {
        // Keep original if resolution fails
      }
    }
  }

  // Final fallback for title if page didn't have one
  if (!title) {
    const pathSlug = parsedUrl.pathname.split("/").filter(Boolean).pop();
    if (pathSlug) {
      title = decodeURIComponent(pathSlug).replace(/[-_]+/g, " ");
      title = title.charAt(0).toUpperCase() + title.slice(1);
    } else {
      title = hostname;
    }
  }

  return {
    url: cleanUrl,
    title,
    description: description || undefined,
    coverUrl: coverUrl || undefined,
    authorOrCreator: authorOrCreator || undefined,
    platform,
    category,
  };
}
