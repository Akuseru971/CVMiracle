import * as cheerio from "cheerio";

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeTitle(raw?: string | null) {
  if (!raw) return null;
  const cleaned = cleanText(raw)
    .replace(/\s*\|\s*.*/, "")
    .replace(/\s*-\s*.*/, "")
    .trim();
  return cleaned || null;
}

function normalizeCompany(raw?: string | null) {
  if (!raw) return null;
  const cleaned = cleanText(raw).trim();
  return cleaned || null;
}

export async function extractJobOfferPreview(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CVMiracleBot/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer l'offre d'emploi");
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title =
    normalizeTitle(
      $("meta[property='og:title']").attr("content") ??
        $("meta[name='twitter:title']").attr("content") ??
        $("h1").first().text() ??
        $("title").text(),
    ) ?? "Poste détecté";

  const company =
    normalizeCompany(
      $("meta[property='og:site_name']").attr("content") ??
        $("meta[name='author']").attr("content") ??
        $("[data-company], .company, .company-name").first().text(),
    ) ?? "Entreprise détectée";

  return { title, company, sourceUrl: url };
}

export async function extractJobOfferText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CVMiracleBot/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer l'offre d'emploi");
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe").remove();
  const text = cleanText($("body").text());

  if (!text || text.length < 120) {
    throw new Error("Contenu d'offre insuffisant pour analyse");
  }

  return text.slice(0, 20000);
}
