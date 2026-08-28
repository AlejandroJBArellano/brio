/**
 * Smart URL Origin & Domain Classifier for Projects & Vault Resources
 */

export type LinkCategory =
  | "git"
  | "live"
  | "figma"
  | "notion"
  | "linear"
  | "board"
  | "docs"
  | "media"
  | "general";

export interface ClassifiedLink {
  url: string;
  category: LinkCategory;
  label: string;
  domain: string;
  badgeStyle: string;
}

export function classifyUrl(rawUrl: string): ClassifiedLink {
  let cleanUrl = rawUrl.trim();
  if (!cleanUrl) {
    return {
      url: "",
      category: "general",
      label: "Enlace",
      domain: "",
      badgeStyle: "bg-[#181715] text-[#8E867B] border-[#2A2723]",
    };
  }

  // Ensure standard protocol
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`;
  }

  try {
    const parsed = new URL(cleanUrl);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = parsed.pathname.toLowerCase();

    // 1. Git / Code Repositories
    if (
      host === "github.com" ||
      host === "gitlab.com" ||
      host === "bitbucket.org" ||
      host.includes("git")
    ) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const repoName =
        parts.length >= 2
          ? `${parts[0]}/${parts[1]}`
          : host === "github.com"
          ? "GitHub"
          : "Repositorio";

      return {
        url: cleanUrl,
        category: "git",
        label: `Git (${repoName})`,
        domain: host,
        badgeStyle: "bg-[#181715] text-[#DDD6C9] border-[#38332D] hover:border-[#F5F2EB]",
      };
    }

    // 2. Figma Designs
    if (host === "figma.com" || host.includes("figma")) {
      return {
        url: cleanUrl,
        category: "figma",
        label: "Figma (Diseño)",
        domain: host,
        badgeStyle: "bg-[#201524] text-[#D8B4FE] border-[#C084FC]/30 hover:border-[#C084FC]",
      };
    }

    // 3. Notion Workspace
    if (
      host === "notion.so" ||
      host === "notion.site" ||
      host.includes("notion")
    ) {
      return {
        url: cleanUrl,
        category: "notion",
        label: "Notion (Doc)",
        domain: host,
        badgeStyle: "bg-[#221D16] text-[#D99B43] border-[#D99B43]/30 hover:border-[#D99B43]",
      };
    }

    // 4. Linear Sprint / Issues
    if (host === "linear.app" || host.includes("linear")) {
      return {
        url: cleanUrl,
        category: "linear",
        label: "Linear (Tablero)",
        domain: host,
        badgeStyle: "bg-[#161C27] text-[#93C5FD] border-[#60A5FA]/30 hover:border-[#60A5FA]",
      };
    }

    // 5. Trello / Jira / Asana / ClickUp
    if (
      host.includes("atlassian.net") ||
      host === "trello.com" ||
      host === "asana.com" ||
      host.includes("clickup.com") ||
      host.includes("jira")
    ) {
      return {
        url: cleanUrl,
        category: "board",
        label: "Gestión de Tareas",
        domain: host,
        badgeStyle: "bg-[#161C27] text-[#93C5FD] border-[#60A5FA]/30 hover:border-[#60A5FA]",
      };
    }

    // 6. Docs / Swagger / Postman / Readme
    if (
      host.startsWith("docs.") ||
      pathname.startsWith("/docs") ||
      host.includes("swagger") ||
      host.includes("postman.com") ||
      host.includes("readme.io") ||
      host.includes("gitbook.io")
    ) {
      return {
        url: cleanUrl,
        category: "docs",
        label: "Documentación API",
        domain: host,
        badgeStyle: "bg-[#141C1A] text-[#4EAB9E] border-[#4EAB9E]/30 hover:border-[#4EAB9E]",
      };
    }

    // 7. Media / Demo / Loom / YouTube
    if (
      host === "loom.com" ||
      host === "youtube.com" ||
      host === "youtu.be" ||
      host === "vimeo.com" ||
      host.includes("drive.google.com")
    ) {
      return {
        url: cleanUrl,
        category: "media",
        label: "Demo / Video",
        domain: host,
        badgeStyle: "bg-[#251717] text-[#F87171] border-[#EF4444]/30 hover:border-[#EF4444]",
      };
    }

    // 8. Staging / Preview / Vercel / Netlify
    if (
      host.includes("vercel.app") ||
      host.includes("netlify.app") ||
      host.includes("staging") ||
      host.includes("localhost") ||
      host.includes("render.com")
    ) {
      return {
        url: cleanUrl,
        category: "live",
        label: `Staging (${host})`,
        domain: host,
        badgeStyle: "bg-[#141813] text-[#7EA35A] border-[#7EA35A]/30 hover:border-[#7EA35A]",
      };
    }

    // 9. Production Website / Custom Domain
    return {
      url: cleanUrl,
      category: "live",
      label: host,
      domain: host,
      badgeStyle: "bg-[#141C1A] text-[#4EAB9E] border-[#4EAB9E]/30 hover:border-[#4EAB9E]",
    };
  } catch {
    return {
      url: cleanUrl,
      category: "general",
      label: cleanUrl,
      domain: cleanUrl,
      badgeStyle: "bg-[#181715] text-[#8E867B] border-[#2A2723]",
    };
  }
}

/**
 * Extracts and classifies all URLs from combined fields or strings.
 */
export function extractAndClassifyLinks(
  ...inputs: (string | undefined | null)[]
): ClassifiedLink[] {
  const links: ClassifiedLink[] = [];
  const seen = new Set<string>();

  for (const input of inputs) {
    if (!input) continue;
    // Split on spaces, newlines, commas or semicolons
    const tokens = input.split(/[\n,;\s]+/);
    for (const token of tokens) {
      const trimmed = token.trim();
      if (!trimmed || !trimmed.includes(".")) continue;
      const classified = classifyUrl(trimmed);
      if (!seen.has(classified.url)) {
        seen.add(classified.url);
        links.push(classified);
      }
    }
  }

  return links;
}

/**
 * Automatically partitions a list of URLs into repoUrl and liveUrl
 * for backward-compatible database persistence.
 */
export function partitionLinksForDb(urls: string[]): {
  repoUrl?: string;
  liveUrl?: string;
} {
  const classified = urls.map(classifyUrl).filter((l) => Boolean(l.url));
  const gitLinks = classified.filter((l) => l.category === "git").map((l) => l.url);
  const otherLinks = classified.filter((l) => l.category !== "git").map((l) => l.url);

  return {
    repoUrl: gitLinks.length > 0 ? gitLinks.join(", ") : undefined,
    liveUrl: otherLinks.length > 0 ? otherLinks.join(", ") : undefined,
  };
}
