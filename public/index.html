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
const TTL6H = 6  * 60 * 60 * 1000;

async function get(p) {
  const { data } = await axios.get(BASE + p, { headers: HEADS, timeout: 10000 });
  return data;
}

// ── Fallback-lista ──────────────────────────────────────────────────────────
let KNOWN_GROUPS = [
  { id: 18263, name: 'SHL',                           level: 1, region: 'Nationell' },
  { id: 19979, name: 'HockeyAllsvenskan',              level: 2, region: 'Nationell' },
  { id: 19978, name: 'HockeyAllsvenskan Play Out',     level: 2, region: 'Nationell' },
  { id: 18264, name: 'Hockeyettan Norra',              level: 3, region: 'Nationell' },
  { id: 20400, name: 'Hockeyettan Södra',              level: 3, region: 'Nationell' },
  { id: 19817, name: 'Hockeyettan Slutspel Norra',     level: 3, region: 'Nationell' },
  { id: 19818, name: 'Hockeyettan Slutspel Södra',     level: 3, region: 'Nationell' },
  { id: 19874, name: 'SDHL',                           level: 1, region: 'Dam' },
  { id: 19820, name: 'Hockeyallsvenskan Dam',           level: 2, region: 'Dam' },
  { id: 18818, name: 'HockeyTvåan Öst',               level: 4, region: 'Region Öst' },
  { id: 19861, name: 'HockeyTrean Öst A',             level: 5, region: 'Region Öst' },
  { id: 20300, name: 'HockeyTrean Öst B',             level: 5, region: 'Region Öst' },
  { id: 95410, name: 'HockeyFyran Stockholm A',        level: 6, region: 'Region Öst' },
  { id: 95411, name: 'HockeyFyran Stockholm B',        level: 6, region: 'Region Öst' },
  { id: 19268, name: 'HockeyFyran Stockholm A',        level: 6, region: 'Region Öst' },
  { id: 19269, name: 'HockeyFyran Stockholm B',        level: 6, region: 'Region Öst' },
  { id: 19270, name: 'HockeyFyran Stockholm C',        level: 6, region: 'Region Öst' },
  { id: 20056, name: 'HockeyFyran Stockholm Topp 6',   level: 6, region: 'Region Öst' },
  { id: 20059, name: 'HockeyFyran Stockholm Forts. A', level: 6, region: 'Region Öst' },
  { id: 20060, name: 'HockeyFyran Stockholm Forts. B', level: 6, region: 'Region Öst' },
  { id: 20057, name: 'HockeyFyran Stockholm Playoff',  level: 6, region: 'Region Öst' },
  { id: 20058, name: 'Kvalserie till HockeyTrean A',   level: 6, region: 'Region Öst' },
  { id: 20061, name: 'Kvalserie till HockeyTrean B',   level: 6, region: 'Region Öst' },
  { id: 19223, name: 'HockeyFyran Uppland',            level: 6, region: 'Region Öst' },
  { id: 20062, name: 'HockeyFyran Uppland Forts.',     level: 6, region: 'Region Öst' },
  { id: 19331, name: 'Hockeyfemman Stockholm Norra',   level: 7, region: 'Region Öst' },
  { id: 20063, name: 'Hockeyfemman Stockholm Södra',   level: 7, region: 'Region Öst' },
  { id: 18446, name: 'Uppland',                        level: 7, region: 'Region Öst' },
  { id: 18921, name: 'Södermanland',                   level: 7, region: 'Region Öst' },
  { id: 19191, name: 'Gotland',                        level: 7, region: 'Region Öst' },
  { id: 18565, name: 'HockeyTvåan Norr',              level: 4, region: 'Region Norr' },
  { id: 18571, name: 'HockeyTrean Norr',              level: 5, region: 'Region Norr' },
  { id: 19070, name: 'Jämtl. Härjedalen',             level: 6, region: 'Region Norr' },
  { id: 18867, name: 'Medelpad',                      level: 6, region: 'Region Norr' },
  { id: 18909, name: 'Norrbotten',                    level: 6, region: 'Region Norr' },
  { id: 18762, name: 'Västerbotten',                  level: 6, region: 'Region Norr' },
  { id: 20293, name: 'Ångermanland',                  level: 6, region: 'Region Norr' },
  { id: 20285, name: 'HockeyTvåan Väst',              level: 4, region: 'Region Väst' },
  { id: 20351, name: 'HockeyTrean Väst',              level: 5, region: 'Region Väst' },
  { id: 20310, name: 'Dalarna',                       level: 6, region: 'Region Väst' },
  { id: 19485, name: 'Gästrikland',                   level: 6, region: 'Region Väst' },
  { id: 19098, name: 'Hälsingland',                   level: 6, region: 'Region Väst' },
  { id: 18412, name: 'Värmland',                      level: 6, region: 'Region Väst' },
  { id: 20144, name: 'Västmanland',                   level: 6, region: 'Region Väst' },
  { id: 19305, name: 'Örebro',                        level: 6, region: 'Region Väst' },
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

(function() {
  const seen = new Set();
  KNOWN_GROUPS = KNOWN_GROUPS.filter(g => { if (seen.has(g.id)) return false; seen.add(g.id); return true; });
})();

// ── Dynamisk scraping ───────────────────────────────────────────────────────
const SKIP_KEYWORDS = [
  'u8','u9','u10','u11','u12','u13','u14','u15','u16','u17','u18','u19','u20',
  'junior','preseason','pre-season','camp','landskamp','paraishockey',
  'rekreation','tv-puck','kval u20','sm-kval','sm-slutspel u','universite',
  'referee','historical','folkets','halloffame','u 20','u 18','u 16','cup','tournament'
];
function shouldSkip(n) { const l=n.toLowerCase(); return SKIP_KEYWORDS.some(k=>l.includes(k)); }
function inferLevel(n) {
  const l=n.toLowerCase();
  if(l.includes('sdhl')||l.includes('shl')) return 1;
  if(l.includes('allsvenskan')) return 2;
  if(l.includes('hockeyettan')||l.includes('hockey ettan')) return 3;
  if(l.includes('tvåan')) return 4;
  if(l.includes('trean')) return 5;
  if(l.includes('fyran')||l.includes('forts')||l.includes('topp')||l.includes('kval')) return 6;
  return 7;
}
function inferRegion(n) {
  const l=n.toLowerCase();
  if(l.includes('dam')||l.includes('sdhl')) return 'Dam';
  if(l.includes('norr')||l.includes('norrbotten')||l.includes('västerbotten')||
     l.includes('ångermanland')||l.includes('medelpad')||l.includes('jämtl')||
     l.includes('härjedalen')) return 'Region Norr';
  if(l.includes('dalarna')||l.includes('gästrikland')||l.includes('hälsingland')||
     l.includes('värmland')||l.includes('västmanland')||l.includes('örebro')) return 'Region Väst';
  if(l.includes('blekinge')||l.includes('bohuslän')||l.includes('göteborg')||
     l.includes('skåne')||l.includes('småland')||l.includes('västergötland')||
     l.includes('östergötland')||l.includes('syd')) return 'Region Syd';
  if(l.includes('stockholm')||l.includes('uppland')||l.includes('södermanland')||
     l.includes('gotland')||l.includes('öst')) return 'Region Öst';
  if(l.includes('väst')) return 'Region Väst';
  return 'Nationell';
}

let groupsLastFetched = 0;
async function fetchAllGroups() {
  if (Date.now() - groupsLastFetched < TTL6H) return KNOWN_GROUPS;
  try {
    console.log('🔍 Scraping swehockey.se...');
    const seen = new Set(KNOWN_GROUPS.map(g => g.id));
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
        if (!name || name.length < 3 || shouldSkip(name)) return;
        newGroups.push({ id, name, level: inferLevel(name), region: inferRegion(name) });
      });
    }
    const PAGES = ['/','/ScheduleAndResults/Overview/18263','/ScheduleAndResults/Overview/18818',
      '/ScheduleAndResults/Overview/18565','/ScheduleAndResults/Overview/20285',
      '/ScheduleAndResults/Overview/20443','/ScheduleAndResults/Overview/95410',
      '/ScheduleAndResults/Overview/19270','/ScheduleAndResults/Overview/19874'];
    await Promise.allSettled(PAGES.map(async (p) => { try { extractFrom(await get(p)); } catch(_){} }));
    if (newGroups.length > 0) {
      KNOWN_GROUPS = [...KNOWN_GROUPS, ...newGroups];
      console.log(`✅ +${newGroups.length} nya serier. Totalt: ${KNOWN_GROUPS.length}`);
    }
    groupsLastFetched = Date.now();
  } catch(e) {
    console.error('❌ Scraping misslyckades:', e.message);
    groupsLastFetched = Date.now();
  }
  return KNOWN_GROUPS;
}
fetchAllGroups();

