import type { Root } from "mdast";
import type { Plugin } from "unified";
import { definitions } from "mdast-util-definitions";
import { joinURL } from "ufo";
import { visit } from "unist-util-visit";

export interface Options {
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
  return /^https?:|mailto:|tel:|ftp:/i.test(url);
}

const remarkTransformLinks: Plugin<Options[], Root> = (options) => {
  if (!options || (typeof options.baseUrl !== "string" && typeof options.baseUrl !== "function")) {
    throw new Error("baseUrl must be a string or a function");
  }
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
          const tagName = node.value.match(/<(\w+)/)?.[1];
          if (!tagName || !TAG_ATTRIBUTES[tagName]) return;

          for (const attr of TAG_ATTRIBUTES[tagName]) {
            const regex = new RegExp(`${attr}=(["'])([^"']+)\\1`, "i");
            const match = node.value.match(regex);
            if (!match) continue;

            const [, quote, url] = match;
            if (!url || isURL(url) || url.startsWith("#")) {
              continue;
            }

            const baseUrl
              = typeof options.baseUrl === "function"
                ? options.baseUrl(url)
                : options.baseUrl;
            const transformedUrl = joinURL(baseUrl, url);
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

          const baseUrl
            = typeof options.baseUrl === "function"
              ? options.baseUrl(definition.url)
              : options.baseUrl;

          definition.url = joinURL(baseUrl, definition.url);
          return;
        }

        const url = node.url;

        if (isURL(url) || url.startsWith("#") || url.startsWith("data:")) {
          return;
        }

        const baseUrl
          = typeof options.baseUrl === "function"
            ? options.baseUrl(url)
            : options.baseUrl;

        node.url = joinURL(baseUrl, url);
      },
    );
  };
};

export default remarkTransformLinks;
