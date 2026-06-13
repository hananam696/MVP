// ─── Types ────────────────────────────────────────────────────────────────────

export type Goal = 'viewers' | 'sponsors' | 'applicants';

export type ContentType =
  | 'food' | 'travel' | 'education' | 'recruitment'
  | 'startup' | 'entertainment' | 'healthcare' | 'fashion'
  | 'tech' | 'finance' | 'general';

export interface Platform {
  id: string; name: string; score: number; confidence: number;
  reach: number; bestDay: string; bestTime: string; reachQuality: number;
}
export interface AudienceSegment { label: string; percent: number; goal: Goal; color: string; }
export interface GeoRegion { region: string; reach: number; level: 'high' | 'medium' | 'low'; lat: number; lng: number; }
export interface Gap { id: string; icon: string; problem: string; action: string; potentialGain: number; }
export interface GrowthCard { icon: string; iconBg: string; title: string; reason: string; action: string; gain: string; }
export interface InsightMetricData { label: string; title: string; value: string; unit: string; }
export interface ExpectedImpactCard {
  label: string; before: string; after: string; gainPct: string;
  beforeNum: number; afterNum: number; maxVal: number;
}

export interface AnalysisResult {
  id: string; goal: Goal; contentType: ContentType;
  platforms: Platform[]; audienceFit: AudienceSegment[];
  geographicReach: GeoRegion[]; gaps: Gap[];
  missedAudiences: GrowthCard[]; missedRegions: GrowthCard[];
  languageGaps: GrowthCard[]; growthOpportunities: GrowthCard[];
  insightMetrics: InsightMetricData[];
  aiSummary: string; aiTags: string[];
  nextActions: Array<{ action: string; priority: 'High' | 'Mid' }>;
  expectedImpact: ExpectedImpactCard[];
  beforeAfter: { score: [number, number]; reach: [number, number]; topRegion: [number, number]; };
}

// ─── Seeded randomness ────────────────────────────────────────────────────────

