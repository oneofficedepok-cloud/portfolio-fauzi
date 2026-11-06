// Semua file .md di folder ini memakai layout ebook. Draft (draft: true) tidak diterbitkan.
export default {
  layout: "ebook.njk",
  ogType: "product",
  eleventyComputed: {
    permalink: (data) => (data.page.inputPath.endsWith("index.njk") ? "/ebook/" : data.draft ? false : `/ebook/${data.page.fileSlug}/`),
  },
};
