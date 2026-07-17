/**
 * Static "who is this company" background info — headquarters, parent
 * company/owner, industry, founding date, a one-line description, and a
 * link to read more. Sourced entirely from Wikidata + Wikipedia's free,
 * keyless public APIs — deliberately NOT a financial-data vendor, since
 * this replaces the old live stock panel that was removed over liability
 * concerns. Nothing here is a price, a quote, or financial advice.
 *
 * Note: we deliberately don't surface "CEO" — Wikidata's chief-executive
 * property is frequently stale (shows former CEOs) since claims aren't
 * reliably ordered by recency and Wikidata often lacks "end date"
 * qualifiers, so we'd need per-company manual verification to trust it.
 * Not worth the risk of showing a wrong exec's name.
 *
 * Coverage is uneven — Wikidata has excellent data on large public
 * companies and thin-to-nothing on smaller tickers. When we don't have
 * real data we return null/empty fields rather than guessing.
 */

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKIPEDIA_SUMMARY_API = "https://en.wikipedia.org/api/rest_v1/page/summary";

// One week — this is slow-changing biographical data, not live market data.
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;

export interface CompanyInfo {
  companyName: string;
  description: string | null;
  imageUrl: string | null;
  headquarters: string | null;
  parentOrganization: string | null;
  ownedBy: string | null;
  industry: string | null;
  founded: string | null;
  wikipediaUrl: string | null;
}

interface WikidataSearchResult {
  id: string;
  label?: string;
  description?: string;
}

interface WikidataSnak {
  mainsnak?: {
    datavalue?: {
      value?: {
        id?: string;
        time?: string;
        precision?: number;
      };
    };
  };
}

interface WikidataEntity {
  labels?: Record<string, { value?: string }>;
  claims?: Record<string, WikidataSnak[]>;
  sitelinks?: Record<string, { title?: string }>;
}

const PROPS = {
  parentOrganization: "P749",
  ownedBy: "P127",
  headquarters: "P159",
  industry: "P452",
  inception: "P571",
} as const;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "PocketFinance/1.0 (news app; contact via app)" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[companyInfo] fetch threw for ${url}:`, err);
    return null;
  }
}

async function searchWikidataEntity(companyName: string): Promise<string | null> {
  const url = `${WIKIDATA_API}?action=wbsearchentities&search=${encodeURIComponent(
    companyName
  )}&language=en&format=json&type=item&limit=3&origin=*`;

  const data = await fetchJson<{ search?: WikidataSearchResult[] }>(url);
  const first = data?.search?.[0];
  return first?.id ?? null;
}

function extractClaimValue(
  claims: Record<string, WikidataSnak[]> | undefined,
  prop: string
): { entityId?: string; time?: string; precision?: number } | null {
  const snak = claims?.[prop]?.[0]?.mainsnak?.datavalue?.value;
  if (!snak) return null;
  return { entityId: snak.id, time: snak.time, precision: snak.precision };
}

function formatInceptionYear(time?: string, precision?: number): string | null {
  if (!time) return null;
  // Wikidata time values look like "+1976-04-01T00:00:00Z"
  const match = time.match(/^([+-])(\d+)-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = match[2];
  if (precision !== undefined && precision >= 10) {
    return `${match[3]}/${match[4]}/${year}`;
  }
  return year;
}

export async function fetchCompanyInfo(
  companyName: string
): Promise<CompanyInfo | null> {
  const cleanName = companyName.trim();
  if (!cleanName) return null;

  const entityId = await searchWikidataEntity(cleanName);
  if (!entityId) return null;

  const entityUrl = `${WIKIDATA_API}?action=wbgetentities&ids=${entityId}&props=claims%7Clabels%7Csitelinks&languages=en&format=json&origin=*`;
  const entityData = await fetchJson<{ entities?: Record<string, WikidataEntity> }>(
    entityUrl
  );
  const entity = entityData?.entities?.[entityId];
  if (!entity) return null;

  const resolvedName = entity.labels?.en?.value ?? cleanName;

  const parentClaim = extractClaimValue(entity.claims, PROPS.parentOrganization);
  const ownedByClaim = extractClaimValue(entity.claims, PROPS.ownedBy);
  const hqClaim = extractClaimValue(entity.claims, PROPS.headquarters);
  const industryClaim = extractClaimValue(entity.claims, PROPS.industry);
  const inceptionClaim = extractClaimValue(entity.claims, PROPS.inception);

  const referencedIds = [
    parentClaim?.entityId,
    ownedByClaim?.entityId,
    hqClaim?.entityId,
    industryClaim?.entityId,
  ].filter((id): id is string => Boolean(id));

  let labels: Record<string, string> = {};
  if (referencedIds.length > 0) {
    const uniqueIds = [...new Set(referencedIds)];
    const labelsUrl = `${WIKIDATA_API}?action=wbgetentities&ids=${uniqueIds.join(
      "%7C"
    )}&props=labels&languages=en&format=json&origin=*`;
    const labelsData = await fetchJson<{
      entities?: Record<string, { labels?: Record<string, { value?: string }> }>;
    }>(labelsUrl);
    if (labelsData?.entities) {
      labels = Object.fromEntries(
        Object.entries(labelsData.entities).map(([id, e]) => [
          id,
          e.labels?.en?.value ?? id,
        ])
      );
    }
  }

  const resolve = (id?: string) => (id ? labels[id] ?? null : null);

  // Wikipedia summary — description, image, canonical link. Prefer the
  // Wikidata sitelink title over guessing from the company name.
  const wikiTitle = entity.sitelinks?.enwiki?.title ?? resolvedName;
  const summaryData = await fetchJson<{
    extract?: string;
    thumbnail?: { source?: string };
    content_urls?: { desktop?: { page?: string } };
  }>(`${WIKIPEDIA_SUMMARY_API}/${encodeURIComponent(wikiTitle)}`);

  const info: CompanyInfo = {
    companyName: resolvedName,
    description: summaryData?.extract ?? null,
    imageUrl: summaryData?.thumbnail?.source ?? null,
    headquarters: resolve(hqClaim?.entityId),
    parentOrganization: resolve(parentClaim?.entityId),
    ownedBy: resolve(ownedByClaim?.entityId),
    industry: resolve(industryClaim?.entityId),
    founded: formatInceptionYear(inceptionClaim?.time, inceptionClaim?.precision),
    wikipediaUrl: summaryData?.content_urls?.desktop?.page ?? null,
  };

  const hasAnyData =
    info.description ||
    info.headquarters ||
    info.parentOrganization ||
    info.ownedBy ||
    info.industry ||
    info.founded;

  return hasAnyData ? info : null;
}
