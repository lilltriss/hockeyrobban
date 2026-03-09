/**
 * HockeyRobban — Backend
 * Scrapar stats.swehockey.se och exponerar ett rent JSON-API.
 */

const express = require('express');
const cors    = require('cors');
const axios   = require('axios');
const cheerio = require('cheerio');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const cache = new Map();
function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.data);
  return fn().then(data => { cache.set(key, { data, ts: Date.now() }); return data; });
}

const BASE  = 'https://stats.swehockey.se';
const HEADS = { 'User-Agent': 'Mozilla/5.0 (compatible; HockeyRobban/1.0)' };
const TTL5  = 5  * 60 * 1000;
const TTL30 = 30 * 60 * 1000;

async function get(p) {
  const { data } = await axios.get(BASE + p, { headers: HEADS, timeout: 10000 });
  return data;
}

// ── Fallback-lista (bygger på PDF-kunskapen om seriestruktur 2024/25) ──────
let KNOWN_GROUPS = [
  // Nationella herr
  { id: 18263, name: 'SHL',                           level: 1, region: 'Nationell' },
  { id: 19979, name: 'HockeyAllsvenskan',              level: 2, region: 'Nationell' },
  { id: 19978, name: 'HockeyAllsvenskan Play Out',     level: 2, region: 'Nationell' },
  { id: 18264, name: 'Hockeyettan Norra',              level: 3, region: 'Nationell' },
  { id: 20400, name: 'Hockeyettan Södra',              level: 3, region: 'Nationell' },
  { id: 19817, name: 'Hockeyettan Slutspel Norra',     level: 3, region: 'Nationell' },
  { id: 19818, name: 'Hockeyettan Slutspel Södra',     level: 3, region: 'Nationell' },
  { id: 20401, name: 'Hockeyettan Play In Norra',      level: 3, region: 'Nationell' },
  { id: 20402, name: 'Hockeyettan Play In Södra',      level: 3, region: 'Nationell' },
  { id: 20403, name: 'Kvalserie till Hockeyettan',     level: 3, region: 'Nationell' },
  // Nationella dam
  { id: 19874, name: 'SDHL',                           level: 1, region: 'Dam' },
  { id: 19820, name: 'Hockeyallsvenskan Dam',           level: 2, region: 'Dam' },
  { id: 20410, name: 'Hockeyallsvenskan Dam Norra',     level: 2, region: 'Dam' },
  { id: 20411, name: 'Hockeyallsvenskan Dam Södra',     level: 2, region: 'Dam' },
  // Region Öst — HockeyTvåan
  { id: 18818, name: 'HockeyTvåan Öst',               level: 4, region: 'Region Öst' },
  // Region Öst — HockeyTrean
  { id: 19861, name: 'HockeyTrean Öst A',             level: 5, region: 'Region Öst' },
  { id: 20300, name: 'HockeyTrean Öst B',             level: 5, region: 'Region Öst' },
  { id: 20301, name: 'HockeyTrean Öst Fortsättning',  level: 5, region: 'Region Öst' },
  { id: 20302, name: 'Alltrean Öst',                  level: 5, region: 'Region Öst' },
  { id: 20303, name: 'Kvalserie till HockeyTrean',    level: 5, region: 'Region Öst' },
  // Region Öst — HockeyFyran Stockholm (2024/25 ID:n från PDF)
  { id: 95410, name: 'HockeyFyran Stockholm A',        level: 6, region: 'Region Öst' },
  { id: 95411, name: 'HockeyFyran Stockholm B',        level: 6, region: 'Region Öst' },
  // Äldre/alternativa ID:n
  { id: 19268, name: 'HockeyFyran Stockholm A',        level: 6, region: 'Region Öst' },
  { id: 19269, name: 'HockeyFyran Stockholm B',        level: 6, region: 'Region Öst' },
  { id: 19270, name: 'HockeyFyran Stockholm C',        level: 6, region: 'Region Öst' },
  // Fortsättnings- och slutspelsserier
  { id: 20056, name: 'HockeyFyran Stockholm Topp 6',   level: 6, region: 'Region Öst' },
  { id: 20059, name: 'HockeyFyran Stockholm Forts. A', level: 6, region: 'Region Öst' },
  { id: 20060, name: 'HockeyFyran Stockholm Forts. B', level: 6, region: 'Region Öst' },
  { id: 20057, name: 'HockeyFyran Stockholm Playoff',  level: 6, region: 'Region Öst' },
  { id: 20058, name: 'Kvalserie till HockeyTrean A',   level: 6, region: 'Region Öst' },
  { id: 20061, name: 'Kvalserie till HockeyTrean B',   level: 6, region: 'Region Öst' },
  // HockeyFyran Uppland
  { id: 19223, name: 'HockeyFyran Uppland',            level: 6, region: 'Region Öst' },
  { id: 20062, name: 'HockeyFyran Uppland Forts.',     level: 6, region: 'Region Öst' },
  // Hockeyfemman Stockholm
  { id: 19331, name: 'Hockeyfemman Stockholm Norra',   level: 7, region: 'Region Öst' },
  { id: 20063, name: 'Hockeyfemman Stockholm Södra',   level: 7, region: 'Region Öst' },
  { id: 20064, name: 'Hockeyfemman Stockholm Slutspel',level: 7, region: 'Region Öst' },
  // Distrikt
  { id: 18446, name: 'Uppland',                        level: 7, region: 'Region Öst' },
  { id: 18921, name: 'Södermanland',                   level: 7, region: 'Region Öst' },
  { id: 19191, name: 'Gotland',                        level: 7, region: 'Region Öst' },
  // Region Norr
  { id: 18565, name: 'HockeyTvåan Norr',              level: 4, region: 'Region Norr' },
  { id: 18571, name: 'HockeyTrean Norr',              level: 5, region: 'Region Norr' },
  { id: 19070, name: 'Jämtl. Härjedalen',             level: 6, region: 'Region Norr' },
  { id: 18867, name: 'Medelpad',                      level: 6, region: 'Region Norr' },
  { id: 18909, name: 'Norrbotten',                    level: 6, region: 'Region Norr' },
  { id: 18762, name: 'Västerbotten',                  level: 6, region: 'Region Norr' },
  { id: 20293, name: 'Ångermanland',                  level: 6, region: 'Region Norr' },
  // Region Väst
  { id: 20285, name: 'HockeyTvåan Väst',              level: 4, region: 'Region Väst' },
  { id: 20351, name: 'HockeyTrean Väst',              level: 5, region: 'Region Väst' },
  { id: 20310, name: 'Dalarna',                       level: 6, region: 'Region Väst' },
  { id: 19485, name: 'Gästrikland',                   level: 6, region: 'Region Väst' },
  { id: 19098, name: 'Hälsingland',                   level: 6, region: 'Region Väst' },
  { id: 18412, name: 'Värmland',                      level: 6, region: 'Region Väst' },
  { id: 20144, name: 'Västmanland',                   level: 6, region: 'Region Väst' },
  { id: 19305, name: 'Örebro',                        level: 6, region: 'Region Väst' },
  // Region Syd
  { id: 20443, name: 'HockeyTvåan Syd',               level: 4, region: 'Region Syd' },
  { id: 19917, name: 'HockeyTrean Syd',               level: 5, region: 'Region Syd' },
  { id: 18911, name: 'Blekinge',                      level: 6, region: 'Region Syd' },
  { id: 19308, name: 'Bohuslän-Dals',                 level: 6, region: 'Region Syd' },
  { id: 19536, name: 'Göteborg',                      level: 6, region: 'Region Syd' },
  { id: 18854, name: 'Skåne',                         level: 6, region: 'Region Syd' },
  { id: 18984, name: 'Småland',                       level: 6, region: 'Region Syd' },
  { id: 19371, name: 'Västergötland',                 level: 6, region: 'Region Syd' },
  { id: 18526, name: 'Östergötland',                  level: 6, region: 'Region Syd' },
];

