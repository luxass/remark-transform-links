import type { Root } from "mdast";
import type { Plugin } from "unified";
import { definitions } from "mdast-util-definitions";
import { joinURL } from "ufo";
import { visit } from "unist-util-visit";

export interface Options {
  /**
   * The base URL to prepand to links.
   */
  baseUrl: string | ((path: string) => string);
}

const TAG_ATTRIBUTES: Record<string, string[]> = {
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

  const getBaseUrl = (url: string): string =>
    typeof options.baseUrl === "function"
      ? options.baseUrl(url)
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
          const tagName = node.value.match(/<(\w+)/)?.[1]?.toLowerCase();
          if (!tagName || !TAG_ATTRIBUTES[tagName]) return;

          for (const attr of TAG_ATTRIBUTES[tagName]) {
            const regex = new RegExp(`${attr}=(["']?)([^"'>\\s]+)\\1`, "i");
            const match = node.value.match(regex);
            if (!match) continue;

            const [, quote, url] = match;
            if (!url || isURL(url) || url.startsWith("#")) {
              continue;
            }

            const transformedUrl = joinURL(getBaseUrl(url), url);
            node.value = node.value.replace(regex, `${attr}=${quote}${transformedUrl}${quote}`);
          }
          return;
        }

        if (node.type === "linkReference" || node.type === "imageReference") {
          const definition = define(node.identifier);
          if (!definition) return;

          if (isURL(definition.url) || definition.url.startsWith("#") || definition.url.startsWith("data:")) {
            return;
          }

          definition.url = joinURL(getBaseUrl(definition.url), definition.url);
          return;
        }

        const url = node.url;

        if (isURL(url) || url.startsWith("#") || url.startsWith("data:")) {
          return;
        }

        node.url = joinURL(getBaseUrl(url), url);
      },
    );
  };
};

export default remarkTransformLinks;
