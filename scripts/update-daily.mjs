import { readFile, writeFile } from 'node:fs/promises';

const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
}).formatToParts().map(({ type, value }) => [type, value]));
const dateKey = process.env.MUSIC_DATE || `${parts.month}-${parts.day}`;
const currentYear = Number(parts.year);
const music = JSON.parse(await readFile(new URL('../music.json', import.meta.url), 'utf8'));
const previousTitles = new Set((music[dateKey] || []).map(item => item.title));

if (music[dateKey]?.length && music._updated?.[dateKey] >= currentYear && !process.env.FORCE_UPDATE) {
  console.log(`${dateKey}: already updated for ${currentYear}; skipped.`);
  process.exit(0);
}

const dates = Array.from({ length: currentYear - 1959 }, (_, i) =>
  `"${1960 + i}-${dateKey}T00:00:00Z"^^xsd:dateTime`
).join(' ');
const query = `SELECT DISTINCT ?item ?itemLabel ?date ?artistLabel ?genreLabel ?kindLabel ?country ?mbid ?sitelinks WHERE {
  VALUES ?date { ${dates} }
  ?item wdt:P577 ?date; wdt:P436 ?mbid; wikibase:sitelinks ?sitelinks.
  { ?item wdt:P31 ?kind. ?kind wdt:P279* wd:Q482994. } UNION { ?item wdt:P31 wd:Q134556. BIND(wd:Q134556 AS ?kind) }
  ?item wdt:P175 ?artist.
  OPTIONAL { { ?artist wdt:P27 ?country. } UNION { ?artist wdt:P495 ?country. } }
  OPTIONAL { ?item wdt:P136 ?genre. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en". }
} ORDER BY DESC(?sitelinks) LIMIT 100`;
const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
const response = await fetch(url, { headers: { 'User-Agent': 'OnThisDayMusic/1.0 (GitHub Actions)' } });
if (!response.ok) throw new Error(`Wikidata ${response.status}`);

const genre = (item, region) => {
  const value = item.genreLabel?.value?.toLowerCase() || '';
  if (region === 'KR') return 'KOREAN MUSIC';
  if (/jazz|재즈|bebop|비밥/.test(value)) return 'JAZZ';
  if (/hip hop|hip-hop|힙합|rap/.test(value)) return 'HIP-HOP';
  if (/r&b|rhythm and blues|리듬 앤 블루스|soul|소울/.test(value)) return 'R&B/SOUL';
  if (/electronic|일렉트로닉|house|techno|ambient|edm/.test(value)) return 'EDM';
  if (/rock|록|metal|메탈|punk|펑크|grunge/.test(value)) return 'ROCK';
  return 'POP';
};
const bindings = (await response.json()).results.bindings;
const candidates = [...new Map(bindings.map(item => [item.mbid.value, item])).values()];

const found = [];
for (const item of candidates.slice(0, 35)) {
  if (found.length === 20) break;
  const mbid = item.mbid.value;
  const image = `https://coverartarchive.org/release-group/${mbid}/front-500`;
  const cover = await fetch(image, { method: 'HEAD' });
  if (!cover.ok) continue;
  const artist = item.artistLabel?.value || 'Unknown artist';
  const region = item.country?.value === 'http://www.wikidata.org/entity/Q884' ? 'KR' : 'GLOBAL';
  const releaseDate = item.date.value.slice(0, 10);
  const year = Number(releaseDate.slice(0, 4));
  found.push({
    region,
    type: item.kindLabel?.value || 'Release',
    genre: genre(item, region),
    title: item.itemLabel.value,
    curation: '오늘의 발견',
    artist,
    year,
    image,
    text: `${releaseDate}에 공개된 음악 작품입니다. 자동 수집된 후보이므로 대표작 여부와 장르 설명은 추후 검수됩니다.`,
    url: `https://musicbrainz.org/release-group/${mbid}`
  });
}

if (!found.length) throw new Error(`${dateKey}: no releases with cover art found.`);
const global = ['POP', 'HIP-HOP', 'R&B/SOUL', 'ROCK']
  .map(genre => found.find(item => item.region === 'GLOBAL' && item.genre === genre && !previousTitles.has(item.title))
    || found.find(item => item.region === 'GLOBAL' && item.genre === genre))
  .filter(Boolean);
music[dateKey] = global;
music._updated = { ...music._updated, [dateKey]: currentYear };

if (process.env.DRY_RUN) console.log(JSON.stringify({ [dateKey]: music[dateKey] }, null, 2));
else {
  await writeFile(new URL('../music.json', import.meta.url), `${JSON.stringify(music, null, 2)}\n`);
  console.log(`${dateKey}: added ${music[dateKey].length} releases.`);
}
