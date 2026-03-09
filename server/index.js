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

const KNOWN_GROUPS = [
  { id: 18263, name: 'SHL', level: 1, region: 'Nationell' },
  { id: 19979, name: 'HockeyAllsvenskan Slutspel', level: 2, region: 'Nationell' },
  { id: 19978, name: 'HockeyAllsvenskan Play Out', level: 2, region: 'Nationell' },
  { id: 18264, name: 'Hockeyettan', level: 3, region: 'Nationell' },
  { id: 19817, name: 'Hockeyettan Slutspel Norra', level: 3, region: 'Nationell' },
  { id: 19818, name: 'Hockeyettan Slutspel Södra', level: 3, region: 'Nationell' },
  { id: 19874, name: 'SDHL', level: 1, region: 'Dam' },
  { id: 19820, name: 'Hockeyallsvenskan Dam', level: 2, region: 'Dam' },
  { id: 18818, name: 'HockeyTvåan Öst', level: 4, region: 'Region Öst' },
  { id: 19861, name: 'HockeyTrean Öst', level: 5, region: 'Region Öst' },
  { id: 20059, name: 'HockeyFyran Öst', level: 6, region: 'Region Öst' },
  { id: 19331, name: 'Stockholm', level: 7, region: 'Region Öst' },
  { id: 18446, name: 'Uppland', level: 7, region: 'Region Öst' },
  { id: 18921, name: 'Södermanland', level: 7, region: 'Region Öst' },
  { id: 19191, name: 'Gotland', level: 7, region: 'Region Öst' },
  { id: 18565, name: 'HockeyTvåan Norr', level: 4, region: 'Region Norr' },
  { id: 18571, name: 'HockeyTrean Norr', level: 5, region: 'Region Norr' },
  { id: 19070, name: 'Jämtl. Härjedalen', level: 6, region: 'Region Norr' },
  { id: 18867, name: 'Medelpad', level: 6, region: 'Region Norr' },
  { id: 18909, name: 'Norrbotten', level: 6, region: 'Region Norr' },
  { id: 18762, name: 'Västerbotten', level: 6, region: 'Region Norr' },
  { id: 20293, name: 'Ångermanland', level: 6, region: 'Region Norr' },
  { id: 20285, name: 'HockeyTvåan Väst', level: 4, region: 'Region Väst' },
  { id: 20351, name: 'HockeyTrean Väst', level: 5, region: 'Region Väst' },
  { id: 20310, name: 'Dalarna', level: 6, region: 'Region Väst' },
  { id: 19485, name: 'Gästrikland', level: 6, region: 'Region Väst' },
  { id: 19098, name: 'Hälsingland', level: 6, region: 'Region Väst' },
  { id: 18412, name: 'Värmland', level: 6, region: 'Region Väst' },
  { id: 20144, name: 'Västmanland', level: 6, region: 'Region Väst' },
  { id: 19305, name: 'Örebro', level: 6, region: 'Region Väst' },
  { id: 20443, name: 'HockeyTvåan Syd', level: 4, region: 'Region Syd' },
  { id: 19917, name: 'HockeyTrean Syd', level: 5, region: 'Region Syd' },
  { id: 18911, name: 'Blekinge', level: 6, region: 'Region Syd' },
  { id: 19308, name: 'Bohuslän-Dals', level: 6, region: 'Region Syd' },
  { id: 19536, name: 'Göteborg', level: 6, region: 'Region Syd' },
  { id: 18854, name: 'Skåne', level: 6, region: 'Region Syd' },
  { id: 18984, name: 'Småland', level: 6, region: 'Region Syd' },
  { id: 19371, name: 'Västergötland', level: 6, region: 'Region Syd' },
  { id: 18526, name: 'Östergötland', level: 6, region: 'Region Syd' },
];

function parseStandings(html) {
  const $ = cheerio.load(html);
  const teams = [];
  $('table.tblContent tr, table tr').each((i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 8) return;
    const pos = parseInt($(cells[0]).text().trim());
    if (isNaN(pos)) return;
    const nameCell = $(cells[1]);
    const nameLink = nameCell.find('a').first();
    const name = (nameLink.length ? nameLink.text() : nameCell.text()).trim();
    const href = nameLink.attr('href') || '';
    const teamIdMatch = href.match(/\/(\d+)$/);
    const teamId = teamIdMatch ? teamIdMatch[1] : null;
    const nums = [];
    cells.each((j, cell) => { if (j >= 2) nums.push($(cell).text().trim()); });
    const gp = parseInt(nums[0])||0, w = parseInt(nums[1])||0;
    const otw = parseInt(nums[2])||0, otl = parseInt(nums[3])||0;
    const l = parseInt(nums[4])||0, gf = parseInt(nums[5])||0;
    const ga = parseInt(nums[6])||0, pts = parseInt(nums[nums.length-1])||0;
    if (name) teams.push({ pos, name, teamId, gp, w, otw, otl, l, gf, ga, diff: gf-ga, pts, form: [] });
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

app.get('/api/leagues', (req, res) => res.json(KNOWN_GROUPS));

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
  const leagues = KNOWN_GROUPS.filter(g => g.name.toLowerCase().includes(q));
  const teamResults = [];
  await Promise.allSettled(KNOWN_GROUPS.slice(0, 20).map(async (group) => {
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
