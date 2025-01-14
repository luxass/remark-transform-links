import { remark } from "remark";
import { expect, it } from "vitest";
import remarkTransformLinks, { type Options } from "../src";

async function runRemark(input: string, options: Options) {
  return remark().use(remarkTransformLinks, options).process(input);
}

export function dedent(strings: TemplateStringsArray, ...values: any[]): string {
  const raw = strings.raw.reduce((result, str, i) => result + str + (values[i] || ""), "");

  const lines = raw.split("\n");
  const indentLength = Math.min(
    ...lines
      .filter((line) => line.trim().length > 0)
      .map((line) => line.match(/^ */)?.[0].length || 0),
  );

  return lines
    .map((line) => line.slice(indentLength))
    .join("\n")
    .trim();
}

it("transform links with base url string", async () => {
  const input = dedent`
    # Hello World

    [link](./path/to/file.md)
    [link external](https://example.com)
    [link anchor](#anchor)
    [link mailto](mailto:example@example.com)
    [link absolute](/path/to/file.md)
  `;

  const result = await runRemark(input, {
    baseUrl: "https://luxass.dev",
  });

  expect(result.toString()).toMatchInlineSnapshot(dedent`
    "# Hello World

    [link](https://luxass.dev/path/to/file.md)
    [link external](https://example.com)
    [link anchor](#anchor)
    [link mailto](mailto:example@example.com)
    [link absolute](https://luxass.dev/path/to/file.md)
    "
  `);
});

it("transform links with base url function", async () => {
  const input = dedent`
    # Hello World

    [link](./test.md)
    [link external](https://example.com)
    [link anchor](#anchor)
    [link mailto](mailto:example@example.com)
    [link absolute](/thank-you-next.md)
  `;

  const result = await runRemark(input, {
    baseUrl: (path) => {
      if (path === "/thank-you-next.md") {
        return "https://luxass.dev";
      }

      return "https://luxass.dev/blog";
    },
  });

  expect(result.toString()).toMatchInlineSnapshot(dedent`
    "# Hello World

    [link](https://luxass.dev/blog/test.md)
    [link external](https://example.com)
    [link anchor](#anchor)
    [link mailto](mailto:example@example.com)
    [link absolute](https://luxass.dev/thank-you-next.md)
    "
  `);
});

it("transform link references", async () => {
  const input = dedent`
    # Hello World

    [link][link]
    [link external][link external]
    [link anchor][link anchor]
    [link mailto][link mailto]
    [link absolute][link absolute]

    [link]: ./test.md
    [link external]: https://example.com
    [link anchor]: #anchor
    [link mailto]: mailto:example@example.com
    [link absolute]: /thank-you-next.md
  `;

  const result = await runRemark(input, {
    baseUrl: "https://luxass.dev",
  });

  expect(result.toString()).toMatchInlineSnapshot(dedent`
    "# Hello World

    [link][link]
    [link external][link external]
    [link anchor][link anchor]
    [link mailto][link mailto]
    [link absolute][link absolute]

    [link]: https://luxass.dev/test.md

    [link external]: https://example.com

    [link anchor]: #anchor

    [link mailto]: mailto:example@example.com

    [link absolute]: https://luxass.dev/thank-you-next.md
    "
  `);
});

it("transform image links", async () => {
  const input = dedent`
    # Hello World

    ![image](./path/to/file.md)
    ![image external](https://example.com)
    ![image anchor](#anchor)
    ![image mailto](mailto:example@example.com)
    ![image absolute](/path/to/file.md)
  `;

  const result = await runRemark(input, {
    baseUrl: "https://luxass.dev",
  });

  expect(result.toString()).toMatchInlineSnapshot(dedent`
    "# Hello World

    ![image](https://luxass.dev/path/to/file.md)
    ![image external](https://example.com)
    ![image anchor](https://luxass.dev/#anchor)
    ![image mailto](mailto:example@example.com)
    ![image absolute](https://luxass.dev/path/to/file.md)
    "
  `);
});

it("transform image references", async () => {
  const input = dedent`
    # Hello World

    ![image][image]
    ![image external][image external]
    ![image anchor][image anchor]
    ![image mailto][image mailto]
    ![image absolute][image absolute]

    [image]: ./test.md
    [image external]: https://example.com
    [image anchor]: #anchor
    [image mailto]: mailto:example@example.com
    [image absolute]: /thank-you-next.md
  `;

  const result = await runRemark(input, {
    baseUrl: "https://luxass.dev",
  });

  expect(result.toString()).toMatchInlineSnapshot(dedent`
    "# Hello World

    ![image][image]
    ![image external][image external]
    ![image anchor][image anchor]
    ![image mailto][image mailto]
    ![image absolute][image absolute]

    [image]: https://luxass.dev/test.md

    [image external]: https://example.com

    [image anchor]: https://luxass.dev/#anchor

    [image mailto]: mailto:example@example.com

    [image absolute]: https://luxass.dev/thank-you-next.md
    "
  `);
});

it("transform links inside html tags", async () => {
  const input = dedent`
    # Hello World

    <a href="./path/to/file.md">link</a>
    <a href="https://example.com">link external</a>
    <a href="#anchor">link anchor</a>
    <img src="./path/to/file.png" alt="image">
    <video src="./path/to/file.mp4"></video>
  `;

  const result = await runRemark(input, {
    baseUrl: "https://luxass.dev",
  });

  expect(result.toString()).toMatchSnapshot();
});
