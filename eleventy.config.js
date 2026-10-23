// Konfigurasi Eleventy: data di src/_data, tutorial Markdown di src/tutorial, hasil build di _site
// (dikirim ke branch "hosting" lalu di-pull oleh cPanel).
export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/img": "img", "src/assets": "assets", "src/favicon.svg": "favicon.svg", "src/og.png": "og.png", "src/.cpanel.yml": ".cpanel.yml", "src/.htaccess": ".htaccess", "src/admin": "admin" });
  // Halaman admin disalin apa adanya (bukan template).
  eleventyConfig.ignores.add("src/admin/**");
  eleventyConfig.addGlobalData("tahun", new Date().getFullYear());
  // Versi build untuk memaksa browser memuat CSS/JS terbaru setelah deploy.
  eleventyConfig.addGlobalData("versi", Date.now().toString(36));

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
  // Pilih satu item dari daftar (atau dari semua kelompok sebuah objek) secara tetap berdasarkan teks,
  // dipakai sebagai candaan cadangan untuk tutorial yang belum memilih candaan di admin.
  eleventyConfig.addFilter("pilihTetap", (daftar, kunci) => {
    const list = Array.isArray(daftar) ? daftar : Object.values(daftar).flat();
    let h = 0;
    for (const c of String(kunci)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return list[h % list.length];
  });

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
