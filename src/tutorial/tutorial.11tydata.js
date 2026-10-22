// Semua file .md di folder ini memakai layout tutorial. Draft (draft: true) tidak diterbitkan.
export default {
  layout: "tutorial.njk",
  ogType: "article",
  eleventyComputed: {
    permalink: (data) => (data.page.inputPath.endsWith("index.njk") ? "/tutorial/" : data.draft ? false : `/tutorial/${data.page.fileSlug}/`),
    deskripsi: (data) => data.deskripsi || data.ringkasan,
  },
};