// Deduplicera fallback-listan
(function() {
  const seen = new Set();
  KNOWN_GROUPS = KNOWN_GROUPS.filter(g => {
    if (seen.has(g.id)) return false;
    seen.add(g.id); return true;
  });
})();

// ── Dynamisk scraping ──────────────────────────────────────────────────────
const SKIP_KEYWORDS = [
  'u8','u9','u10','u11','u12','u13','u14','u15','u16','u17','u18','u19','u20',
  'junior','preseason','pre-season','camp','landskamp','paraishockey',
  'rekreation','tv-puck','kval u20','sm-kval','sm-slutspel u','universite',
  'referee','historical','folkets','halloffame','u 20','u 18','u 16','cup','tournament'
];

function shouldSkip(name) {
  const l = name.toLowerCase();
  return SKIP_KEYWORDS.some(kw => l.includes(kw));
}

function inferLevel(name) {
  const l = name.toLowerCase();
  if (l.includes('sdhl') || l.includes('shl')) return 1;
  if (l.includes('allsvenskan')) return 2;
  if (l.includes('hockeyettan') || l.includes('hockey ettan')) return 3;
  if (l.includes('tvåan')) return 4;
  if (l.includes('trean')) return 5;
  if (l.includes('fyran') || l.includes('forts') || l.includes('topp') || l.includes('kval')) return 6;
  return 7;
}

