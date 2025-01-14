import type { Root } from "mdast";
import type { Plugin } from "unified";
import { definitions } from "mdast-util-definitions";
import { joinURL } from "ufo";
import { visit } from "unist-util-visit";

export type LinkType = "image" | "link" | `html_${Tag}`;

export type BaseURLFn = (path: string, type: LinkType) => string;

export interface Options {
  /**
   * The base URL to prepand to links.
   */
  baseUrl: string | BaseURLFn;
}

export type Tag = "a" | "img" | "video" | "source" | "iframe" | "link";

const TAG_ATTRIBUTES: Record<Tag, string[]> = {
  a: ["href"],
  img: ["src"],
  video: ["src", "poster"],
  source: ["src"],
  iframe: ["src"],
  link: ["href"],
};

function isURL(url: string): boolean {
  if (url.startsWith("http://") || url.startsWith("https://")) return true;
  if (url.startsWith("mailto:") || url.startsWith("tel:")) return true;
  if (url.startsWith("ftp://") || url.startsWith("sftp://")) return true;

  return false;
}

const remarkTransformLinks: Plugin<Options[], Root> = (options) => {
  if (!options || (typeof options.baseUrl !== "string" && typeof options.baseUrl !== "function")) {
    throw new Error("baseUrl must be a string or a function");
  }

  const getBaseUrl = (url: string, linkType: LinkType): string =>
    typeof options.baseUrl === "function"
      ? options.baseUrl(url, linkType)
      : options.baseUrl;

  return (tree) => {
    const define = definitions(tree);

    visit(
      tree,
      ["link", "linkReference", "image", "imageReference", "html"],
      (node) => {
        if (
          node.type !== "link"
          && node.type !== "linkReference"
          && node.type !== "image"
          && node.type !== "imageReference"
          && node.type !== "html"
        ) {
          return;
        }

        if (node.type === "html") {
          let value = node.value;
          const processed = new Set<string>();

          for (const tag of Object.keys(TAG_ATTRIBUTES) as Tag[]) {
            const tagRegex = new RegExp(`<${tag}[^>]+>`, "gi");
            const tagMatches = value.matchAll(tagRegex);

            for (const tagMatch of tagMatches) {
              const tagContent = tagMatch[0];
              if (processed.has(tagContent)) continue;

              for (const attr of TAG_ATTRIBUTES[tag]) {
                const attrRegex = new RegExp(`${attr}=(["']?)([^"'>\\s]+)\\1`, "i");
                const match = tagContent.match(attrRegex);
                if (!match) continue;

                const [, quote, url] = match;
                if (!url || isURL(url) || url.startsWith("#")) {
                  continue;
                }

                const transformedUrl = joinURL(getBaseUrl(url, `html_${tag}`), url);
                const newTagContent = tagContent.replace(attrRegex, `${attr}=${quote}${transformedUrl}${quote}`);
                value = value.replace(tagContent, newTagContent);
                processed.add(newTagContent);
              }
            }
          }

          node.value = value;
          return;
        }

        if (node.type === "linkReference" || node.type === "imageReference") {
          const definition = define(node.identifier);
          if (!definition) return;

          if (isURL(definition.url) || definition.url.startsWith("#") || definition.url.startsWith("data:")) {
            return;
          }

          definition.url = joinURL(getBaseUrl(definition.url, node.type === "imageReference" ? "image" : "link"), definition.url);
          return;
        }

        const url = node.url;

        if (isURL(url) || url.startsWith("#") || url.startsWith("data:")) {
          return;
        }

        node.url = joinURL(getBaseUrl(url, node.type === "image" ? "image" : "link"), url);
      },
    );
  };
};

export default remarkTransformLinks;