// ── Parsers ─────────────────────────────────────────────────────────────────

// Parsar tabellkolumner dynamiskt baserat på th-rubriker
// Swehockey-format: RK, Team, GP, W, T, L, GF:GA (GD), TP, OTW, OTL, GWSW, GWSL
function parseStandings(html) {
  const $ = cheerio.load(html);
  const groups = [];
  let currentGroup = { groupName: '', teams: [] };

  $('h2,h3,h4,table').each((i, el) => {
    const tag = el.name.toLowerCase();
    if (tag !== 'table') {
      const title = $(el).text().trim();
      if (title && title.length > 1) {
        if (currentGroup.teams.length > 0) groups.push(currentGroup);
        currentGroup = { groupName: title, teams: [] };
      }
      return;
    }

    // Läs kolumnrubriker från th-raden
    const headers = [];
    $(el).find('thead tr th, tr th').first().parent().find('th').each((j, th) => {
      headers.push($(th).text().trim().toLowerCase());
    });
    // Fallback: kolla första tr med td om ingen thead
    if (headers.length === 0) {
      $(el).find('tr').first().find('td').each((j, td) => {
        headers.push($(td).text().trim().toLowerCase());
      });
    }

    // Bygg kolumnindex-map
    const idx = {
      pos:  headers.findIndex(h => h === 'rk' || h === '#' || h === 'plats'),
      name: headers.findIndex(h => h === 'team' || h === 'lag' || h === 'name'),
      gp:   headers.findIndex(h => h === 'gp' || h === 'm' || h === 'gm'),
      w:    headers.findIndex(h => h === 'w' || h === 'v'),
      t:    headers.findIndex(h => h === 't'),
      l:    headers.findIndex(h => h === 'l' || h === 'f'),
      gfga: headers.findIndex(h => h.includes('gf') || h.includes('gm') && h.includes('gi')),
      tp:   headers.findIndex(h => h === 'tp'),
      otw:  headers.findIndex(h => h === 'otw'),
      otl:  headers.findIndex(h => h === 'otl'),
      gwsw: headers.findIndex(h => h === 'gwsw'),
      gwsl: headers.findIndex(h => h === 'gwsl'),
    };

    $(el).find('tr').each((j, row) => {
      const cells = $(row).find('td');
      if (cells.length < 5) return;

      const getText = (colIdx) => colIdx >= 0 && colIdx < cells.length
        ? $(cells[colIdx]).text().trim() : '';

      // Försök med header-baserat index, annars positionsbaserat
      const posText = idx.pos >= 0 ? getText(idx.pos) : $(cells[0]).text().trim();
      const pos = parseInt(posText);
      if (isNaN(pos)) return;

      const nameCell = idx.name >= 0 ? $(cells[idx.name]) : $(cells[1]);
      const nameLink = nameCell.find('a').first();
      const name = (nameLink.length ? nameLink.text() : nameCell.text()).trim();
      if (!name) return;

      // Samla alla celltexter (kolumn 2+) för fallback-parsning
      const allTexts = [];
      cells.each((k, cell) => { if (k >= 2) allTexts.push($(cell).text().trim()); });

      // TP — leta explicit kolumn, annars sista kolumnen
      const tp = idx.tp >= 0 ? (parseInt(getText(idx.tp)) || 0)
                              : (parseInt(allTexts[allTexts.length - 1]) || 0);

      const gp = idx.gp >= 0 ? (parseInt(getText(idx.gp)) || 0) : (parseInt(allTexts[0]) || 0);
      const w  = idx.w  >= 0 ? (parseInt(getText(idx.w))  || 0) : (parseInt(allTexts[1]) || 0);
      const t  = idx.t  >= 0 ? (parseInt(getText(idx.t))  || 0) : (parseInt(allTexts[2]) || 0);
      const l  = idx.l  >= 0 ? (parseInt(getText(idx.l))  || 0) : (parseInt(allTexts[3]) || 0);

      // GF:GA — leta cell med kolon-format "66:38 (28)" eller "66:38"
      let gf = 0, ga = 0, gd = 0;
      for (const txt of allTexts) {
        const m = txt.match(/(\d+)[:\s]+(\d+)(?:\s*\(([+-]?\d+)\))?/);
        if (m && parseInt(m[1]) > 0) {
          gf = parseInt(m[1]); ga = parseInt(m[2]);
          gd = m[3] ? parseInt(m[3]) : gf - ga;
          break;
        }
      }

      const otw  = idx.otw  >= 0 ? (parseInt(getText(idx.otw))  || 0) : 0;
      const otl  = idx.otl  >= 0 ? (parseInt(getText(idx.otl))  || 0) : 0;
      const gwsw = idx.gwsw >= 0 ? (parseInt(getText(idx.gwsw)) || 0) : 0;
      const gwsl = idx.gwsl >= 0 ? (parseInt(getText(idx.gwsl)) || 0) : 0;

      currentGroup.teams.push({ pos, name, gp, w, t, l, gf, ga, gd, tp, otw, otl, gwsw, gwsl });
    });
  });

  if (currentGroup.teams.length > 0) groups.push(currentGroup);
  if (groups.length === 0) return [{ groupName: '', teams: [] }];
  return groups;
}