function inferRegion(name) {
  const l = name.toLowerCase();
  if (l.includes('dam') || l.includes('ndhl') || l.includes('sdhl')) return 'Dam';
  if (l.includes('norr') || l.includes('norrbotten') || l.includes('västerbotten') ||
      l.includes('ångermanland') || l.includes('medelpad') || l.includes('jämtl') ||
      l.includes('härjedalen')) return 'Region Norr';
  if (l.includes('dalarna') || l.includes('gästrikland') || l.includes('hälsingland') ||
      l.includes('värmland') || l.includes('västmanland') || l.includes('örebro')) return 'Region Väst';
  if (l.includes('blekinge') || l.includes('bohuslän') || l.includes('göteborg') ||
      l.includes('skåne') || l.includes('småland') || l.includes('västergötland') ||
      l.includes('östergötland') || l.includes('syd')) return 'Region Syd';
  if (l.includes('stockholm') || l.includes('uppland') || l.includes('södermanland') ||
      l.includes('gotland') || l.includes('öst')) return 'Region Öst';
  if (l.includes('väst')) return 'Region Väst';
  return 'Nationell';
}

let groupsLastFetched = 0;
const GROUPS_TTL = 6 * 60 * 60 * 1000;

async function fetchAllGroups() {
  if (Date.now() - groupsLastFetched < GROUPS_TTL) return KNOWN_GROUPS;
  try {
    console.log('🔍 Scraping swehockey.se...');
    const knownIds = new Set(KNOWN_GROUPS.map(g => g.id));
    const seen = new Set(knownIds);
    const newGroups = [];

    function extractFrom(html) {
      const $ = cheerio.load(html);
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href') || '';
        const m = href.match(/\/ScheduleAndResults\/(?:Overview|Schedule|Standings|Live)\/(\d+)/i);
        if (!m) return;
        const id = parseInt(m[1]);
        if (seen.has(id)) return;
        seen.add(id);
        const name = $(el).text().trim();
        if (!name || name.length < 3) return;
        if (shouldSkip(name)) return;
        newGroups.push({ id, name, level: inferLevel(name), region: inferRegion(name) });
      });
    }

    // Startsidan + ankarsidor för varje regions dropdown-meny
    const PAGES = [
      '/',
      '/ScheduleAndResults/Overview/18263',  // SHL (nationell meny)
      '/ScheduleAndResults/Overview/18818',  // HockeyTvåan Öst
      '/ScheduleAndResults/Overview/18565',  // HockeyTvåan Norr
      '/ScheduleAndResults/Overview/20285',  // HockeyTvåan Väst
      '/ScheduleAndResults/Overview/20443',  // HockeyTvåan Syd
      '/ScheduleAndResults/Overview/95410',  // HockeyFyran Stockholm A (24/25)
      '/ScheduleAndResults/Overview/19270',  // HockeyFyran Stockholm C (äldre)
      '/ScheduleAndResults/Overview/19874',  // SDHL
    ];

    await Promise.allSettled(PAGES.map(async (p) => {
      try { extractFrom(await get(p)); } catch (_) {}
    }));

    if (newGroups.length > 0) {
      KNOWN_GROUPS = [...KNOWN_GROUPS, ...newGroups];
      console.log(`✅ +${newGroups.length} nya serier. Totalt: ${KNOWN_GROUPS.length}`);
    } else {
      console.log(`✅ Inga nya. Totalt: ${KNOWN_GROUPS.length}`);
    }
    groupsLastFetched = Date.now();
  } catch (e) {
    console.error('❌ Scraping misslyckades:', e.message);
    groupsLastFetched = Date.now();
  }
  return KNOWN_GROUPS;
}

fetchAllGroups();

// ── Parsers ────────────────────────────────────────────────────────────────

function parseStandings(html) {
  const $ = cheerio.load(html);
  const teams = [];
  $('table tr').each((i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 5) return;
    const pos = parseInt($(cells[0]).text().trim());
    if (isNaN(pos)) return;
    const nameCell = $(cells[1]);
    const nameLink = nameCell.find('a').first();
    const name = (nameLink.length ? nameLink.text() : nameCell.text()).trim();
    if (!name) return;
    const cellTexts = [];
    cells.each((j, cell) => { if (j >= 2) cellTexts.push($(cell).text().trim()); });
    const pts = parseInt(cellTexts[cellTexts.length - 1]) || 0;
    const gp  = parseInt(cellTexts[0]) || 0;
    let gf = 0, ga = 0;
    for (const t of cellTexts) {
      const m = t.match(/(\d+)\s*:\s*(\d+)/);
      if (m) { gf = parseInt(m[1]); ga = parseInt(m[2]); break; }
    }
    const w   = parseInt(cellTexts[1]) || 0;
    const otw = parseInt(cellTexts[2]) || 0;
    const otl = parseInt(cellTexts[3]) || 0;
    const l   = parseInt(cellTexts[4]) || 0;
    teams.push({ pos, name, gp, w, otw, otl, l, gf, ga, diff: gf - ga, pts, form: [] });
  });
  return teams;
}

