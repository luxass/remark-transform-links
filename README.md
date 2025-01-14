# remark-transform-links

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

transform links in markdown files using remark

## 📦 Installation

```bash
npm install remark-transform-links
```

## 🚀 Usage

```ts
import { remark } from "remark";
import remarkTransformLinks from "remark-transform-links";

const markdown = `
[Relative Link](/resource.html)
![Relative Image](./image.png)
<a href="/another/path">Link</a>
`;

const result = await remark()
  .use(remarkTransformLinks, { baseUrl: "https://example.com" })
  .process(markdown);

console.log(result.toString());

// Output:
// [Relative Link](https://example.com/resource.html)
// ![Relative Image](https://example.com/image.png)
// <a href="https://example.com/another/path">Link</a>

const result2 = await remark()
  .use(remarkTransformLinks, {
    baseUrl: (path) => {
      if (path.startsWith("/resource.html")) {
        return `https://example.com/market`;
      }

      return `https://example.com`;
    }
  })
  .process(markdown);

console.log(result2.toString());

// Output:
// [Relative Link](https://example.com/market/resource.html)
// ![Relative Image](https://example.com/image.png)
// <a href="https://example.com/another/path">Link</a>
```

## 📄 License

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/remark-transform-links?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/remark-transform-links
[npm-downloads-src]: https://img.shields.io/npm/dm/remark-transform-links?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/remark-transform-links
