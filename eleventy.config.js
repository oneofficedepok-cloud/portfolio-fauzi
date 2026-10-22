// Konfigurasi Eleventy: data di src/_data, tutorial Markdown di src/tutorial, hasil build di _site.
export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/img": "img", "src/assets": "assets", "src/favicon.svg": "favicon.svg", "src/og.png": "og.png", "src/CNAME": "CNAME" });
  eleventyConfig.addGlobalData("tahun", new Date().getFullYear());

  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  eleventyConfig.addFilter("tanggalID", (d) => {
    const t = new Date(d);
    return `${t.getUTCDate()} ${bulan[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
  });
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("byStatus", (list, s) => list.filter((p) => p.status === s));
  eleventyConfig.addFilter("byId", (list, id) => list.find((p) => p.id === id));
  eleventyConfig.addFilter("absUrl", (path, base) => new URL(path, base).href);
  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));

  // Tutorial terbit = draft bukan true; draft tetap tampil di beranda sebagai "Segera".
  const semuaTutorial = (api) => api.getFilteredByGlob("src/tutorial/*.md");
  eleventyConfig.addCollection("tutorial", (api) => semuaTutorial(api).filter((t) => !t.data.draft).sort((a, b) => b.date - a.date));
  eleventyConfig.addCollection("tutorialSegera", (api) => semuaTutorial(api).filter((t) => t.data.draft).sort((a, b) => (a.data.urutan || 99) - (b.data.urutan || 99)));

  return {
    dir: { input: "src", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
}