function parseSchedule(html) {
  const $ = cheerio.load(html);
  const games = [];
  $('table tr').each((i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 5) return;
    const dateText  = $(cells[0]).text().trim();
    const timeText  = $(cells[1]).text().trim();
    const homeText  = $(cells[2]).text().trim();
    const scoreText = $(cells[3]).text().trim();
    const awayText  = $(cells[4]).text().trim();
    if (!dateText || !homeText || !awayText) return;
    if (dateText.toLowerCase().includes('datum') || dateText.toLowerCase().includes('date')) return;
    const scoreMatch = scoreText.match(/(\d+)\s*[-–]\s*(\d+)/);
    const played     = !!scoreMatch;
    const scoreHome  = played ? parseInt(scoreMatch[1]) : null;
    const scoreAway  = played ? parseInt(scoreMatch[2]) : null;
    const overtime   = scoreText.includes('OT') || scoreText.includes('SO');
    const gameLink   = $(cells[3]).find('a').attr('href') || $(row).find('a').attr('href') || '';
    const gameIdM    = gameLink.match(/\/(\d+)$/);
    games.push({
      date: dateText.replace(/\s+/,' ').trim(), time: timeText,
      home: homeText.replace(/\s+/,' ').trim(), away: awayText.replace(/\s+/,' ').trim(),
      scoreHome, scoreAway, played, overtime,
      gameId: gameIdM ? gameIdM[1] : null, raw: scoreText
    });
  });
  return games;
}

// ── Routes ─────────────────────────────────────────────────────────────────

app.get('/api/leagues', async (req, res) => res.json(await fetchAllGroups()));

app.get('/api/standings/:groupId', async (req, res) => {
  try {
    const data = await cached(`standings:${req.params.groupId}`, TTL5, async () =>
      parseStandings(await get(`/ScheduleAndResults/Standings/${req.params.groupId}`))
    );
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/schedule/:groupId', async (req, res) => {
  try {
    const data = await cached(`schedule:${req.params.groupId}`, TTL5, async () =>
      parseSchedule(await get(`/ScheduleAndResults/Schedule/${req.params.groupId}`))
    );
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ teams: [], leagues: [] });
  const groups  = await fetchAllGroups();
  const leagues = groups.filter(g => g.name.toLowerCase().includes(q));
  const teamResults = [];
  await Promise.allSettled(groups.map(async (group) => {
    try {
      const teams = await cached(`standings:${group.id}`, TTL30, async () =>
        parseStandings(await get(`/ScheduleAndResults/Standings/${group.id}`))
      );
      teams.forEach(t => {
        if (t.name.toLowerCase().includes(q)) teamResults.push({ ...t, league: group });
      });
    } catch (_) {}
  }));
  // Deduplicera — varje lag visas en gång, i sin högsta nivå-serie
  const best = new Map();
  teamResults.forEach(t => {
    const key = t.name.toLowerCase();
    if (!best.has(key) || t.league.level < best.get(key).league.level) best.set(key, t);
  });
  const deduped = Array.from(best.values()).sort((a, b) => {
    const as = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bs = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return as - bs || a.league.level - b.league.level;
  });
  res.json({ teams: deduped.slice(0, 10), leagues: leagues.slice(0, 6) });
});

app.get('/api/team-schedule/:groupId/:teamName', async (req, res) => {
  const name = decodeURIComponent(req.params.teamName).toLowerCase();
  try {
    const games = await cached(`schedule:${req.params.groupId}`, TTL5, async () =>
      parseSchedule(await get(`/ScheduleAndResults/Schedule/${req.params.groupId}`))
    );
    res.json(games.filter(g =>
      g.home.toLowerCase().includes(name) || g.away.toLowerCase().includes(name)
    ));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/proxy', async (req, res) => {
  const p = req.query.path;
  if (!p || !p.startsWith('/')) return res.status(400).json({ error: 'bad path' });
  try { res.type('html').send(await get(p)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => console.log(`🏒 HockeyRobban på port ${PORT} — ${KNOWN_GROUPS.length} serier i fallback`));