// Parsar Results/schema — med periodresultat
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

    // Huvudresultat: "8 - 3" eller "8-3"
    const scoreMatch = scoreText.match(/(\d+)\s*[-–]\s*(\d+)/);
    const played = !!scoreMatch;
    const scoreHome = played ? parseInt(scoreMatch[1]) : null;
    const scoreAway = played ? parseInt(scoreMatch[2]) : null;
    const overtime  = scoreText.includes('OT') || scoreText.includes('SO');
    const shootout  = scoreText.includes('SO');

    // Periodresultat: "(3-1, 2-1, 3-1)" i cell 5+ eller i score-cellen
    let periods = [];
    const periodSource = cells.length > 5 ? $(cells[5]).text().trim() : scoreText;
    const periodMatch = periodSource.match(/\(([^)]+)\)/);
    if (periodMatch) {
      periods = periodMatch[1].split(',').map(s => {
        const m = s.trim().match(/(\d+)[–-](\d+)/);
        return m ? { home: parseInt(m[1]), away: parseInt(m[2]) } : null;
      }).filter(Boolean);
    }

    // Venue — cell 6 om det finns
    const venue = cells.length > 6 ? $(cells[6]).text().trim() : '';
    // Spectators — cell 5 om 7+ kolumner
    const spectators = cells.length > 7 ? parseInt($(cells[5]).text().trim()) || null : null;

    const gameLink = $(cells[3]).find('a').attr('href') || $(row).find('a').attr('href') || '';
    const gameIdM  = gameLink.match(/\/(\d+)$/);

    games.push({
      date: dateText.replace(/\s+/,' ').trim(), time: timeText,
      home: homeText.replace(/\s+/,' ').trim(), away: awayText.replace(/\s+/,' ').trim(),
      scoreHome, scoreAway, played, overtime, shootout, periods,
      spectators, venue,
      gameId: gameIdM ? gameIdM[1] : null, raw: scoreText
    });
  });
  return games;
}

