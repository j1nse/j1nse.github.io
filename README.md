# j1nse.github.io

新的博客站点使用 Astro 构建内容，使用 XP.css 提供 Windows XP 风格的 UI。

## 开发命令

```bash
npm install
npm run migrate
npm run dev
```

## 构建

```bash
npm run build
```

## 内容迁移

迁移脚本会读取仓库根目录下的以下旧博客目录：

- `../shequ123.github.io`
- `../old_blog`
- `../old_blog_2`

执行命令：

```bash
npm run migrate
```

脚本会：

- 从旧博客中提取文章标题、日期、分类、标签、摘要和正文
- 将文章写入 `src/content/posts/`
- 将旧站正文里引用到的本地资源复制到 `public/legacy-assets/`
- 把能识别的旧站内部文章链接改写到新站 `/blog/.../`

字符猫：

```text
 /\_/\\
( o.o )
 > ^ <
```
