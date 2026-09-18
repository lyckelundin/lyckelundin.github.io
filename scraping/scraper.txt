const fs = require("fs");
const cheerio = require("cheerio");

const BASE_URL =
  "https://www.allabolag.se/bransch-s%C3%B6k?q=Reklambyr%C3%A5";

const MAX_COMPANIES = 125;
const DELAY_MS = 500;
const MAX_EMPTY_PAGES_IN_A_ROW = 3; // avbryt om vi får tomma sidor flera gånger i rad

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache"
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getPageUrl(pageNumber) {
  const url = new URL(BASE_URL);

  if (pageNumber > 1) {
    url.searchParams.set("page", pageNumber);
  }

  url.searchParams.set("_cacheBust", Date.now().toString());

  return url.toString();
}

async function fetchPage(pageNumber) {
  const url = getPageUrl(pageNumber);

  console.log(`Hämtar sida ${pageNumber}...`);

  const response = await fetch(url, {
    headers: HEADERS,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.text();
}

function extractCompanies(html) {
  const $ = cheerio.load(html);
  const companies = [];

  $(".SearchResultCard-card").each((index, element) => {
    const card = $(element);

    const companyName = card.find("h2 a").first().text().trim();

    let organizationNumber = "";

    card.find(".CardHeader-propertyList").each((i, el) => {
      const text = $(el).text().trim();

      if (text.includes("Org.nr")) {
        organizationNumber = text
          .replace("Org.nr", "")
          .trim();
      }
    });

    const phone = card
      .find(".CardHeader-phone")
      .text()
      .replace("Telefon", "")
      .trim();

    let address = "";

    card.find(".CardHeader-propertyList").each((i, el) => {
      const property = $(el);

      if (property.hasClass("CardHeader-phone")) {
        return;
      }

      const text = property.text().trim();

      if (!text || text.includes("Org.nr")) {
        return;
      }

      address = text;
    });

    if (companyName) {
      companies.push({
        companyName,
        organizationNumber,
        phone,
        address
      });
    }
  });

  return companies;
}

function removeDuplicates(companies) {
  const uniqueCompanies = [];
  const seen = new Set();

  for (const company of companies) {
    const key = company.organizationNumber || company.companyName;

    if (!seen.has(key)) {
      seen.add(key);
      uniqueCompanies.push(company);
    }
  }

  return uniqueCompanies;
}

function csvEscape(value) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

function saveCsv(companies) {
  const header =
    "Företagsnamn,Organisationsnummer,Telefonnummer,Adress";

  const rows = companies.map(company => {
    return [
      company.companyName,
      company.organizationNumber,
      company.phone,
      company.address
    ]
      .map(csvEscape)
      .join(",");
  });

  fs.writeFileSync(
    "foretag.csv",
    [header, ...rows].join("\n"),
    "utf8"
  );
}

async function main() {
  let allCompanies = [];

  let pageNumber = 1;
  let consecutiveEmptyPages = 0;

  console.log("Startar scraper...");
  console.log("Sökord: Reklambyrå");
  console.log(`Mål: ${MAX_COMPANIES} företag`);
  console.log("");

  while (
    allCompanies.length < MAX_COMPANIES &&
    consecutiveEmptyPages < MAX_EMPTY_PAGES_IN_A_ROW
  ) {
    try {
      const html = await fetchPage(pageNumber);

      const companies = extractCompanies(html);

      console.log(
        `Sida ${pageNumber}: ${companies.length} företag hittades`
      );

      if (companies.length === 0) {
        consecutiveEmptyPages++;
      } else {
        consecutiveEmptyPages = 0;
      }

      allCompanies.push(...companies);
      allCompanies = removeDuplicates(allCompanies);

      console.log(`Totalt (unika): ${allCompanies.length} företag`);
    } catch (error) {
      console.log(`Sida ${pageNumber}: FEL - ${error.message}`);
      console.log("Fortsätter till nästa sida...");
    }

    pageNumber++;

    if (
      allCompanies.length < MAX_COMPANIES &&
      consecutiveEmptyPages < MAX_EMPTY_PAGES_IN_A_ROW
    ) {
      await sleep(DELAY_MS);
    }
  }

  if (consecutiveEmptyPages >= MAX_EMPTY_PAGES_IN_A_ROW) {
    console.log("");
    console.log(
      `Avbryter: ${MAX_EMPTY_PAGES_IN_A_ROW} tomma sidor i rad (troligen slut på resultat).`
    );
  }

  const finalCompanies = allCompanies.slice(0, MAX_COMPANIES);

  saveCsv(finalCompanies);

  console.log("");
  console.log("KLART!");
  console.log(`Sparade ${finalCompanies.length} företag.`);
  console.log("Filen heter: foretag.csv");
}

main().catch(error => {
  console.error("Ett oväntat fel inträffade:", error);
  process.exit(1);
});