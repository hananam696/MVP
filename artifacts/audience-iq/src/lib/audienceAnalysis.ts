export type Goal = 'viewers' | 'sponsors' | 'applicants';

export interface Platform {
  id: string;
  name: string;
  score: number;
  confidence: number;
  reach: number;
  bestDay: string;
  bestTime: string;
  reachQuality: number;
}

export interface AudienceSegment {
  label: string;
  percent: number;
  goal: Goal;
  color: string;
}

export interface GeoRegion {
  region: string;
  reach: number;
  level: 'high' | 'medium' | 'low';
  lat: number;
  lng: number;
}

export interface Gap {
  id: string;
  icon: string;
  problem: string;
  action: string;
  potentialGain: number;
}

export interface AnalysisResult {
  id: string;
  goal: Goal;
  platforms: Platform[];
  audienceFit: AudienceSegment[];
  geographicReach: GeoRegion[];
  gaps: Gap[];
  beforeAfter: {
    score: [number, number];
    reach: [number, number];
    topRegion: [number, number];
  };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = ['9:00 AM', '12:00 PM', '2:00 PM', '5:00 PM', '7:00 PM', '9:00 PM'];

function seed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = Math.imul(31, h) + text.charCodeAt(i) | 0;
  return Math.abs(h);
}

export function analyzeContent(text: string, goal: Goal): AnalysisResult {
  const s = seed(text);

  const platformsRaw = [
    { id: 'instagram', name: 'Instagram' },
    { id: 'tiktok',    name: 'TikTok' },
    { id: 'linkedin',  name: 'LinkedIn' },
    { id: 'youtube',   name: 'YouTube' },
    { id: 'x',         name: 'X' },
  ];

  const platforms: Platform[] = platformsRaw.map((p, i) => {
    let base = 45 + ((s + i * 17) % 25);
    if (goal === 'viewers')    { if (p.id === 'instagram' || p.id === 'tiktok')  base += 28; }
    if (goal === 'sponsors')   { if (p.id === 'linkedin')                         base += 32; if (p.id === 'youtube') base += 10; }
    if (goal === 'applicants') { if (p.id === 'linkedin')                         base += 24; if (p.id === 'youtube') base += 14; }
    const score = Math.min(97, base);
    return {
      ...p,
      score,
      confidence: Math.min(99, score + 4),
      reach: Math.floor(score * 1400 + (s % 50000)),
      bestDay:  DAYS[(s + i * 3) % DAYS.length],
      bestTime: TIMES[(s + i * 7) % TIMES.length],
      reachQuality: Math.min(98, score + ((s + i) % 15)),
    };
  }).sort((a, b) => b.score - a.score);

  // Audience fit — always 3 segments totalling 100, goal segment wins
  const goalPercent = 60 + (s % 20);
  const seg2 = Math.floor((100 - goalPercent) * 0.6);
  const seg3 = 100 - goalPercent - seg2;

  const allSegments: AudienceSegment[] = [
    { label: 'Viewers',    percent: 0, goal: 'viewers',    color: '#06B6D4' },
    { label: 'Applicants', percent: 0, goal: 'applicants', color: '#14B8A6' },
    { label: 'Sponsors',   percent: 0, goal: 'sponsors',   color: '#84CC16' },
  ];
  allSegments.forEach(seg => {
    if (seg.goal === goal) seg.percent = goalPercent;
  });
  let filled = false;
  allSegments.forEach(seg => {
    if (seg.goal !== goal) {
      seg.percent = filled ? seg3 : seg2;
      filled = true;
    }
  });

  // Geographic reach
  const geoByGoal: Record<Goal, GeoRegion[]> = {
    viewers: [
      { region: 'Saudi Arabia', reach: 88, level: 'high',   lat: 24.7,  lng: 46.7 },
      { region: 'UAE',          reach: 82, level: 'high',   lat: 25.2,  lng: 55.3 },
      { region: 'Egypt',        reach: 75, level: 'high',   lat: 30.1,  lng: 31.2 },
      { region: 'Europe',       reach: 58, level: 'medium', lat: 51.5,  lng: 10.0 },
      { region: 'USA',          reach: 50, level: 'medium', lat: 37.1,  lng: -95.7},
      { region: 'Morocco',      reach: 25, level: 'low',    lat: 33.9,  lng: -6.9 },
      { region: 'Tunisia',      reach: 20, level: 'low',    lat: 36.8,  lng: 10.2 },
      { region: 'India',        reach: 42, level: 'medium', lat: 20.6,  lng: 78.9 },
    ],
    sponsors: [
      { region: 'USA',          reach: 85, level: 'high',   lat: 37.1,  lng: -95.7},
      { region: 'UK',           reach: 78, level: 'high',   lat: 51.5,  lng: -0.1 },
      { region: 'Germany',      reach: 72, level: 'high',   lat: 51.2,  lng: 10.4 },
      { region: 'UAE',          reach: 60, level: 'medium', lat: 25.2,  lng: 55.3 },
      { region: 'Saudi Arabia', reach: 52, level: 'medium', lat: 24.7,  lng: 46.7 },
      { region: 'Egypt',        reach: 22, level: 'low',    lat: 30.1,  lng: 31.2 },
      { region: 'Morocco',      reach: 18, level: 'low',    lat: 33.9,  lng: -6.9 },
      { region: 'India',        reach: 35, level: 'medium', lat: 20.6,  lng: 78.9 },
    ],
    applicants: [
      { region: 'India',        reach: 82, level: 'high',   lat: 20.6,  lng: 78.9 },
      { region: 'Egypt',        reach: 76, level: 'high',   lat: 30.1,  lng: 31.2 },
      { region: 'Saudi Arabia', reach: 68, level: 'high',   lat: 24.7,  lng: 46.7 },
      { region: 'USA',          reach: 55, level: 'medium', lat: 37.1,  lng: -95.7},
      { region: 'UK',           reach: 48, level: 'medium', lat: 51.5,  lng: -0.1 },
      { region: 'Morocco',      reach: 22, level: 'low',    lat: 33.9,  lng: -6.9 },
      { region: 'Tunisia',      reach: 20, level: 'low',    lat: 36.8,  lng: 10.2 },
      { region: 'Pakistan',     reach: 30, level: 'medium', lat: 30.4,  lng: 69.3 },
    ],
  };

  // Goal-specific gaps
  const gapsByGoal: Record<Goal, Gap[]> = {
    viewers: [
      { id: 'g1', icon: '🌍', problem: 'Morocco Underreached',    action: 'Generate Arabic short-form clip',  potentialGain: 42 },
      { id: 'g2', icon: '🇺🇸', problem: 'US Audience Untapped',   action: 'Add English hooks in first 3 sec', potentialGain: 38 },
      { id: 'g3', icon: '📱', problem: 'No Short-Form Content',    action: 'Cut 60-second vertical version',   potentialGain: 55 },
    ],
    sponsors: [
      { id: 'g1', icon: '💼', problem: 'Sponsor Reach Low',        action: 'Add ROI stats in first sentence',  potentialGain: 48 },
      { id: 'g2', icon: '🏢', problem: 'B2B Content Missing',      action: 'Create LinkedIn carousel post',    potentialGain: 35 },
      { id: 'g3', icon: '🎯', problem: 'Decision-makers Untapped', action: 'Tag industry leaders directly',    potentialGain: 52 },
    ],
    applicants: [
      { id: 'g1', icon: '🎓', problem: 'Student Audience Missed',  action: 'Post during exam-prep season',     potentialGain: 44 },
      { id: 'g2', icon: '🔗', problem: 'LinkedIn Profile Weak',    action: 'Add apply-now CTA with link',      potentialGain: 37 },
      { id: 'g3', icon: '🌏', problem: 'South Asia Underreached',  action: 'Schedule for IST morning hours',   potentialGain: 50 },
    ],
  };

  return {
    id: Math.random().toString(36).slice(2, 9),
    goal,
    platforms,
    audienceFit: allSegments,
    geographicReach: geoByGoal[goal],
    gaps: gapsByGoal[goal],
    beforeAfter: {
      score:     [62, Math.min(97, platforms[0].score)],
      reach:     [41, 84],
      topRegion: [18, 57],
    },
  };
}

export function generateOptimizedContent(text: string, goal: Goal): string {
  const prefix: Record<Goal, string> = {
    viewers:    '🎬 Optimized for maximum viewer reach:\n\n',
    sponsors:   '💼 Optimized for sponsor engagement:\n\n',
    applicants: '🎓 Optimized to attract applicants:\n\n',
  };
  const suffix: Record<Goal, string> = {
    viewers:    '\n\n✨ Crafted for high engagement. Post Tuesday–Thursday, 6–8 PM for peak reach.\n#trending #viral #content',
    sponsors:   '\n\n📈 ROI-focused framing. Post Monday–Wednesday, 9 AM–12 PM for decision-maker visibility.\n#sponsored #partnership #brand',
    applicants: '\n\n🚀 Apply now → [link in bio]. Post Monday & Tuesday morning for maximum applicant reach.\n#hiring #careers #opportunity',
  };
  return prefix[goal] + text + suffix[goal];
}