function seed(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function sr(base: number, off: number): number {
  const h = Math.abs(Math.imul(base + off * 2654435761, 0x9e3779b9) ^ (base >>> 16));
  return (h >>> 0) / 0x100000000;
}
function si(base: number, off: number, min: number, max: number): number {
  return min + Math.floor(sr(base, off) * (max - min + 1));
}

// ─── Content type detection ───────────────────────────────────────────────────

const TYPE_KEYWORDS: Record<ContentType, string[]> = {
  food:          ['food','recipe','cook','eat','meal','dish','restaurant','chef','taste','delicious','cuisine','flavor','ingredient','menu','dining','bake','grill','breakfast','lunch','dinner','dessert','coffee','spice'],
  travel:        ['travel','destination','trip','explore','adventure','hotel','flight','tour','visit','journey','beach','mountain','country','passport','vacation','holiday','resort','cruise','island','abroad','wanderlust'],
  education:     ['learn','course','tutorial','study','knowledge','skill','training','teach','lesson','education','workshop','certificate','degree','university','school','student','academic','exam','mentor','bootcamp'],
  recruitment:   ['hiring','job','career','apply','opportunity','team','role','position','candidate','recruit','vacancy','talent','hr','interview','resume','cv','employee','employer','salary','remote','onsite','internship'],
  startup:       ['startup','founder','product','launch','scale','funding','investor','venture','raise','series','pitch','mvp','traction','saas','b2b','bootstrapped','runway','churn','product-market fit'],
  entertainment: ['music','show','performance','art','concert','film','movie','comedy','dance','festival','entertainment','singer','band','tour','ticket','stream','podcast','actor','artist','creative','stage'],
  healthcare:    ['health','fitness','wellness','medical','doctor','mental','gym','workout','diet','nutrition','therapy','medicine','hospital','clinic','patient','symptom','recovery','exercise','yoga','meditation'],
  fashion:       ['fashion','style','outfit','clothes','wear','brand','design','clothing','collection','trend','accessory','shoes','bag','luxury','streetwear','sustainable','fabric','model','lookbook'],
  tech:          ['tech','software','ai','digital','code','developer','platform','app','saas','api','data','cloud','automation','algorithm','engineering','devops','cybersecurity','ux','ui','blockchain','machine learning'],
  finance:       ['finance','invest','money','economy','crypto','trading','stock','wealth','budget','savings','financial','fund','portfolio','asset','loan','banking','payment','revenue','profit','market'],
  general:       [],
};

function detectContentType(text: string): ContentType {
  const lower = text.toLowerCase();
  let best: ContentType = 'general';
  let bestScore = 2;
  for (const [t, kws] of Object.entries(TYPE_KEYWORDS) as [ContentType, string[]][]) {
    if (t === 'general') continue;
    const score = kws.filter(w => lower.includes(w)).length;
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return best;
}

// ─── Content quality ──────────────────────────────────────────────────────────

interface Quality {
  words: number; hasQuestion: boolean; emojiCount: number;
  hasHashtags: boolean; hasCTA: boolean; hasArabic: boolean;
  hasStats: boolean; hookScore: number; overallScore: number;
}

function analyzeQuality(text: string): Quality {
  const words = text.trim().split(/\s+/).length;
  const hasQuestion = text.includes('?');
  const emojiCount = (text.match(/\p{Emoji_Presentation}/gu) || []).length;
  const hasHashtags = text.includes('#');
  const hasCTA = /apply|link in bio|follow|subscribe|dm|contact|register|join|get started|sign up|check out|book|download|watch|click/i.test(text);
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  const hasStats = /%|\d+x|\d+k|\d+m|\d+ times|\d+ years|\d+ users/i.test(text);
  const firstLine = text.split(/[.!?\n]/)[0].trim();
  const hookScore = (firstLine.length < 80 ? 1 : 0) + (hasQuestion ? 1 : 0) + (emojiCount > 0 ? 1 : 0);
  const overallScore = Math.min(10,
    hookScore + (hasCTA ? 2 : 0) + (hasStats ? 2 : 0) + (hasHashtags ? 1 : 0) +
    (words > 20 && words < 200 ? 1 : 0) + (hasArabic ? 1 : 0)
  );
  return { words, hasQuestion, emojiCount, hasHashtags, hasCTA, hasArabic, hasStats, hookScore, overallScore };
}

// ─── Platform scoring ─────────────────────────────────────────────────────────

const TYPE_BOOST: Record<ContentType, Record<string, number>> = {
  food:          { instagram: 30, tiktok: 25, youtube: 14, linkedin: -8,  x:  5 },
  travel:        { instagram: 28, tiktok: 20, youtube: 22, linkedin: -5,  x: 10 },
  education:     { youtube: 30,  linkedin: 24, tiktok: 12, instagram:  5, x:  8 },
  recruitment:   { linkedin: 35, youtube: 10, instagram: -5, tiktok: -12, x:  8 },
  startup:       { linkedin: 28, x: 22,       youtube: 14, instagram:  4, tiktok: -5 },
  entertainment: { tiktok: 35,   instagram: 28, youtube: 22, x: 10,      linkedin: -10 },
  healthcare:    { instagram: 20, youtube: 24, linkedin: 14, tiktok: 18,  x:  5 },
  fashion:       { instagram: 35, tiktok: 30, youtube:  8, linkedin: -10, x:  7 },
  tech:          { linkedin: 28, x: 24,       youtube: 18, instagram:  0, tiktok: -5 },
  finance:       { linkedin: 30, x: 22,       youtube: 18, instagram: -5, tiktok: -10 },
  general:       { instagram: 8, tiktok: 8,   youtube:  8, linkedin:  8,  x:  8 },
};

const GOAL_BOOST: Record<Goal, Record<string, number>> = {
  viewers:    { instagram: 14, tiktok: 14, youtube: 10, linkedin: -5, x:  5 },
  sponsors:   { linkedin: 18, youtube:  8, instagram:  5, tiktok: -5, x:  8 },
  applicants: { linkedin: 20, youtube:  8, instagram:  0, tiktok: -8, x:  5 },
};

function qBoost(q: Quality, pid: string): number {
  let b = 0;
  if (q.hasQuestion && ['instagram','tiktok','x'].includes(pid)) b += 3;
  if (q.hasCTA) b += 2;
  if (q.hasStats && ['linkedin','x'].includes(pid)) b += 4;
  if (q.emojiCount > 0 && pid !== 'linkedin') b += 2;
  if (q.words < 30 && ['tiktok','x'].includes(pid)) b += 4;
  if (q.words > 100 && ['linkedin','youtube'].includes(pid)) b += 4;
  if (q.overallScore >= 8) b += 4;
  return b;
}

// ─── Timing ───────────────────────────────────────────────────────────────────

const TYPE_DAYS: Record<ContentType, string[]> = {
  food:          ['Friday','Sunday','Wednesday','Saturday','Monday'],
  travel:        ['Monday','Thursday','Sunday','Saturday','Tuesday'],
  education:     ['Tuesday','Wednesday','Thursday','Monday','Friday'],
  recruitment:   ['Monday','Tuesday','Wednesday','Thursday','Sunday'],
  startup:       ['Tuesday','Wednesday','Thursday','Monday','Friday'],
  entertainment: ['Friday','Saturday','Thursday','Sunday','Wednesday'],
  healthcare:    ['Monday','Wednesday','Thursday','Tuesday','Saturday'],
  fashion:       ['Thursday','Friday','Tuesday','Saturday','Sunday'],
  tech:          ['Tuesday','Wednesday','Thursday','Monday','Friday'],
  finance:       ['Monday','Tuesday','Wednesday','Thursday','Friday'],
  general:       ['Tuesday','Wednesday','Thursday','Monday','Friday'],
};

const TYPE_TIMES: Record<ContentType, string[]> = {
  food:          ['12:00 PM','6:00 PM','8:00 PM','9:00 AM','7:00 PM'],
  travel:        ['8:00 PM','9:00 PM','7:00 PM','10:00 AM','6:00 PM'],
  education:     ['7:00 PM','8:00 PM','9:00 AM','6:00 PM','10:00 AM'],
  recruitment:   ['8:00 AM','9:00 AM','10:00 AM','7:00 PM','11:00 AM'],
  startup:       ['9:00 AM','10:00 AM','7:00 PM','8:00 AM','6:00 PM'],
  entertainment: ['9:00 PM','8:00 PM','10:00 PM','7:00 PM','11:00 PM'],
  healthcare:    ['7:00 AM','8:00 AM','6:00 PM','9:00 AM','5:00 PM'],
  fashion:       ['1:00 PM','7:00 PM','8:00 PM','12:00 PM','9:00 AM'],
  tech:          ['9:00 AM','10:00 AM','2:00 PM','7:00 PM','11:00 AM'],
  finance:       ['8:00 AM','9:00 AM','12:00 PM','5:00 PM','7:00 PM'],
  general:       ['9:00 AM','12:00 PM','5:00 PM','7:00 PM','8:00 PM'],
};

// ─── Geographic regions ───────────────────────────────────────────────────────

const ALL_REGIONS = [
  { region: 'Saudi Arabia',  lat: 24.7, lng:  46.7 },
  { region: 'UAE',           lat: 25.2, lng:  55.3 },
  { region: 'Egypt',         lat: 30.1, lng:  31.2 },
  { region: 'Morocco',       lat: 33.9, lng:  -6.9 },
  { region: 'USA',           lat: 37.1, lng: -95.7 },
  { region: 'UK',            lat: 51.5, lng:  -0.1 },
  { region: 'Germany',       lat: 51.2, lng:  10.4 },
  { region: 'France',        lat: 46.2, lng:   2.2 },
  { region: 'India',         lat: 20.6, lng:  78.9 },
  { region: 'Pakistan',      lat: 30.4, lng:  69.3 },
  { region: 'Indonesia',     lat: -0.8, lng: 113.9 },
  { region: 'Turkey',        lat: 38.9, lng:  35.2 },
  { region: 'Nigeria',       lat:  9.1, lng:   8.7 },
  { region: 'Canada',        lat: 56.1, lng: -106.3 },
  { region: 'Australia',     lat: -25.3,lng: 133.8 },
  { region: 'Brazil',        lat: -14.2,lng: -51.9 },
  { region: 'Spain',         lat: 40.5, lng:  -3.7 },
  { region: 'South Africa',  lat: -30.6,lng:  22.9 },
  { region: 'Malaysia',      lat:  4.2, lng: 108.0 },
  { region: 'Jordan',        lat: 31.0, lng:  36.0 },
];

const TYPE_REGION_BASE: Record<ContentType, Record<string, number>> = {
  food:          { 'Saudi Arabia':88,'UAE':82,'Egypt':78,'Morocco':68,'India':62,'Turkey':58,'UK':44,'USA':40,'France':42,'Indonesia':38 },
  travel:        { 'USA':84,'UK':80,'Germany':76,'France':74,'Australia':72,'Canada':66,'UAE':62,'India':50,'Brazil':46,'Spain':44 },
  education:     { 'India':86,'Pakistan':78,'Egypt':74,'Saudi Arabia':68,'USA':62,'Nigeria':58,'UK':52,'Indonesia':48,'Morocco':44,'Malaysia':40 },
  recruitment:   { 'India':88,'Egypt':82,'Saudi Arabia':76,'UAE':72,'USA':62,'UK':55,'Pakistan':50,'Jordan':46,'Morocco':42,'Nigeria':38 },
  startup:       { 'USA':90,'UK':84,'Germany':78,'UAE':72,'India':65,'Canada':60,'France':56,'Australia':50,'Jordan':42,'Saudi Arabia':38 },
  entertainment: { 'Saudi Arabia':86,'Egypt':82,'UAE':78,'Morocco':72,'USA':66,'Nigeria':60,'UK':55,'Indonesia':52,'Turkey':48,'Brazil':45 },
  healthcare:    { 'USA':86,'UK':80,'Germany':74,'Australia':68,'Canada':64,'UAE':58,'Saudi Arabia':52,'India':48,'France':46,'Egypt':40 },
  fashion:       { 'UAE':88,'Saudi Arabia':82,'Egypt':76,'France':74,'UK':68,'USA':65,'Morocco':60,'Turkey':52,'Lebanon':48,'Germany':42 },
  tech:          { 'USA':92,'India':84,'Germany':78,'UK':75,'Canada':70,'UAE':66,'France':58,'Australia':55,'Nigeria':45,'Brazil':42 },
  finance:       { 'USA':90,'UK':86,'Germany':80,'UAE':76,'Saudi Arabia':70,'France':62,'Canada':58,'Australia':55,'India':48,'Egypt':38 },
  general:       { 'USA':70,'UK':65,'India':62,'UAE':58,'Saudi Arabia':55,'Germany':52,'Egypt':48,'Nigeria':44,'Morocco':40,'France':38 },
};

const GOAL_GEO_MULT: Record<Goal, Partial<Record<string, number>>> = {
  viewers:    { 'Saudi Arabia':1.1,'Egypt':1.1,'UAE':1.05,'Morocco':1.12,'Nigeria':1.1,'Indonesia':1.1,'Turkey':1.05 },
  sponsors:   { 'USA':1.1,'UK':1.1,'Germany':1.1,'UAE':1.15,'Saudi Arabia':1.05,'France':1.05,'Canada':1.05,'Australia':1.05 },
  applicants: { 'India':1.15,'Egypt':1.1,'Pakistan':1.1,'Saudi Arabia':1.05,'Morocco':1.1,'Jordan':1.12,'Nigeria':1.05 },
};

function buildGeoRegions(type: ContentType, goal: Goal, s: number, hasArabic: boolean): GeoRegion[] {
  const typeW = TYPE_REGION_BASE[type] ?? TYPE_REGION_BASE.general;
  const goalM = GOAL_GEO_MULT[goal];
  const scored = ALL_REGIONS.map((rd, idx) => {
    let reach = typeW[rd.region] ?? (28 + si(s, idx * 3 + 100, 0, 18));
    if (goalM[rd.region]) reach = Math.round(reach * goalM[rd.region]!);
    if (hasArabic) {
      const mena = ['Saudi Arabia','UAE','Egypt','Morocco','Jordan','Turkey'];
      if (mena.includes(rd.region)) reach = Math.min(95, Math.round(reach * 1.14));
    }
    reach = Math.min(95, Math.max(14, reach + si(s, idx * 7 + 200, -4, 4)));
    return { ...rd, reach };
  }).sort((a, b) => b.reach - a.reach);
  return scored.slice(0, 8).map(r => ({
    region: r.region, reach: r.reach, lat: r.lat, lng: r.lng,
    level: r.reach >= 68 ? 'high' : r.reach >= 42 ? 'medium' : 'low',
  }));
}

// ─── Gap pools ────────────────────────────────────────────────────────────────

type GapMap = Record<ContentType, Partial<Record<Goal, Gap[]>>>;

const GAP_POOLS: GapMap = {
  food: {
    viewers:    [{ id:'g1',icon:'🎬',problem:'No short cooking video',action:'Cut a 30-sec plating or cooking clip',potentialGain:36 },{ id:'g2',icon:'🌍',problem:'MENA audience not reached',action:'Post the recipe in Arabic with local spice variants',potentialGain:30 },{ id:'g3',icon:'❓',problem:'Caption lacks a hook question',action:'Open with "Have you tried this twist on a classic?"',potentialGain:26 }],
    sponsors:   [{ id:'g1',icon:'💼',problem:'No brand integration signal',action:'Name the hero ingredient or kitchen tool brand',potentialGain:34 },{ id:'g2',icon:'📊',problem:'Missing audience save rate data',action:'Share your average recipe saves per post',potentialGain:28 },{ id:'g3',icon:'🏷️',problem:'No collab CTA visible',action:'Add "Open to brand collaborations → DM" to bio',potentialGain:24 }],
    applicants: [{ id:'g1',icon:'🧑‍🍳',problem:'Team culture not shown',action:'Film a 60-sec behind-the-scenes kitchen clip',potentialGain:40 },{ id:'g2',icon:'📋',problem:'Role details buried in post',action:'Add a 3-bullet summary of what the role involves',potentialGain:28 },{ id:'g3',icon:'🔗',problem:'No direct application link',action:'Add application link in post body, not just bio',potentialGain:34 }],
  },
  travel: {
    viewers:    [{ id:'g1',icon:'📱',problem:'No vertical short-form clip',action:'Reframe as a 30-sec vertical Reel or TikTok',potentialGain:40 },{ id:'g2',icon:'❓',problem:'Caption opens with destination name',action:'Replace with an unexpected local insight or question',potentialGain:30 },{ id:'g3',icon:'📍',problem:'No geo-tag or location hashtag',action:'Tag the precise location to boost discovery reach',potentialGain:24 }],
    sponsors:   [{ id:'g1',icon:'🏨',problem:'Accommodation not named or tagged',action:'Name and tag the hotel or property you stayed at',potentialGain:36 },{ id:'g2',icon:'📊',problem:'No audience reach stats shown',action:'Add your follower count and average post reach',potentialGain:30 },{ id:'g3',icon:'🎯',problem:'Tourism board not tagged',action:'Tag the destination tourism board for cross-promo',potentialGain:26 }],
    applicants: [{ id:'g1',icon:'🌐',problem:'No remote or global hiring signal',action:'Add "Remote-first, hire globally" to the post',potentialGain:36 },{ id:'g2',icon:'🎒',problem:'No travel culture content',action:'Post a "Work from [destination]" team story',potentialGain:30 },{ id:'g3',icon:'🌍',problem:'International candidates excluded',action:'Translate key details to Spanish and French',potentialGain:26 }],
  },
  education: {
    viewers:    [{ id:'g1',icon:'❓',problem:'Opens with a statement, not curiosity',action:'Rewrite the first line as a question your audience already asks',potentialGain:40 },{ id:'g2',icon:'📱',problem:'No short learning clip',action:'Create a 60-sec key takeaway Reel from your best lesson',potentialGain:34 },{ id:'g3',icon:'🌍',problem:'No subtitles for global reach',action:'Add auto-captions and Arabic subtitle track',potentialGain:28 }],
    sponsors:   [{ id:'g1',icon:'📊',problem:'No learning outcome metric',action:'Add "X% of students improved within Y days" to the post',potentialGain:42 },{ id:'g2',icon:'💼',problem:'No corporate training angle',action:'Add "Team pricing available — contact us" CTA',potentialGain:36 },{ id:'g3',icon:'🏷️',problem:'No accreditation or partner tag',action:'Tag institutional partner or accreditation body',potentialGain:28 }],
    applicants: [{ id:'g1',icon:'🎓',problem:'No student success story',action:'Add a short alumni quote in the first 3 lines',potentialGain:40 },{ id:'g2',icon:'🔗',problem:'Enrollment CTA is at the bottom',action:'Move the application link to the second line',potentialGain:32 },{ id:'g3',icon:'🌏',problem:'South Asian audience not targeted',action:'Schedule the post at IST 8–10 AM on Tuesday',potentialGain:26 }],
  },
  recruitment: {
    viewers:    [{ id:'g1',icon:'🎬',problem:'No team culture video',action:'Post a 45-sec "day in the life" for your top role',potentialGain:42 },{ id:'g2',icon:'📱',problem:'Too text-heavy for social',action:'Design a visual job card instead of a text post',potentialGain:34 },{ id:'g3',icon:'❓',problem:'No engagement question',action:'End with "What does your ideal workplace look like?"',potentialGain:26 }],
    sponsors:   [{ id:'g1',icon:'📊',problem:'No talent pool data shared',action:'Share your applicant reach and quality metrics',potentialGain:34 },{ id:'g2',icon:'💼',problem:'No employer brand authority',action:'Link to Glassdoor rating in the first comment',potentialGain:28 },{ id:'g3',icon:'🏢',problem:'No HR brand partnership signal',action:'Add "Open to employer brand collaborations → DM"',potentialGain:24 }],
    applicants: [{ id:'g1',icon:'🚀',problem:'Benefits are listed at the bottom',action:'Lead the post with the strongest benefit, not the title',potentialGain:44 },{ id:'g2',icon:'🔗',problem:'No direct application link',action:'Add "Apply in 2 min → [link]" in the first 2 lines',potentialGain:40 },{ id:'g3',icon:'🌍',problem:'International candidates excluded',action:'Add "Open to remote / we support visa sponsorship"',potentialGain:34 }],
  },
  startup: {
    viewers:    [{ id:'g1',icon:'📊',problem:'No real metric in the post',action:'Share one number: users, revenue, or growth rate',potentialGain:40 },{ id:'g2',icon:'🎬',problem:'No product demo or walkthrough',action:'Post a 30-sec screen-share or product clip',potentialGain:38 },{ id:'g3',icon:'❓',problem:'No problem-solution framing',action:'Rewrite opening as a relatable problem in one sentence',potentialGain:30 }],
    sponsors:   [{ id:'g1',icon:'📊',problem:'No traction metric visible',action:'Add MRR, user count, or month-over-month growth',potentialGain:44 },{ id:'g2',icon:'💼',problem:'No investor-signal language',action:'Use "profitable" or "Series A–ready" framing if true',potentialGain:36 },{ id:'g3',icon:'🎯',problem:'No partnership or investment CTA',action:'Add "Interested in investing or partnering? DM us"',potentialGain:30 }],
    applicants: [{ id:'g1',icon:'🚀',problem:'Equity and ownership not mentioned',action:'Add "equity + real product ownership from day one"',potentialGain:40 },{ id:'g2',icon:'🎬',problem:'No founder or team energy visible',action:'Post a 30-sec founder intro clip with the open roles',potentialGain:34 },{ id:'g3',icon:'🌍',problem:'Only targeting local talent',action:'Add "100% remote — we hire globally" to the post',potentialGain:28 }],
  },
  entertainment: {
    viewers:    [{ id:'g1',icon:'📱',problem:'No vertical short-form clip',action:'Recut as a 15–30 sec vertical teaser Reel',potentialGain:44 },{ id:'g2',icon:'🌍',problem:'No Arabic subtitle track',action:'Add Arabic captions to reach 350M+ Arabic speakers',potentialGain:38 },{ id:'g3',icon:'❓',problem:'No audience interaction hook',action:'Add a poll or "pick a side" element to the post',potentialGain:30 }],
    sponsors:   [{ id:'g1',icon:'📊',problem:'No audience demographics shared',action:'Post your age, location, and gender breakdown stats',potentialGain:40 },{ id:'g2',icon:'💼',problem:'No branded integration slot offered',action:'Create a "branded moment" slot in your content format',potentialGain:34 },{ id:'g3',icon:'🎯',problem:'No sponsorship CTA visible',action:'Add "Partnership inquiries: DM or [email]" to bio',potentialGain:26 }],
    applicants: [{ id:'g1',icon:'🎬',problem:'No team culture or BTS content',action:'Post a behind-the-scenes production clip this week',potentialGain:36 },{ id:'g2',icon:'🔗',problem:'No talent or crew CTA',action:'Add "Casting and crew opportunities → DM us" to bio',potentialGain:30 },{ id:'g3',icon:'🌍',problem:'Talent pool is too narrow',action:'Post casting call in Arabic and English for wider reach',potentialGain:26 }],
  },
  tech: {
    viewers:    [{ id:'g1',icon:'🎬',problem:'No product demo or screen walkthrough',action:'Create a 60-sec screen-share demo clip',potentialGain:42 },{ id:'g2',icon:'❓',problem:'No engaging developer question',action:'Ask "What is the biggest pain point in your stack?"',potentialGain:34 },{ id:'g3',icon:'📊',problem:'No benchmark or before/after data',action:'Add a concrete performance stat in the opening line',potentialGain:28 }],
    sponsors:   [{ id:'g1',icon:'📊',problem:'No commercial traction metrics',action:'Add MRR, active users, or growth rate to the post',potentialGain:44 },{ id:'g2',icon:'💼',problem:'No enterprise use case mentioned',action:'Add one enterprise client quote or quantified result',potentialGain:36 },{ id:'g3',icon:'🎯',problem:'Decision-makers not addressed',action:'Tag 2–3 relevant CTO or CPO accounts in the post',potentialGain:30 }],
    applicants: [{ id:'g1',icon:'💻',problem:'No tech stack details given',action:'List the actual stack: "We build in React, Go, Postgres"',potentialGain:40 },{ id:'g2',icon:'🚀',problem:'No autonomy or ownership signal',action:'Add "You own the full product from day one"',potentialGain:34 },{ id:'g3',icon:'🌍',problem:'Not reaching global developer pools',action:'Post on HackerNews, Dev.to, and GitHub Discussions',potentialGain:28 }],
  },
  healthcare: {
    viewers:    [{ id:'g1',icon:'❓',problem:'Opening lacks a relatable hook',action:'Open with "Do you feel X? Here is why." format',potentialGain:38 },{ id:'g2',icon:'📱',problem:'No short educational clip',action:'Create a 60-sec "one tip" Reel designed for saves',potentialGain:34 },{ id:'g3',icon:'📊',problem:'No credibility signal',action:'Add a stat or cite a recognized health source',potentialGain:26 }],
    sponsors:   [{ id:'g1',icon:'💼',problem:'No brand credibility proof',action:'Share your engagement rate and audience breakdown',potentialGain:36 },{ id:'g2',icon:'🏷️',problem:'No wellness brand partnership signal',action:'Add "Open to wellness brand collaborations" in bio',potentialGain:28 },{ id:'g3',icon:'📊',problem:'No client success story',action:'Share one anonymised patient or client outcome',potentialGain:32 }],
    applicants: [{ id:'g1',icon:'🏥',problem:'No team culture content',action:'Post a "meet the team" photo or 30-sec video',potentialGain:36 },{ id:'g2',icon:'🔗',problem:'No direct application path',action:'Add job link in post body, not just in bio',potentialGain:30 },{ id:'g3',icon:'🌍',problem:'Not reaching international medical talent',action:'Translate listing to Arabic and French',potentialGain:26 }],
  },
  fashion: {
    viewers:    [{ id:'g1',icon:'🎬',problem:'No styling video format',action:'Post a 30-sec "how to style this" Reel',potentialGain:44 },{ id:'g2',icon:'🌍',problem:'MENA modest fashion audience missed',action:'Feature a modest styling variant in the next post',potentialGain:36 },{ id:'g3',icon:'❓',problem:'No style question to drive comments',action:'End with "Which colorway would you wear?" ',potentialGain:26 }],
    sponsors:   [{ id:'g1',icon:'💼',problem:'No brand aesthetic alignment shown',action:'Create a mood board post showing your brand palette',potentialGain:36 },{ id:'g2',icon:'📊',problem:'No buying intent signal',action:'Share your link-in-bio click rate or product saves',potentialGain:30 },{ id:'g3',icon:'🏷️',problem:'No collab CTA visible',action:'Add "Brand collaborations → DM or [email]"',potentialGain:26 }],
    applicants: [{ id:'g1',icon:'🎨',problem:'No portfolio showcase',action:'Pin a best-work carousel post to your profile',potentialGain:38 },{ id:'g2',icon:'🌍',problem:'Not reaching global fashion talent',action:'Post English and French versions for EU talent',potentialGain:30 },{ id:'g3',icon:'🔗',problem:'Application path unclear',action:'Add "Send portfolio + CV to [email]" in bio',potentialGain:26 }],
  },
  finance: {
    viewers:    [{ id:'g1',icon:'❓',problem:'No pattern interrupt in the hook',action:'Open with a counterintuitive money truth',potentialGain:36 },{ id:'g2',icon:'📊',problem:'Key stat not visually presented',action:'Turn your main insight into a clean infographic',potentialGain:30 },{ id:'g3',icon:'🎬',problem:'No short breakdown video',action:'Create a 60-sec financial tip Reel',potentialGain:26 }],
    sponsors:   [{ id:'g1',icon:'💼',problem:'No trust signal for finance brands',action:'Add a regulatory, certification, or compliance mention',potentialGain:38 },{ id:'g2',icon:'📊',problem:'No audience wealth or income signal',action:'Share your audience income bracket if you have it',potentialGain:32 },{ id:'g3',icon:'🎯',problem:'Not targeting fintech decision-makers',action:'Tag relevant CFOs and fintech leaders in the post',potentialGain:28 }],
    applicants: [{ id:'g1',icon:'📈',problem:'No compensation or bonus signal',action:'Add "Competitive salary + performance bonus"',potentialGain:36 },{ id:'g2',icon:'🌍',problem:'Mostly reaching local audience only',action:'Post in English and Arabic for regional finance talent',potentialGain:30 },{ id:'g3',icon:'🔗',problem:'No direct apply link',action:'Add "Apply now: [link]" in the first paragraph',potentialGain:26 }],
  },
  general: {
    viewers:    [{ id:'g1',icon:'❓',problem:'Weak opening hook',action:'Start with a question or a surprising statement',potentialGain:34 },{ id:'g2',icon:'📱',problem:'No short-form version',action:'Create a vertical 30–60 sec version for Reels',potentialGain:28 },{ id:'g3',icon:'🌍',problem:'Limited language reach',action:'Add Arabic or Spanish subtitle to expand reach',potentialGain:24 }],
    sponsors:   [{ id:'g1',icon:'📊',problem:'No engagement metrics mentioned',action:'Add your average reach and engagement rate',potentialGain:32 },{ id:'g2',icon:'💼',problem:'No partnership CTA',action:'Add "Open to collaborations: DM us" at the end',potentialGain:28 },{ id:'g3',icon:'🎯',problem:'Generic audience targeting',action:'Define your niche clearly in the first 10 words',potentialGain:24 }],
    applicants: [{ id:'g1',icon:'🚀',problem:'Benefits mentioned at the bottom',action:'Lead the post with the top benefit, not the title',potentialGain:36 },{ id:'g2',icon:'🔗',problem:'No direct application link',action:'Add "Apply here: [link]" directly in the post body',potentialGain:30 },{ id:'g3',icon:'🌍',problem:'Not reaching global applicants',action:'Translate post to Arabic and English',potentialGain:26 }],
  },
};

// ─── Audience Growth page data ────────────────────────────────────────────────

type GrowthData = Partial<Record<Goal, GrowthCard[]>>;
type GrowthMap  = Partial<Record<ContentType, GrowthData>>;

const MISSED_AUD: GrowthMap = {
  food: {
    viewers:    [{ icon:'👨‍👩‍👧',iconBg:'bg-purple-100',title:'Families (25–45)',reason:'Meal-planning content missing',action:'Add family portion sizes and prep tips',gain:'High Potential' },{ icon:'🥗',iconBg:'bg-green-100',title:'Health-Conscious Eaters',reason:'No nutritional angle in posts',action:'Add calorie count or macro breakdown',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🧑‍🍳',iconBg:'bg-amber-100',title:'Professional Chefs',reason:'No professional culinary language',action:'Include technique terms and pro kitchen tool names',gain:'High Potential' },{ icon:'🏪',iconBg:'bg-blue-100',title:'F&B Brand Buyers',reason:'No ingredient sourcing mention',action:'Name a premium ingredient brand in the post',gain:'Medium Potential' }],
    applicants: [{ icon:'🎓',iconBg:'bg-amber-100',title:'Culinary School Graduates',reason:'No entry-level welcome signal',action:'Add "Fresh graduates welcome" to the post',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-rose-100',title:'Expat Kitchen Staff',reason:'No visa or relocation mention',action:'Add "Visa support available" if applicable',gain:'Medium Potential' }],
  },
  travel: {
    viewers:    [{ icon:'💼',iconBg:'bg-blue-100',title:'Digital Nomads',reason:'No remote-work travel angle',action:'Mention coworking spots or WiFi quality at the destination',gain:'High Potential' },{ icon:'👫',iconBg:'bg-rose-100',title:'Couples & Honeymooners',reason:'No romantic framing in post',action:'Add a "perfect for couples" tip or moment',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🏨',iconBg:'bg-amber-100',title:'Luxury Hotel Brands',reason:'No premium property mentions',action:'Name or tag the accommodation you stayed at',gain:'High Potential' },{ icon:'✈️',iconBg:'bg-blue-100',title:'Airlines & Booking Platforms',reason:'No travel logistics angle',action:'Include flight duration or booking tip with brand tag',gain:'Medium Potential' }],
    applicants: [{ icon:'🌐',iconBg:'bg-purple-100',title:'International Remote Candidates',reason:'No global hiring signal visible',action:'Add "Remote-first, hire worldwide" to the post',gain:'High Potential' },{ icon:'🎒',iconBg:'bg-green-100',title:'Travel Industry Professionals',reason:'No industry credential requirement stated',action:'Specify "tourism industry experience preferred"',gain:'Medium Potential' }],
  },
  education: {
    viewers:    [{ icon:'👩‍💼',iconBg:'bg-blue-100',title:'Working Professionals (28–40)',reason:'Content feels student-focused',action:'Add a career progression or salary impact angle',gain:'High Potential' },{ icon:'👨‍👩‍👦',iconBg:'bg-purple-100',title:'Parents Choosing for Kids',reason:'No parent-friendly framing',action:'Add "suitable for students aged X+" or equivalent',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🏢',iconBg:'bg-blue-100',title:'Corporate L&D Buyers',reason:'No enterprise training angle',action:'Add "Team licenses available — contact us"',gain:'High Potential' },{ icon:'📚',iconBg:'bg-amber-100',title:'EdTech Platform Partners',reason:'No API or white-label signal',action:'Mention curriculum integration possibilities',gain:'Medium Potential' }],
    applicants: [{ icon:'🌍',iconBg:'bg-rose-100',title:'International Students',reason:'Content is English-only',action:'Post enrollment details in Arabic and English',gain:'High Potential' },{ icon:'🎓',iconBg:'bg-green-100',title:'Recent Graduates (21–26)',reason:'No fresh-start framing',action:'Add "No experience needed" if applicable',gain:'Medium Potential' }],
  },
  recruitment: {
    viewers:    [{ icon:'💼',iconBg:'bg-blue-100',title:'Passive Job Seekers',reason:'Content only targets active searchers',action:'Open with a company culture story, not the job title',gain:'High Potential' },{ icon:'🎓',iconBg:'bg-purple-100',title:'Recent Graduates (21–25)',reason:'No entry-level welcome signal',action:'Add "Entry level welcome" or "0–2 years exp OK"',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🏢',iconBg:'bg-blue-100',title:'HR Tech Platforms',reason:'No ATS or hiring automation angle',action:'Mention your hiring stack or tools in the post',gain:'High Potential' },{ icon:'🎯',iconBg:'bg-amber-100',title:'Employer Brand Agencies',reason:'No brand partnership angle',action:'Add "Open to employer brand collaborations → DM"',gain:'Medium Potential' }],
    applicants: [{ icon:'🌍',iconBg:'bg-rose-100',title:'International Applicants',reason:'No visa or remote signal',action:'Add "Open to international candidates"',gain:'High Potential' },{ icon:'🔄',iconBg:'bg-green-100',title:'Career Switchers (28–38)',reason:'No transferable skills mention',action:'Add "Transferable skills valued"',gain:'Medium Potential' }],
  },
  startup: {
    viewers:    [{ icon:'👩‍💻',iconBg:'bg-purple-100',title:'Indie Hackers & Builders',reason:'No build-in-public element',action:'Share a metric or behind-the-scenes decision this week',gain:'High Potential' },{ icon:'🎓',iconBg:'bg-blue-100',title:'Startup Students & Learners',reason:'No educational angle',action:'Frame one key lesson from your journey',gain:'Medium Potential' }],
    sponsors:   [{ icon:'💰',iconBg:'bg-amber-100',title:'Angel Investors',reason:'No traction metric in the post',action:'Add one clear growth number: users, MRR, or growth %',gain:'High Potential' },{ icon:'🏢',iconBg:'bg-blue-100',title:'Enterprise Decision Makers',reason:'No B2B ROI framing',action:'Add a "saves X hours per week" or cost stat',gain:'Medium Potential' }],
    applicants: [{ icon:'🚀',iconBg:'bg-green-100',title:'High-Growth Talent (24–32)',reason:'No equity or ownership signal',action:'Mention equity, fast growth, and real ownership in post',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-rose-100',title:'Global Tech Talent',reason:'No remote-first signal',action:'Add "Remote-first, async culture" to the post',gain:'Medium Potential' }],
  },
  entertainment: {
    viewers:    [{ icon:'🌍',iconBg:'bg-amber-100',title:'Arabic-Speaking Viewers',reason:'No Arabic content or subtitle',action:'Add Arabic captions to reach 350M+ Arabic speakers',gain:'High Potential' },{ icon:'👨‍👩‍👧‍👦',iconBg:'bg-purple-100',title:'Family Audiences (30–45)',reason:'Content currently skews very young',action:'Create a family-friendly version or content segment',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🎯',iconBg:'bg-blue-100',title:'Entertainment Brand Sponsors',reason:'No branded integration slot offered',action:'Create a "sponsor moment" in your regular content',gain:'High Potential' },{ icon:'📊',iconBg:'bg-green-100',title:'FMCG & Lifestyle Brands',reason:'No consumer lifestyle demographic data shown',action:'Share your audience age, gender, and location split',gain:'Medium Potential' }],
    applicants: [{ icon:'🎬',iconBg:'bg-purple-100',title:'Creative Freelancers',reason:'No gig or project-based role framing',action:'Add "Freelance, project-based opportunities available"',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-amber-100',title:'Regional Creative Talent',reason:'Not posting casting calls in Arabic',action:'Add Arabic version of casting or crew call',gain:'Medium Potential' }],
  },
  tech: {
    viewers:    [{ icon:'🏢',iconBg:'bg-blue-100',title:'Non-Technical Decision Makers',reason:'Too much technical jargon',action:'Add a "What this means for your business" section',gain:'High Potential' },{ icon:'👩‍💻',iconBg:'bg-purple-100',title:'Junior Developers (21–26)',reason:'No beginner-friendly angle',action:'Add a "Getting started" or beginner tip at the end',gain:'Medium Potential' }],
    sponsors:   [{ icon:'💰',iconBg:'bg-amber-100',title:'SaaS Tooling Partners',reason:'No integration or API angle',action:'Mention your API or integration ecosystem',gain:'High Potential' },{ icon:'🏢',iconBg:'bg-blue-100',title:'Enterprise IT Buyers',reason:'No enterprise compliance language',action:'Add "SOC 2 / GDPR compliant" if applicable',gain:'Medium Potential' }],
    applicants: [{ icon:'💻',iconBg:'bg-green-100',title:'Senior Engineers (5+ yrs)',reason:'No senior-level challenge mentioned',action:'Add "Complex problems, real product ownership" to post',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-rose-100',title:'Global Developer Communities',reason:'Not posted in developer forums',action:'Cross-post to HackerNews and /r/cscareerquestions',gain:'Medium Potential' }],
  },
  general: {
    viewers:    [{ icon:'🌍',iconBg:'bg-amber-100',title:'Arabic-Speaking Audience',reason:'No Arabic content',action:'Add an Arabic caption or subtitle',gain:'High Potential' },{ icon:'👥',iconBg:'bg-purple-100',title:'Gen Z (18–24)',reason:'Content tone feels too formal',action:'Use a conversational tone with a strong single hook',gain:'Medium Potential' }],
    sponsors:   [{ icon:'📊',iconBg:'bg-blue-100',title:'Brand Decision Makers',reason:'No engagement metrics shown',action:'Share your reach and engagement rate in the post',gain:'High Potential' },{ icon:'🏷️',iconBg:'bg-amber-100',title:'Niche Brand Partners',reason:'Too generic to attract niche sponsors',action:'Define your specific audience in the first line',gain:'Medium Potential' }],
    applicants: [{ icon:'🎓',iconBg:'bg-green-100',title:'Recent Graduates',reason:'No entry-level welcome signal',action:'Add "New graduates encouraged to apply"',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-rose-100',title:'International Candidates',reason:'No remote or relocation mention',action:'Add remote/hybrid options or visa support note',gain:'Medium Potential' }],
  },
};

const MISSED_REG: GrowthMap = {
  food: {
    viewers:    [{ icon:'🌍',iconBg:'bg-amber-100',title:'Gulf States (GCC)',reason:'Food content underperforms without Arabic',action:'Post in Arabic during Iftar or Ghabqa hours',gain:'High Potential' },{ icon:'🌏',iconBg:'bg-amber-100',title:'South Asia',reason:'No local ingredient or cultural adaptation',action:'Include a regional ingredient swap relevant to this audience',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🌍',iconBg:'bg-amber-100',title:'GCC Food & Beverage Market',reason:'No Halal or regional certification signal',action:'Add Halal certification or regional distribution note',gain:'High Potential' },{ icon:'🌎',iconBg:'bg-amber-100',title:'Western Europe',reason:'No European food trend framing',action:'Position as a Mediterranean or fusion recipe',gain:'Medium Potential' }],
    applicants: [{ icon:'🌍',iconBg:'bg-amber-100',title:'North Africa',reason:'No Arabic version of job post',action:'Translate job post to Arabic and Darija if relevant',gain:'High Potential' },{ icon:'🌏',iconBg:'bg-amber-100',title:'South & Southeast Asia',reason:'Large hospitality talent pool not reached',action:'Post to Filipino, Indian, and Pakistani hospitality groups',gain:'Medium Potential' }],
  },
  travel: {
    viewers:    [{ icon:'🌍',iconBg:'bg-amber-100',title:'MENA Region',reason:'Arabic travel content is heavily underserved',action:'Translate key content and add Arabic travel hashtags',gain:'High Potential' },{ icon:'🌎',iconBg:'bg-amber-100',title:'Latin America',reason:'Zero Spanish-language travel content',action:'Translate your top 3 travel posts to Spanish',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🌎',iconBg:'bg-amber-100',title:'North America',reason:'No USD-priced package or US-facing CTA',action:'Add a USD price point or American market call-to-action',gain:'High Potential' },{ icon:'🌏',iconBg:'bg-amber-100',title:'Southeast Asia',reason:'No local tourism partnership angle',action:'Tag local tourism boards for cross-promotion opportunities',gain:'Medium Potential' }],
    applicants: [{ icon:'🌎',iconBg:'bg-amber-100',title:'Europe',reason:'EU travel talent pool not reached at all',action:'Post in English, French, and German for EU coverage',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-amber-100',title:'MENA',reason:'Arabic-speaking travel professionals missed',action:'Post job in Arabic on LinkedIn MENA',gain:'Medium Potential' }],
  },
  education: {
    viewers:    [{ icon:'🌍',iconBg:'bg-amber-100',title:'MENA Region',reason:'Arabic educational content is in high demand',action:'Produce Arabic-subtitled version of your top lessons',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-amber-100',title:'Sub-Saharan Africa',reason:'Young, fast-growing learner population underserved',action:'Add affordable pricing or free tier for this region',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🌎',iconBg:'bg-amber-100',title:'North America',reason:'US EdTech sponsorship budget not targeted',action:'Apply to US-based EdTech accelerators or catalogs',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-amber-100',title:'GCC Education Market',reason:'Saudi Vision 2030 EdTech spend untapped',action:'Apply to Misk or other Saudi EdTech funding programs',gain:'Medium Potential' }],
    applicants: [{ icon:'🌍',iconBg:'bg-amber-100',title:'MENA Student Market',reason:'No Arabic enrollment landing page',action:'Launch Arabic landing page for course enrollment',gain:'High Potential' },{ icon:'🌏',iconBg:'bg-amber-100',title:'India & Pakistan',reason:'Pricing not adapted for local purchasing power',action:'Add regional pricing with PPP adjustment',gain:'Medium Potential' }],
  },
  recruitment: {
    viewers:    [{ icon:'🌍',iconBg:'bg-amber-100',title:'MENA Region',reason:'No Arabic employer branding content',action:'Post team culture content in Arabic',gain:'High Potential' },{ icon:'🌏',iconBg:'bg-amber-100',title:'South Asia',reason:'Huge talent pool with zero targeted outreach',action:'Post in LinkedIn India, Pakistan, and Sri Lanka groups',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🌎',iconBg:'bg-amber-100',title:'North America',reason:'No US HR market framing',action:'Translate your product pitch to SHRM language',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-amber-100',title:'GCC HR Market',reason:'Nationalization quotas create high demand',action:'Frame your solution around Saudization / Emiratization',gain:'Medium Potential' }],
    applicants: [{ icon:'🌍',iconBg:'bg-amber-100',title:'Egypt & Levant',reason:'High-quality talent pool not reached',action:'Post roles on Wuzzuf and Bayt.com in Arabic',gain:'High Potential' },{ icon:'🌏',iconBg:'bg-amber-100',title:'India & Philippines',reason:'Large English-speaking tech and service talent',action:'Post on Naukri.com and Jobstreet',gain:'Medium Potential' }],
  },
  startup: {
    viewers:    [{ icon:'🌍',iconBg:'bg-amber-100',title:'MENA Startup Community',reason:'Fastest-growing startup ecosystem not reached',action:'Post in MENA founder groups on LinkedIn and X',gain:'High Potential' },{ icon:'🌏',iconBg:'bg-amber-100',title:'Southeast Asia',reason:'Fast-growing tech market not targeted',action:'Cross-post to Singapore and Indonesian tech communities',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🌎',iconBg:'bg-amber-100',title:'Silicon Valley Ecosystem',reason:'No US investor-facing narrative',action:'Reframe content with US market size and TAM language',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-amber-100',title:'GCC VC Ecosystem',reason:'Saudi and UAE VCs not targeted',action:'Tag or mention relevant regional VCs in your posts',gain:'Medium Potential' }],
    applicants: [{ icon:'🌎',iconBg:'bg-amber-100',title:'European Tech Hubs',reason:'UK, Germany, Netherlands talent not reached',action:'Post on AngelList EU and LinkedIn DACH groups',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-amber-100',title:'MENA Tech Talent',reason:'Rapidly growing developer pool ignored',action:'Post on LinkedIn MENA and Makeen (Saudi)',gain:'Medium Potential' }],
  },
  entertainment: {
    viewers:    [{ icon:'🌍',iconBg:'bg-amber-100',title:'MENA & Maghreb',reason:'Arabic audience is largest per-capita streamer',action:'Post with Arabic subtitles and Darija variation',gain:'High Potential' },{ icon:'🌏',iconBg:'bg-amber-100',title:'Southeast Asia',reason:'TikTok-first market with no localized content',action:'Add Bahasa Indonesia subtitles for Indonesia',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🌎',iconBg:'bg-amber-100',title:'North America',reason:'US entertainment brands not targeted',action:'Pitch to US-based entertainment sponsorship agencies',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-amber-100',title:'GCC Luxury Brands',reason:'High entertainment spend but low creator outreach',action:'Submit to MBC, OSN, and Gulf lifestyle brand lists',gain:'Medium Potential' }],
    applicants: [{ icon:'🌍',iconBg:'bg-amber-100',title:'North Africa Creative Scene',reason:'Active creative talent, no Arabic job posts',action:'Post casting call in Arabic on Moroccan, Egyptian channels',gain:'High Potential' },{ icon:'🌎',iconBg:'bg-amber-100',title:'Latin America',reason:'Vibrant entertainment talent pool',action:'Post Spanish version to Buenos Aires and Mexico City groups',gain:'Medium Potential' }],
  },
  tech: {
    viewers:    [{ icon:'🌏',iconBg:'bg-amber-100',title:'India & Pakistan',reason:'Largest developer audience for tutorials',action:'Post during IST peak hours (8PM–11PM weekdays)',gain:'High Potential' },{ icon:'🌎',iconBg:'bg-amber-100',title:'Latin America',reason:'Fast-growing developer community not reached',action:'Add Spanish subtitle to technical demo videos',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🌎',iconBg:'bg-amber-100',title:'Silicon Valley',reason:'No US market size or competitive framing',action:'Add TAM/SAM data to make US relevance clear',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-amber-100',title:'MENA Tech Ecosystem',reason:'UAE and Saudi Vision 2030 tech spend not targeted',action:'Apply to Hub71, DIFC Innovation, or Saudi LEAP',gain:'Medium Potential' }],
    applicants: [{ icon:'🌏',iconBg:'bg-amber-100',title:'India & Pakistan',reason:'Massive English-speaking engineer pool',action:'Post on Naukri.com, HackerEarth, and LinkedIn India',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-amber-100',title:'Egypt & Jordan',reason:'Growing Arab tech talent underserved',action:'Post on Wuzzuf (Egypt) and Jordan job boards',gain:'Medium Potential' }],
  },
  general: {
    viewers:    [{ icon:'🌍',iconBg:'bg-amber-100',title:'MENA Region',reason:'No Arabic content',action:'Add Arabic caption or subtitle',gain:'High Potential' },{ icon:'🌏',iconBg:'bg-amber-100',title:'South & Southeast Asia',reason:'Large English-speaking audience not targeted',action:'Schedule posts for IST and WIB peak times',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🌎',iconBg:'bg-amber-100',title:'USA',reason:'Largest sponsorship budget market not reached',action:'Frame audience data in USD and US market terms',gain:'High Potential' },{ icon:'🌍',iconBg:'bg-amber-100',title:'GCC',reason:'High per-capita spend, low creator competition',action:'Reach out to UAE and Saudi brand teams directly',gain:'Medium Potential' }],
    applicants: [{ icon:'🌍',iconBg:'bg-amber-100',title:'MENA',reason:'Large candidate pool not reached',action:'Post in Arabic on regional job boards',gain:'High Potential' },{ icon:'🌏',iconBg:'bg-amber-100',title:'South Asia',reason:'India and Pakistan talent pool underused',action:'Post on Naukri.com and LinkedIn South Asia',gain:'Medium Potential' }],
  },
};

const LANG_GAPS: GrowthMap = {
  food: {
    viewers:    [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Content Gap',reason:'MENA food audience speaks Arabic first',action:'Post recipe steps in Arabic with local spice variants',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'Urdu Content Missing',reason:'230M Urdu speakers engage heavily with food content',action:'Add Urdu caption to your top recipe posts',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Brand Pitches',reason:'GCC F&B brands prefer Arabic-language proposals',action:'Prepare an Arabic media kit for GCC outreach',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'French for Maghreb',reason:'Morocco, Tunisia, Algeria are French-Arabic bilingual',action:'Add French captions for Maghreb brand deal outreach',gain:'Medium Potential' }],
    applicants: [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Job Post',reason:'Most regional kitchen candidates read Arabic first',action:'Translate the full job post to Arabic',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'Hindi or Tagalog',reason:'Large South Asian and Filipino hospitality workforce',action:'Add Hindi or Tagalog version for kitchen staff roles',gain:'Medium Potential' }],
  },
  travel: {
    viewers:    [{ icon:'🔤',iconBg:'bg-rose-100',title:'Spanish Content Gap',reason:'500M+ Spanish speakers love travel content',action:'Translate your top 3 travel posts to Spanish',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Travel Content',reason:'GCC travelers spend the most per trip globally',action:'Post daily Arabic travel tips during Ramadan season',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🔤',iconBg:'bg-rose-100',title:'German Outreach Language',reason:'DACH travel brands need German-language pitches',action:'Prepare a German media kit for EU brand deals',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'French Tourism Language',reason:'French tourism boards respond to French proposals',action:'Prepare a French-language collaboration proposal',gain:'Medium Potential' }],
    applicants: [{ icon:'🔤',iconBg:'bg-rose-100',title:'Spanish Job Posts',reason:'Latin America is a growing travel talent source',action:'Translate job post to Spanish for LatAm candidates',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'French Job Posts',reason:'Morocco and Francophone Africa have active travel talent',action:'Add French version for Francophone candidate pool',gain:'Medium Potential' }],
  },
  education: {
    viewers:    [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Content Gap',reason:'#1 requested language for online learning in MENA',action:'Translate your most popular lesson to Arabic',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'Hindi Learning Content',reason:'600M Hindi speakers, very low EdTech supply',action:'Add Hindi subtitle to your top lesson video',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Partnership Proposal',reason:'MENA EdTech investors prefer Arabic-first approach',action:'Prepare Arabic deck for GCC EdTech investors',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'Spanish Course Content',reason:'Latin America is fastest-growing online learning market',action:'Launch Spanish-language version of your top course',gain:'Medium Potential' }],
    applicants: [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Enrollment Materials',reason:'MENA students enroll more from Arabic landing pages',action:'Create Arabic registration and onboarding page',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'French for Africa',reason:'Sub-Saharan Africa is the fastest-growing student base',action:'Add French or Swahili course summary page',gain:'Medium Potential' }],
  },
  recruitment: {
    viewers:    [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Employer Brand',reason:'MENA talent engages 3× more with Arabic content',action:'Post culture content in Arabic on LinkedIn',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'Hindi for South Asia',reason:'India has 4.8M+ software engineers',action:'Post Hindi-captioned culture videos on Instagram',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic HR Content',reason:'GCC HR market is underserved in Arabic',action:'Post HR insight content in Arabic monthly',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'German for DACH Market',reason:"Germany has Europe's largest recruiting tech spend",action:'Translate your product overview to German',gain:'Medium Potential' }],
    applicants: [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Job Descriptions',reason:'MENA candidates respond 2× more to Arabic posts',action:'Translate all role descriptions to Arabic',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'Hindi for Operational Roles',reason:'South Asian workforce is highly skilled and available',action:'Add Hindi versions for operational and support roles',gain:'Medium Potential' }],
  },
  startup: {
    viewers:    [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Founder Content',reason:'Arab startup ecosystem growing 40% per year',action:'Post one Arabic founder insight per week',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'French for Francophone Africa',reason:'Fast-growing startup community, very little supply',action:'Share French startup insights for Francophone founders',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Investor Pitch',reason:'Gulf VCs respond better to Arabic-first materials',action:'Prepare an Arabic-language pitch summary',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'German for EU Investors',reason:'DACH investors prefer German-language outreach',action:'Translate your executive summary to German',gain:'Medium Potential' }],
    applicants: [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Job Posts',reason:'MENA tech talent speaks Arabic first',action:'Post all open roles in Arabic on LinkedIn',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'French for Francophone Devs',reason:'Strong developer talent in France, Morocco, Algeria',action:'Add French version to your careers page',gain:'Medium Potential' }],
  },
  entertainment: {
    viewers:    [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Subtitle Gap',reason:'Arabic content gets 3× the shares in MENA',action:'Add Arabic subtitles to all videos above 10K views',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'French for West Africa',reason:'Nigeria, Cameroon, Senegal consume French entertainment',action:'Add French subtitle track to your top content',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Sponsorship Pitch',reason:'GCC brands want Arabic-fluent creator partnerships',action:'Prepare an Arabic media kit version for GCC brands',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'French Collab Pitch',reason:'Francophone African brands want local-language outreach',action:'Write a French-language partnership email template',gain:'Medium Potential' }],
    applicants: [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Casting Call',reason:'North Africa has an active theatre and film talent pool',action:'Post casting calls in Arabic on regional platforms',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'French for Creative Talent',reason:'Francophone Africa has a strong creative workforce',action:'Add French version to your audition post',gain:'Medium Potential' }],
  },
  tech: {
    viewers:    [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Tech Content',reason:'Arab developer community growing 30% per year',action:'Post one weekly Arabic tech tip on X or LinkedIn',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'Hindi Dev Content',reason:'India has 5.8M developers who prefer Hindi resources',action:'Add Hindi subtitle to your technical tutorial videos',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🔤',iconBg:'bg-rose-100',title:'German Enterprise Pitch',reason:'DACH enterprise software market speaks German',action:'Prepare a German-language product one-pager',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Startup Pitch',reason:'Saudi and UAE VCs expect Arabic materials',action:'Prepare Arabic executive summary and pitch deck',gain:'Medium Potential' }],
    applicants: [{ icon:'🔤',iconBg:'bg-rose-100',title:'Hindi Job Post',reason:'India has the largest pool of available engineers',action:'Post key roles in Hindi on Naukri and LinkedIn India',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Tech Jobs',reason:'MENA developers want Arabic-language job content',action:'Post Arabic version in the Arab Developers community',gain:'Medium Potential' }],
  },
  general: {
    viewers:    [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Content Gap',reason:'Arabic is the 5th most spoken language globally',action:'Translate your best-performing post to Arabic',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'Spanish Content Gap',reason:'500M speakers with low content competition',action:'Translate one post per week to Spanish',gain:'Medium Potential' }],
    sponsors:   [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Sponsorship Pitch',reason:'GCC brands have large budgets and prefer Arabic outreach',action:'Prepare an Arabic media kit',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'French Brand Outreach',reason:'Francophone Africa is an emerging brand market',action:'Add a French section to your existing media kit',gain:'Medium Potential' }],
    applicants: [{ icon:'🔤',iconBg:'bg-rose-100',title:'Arabic Job Post',reason:'MENA candidates convert 2× better with Arabic posts',action:'Post all roles in Arabic on regional platforms',gain:'High Potential' },{ icon:'🔤',iconBg:'bg-rose-100',title:'Hindi Job Post',reason:"India is the world's largest talent pool",action:'Add a Hindi version for South Asian applicants',gain:'Medium Potential' }],
  },
};

const GROWTH_OPPS: GrowthMap = {
  food:          { viewers: [{ icon:'🚀',iconBg:'bg-green-100',title:'Recipe Series Format',reason:'Single posts get 40% less saves than a series',action:'Create a 5-part recipe series with consistent format',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Live Cooking Sessions',reason:'No live content scheduled',action:'Schedule one live cook-along per month',gain:'Medium Potential' }], sponsors: [{ icon:'🚀',iconBg:'bg-green-100',title:'Ingredient Spotlight Format',reason:'Brand posts perform best in context',action:'Create a monthly "hero ingredient" content format',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Cross-Platform Repurposing',reason:'Only using 1–2 platforms currently',action:'Repurpose recipe content across IG, TikTok, YouTube',gain:'Medium Potential' }], applicants: [{ icon:'🚀',iconBg:'bg-green-100',title:'Culture Video Series',reason:'Kitchen culture is a top hiring driver',action:'Post a weekly "kitchen team" short video',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Employee Spotlight Posts',reason:'Human stories convert 3× better than job lists',action:'Feature one team member story per week',gain:'Medium Potential' }] },
  travel:        { viewers: [{ icon:'🚀',iconBg:'bg-green-100',title:'Destination Series',reason:'Series get 60% better reach than standalone posts',action:'Plan a 7-day "destination diary" series format',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Posting Cadence Increase',reason:'Posting once/week loses algorithm priority',action:'Move to 3–4× weekly with pre-scheduled content',gain:'Medium Potential' }], sponsors: [{ icon:'🚀',iconBg:'bg-green-100',title:'Media Kit Distribution',reason:'No sponsorship package actively promoted',action:'Add media kit link to bio and LinkedIn profile',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Tourism Board Pitching',reason:'National tourism boards are high-paying sponsors',action:'Submit proposals to 3 tourism boards this quarter',gain:'Medium Potential' }], applicants: [{ icon:'🚀',iconBg:'bg-green-100',title:'Destination-Based Job Posts',reason:'Framing roles by location increases apply rate',action:'Post "Work from [City]" style content monthly',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Employee Travel Stories',reason:'Authentic travel content drives talent applications',action:'Ask the team to post one work-travel story per quarter',gain:'Medium Potential' }] },
  education:     { viewers: [{ icon:'🚀',iconBg:'bg-green-100',title:'Micro-Lesson Format',reason:'60-sec lessons get 2× more saves than full lectures',action:'Create a weekly "one concept in 60 seconds" series',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Q&A Live Format',reason:'Live content gets 6× more interactions',action:'Host a monthly LinkedIn or Instagram Live Q&A',gain:'Medium Potential' }], sponsors: [{ icon:'🚀',iconBg:'bg-green-100',title:'Outcome-Focused Case Studies',reason:'Sponsors fund results, not content',action:'Publish one student outcome story per month',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Webinar Partnership Format',reason:'Co-hosted webinars drive sponsor discovery',action:'Partner with one brand per quarter on a webinar',gain:'Medium Potential' }], applicants: [{ icon:'🚀',iconBg:'bg-green-100',title:'Enrollment Countdown Series',reason:'Urgency increases conversion by 35%',action:'Run a "5 days to enrollment close" countdown series',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Free Sample Lesson',reason:'Try-before-you-commit reduces friction dramatically',action:'Offer a free first lesson with no signup required',gain:'Medium Potential' }] },
  recruitment:   { viewers: [{ icon:'🚀',iconBg:'bg-green-100',title:'"Day in the Life" Series',reason:'Employer brand content is 2× more effective than job ads',action:'Post one "day in the life" per role category monthly',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Hiring Transparency Content',reason:'Candidates want to know the process upfront',action:'Post "What our interview process looks like" content',gain:'Medium Potential' }], sponsors: [{ icon:'🚀',iconBg:'bg-green-100',title:'Quarterly HR Data Reports',reason:'Data-driven content attracts HR brand sponsors',action:'Publish a quarterly talent market insight post',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Employer of Choice Positioning',reason:'Award-based content drives organic brand deals',action:'Apply for "Best Employer" or "Top Workplace" awards',gain:'Medium Potential' }], applicants: [{ icon:'🚀',iconBg:'bg-green-100',title:'Weekly Hiring Updates',reason:'Regular posting keeps roles top-of-mind',action:'Post a "We are hiring" update every Monday morning',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Referral Program Promotion',reason:'Employee referrals are 4× cheaper per hire',action:'Post monthly "refer a friend" post with incentive',gain:'Medium Potential' }] },
  startup:       { viewers: [{ icon:'🚀',iconBg:'bg-green-100',title:'Build-in-Public Series',reason:'#buildinpublic posts get 3× more impressions',action:'Share one weekly metric, decision, or lesson learned',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Founder Thought Leadership',reason:'Personal brand drives startup discovery',action:'Post founder POV content 3× per week on LinkedIn + X',gain:'Medium Potential' }], sponsors: [{ icon:'🚀',iconBg:'bg-green-100',title:'Public Metrics Updates',reason:'Public numbers signal transparency to partners',action:'Post a monthly metrics update publicly on LinkedIn',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Startup Podcast Appearances',reason:'Podcast features drive sponsor introductions',action:'Apply to 3 startup podcasts this month',gain:'Medium Potential' }], applicants: [{ icon:'🚀',iconBg:'bg-green-100',title:'Mission-Driven Hiring Content',reason:'"Why we exist" posts attract the best candidates',action:'Post a founder mission statement with all open roles',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'GitHub / Forum Sourcing',reason:'Tech roles fill faster from community sourcing',action:'Post on HackerNews and GitHub Discussions',gain:'Medium Potential' }] },
  entertainment: { viewers: [{ icon:'🚀',iconBg:'bg-green-100',title:'Teaser-Drop-Recap Cycle',reason:'Three-part cycles drive 2× algorithm push',action:'Plan teaser → drop → recap posts for every release',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'UGC Fan Reaction Series',reason:'Fan content extends organic reach by 40%',action:'Launch a "react to our content" challenge monthly',gain:'Medium Potential' }], sponsors: [{ icon:'🚀',iconBg:'bg-green-100',title:'Branded Content Moments',reason:'Pre-planned integration slots sell 3× better than ad-hoc',action:'Create a branded integration slot in your regular format',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Cross-Platform Simulcast',reason:'Multi-platform presence multiplies sponsor value',action:'Simulcast on IG, TikTok, and YouTube Shorts simultaneously',gain:'Medium Potential' }], applicants: [{ icon:'🚀',iconBg:'bg-green-100',title:'Open Monthly Casting Calls',reason:'Monthly calls get higher volume and quality',action:'Post a monthly "We are casting / looking for…" Reel',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Behind-the-Scenes Crew Posts',reason:'Crew culture content attracts creative professionals',action:'Post one BTS crew story per production cycle',gain:'Medium Potential' }] },
  tech:          { viewers: [{ icon:'🚀',iconBg:'bg-green-100',title:'Weekly Tech Insight Series',reason:'Consistent series build algorithm momentum fast',action:'Post "Insight of the Week" every Tuesday on X + LinkedIn',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Open Source Showcase',reason:'OSS content drives developer community engagement',action:'Post one OSS contribution or community stat weekly',gain:'Medium Potential' }], sponsors: [{ icon:'🚀',iconBg:'bg-green-100',title:'Quarterly Benchmark Report',reason:'Technical comparison content drives B2B engagement',action:'Publish a quarterly technical benchmark post',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Developer Conference Presence',reason:'Conference presence triples developer brand awareness',action:'Apply to speak at one tech conference this quarter',gain:'Medium Potential' }], applicants: [{ icon:'🚀',iconBg:'bg-green-100',title:'Interview Process Transparency',reason:'Sharing the interview format reduces drop-off by 40%',action:'Post "Here is what our interview looks like" content',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Engineering Blog Posts',reason:'Dev blogs attract 3× more senior applicants',action:'Publish one engineering post on Medium or dev.to monthly',gain:'Medium Potential' }] },
  general:       { viewers: [{ icon:'🚀',iconBg:'bg-green-100',title:'Posting Cadence',reason:'Irregular schedule loses algorithm reach fast',action:'Post 3–4× per week with consistent timing',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Cross-Platform Repurposing',reason:'Single-platform strategy limits reach by 60%',action:'Adapt each post for at least 2 platforms',gain:'Medium Potential' }], sponsors: [{ icon:'🚀',iconBg:'bg-green-100',title:'Media Kit Creation',reason:'No professional sponsorship package available',action:'Build a 1-page media kit with reach and rates',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Clear Content Niche',reason:'Broad content confuses potential brand sponsors',action:'Pick 1 clear content pillar and lead every post with it',gain:'Medium Potential' }], applicants: [{ icon:'🚀',iconBg:'bg-green-100',title:'Always-On Hiring Content',reason:'Companies that post culture content hire 2× faster',action:'Post one team or culture update every week',gain:'High Potential' },{ icon:'🚀',iconBg:'bg-green-100',title:'Clear Application CTA',reason:'Missing apply links are the #1 cause of low conversions',action:'Add a direct application link in every hiring post',gain:'Medium Potential' }] },
};

function getGrowthData(map: GrowthMap, type: ContentType, goal: Goal): GrowthCard[] {
  return map[type]?.[goal] ?? map.general![goal]!;
}

// ─── Insights data ────────────────────────────────────────────────────────────

const TOP_PLATFORM: Partial<Record<ContentType, Partial<Record<Goal, { p: string; s: number }>>>> = {
  food:          { viewers: { p:'Instagram',s:88 }, sponsors: { p:'Instagram',s:84 }, applicants: { p:'LinkedIn',s:78 } },
  travel:        { viewers: { p:'Instagram',s:91 }, sponsors: { p:'Instagram',s:85 }, applicants: { p:'LinkedIn',s:77 } },
  education:     { viewers: { p:'YouTube',  s:90 }, sponsors: { p:'LinkedIn', s:88 }, applicants: { p:'LinkedIn',s:92 } },
  recruitment:   { viewers: { p:'LinkedIn', s:87 }, sponsors: { p:'LinkedIn', s:82 }, applicants: { p:'LinkedIn',s:94 } },
  startup:       { viewers: { p:'LinkedIn', s:85 }, sponsors: { p:'LinkedIn', s:90 }, applicants: { p:'LinkedIn',s:88 } },
  entertainment: { viewers: { p:'TikTok',   s:93 }, sponsors: { p:'Instagram',s:87 }, applicants: { p:'Instagram',s:79 } },
  healthcare:    { viewers: { p:'Instagram',s:86 }, sponsors: { p:'Instagram',s:82 }, applicants: { p:'LinkedIn',s:88 } },
  fashion:       { viewers: { p:'Instagram',s:94 }, sponsors: { p:'Instagram',s:90 }, applicants: { p:'Instagram',s:82 } },
  tech:          { viewers: { p:'YouTube',  s:88 }, sponsors: { p:'LinkedIn', s:91 }, applicants: { p:'LinkedIn',s:92 } },
  finance:       { viewers: { p:'LinkedIn', s:87 }, sponsors: { p:'LinkedIn', s:92 }, applicants: { p:'LinkedIn',s:90 } },
};

const CORE_AUD: Record<ContentType, { label: string; mult: string }> = {
  food:{ label:'25–44', mult:'2.4×' }, travel:{ label:'22–35', mult:'2.8×' }, education:{ label:'18–32', mult:'2.1×' },
  recruitment:{ label:'22–38', mult:'1.9×' }, startup:{ label:'25–40', mult:'2.3×' }, entertainment:{ label:'16–28', mult:'3.1×' },
  healthcare:{ label:'30–50', mult:'2.0×' }, fashion:{ label:'18–34', mult:'2.6×' }, tech:{ label:'22–38', mult:'2.2×' },
  finance:{ label:'28–45', mult:'1.8×' }, general:{ label:'25–40', mult:'2.0×' },
};

const PEAK_WIN: Record<ContentType, { days: string; lift: string }> = {
  food:{ days:'Fri / Sun', lift:'+38%' }, travel:{ days:'Mon / Thu', lift:'+45%' }, education:{ days:'Tue / Wed', lift:'+41%' },
  recruitment:{ days:'Mon / Tue', lift:'+52%' }, startup:{ days:'Tue / Thu', lift:'+38%' }, entertainment:{ days:'Fri / Sat', lift:'+55%' },
  healthcare:{ days:'Mon / Wed', lift:'+34%' }, fashion:{ days:'Thu / Fri', lift:'+48%' }, tech:{ days:'Tue / Wed', lift:'+40%' },
  finance:{ days:'Mon / Wed', lift:'+36%' }, general:{ days:'Tue / Wed', lift:'+35%' },
};

const GROWTH_PLAY: Partial<Record<ContentType, Partial<Record<Goal, { p: string; reach: string }>>>> = {
  food:{ viewers:{ p:'TikTok',reach:'65K' }, sponsors:{ p:'YouTube',reach:'45K' }, applicants:{ p:'Instagram',reach:'38K' } },
  travel:{ viewers:{ p:'TikTok',reach:'82K' }, sponsors:{ p:'YouTube',reach:'55K' }, applicants:{ p:'LinkedIn',reach:'28K' } },
  education:{ viewers:{ p:'TikTok',reach:'72K' }, sponsors:{ p:'YouTube',reach:'68K' }, applicants:{ p:'Instagram',reach:'35K' } },
  recruitment:{ viewers:{ p:'Instagram',reach:'42K' }, sponsors:{ p:'YouTube',reach:'32K' }, applicants:{ p:'Instagram',reach:'48K' } },
  startup:{ viewers:{ p:'TikTok',reach:'58K' }, sponsors:{ p:'YouTube',reach:'52K' }, applicants:{ p:'TikTok',reach:'45K' } },
  entertainment:{ viewers:{ p:'YouTube',reach:'95K' }, sponsors:{ p:'YouTube',reach:'78K' }, applicants:{ p:'TikTok',reach:'52K' } },
  tech:{ viewers:{ p:'TikTok',reach:'62K' }, sponsors:{ p:'YouTube',reach:'75K' }, applicants:{ p:'X',reach:'38K' } },
};

const NEXT_MOVE: Partial<Record<ContentType, Record<Goal, string>>> = {
  food:{ viewers:'Post a recipe video now', sponsors:'Pitch a food brand', applicants:'Post kitchen culture' },
  travel:{ viewers:'Share a hidden local gem', sponsors:'Approach a hotel brand', applicants:'Post remote-work travel' },
  education:{ viewers:'Create a micro-lesson Reel', sponsors:'Pitch corporate training', applicants:'Launch enrollment post' },
  recruitment:{ viewers:'Post a team culture video', sponsors:'Pitch an HR tech brand', applicants:'Post a new open role' },
  startup:{ viewers:'Share a product demo', sponsors:'Post your traction metrics', applicants:'Post a founder video' },
  entertainment:{ viewers:'Drop a teaser clip', sponsors:'Share your audience data', applicants:'Open a casting call' },
  tech:{ viewers:'Post a product demo', sponsors:'Share your traction data', applicants:'Post an engineering role' },
};

const AI_SUMMARIES: Partial<Record<ContentType, Record<Goal, string>>> = {
  food:{ viewers:'Recipe content with a **strong sensory hook** in the first line gets **2.4× more saves**. **Short-form video** of the cooking process drives the highest reach on Instagram and TikTok.', sponsors:'Food posts that **name a specific ingredient or tool brand** attract **3.1× more sponsorship inquiries**. Posts with a **clear aesthetic identity** are preferred by F&B brand buyers.', applicants:'Kitchen job posts with **behind-the-scenes team content** receive **2.7× more qualified applications** than text-only listings.' },
  travel:{ viewers:'Travel content with a **single unexpected local detail** outperforms generic destination posts by **2.8×**. First-person storytelling drives **40% more saves** than third-person narration.', sponsors:'Posts that **name the accommodation and tag the location** generate **3× more brand outreach** from hotels, airlines, and tourism boards.', applicants:'Travel job posts that **highlight remote flexibility and team trip stories** convert **2.5× better** than standard listing-style posts.' },
  education:{ viewers:'Educational content that opens with a **relatable question or struggle** gets **2.1× more shares**. **Micro-lessons under 60 seconds** consistently outperform longer formats.', sponsors:'Content that **shows measurable learning outcomes** attracts **3× more EdTech brand interest**. Posts with specific outcome stats get far more partnership inquiries.', applicants:'Course enrollment posts with a **student success story** in the first 3 lines convert **2.4× better** than feature-list posts.' },
  recruitment:{ viewers:'Culture content that shows **real team moments** gets **3× more engagement** than job-list posts. **Video job posts** receive **4× more organic reach** than image-only posts.', sponsors:'Employer brand content with **transparent hiring data** attracts **HR tech sponsors and talent platform partnerships** significantly faster.', applicants:'Job posts that **lead with the top benefit** and include a **direct apply link** in the first 2 lines convert **2.8× better** than standard listings.' },
  startup:{ viewers:'Startup content that includes **one real metric** outperforms general product posts by **3.2×**. **Build-in-public posts** consistently achieve the highest founder audience reach.', sponsors:'Posts with **traction data and clear market size** attract **2.7× more investor and partner interest** than vision-only content.', applicants:'Startup job posts that mention **equity, ownership, and a clear mission** receive **3× more applications from top-tier candidates**.' },
  entertainment:{ viewers:'Entertainment content with a **strong opening 3 seconds** retains **40% more viewers**. Content with **Arabic subtitles** reaches **3× more audience** in the MENA region.', sponsors:'Entertainment creators who share **audience demographics** with brands close **2.5× more sponsorship deals** than those without audience data.', applicants:'Casting calls that include a **behind-the-scenes clip** attract **2.2× more applications** from qualified creative talent.' },
  tech:{ viewers:'Tech content that starts with a **counterintuitive insight or question** gets **2.5× more impressions**. **Product demo clips** outperform text-only posts by **4×**.', sponsors:'Tech posts with **benchmarks and real data** attract **3.2× more enterprise partner interest** than product-feature-only posts.', applicants:'Engineering job posts that mention **the actual tech stack** and **team autonomy** receive **2.7× more senior engineer applications**.' },
};

const AI_TAGS: Partial<Record<ContentType, Record<Goal, string[]>>> = {
  food:          { viewers:['Food Content','Short-form Video','MENA Reach'], sponsors:['F&B Brands','Ingredient Marketing','Aesthetic Content'], applicants:['Kitchen Culture','Hospitality Hiring','Video First'] },
  travel:        { viewers:['Travel Storytelling','Reels First','Local Perspective'], sponsors:['Tourism Brands','Destination Content','Luxury Travel'], applicants:['Remote Work','Global Hiring','Culture Content'] },
  education:     { viewers:['Micro-Learning','Curiosity Hook','Arabic Subtitles'], sponsors:['EdTech','Corporate Training','Outcome-Driven'], applicants:['Student Success','Enrollment Funnel','Social Proof'] },
  recruitment:   { viewers:['Employer Brand','Culture Video','Team Storytelling'], sponsors:['HR Tech','Talent Intelligence','Data-Driven'], applicants:['Benefits First','Direct Apply','Video Job Post'] },
  startup:       { viewers:['Build in Public','Founder Brand','Traction Metrics'], sponsors:['Investor Ready','Growth Data','B2B Positioning'], applicants:['Equity First','Mission Driven','Remote First'] },
  entertainment: { viewers:['Short-form','Arabic Subtitles','Audience Hook'], sponsors:['Audience Data','Branded Moments','Multi-Platform'], applicants:['Creative Culture','Casting Call','BTS Content'] },
  tech:          { viewers:['Product Demo','Developer Audience','Benchmark Data'], sponsors:['Enterprise Ready','Traction Data','Tech Brand'], applicants:['Tech Stack Visible','Engineer Ownership','Remote First'] },
};

const NEXT_ACTIONS: Partial<Record<ContentType, Record<Goal, Array<{ action: string; priority: 'High' | 'Mid' }>>>> = {
  food:          { viewers:[{ action:'Add a sensory question to your opening line to drive comments',priority:'High' },{ action:'Post a 30-second cooking process clip designed for saves',priority:'High' },{ action:'Add Arabic caption to reach the GCC food audience',priority:'Mid' }], sponsors:[{ action:'Name the hero ingredient brand in your next post',priority:'High' },{ action:'Add "Open to brand collaborations → DM" to your bio',priority:'High' },{ action:'Prepare a 1-page food media kit with your audience stats',priority:'Mid' }], applicants:[{ action:'Post a 60-second behind-the-scenes kitchen culture video',priority:'High' },{ action:'Add direct application link in the post body, not just bio',priority:'High' },{ action:'Translate job post to Arabic for GCC hospitality talent',priority:'Mid' }] },
  travel:        { viewers:[{ action:'Open your next post with an unexpected local insight, not the destination name',priority:'High' },{ action:'Cut a vertical 30-second highlight clip for Reels and TikTok',priority:'High' },{ action:'Add geo-tags and location hashtags to boost content discovery',priority:'Mid' }], sponsors:[{ action:'Tag the accommodation and airline in your next travel post',priority:'High' },{ action:'Add your average post reach and engagement rate to your bio',priority:'High' },{ action:'Apply to 2 tourism board creator programs this week',priority:'Mid' }], applicants:[{ action:'Post a "Work from [destination]" team story this week',priority:'High' },{ action:'Add "Remote-first, hire globally" to the job description',priority:'High' },{ action:'Translate job post to Spanish for Latin American candidates',priority:'Mid' }] },
  education:     { viewers:[{ action:'Rewrite your opening line as a question your audience is already asking',priority:'High' },{ action:'Create a 60-second key takeaway Reel from your best lesson',priority:'High' },{ action:'Add Arabic subtitles to your top video for MENA reach',priority:'Mid' }], sponsors:[{ action:'Add one specific learning outcome stat to your next post',priority:'High' },{ action:'Pitch corporate training angle with "Team pricing available" CTA',priority:'High' },{ action:'Share your course completion rate publicly in your next post',priority:'Mid' }], applicants:[{ action:'Add a student success quote in the first 3 lines of your enrollment post',priority:'High' },{ action:'Move your application link to the second line of the post',priority:'High' },{ action:'Launch an Arabic enrollment page for MENA students',priority:'Mid' }] },
  recruitment:   { viewers:[{ action:'Post a 45-second "day in the life" video for your most-applied role',priority:'High' },{ action:'Design a visual job card instead of a text-heavy post',priority:'High' },{ action:'End your next post with a question to drive engagement',priority:'Mid' }], sponsors:[{ action:'Share your average applicant reach and quality rate this week',priority:'High' },{ action:'Post a quarterly talent market insight to attract HR tech brands',priority:'High' },{ action:'Apply to "Best Employer" awards to build employer brand credibility',priority:'Mid' }], applicants:[{ action:'Rewrite your job post: lead with the top benefit, not the job title',priority:'High' },{ action:'Add "Apply in 2 min → [link]" directly in the post body',priority:'High' },{ action:'Add "Open to international candidates" to expand your talent pool',priority:'Mid' }] },
  startup:       { viewers:[{ action:'Share one real metric this week: users, revenue, or growth rate',priority:'High' },{ action:'Post a 30-second product demo or walkthrough clip',priority:'High' },{ action:'Reframe your next post as a clear problem-solution story',priority:'Mid' }], sponsors:[{ action:'Add your MRR or user count to your next post or LinkedIn headline',priority:'High' },{ action:'Post a monthly public metrics update to signal transparency',priority:'High' },{ action:'Tag 2–3 relevant investors or partners in your next post',priority:'Mid' }], applicants:[{ action:'Mention equity, ownership, and mission in your next job post',priority:'High' },{ action:'Post a 30-second founder intro video with all open roles listed',priority:'High' },{ action:'Post your roles on HackerNews "Who is Hiring" thread this week',priority:'Mid' }] },
  entertainment: { viewers:[{ action:'Recut your next release as a 15-second vertical teaser first',priority:'High' },{ action:'Add Arabic subtitles to your top 3 videos this week',priority:'High' },{ action:'Add a poll or "pick a side" CTA to your next post',priority:'Mid' }], sponsors:[{ action:'Share your audience demographics breakdown in a post this week',priority:'High' },{ action:'Create a branded integration slot in your regular content format',priority:'High' },{ action:'Pitch to one MENA lifestyle brand with an Arabic media kit',priority:'Mid' }], applicants:[{ action:'Post a behind-the-scenes crew moment from your next production',priority:'High' },{ action:'Add "Casting and crew opportunities → DM us" to your bio',priority:'High' },{ action:'Post your next casting call in Arabic on regional platforms',priority:'Mid' }] },
  tech:          { viewers:[{ action:'Open your next post with a counterintuitive insight or developer question',priority:'High' },{ action:'Create a 60-second screen-share demo clip for your product or feature',priority:'High' },{ action:'Add a before/after benchmark stat to your next technical post',priority:'Mid' }], sponsors:[{ action:'Add MRR, active users, or growth rate to your next post or profile',priority:'High' },{ action:'Add one enterprise client result or quote to your next post',priority:'High' },{ action:'Publish a quarterly technical benchmark comparison post',priority:'Mid' }], applicants:[{ action:'List the actual tech stack in your job post: "We use React, Go, Postgres"',priority:'High' },{ action:'Add "You own the product from day one" to signal real autonomy',priority:'High' },{ action:'Post your roles on HackerNews and Dev.to this week',priority:'Mid' }] },
};

const ENG_LABELS: Record<ContentType, string> = {
  food:'Recipe Engagement', travel:'Discovery Rate', education:'Content Completion',
  recruitment:'Apply Rate', startup:'Follower Conversion', entertainment:'Avg Watch Time',
  healthcare:'Content Save Rate', fashion:'Profile Visit Rate', tech:'Click-Through Rate',
  finance:'Content Share Rate', general:'Engagement Rate',
};

// ─── Main export ──────────────────────────────────────────────────────────────

export function analyzeContent(text: string, goal: Goal): AnalysisResult {
  const type = detectContentType(text);
  const q    = analyzeQuality(text);
  const s    = seed(text + goal + type);

  // Platforms
  const PDEFS = [
    { id:'instagram',name:'Instagram' },{ id:'tiktok',name:'TikTok' },
    { id:'linkedin',name:'LinkedIn'  },{ id:'youtube',name:'YouTube' },
    { id:'x',       name:'X'         },
  ];
  const platforms: Platform[] = PDEFS.map((p, i) => {
    let base = 40 + si(s, i * 13 + 1, 0, 20);
    base += (TYPE_BOOST[type]?.[p.id] ?? 0);
    base += (GOAL_BOOST[goal]?.[p.id] ?? 0);
    base += qBoost(q, p.id);
    const score = Math.max(18, Math.min(96, base));
    const tDays  = TYPE_DAYS[type];
    const tTimes = TYPE_TIMES[type];
    return { ...p, score,
      confidence:   Math.min(98, score + si(s, i*7+50, 2, 8)),
      reach:        score * 1100 + si(s, i*11+80, 4000, 28000),
      bestDay:      tDays[(s + i*3) % tDays.length],
      bestTime:     tTimes[(s + i*5) % tTimes.length],
      reachQuality: Math.min(96, score + si(s, i*9+60, 0, 10)),
    };
  }).sort((a, b) => b.score - a.score);

  // Audience fit
  const gp  = 50 + si(s, 200, 0, 22);
  const s2  = Math.floor((100 - gp) * 0.55);
  const s3  = 100 - gp - s2;
  const audienceFit: AudienceSegment[] = [
    { label:'Viewers',    percent:0, goal:'viewers',    color:'#06B6D4' },
    { label:'Applicants', percent:0, goal:'applicants', color:'#14B8A6' },
    { label:'Sponsors',   percent:0, goal:'sponsors',   color:'#84CC16' },
  ];
  let filled = false;
  audienceFit.forEach(seg => {
    if (seg.goal === goal) { seg.percent = gp; return; }
    seg.percent = filled ? s3 : s2; filled = true;
  });

  // Geo
  const geographicReach = buildGeoRegions(type, goal, s, q.hasArabic);

  // Gaps
  const gaps = GAP_POOLS[type]?.[goal] ?? GAP_POOLS.general[goal]!;

  // AudienceGrowth data
  const missedAudiences     = getGrowthData(MISSED_AUD,   type, goal);
  const missedRegions       = getGrowthData(MISSED_REG,   type, goal);
  const languageGaps        = getGrowthData(LANG_GAPS,    type, goal);
  const growthOpportunities = getGrowthData(GROWTH_OPPS,  type, goal);

  // Insights data
  const tp  = TOP_PLATFORM[type]?.[goal]  ?? { p:'LinkedIn', s:82 };
  const ca  = CORE_AUD[type];
  const pw  = PEAK_WIN[type];
  const gpl = GROWTH_PLAY[type]?.[goal]   ?? { p:'YouTube', reach:'45K' };
  const nm  = NEXT_MOVE[type]?.[goal]     ?? 'Post actionable content now';

  const insightMetrics: InsightMetricData[] = [
    { label:'Top Platform',  title: tp.p,        value: String(tp.s),  unit:'/100' },
    { label:'Core Audience', title: ca.label,     value: ca.mult,       unit:'eng'  },
    { label:'Peak Window',   title: pw.days,      value: pw.lift,       unit:''     },
    { label:'Growth Play',   title: gpl.p,        value: gpl.reach,     unit:'reach'},
    { label:'Next Move',     title: nm,           value: '→',           unit:'now'  },
  ];

  const aiSummary   = AI_SUMMARIES[type]?.[goal]  ?? `Content targeting **${goal}** performs best when the hook is direct and the CTA is specific. Focus on **one clear message** per post and test posting at peak times for your audience.`;
  const aiTags      = AI_TAGS[type]?.[goal]       ?? ['Quality Content','Consistent Posting','Audience Focus'];
  const nextActions = NEXT_ACTIONS[type]?.[goal]  ?? [{ action:'Strengthen your opening hook — it determines 80% of reach', priority:'High' as const }, { action:'Add a clear call-to-action aligned to your goal', priority:'High' as const }, { action:'Post at the peak window identified above', priority:'Mid' as const }];

  // Expected impact (realistic)
  const sb = 44 + si(s, 300, 0, 22);
  const sa = Math.min(84, sb + si(s, 301, 11, 24));
  const rb = 30 + si(s, 302, 0, 22);
  const ra = Math.min(76, rb + si(s, 303, 9, 20));
  const xb = 18 + si(s, 304, 0, 18);
  const xa = Math.min(62, xb + si(s, 305, 8, 16));
  const eb = 20 + si(s, 306, 0, 18);
  const ea = Math.min(68, eb + si(s, 307, 9, 16));
  const pct = (b: number, a: number) => `+${Math.round((a-b)/b*100)}%`;
  const topReg = geographicReach[0]?.region ?? 'Top Region';

  const expectedImpact: ExpectedImpactCard[] = [
    { label:`${platforms[0].name} Score`, before:String(sb),     after:String(sa),     gainPct:pct(sb,sa), beforeNum:sb, afterNum:sa, maxVal:100 },
    { label:'Audience Reach',             before:`${rb}%`,       after:`${ra}%`,        gainPct:pct(rb,ra), beforeNum:rb, afterNum:ra, maxVal:100 },
    { label:`${topReg} Reach`,            before:`${xb}%`,       after:`${xa}%`,        gainPct:pct(xb,xa), beforeNum:xb, afterNum:xa, maxVal:100 },
    { label:ENG_LABELS[type] ?? 'Engagement Rate', before:`${eb}%`, after:`${ea}%`, gainPct:pct(eb,ea), beforeNum:eb, afterNum:ea, maxVal:100 },
  ];

  return {
    id: Math.random().toString(36).slice(2,9), goal, contentType: type,
    platforms, audienceFit, geographicReach, gaps,
    missedAudiences, missedRegions, languageGaps, growthOpportunities,
    insightMetrics, aiSummary, aiTags, nextActions,
    expectedImpact,
    beforeAfter: { score:[sb,sa], reach:[rb,ra], topRegion:[xb,xa] },
  };
}

// ─── Optimized content generator ─────────────────────────────────────────────

export function generateOptimizedContent(text: string, goal: Goal): string {
  const type = detectContentType(text);
  const q    = analyzeQuality(text);
  const sentences = text.split(/(?<=[.!?])\s+|[\n]+/).filter(s => s.trim().length > 8);
  const core = sentences.slice(0, Math.min(3, sentences.length)).join(' ').trim();

  const HOOKS: Record<ContentType, string[]> = {
    food:          ["Here's what makes this recipe worth saving.", "One ingredient changes everything about this dish.", "The step most people skip is the one that matters most."],
    travel:        ["One detail about this place that no travel guide mentions.", "This is the kind of trip that stays with you long after you leave.", "Most people visit here for the wrong reason — here's the right one."],
    education:     ["Most people learn this the hard way. You don't have to.", "This one shift in thinking changes how fast you learn.", "The gap between where you are and where you want to be is smaller than you think."],
    recruitment:   ["We don't just offer a job — we offer a place to actually grow.", "The best part of working here isn't on the job description.", "Here's what you get from day one — beyond the salary."],
    startup:       ["We built this because the problem was too obvious to ignore.", "Here's what happened when we showed 100 people our product.", "The insight that changed everything about how we built this."],
    entertainment: ["This is the moment you've been waiting for.", "You need to see this before anyone else does.", "Nothing prepares you for what happens next."],
    healthcare:    ["One change. Real results. Here's what the evidence shows.", "The habit quietly transforming how people feel every day.", "Most people get this health advice completely backwards."],
    fashion:       ["This look was built with one intention in mind.", "Style is a language — here's what this one says.", "The piece everyone's been asking about is finally here."],
    tech:          ["We solved a problem that everyone said couldn't be done.", "The tool that changes your workflow from day one.", "Here's what 3 months of data actually showed us."],
    finance:       ["The number most people ignore — and what it costs them.", "Here's what the smart money is actually doing right now.", "Most people get this financial decision completely backwards."],
    general:       ["Here's something most people skip — and why it matters.", "One insight that changes the way you approach this.", "The part everyone glosses over is actually the most important."],
  };

  const hook = HOOKS[type]?.[q.overallScore % HOOKS[type].length] ?? HOOKS.general[0];

  const CTAS: Record<Goal, string> = {
    viewers:    q.hasQuestion
      ? "What would you try first? Drop your answer below 👇 — and share this with someone who would appreciate it."
      : "Save this for later and share it with someone it would genuinely help. 🔖",
    sponsors:   "If this aligns with what your brand stands for — let's talk. DM us or reach out directly. We would love to explore what we can build together.",
    applicants: "If this sounds like the environment where you would do your best work — apply now. The link is in the bio. It takes under 2 minutes. 🚀",
  };

  const TAGS: Record<Goal, string> = {
    viewers:    '#content #trending #explore',
    sponsors:   '#partnership #collaboration #brand',
    applicants: '#careers #opportunity #growth',
  };

  return `${hook}\n\n${core}\n\n${CTAS[goal]}\n\n${TAGS[goal]}`;
}
