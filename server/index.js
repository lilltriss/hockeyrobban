/**
 * HockeyRobban — Backend
 * Scrapar stats.swehockey.se och exponerar ett rent JSON-API.
 * Kör: node index.js  (port 3001)
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

// Servera frontend
app.use(express.static(path.join(__dirname, '../public')));

const cache = new Map();
function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.data);
  return fn().then(data => { cache.set(key, { data, ts: Date.now() }); return data; });
}

const BASE   = 'https://stats.swehockey.se';
const HEADS  = { 'User-Agent': 'Mozilla/5.0 (compatible; HockeyRobban/1.0)' };
const TTL5   = 5 * 60 * 1000;
const TTL30  = 30 * 60 * 1000;

async function get(path) {
  const { data } = await axios.get(BASE + path, { headers: HEADS, timeout: 8000 });
  return data;
}

// ── Dynamisk grupplista — scrapad från swehockey.se ───────
const SKIP_KEYWORDS = [
  'u8','u9','u10','u11','u12','u13','u14','u15','u16','u17','u18','u19','u20',
  'junior','preseason','pre-season','camp','cup','landskamp','paraishockey',
  'rekreation','tv-puck','kval u20','sm-kval','sm-slutspel u','universite',
  'referee','historical','folkets','halloffame','u 20','u 18','u 16'
];

function shouldSkip(name) {
  const lower = name.toLowerCase();
  return SKIP_KEYWORDS.some(kw => lower.includes(kw));
}

function inferLevel(name) {
  const l = name.toLowerCase();
  if (l.includes('shl') || (l.includes('sdhl') && !l.includes('dam'))) return 1;
  if (l.includes('sdhl')) return 1;
  if (l.includes('allsvenskan')) return 2;
  if (l.includes('hockeyettan') || l.includes('hockey ettan')) return 3;
  if (l.includes('tv\u00e5an') || l.includes('tvaaan')) return 4;
  if (l.includes('trean')) return 5;
  if (l.includes('fyran') || l.includes('forts') || l.includes('topp')) return 6;
  return 7;
}

function inferRegion(name) {
  const l = name.toLowerCase();
  if (l.includes('dam') || l.includes('ndhl') || l.includes('sdhl')) return 'Dam';
  if (l.includes('norr') || l.includes('norrbotten') || l.includes('v\u00e4sterbotten') ||
      l.includes('\u00e5ngermanland') || l.includes('medelpad') || l.includes('j\u00e4mtl') ||
      l.includes('h\u00e4rjedalen')) return 'Region Norr';
  if (l.includes('dalarna') || l.includes('g\u00e4strikland') || l.includes('h\u00e4lsingland') ||
      l.includes('v\u00e4rmland') || l.includes('v\u00e4stmanland') || l.includes('\u00f6rebro')) return 'Region Väst';
  if (l.includes('blekinge') || l.includes('bohuslan') || l.includes('bohusl\u00e4n') ||
      l.includes('g\u00f6teborg') || l.includes('sk\u00e5ne') || l.includes('sm\u00e5land') ||
      l.includes('v\u00e4sterg\u00f6tland') || l.includes('\u00f6sterg\u00f6tland')) return 'Region Syd';
  if (l.includes('stockholm') || l.includes('uppland') || l.includes('s\u00f6dermanland') ||
      l.includes('gotland') || l.includes('\u00f6st')) return 'Region Öst';
  if (l.includes('syd')) return 'Region Syd';
  if (l.includes('v\u00e4st')) return 'Region Väst';
  return 'Nationell';
}

// Fallback-lista används tills dynamisk scraping är klar
let KNOWN_GROUPS = [
  { id: 18263, name: 'SHL', level: 1, region: 'Nationell' },
  { id: 19874, name: 'SDHL', level: 1, region: 'Dam' },
  { id: 19979, name: 'HockeyAllsvenskan Slutspel', level: 2, region: 'Nationell' },
  { id: 19820, name: 'Hockeyallsvenskan Dam', level: 2, region: 'Dam' },
  { id: 18264, name: 'Hockeyettan', level: 3, region: 'Nationell' },
  { id: 18818, name: 'HockeyTvåan Öst', level: 4, region: 'Region Öst' },
  { id: 18565, name: 'HockeyTvåan Norr', level: 4, region: 'Region Norr' },
  { id: 20285, name: 'HockeyTvåan Väst', level: 4, region: 'Region Väst' },
  { id: 20443, name: 'HockeyTvåan Syd', level: 4, region: 'Region Syd' },
  { id: 19861, name: 'HockeyTrean Öst', level: 5, region: 'Region Öst' },
  { id: 18571, name: 'HockeyTrean Norr', level: 5, region: 'Region Norr' },
  { id: 20351, name: 'HockeyTrean Väst', level: 5, region: 'Region Väst' },
  { id: 19917, name: 'HockeyTrean Syd', level: 5, region: 'Region Syd' },
  { id: 19268, name: 'HockeyFyran Stockholm A', level: 6, region: 'Region Öst' },
  { id: 19269, name: 'HockeyFyran Stockholm B', level: 6, region: 'Region Öst' },
  { id: 19270, name: 'HockeyFyran Stockholm C', level: 6, region: 'Region Öst' },
  { id: 20059, name: 'HockeyFyran Stockholm forts. A', level: 6, region: 'Region Öst' },
];

let groupsLastFetched = 0;
const GROUPS_TTL = 6 * 60 * 60 * 1000; // 6 timmar

async function fetchAllGroups() {
  if (Date.now() - groupsLastFetched < GROUPS_TTL) return KNOWN_GROUPS;
  try {
    console.log('🔍 Hämtar serielista från swehockey.se...');
    const html = await get('/');
    const $ = cheerio.load(html);
    const seen = new Set();
    const groups = [];

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
      groups.push({ id, name, level: inferLevel(name), region: inferRegion(name) });
    });

    if (groups.length > 10) {
      KNOWN_GROUPS = groups;
      groupsLastFetched = Date.now();
      console.log(`✅ Hittade ${groups.length} serier från swehockey.se`);
    }
  } catch (e) {
    console.error('❌ Kunde inte hämta serielista:', e.message);
  }
  return KNOWN_GROUPS;
}

// Hämta serielista vid start
fetchAllGroups();

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

    // Samla all celltext från kolumn 2 och framåt
    const cellTexts = [];
    cells.each((j, cell) => { if (j >= 2) cellTexts.push($(cell).text().trim()); });

    // Poäng = sista kolumnen
    const pts = parseInt(cellTexts[cellTexts.length - 1]) || 0;

    // GP = första kolumnen efter namn
    const gp = parseInt(cellTexts[0]) || 0;

    // Sök efter GF:GA-cell med format "126:31 (95)" eller "126:31"
    let gf = 0, ga = 0;
    for (const t of cellTexts) {
      const m = t.match(/(\d+)\s*:\s*(\d+)/);
      if (m) { gf = parseInt(m[1]); ga = parseInt(m[2]); break; }
    }

    // W, T/OT, L — kolumnerna 1,2,3 efter GP
    const w   = parseInt(cellTexts[1]) || 0;
    const otw = parseInt(cellTexts[2]) || 0; // kan vara T (ties) eller OTV
    const otl = parseInt(cellTexts[3]) || 0;
    const l   = parseInt(cellTexts[4]) || 0;

    teams.push({ pos, name, gp, w, otw, otl, l, gf, ga, diff: gf - ga, pts, form: [] });
  });
  return teams;
}

function parseSchedule(html) {
  const $ = cheerio.load(html);
  const games = [];
  $('table.tblContent tr, .scheduleTable tr, table tr').each((i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 5) return;
    const dateText = $(cells[0]).text().trim();
    const timeText = $(cells[1]).text().trim();
    const homeText = $(cells[2]).text().trim();
    const scoreText = $(cells[3]).text().trim();
    const awayText = $(cells[4]).text().trim();
    if (!dateText || !homeText || !awayText) return;
    if (dateText.toLowerCase().includes('datum') || dateText.toLowerCase().includes('date')) return;
    const scoreMatch = scoreText.match(/(\d+)\s*[-–]\s*(\d+)/);
    const played = !!scoreMatch;
    const scoreHome = played ? parseInt(scoreMatch[1]) : null;
    const scoreAway = played ? parseInt(scoreMatch[2]) : null;
    const overtime = scoreText.includes('OT') || scoreText.includes('SO');
    const gameLink = $(cells[3]).find('a').attr('href') || $(row).find('a').attr('href') || '';
    const gameIdMatch = gameLink.match(/\/(\d+)$/);
    const gameId = gameIdMatch ? gameIdMatch[1] : null;
    games.push({ date: dateText.replace(/\s+/,' ').trim(), time: timeText,
      home: homeText.replace(/\s+/,' ').trim(), away: awayText.replace(/\s+/,' ').trim(),
      scoreHome, scoreAway, played, overtime, gameId, raw: scoreText });
  });
  return games;
}

app.get('/api/leagues', async (req, res) => res.json(await fetchAllGroups()));

app.get('/api/standings/:groupId', async (req, res) => {
  try {
    const data = await cached(`standings:${req.params.groupId}`, TTL5, async () => {
      return parseStandings(await get(`/ScheduleAndResults/Standings/${req.params.groupId}`));
    });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/schedule/:groupId', async (req, res) => {
  try {
    const data = await cached(`schedule:${req.params.groupId}`, TTL5, async () => {
      return parseSchedule(await get(`/ScheduleAndResults/Schedule/${req.params.groupId}`));
    });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ teams: [], leagues: [] });
  const groups = await fetchAllGroups();
  const leagues = groups.filter(g => g.name.toLowerCase().includes(q));
  const teamResults = [];
  await Promise.allSettled(groups.map(async (group) => {
    try {
      const teams = await cached(`standings:${group.id}`, TTL30, async () => {
        return parseStandings(await get(`/ScheduleAndResults/Standings/${group.id}`));
      });
      teams.forEach(t => { if (t.name.toLowerCase().includes(q)) teamResults.push({ ...t, league: group }); });
    } catch (_) {}
  }));
  teamResults.sort((a, b) => {
    const as = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bs = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return as - bs || a.league.level - b.league.level;
  });
  res.json({ teams: teamResults.slice(0, 10), leagues: leagues.slice(0, 6) });
});

app.get('/api/team-schedule/:groupId/:teamName', async (req, res) => {
  const name = decodeURIComponent(req.params.teamName).toLowerCase();
  try {
    const games = await cached(`schedule:${req.params.groupId}`, TTL5, async () => {
      return parseSchedule(await get(`/ScheduleAndResults/Schedule/${req.params.groupId}`));
    });
    res.json(games.filter(g => g.home.toLowerCase().includes(name) || g.away.toLowerCase().includes(name)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/proxy', async (req, res) => {
  const path = req.query.path;
  if (!path || !path.startsWith('/')) return res.status(400).json({ error: 'bad path' });
  try { res.type('html').send(await get(path)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Fallback — skicka index.html för alla andra routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => console.log(`🏒 HockeyRobban körs på port ${PORT}`));
