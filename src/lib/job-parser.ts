import * as cheerio from "cheerio";

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
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