// Parsar spelarstatistik — /Statistics/Players/groupId
function parsePlayerStats(html) {
  const $ = cheerio.load(html);
  const players = [];

  // Läs kolumnrubriker
  const headers = [];
  $('table thead tr th, table tr th').first().parent().find('th').each((j, th) => {
    headers.push($(th).text().trim().toLowerCase());
  });

  $('table tr').each((i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 5) return;
    const pos = parseInt($(cells[0]).text().trim());
    if (isNaN(pos)) return;

    const nameCell = $(cells[1]);
    const name = nameCell.find('a').first().text().trim() || nameCell.text().trim();
    if (!name) return;

    const teamCell = $(cells[2]);
    const team = teamCell.text().trim();

    const allTexts = [];
    cells.each((k, c) => allTexts.push($(c).text().trim()));

    // Vanliga kolumnnamn: #, Player, Team, GP, G, A, TP, PIM, +/-, PPG, SHG, GWG
    const idx = {
      gp:  headers.findIndex(h => h === 'gp'),
      g:   headers.findIndex(h => h === 'g' || h === 'goals'),
      a:   headers.findIndex(h => h === 'a' || h === 'assists'),
      tp:  headers.findIndex(h => h === 'tp' || h === 'pts'),
      pim: headers.findIndex(h => h === 'pim'),
      pm:  headers.findIndex(h => h === '+/-'),
      ppg: headers.findIndex(h => h === 'ppg'),
      shg: headers.findIndex(h => h === 'shg'),
      gwg: headers.findIndex(h => h === 'gwg'),
    };

    const g = (c, fb) => c >= 0 ? (parseInt(allTexts[c]) || 0) : fb;
    players.push({
      pos,
      name,
      team,
      gp:  g(idx.gp,  parseInt(allTexts[3]) || 0),
      g:   g(idx.g,   parseInt(allTexts[4]) || 0),
      a:   g(idx.a,   parseInt(allTexts[5]) || 0),
      tp:  g(idx.tp,  parseInt(allTexts[6]) || 0),
      pim: g(idx.pim, parseInt(allTexts[7]) || 0),
      pm:  idx.pm >= 0 ? (parseInt(allTexts[idx.pm]) || 0) : 0,
      ppg: g(idx.ppg, 0),
      shg: g(idx.shg, 0),
      gwg: g(idx.gwg, 0),
    });
  });
  return players;
}

