import type { Root } from "mdast";
import type { Plugin } from "unified";
import { definitions } from "mdast-util-definitions";
import { joinURL } from "ufo";
import { visit } from "unist-util-visit";

export interface Options {
  baseUrl: string | ((path: string) => string);
}

const ALLOWED_TAG_NAMES = ["a", "video", "img"];

const remarkTransformLinks: Plugin<Options[], Root> = (options) => {
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
          // filter non a, video and image tags
          const tagName = node.value.match(/<(\w+)/)?.[1];

          if (!tagName || !ALLOWED_TAG_NAMES.includes(tagName)) return;

          if (tagName === "a") {
            const url = node.value.match(/href="([^"]+)"/)?.[1];
            if (!url) return;

            if (
              url.startsWith("http://")
              || url.startsWith("https://")
              || url.startsWith("mailto:")
            ) {
              return;
            }

            if (url.startsWith("#")) {
              return;
            }

            const baseUrl
              = typeof options.baseUrl === "function"
                ? options.baseUrl(url)
                : options.baseUrl;
            node.value = node.value.replace(
              /href="([^"]+)"/,
              `href="${joinURL(baseUrl, url)}"`,
            );
          }

          if (tagName === "video" || tagName === "img") {
            const src = node.value.match(/src="([^"]+)"/)?.[1];
            if (!src) return;

            if (
              src.startsWith("http://")
              || src.startsWith("https://")
              || src.startsWith("mailto:")
            ) {
              return;
            }

            if (src.startsWith("#")) {
              return;
            }

            const baseUrl
              = typeof options.baseUrl === "function"
                ? options.baseUrl(src)
                : options.baseUrl;

            node.value = node.value.replace(
              /src="([^"]+)"/,
              `src="${joinURL(baseUrl, src)}"`,
            );
          }

          return;
        }

        if (node.type === "linkReference" || node.type === "imageReference") {
          const definition = define(node.identifier);

          if (!definition) return;

          if (
            definition.url.startsWith("http://")
            || definition.url.startsWith("https://")
            || definition.url.startsWith("mailto:")
          ) {
            return;
          }

          if ((node.type === "linkReference" && definition.url.startsWith("#")) || (node.type === "imageReference" && definition.url.startsWith("data:") && definition.url.startsWith("#"))) {
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

        if (
          url.startsWith("http://")
          || url.startsWith("https://")
          || url.startsWith("mailto:")
        ) {
          return;
        }

        if ((node.type === "link" && url.startsWith("#")) || (node.type === "image" && url.startsWith("data:") && url.startsWith("#"))) {
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
