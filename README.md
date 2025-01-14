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
[Relative Link](/path/to/resource)
![Relative Image](/path/to/image.png)
<a href="/another/path">Link</a>
`;

const result = remark()
  .use(remarkTransformLinks, { baseUrl: "https://example.com" })
  .process(markdown);

console.log(result.toString());
```

## 📄 License

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/remark-transform-links?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/remark-transform-links
[npm-downloads-src]: https://img.shields.io/npm/dm/remark-transform-links?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/remark-transform-links