// Parsar lagstatistik — /Statistics/Teams/groupId
function parseTeamStats(html) {
  const $ = cheerio.load(html);
  const teams = [];

  const headers = [];
  $('table thead tr th, table tr th').first().parent().find('th').each((j, th) => {
    headers.push($(th).text().trim().toLowerCase());
  });

  $('table tr').each((i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 4) return;
    const pos = parseInt($(cells[0]).text().trim());
    if (isNaN(pos)) return;
    const nameCell = $(cells[1]);
    const name = nameCell.find('a').first().text().trim() || nameCell.text().trim();
    if (!name) return;

    const allTexts = [];
    cells.each((k, c) => allTexts.push($(c).text().trim()));

    teams.push({
      pos,
      name,
      // Vanliga lagstat-kolumner: GP, G, A, TP, PIM, PPG, PPGA, SHG, SHGA, GWG, hits, fo%
      gp:   parseInt(allTexts[2]) || 0,
      g:    parseInt(allTexts[3]) || 0,
      a:    parseInt(allTexts[4]) || 0,
      tp:   parseInt(allTexts[5]) || 0,
      pim:  parseInt(allTexts[6]) || 0,
      ppg:  parseInt(allTexts[7]) || 0,
      ppga: parseInt(allTexts[8]) || 0,
      shg:  parseInt(allTexts[9]) || 0,
      shga: parseInt(allTexts[10]) || 0,
      gwg:  parseInt(allTexts[11]) || 0,
      raw: allTexts,
    });
  });
  return teams;
}

// ── Routes ──────────────────────────────────────────────────────────────────

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

// Spelarstatistik för en serie
app.get('/api/players/:groupId', async (req, res) => {
  try {
    const data = await cached(`players:${req.params.groupId}`, TTL5, async () =>
      parsePlayerStats(await get(`/Statistics/Players/${req.params.groupId}`))
    );
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Lagstatistik för en serie
app.get('/api/teamstats/:groupId', async (req, res) => {
  try {
    const data = await cached(`teamstats:${req.params.groupId}`, TTL5, async () =>
      parseTeamStats(await get(`/Statistics/Teams/${req.params.groupId}`))
    );
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Debug — dumpa råhtmlen för ett path (för felsökning av parsers)
app.get('/api/debug-html', async (req, res) => {
  const p = req.query.path;
  if (!p || !p.startsWith('/')) return res.status(400).json({ error: 'bad path' });
  try {
    const html = await get(p);
    const $ = cheerio.load(html);
    // Returnera: alla th-rubriker + första 3 datarader per tabell
    const tables = [];
    $('table').each((i, tbl) => {
      const headers = [];
      $(tbl).find('th').each((j, th) => headers.push($(th).text().trim()));
      const rows = [];
      $(tbl).find('tr').slice(0,5).each((j, row) => {
        const cells = [];
        $(row).find('td').each((k, td) => cells.push($(td).text().trim()));
        if (cells.length) rows.push(cells);
      });
      if (headers.length || rows.length) tables.push({ headers, rows });
    });
    res.json({ path: p, tables });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ teams: [], leagues: [] });
  const groups  = await fetchAllGroups();
  const leagues = groups.filter(g => g.name.toLowerCase().includes(q));
  const teamResults = [];
  await Promise.allSettled(groups.map(async (group) => {
    try {
      const standingGroups = await cached(`standings:${group.id}`, TTL30, async () =>
        parseStandings(await get(`/ScheduleAndResults/Standings/${group.id}`))
      );
      standingGroups.flatMap(g => g.teams).forEach(t => {
        if (t.name.toLowerCase().includes(q)) teamResults.push({ ...t, league: group });
      });
    } catch (_) {}
  }));
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
