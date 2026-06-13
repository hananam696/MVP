import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiInstagram, SiTiktok, SiYoutube, SiX } from 'react-icons/si';
import { AlertTriangle, Sparkles, Globe, ArrowRight, Loader2, CheckCircle2, Linkedin, FileText, CalendarDays, Clock, Zap, Users, TrendingUp, ImagePlus, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/lib/store';
import { analyzeContent, generateOptimizedContent, Goal, AnalysisResult } from '@/lib/audienceAnalysis';

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: SiInstagram,
  tiktok: SiTiktok,
  linkedin: Linkedin,
  youtube: SiYoutube,
  x: SiX,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  tiktok: '#010101',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  x: '#14171A',
};

const GOAL_ICONS: Record<Goal, React.ElementType> = {
  applicants: Users,
  viewers: Globe,
  sponsors: Zap,
};

function CircleScore({ score, size = 90, strokeWidth = 6, color = '#06B6D4' }: {
  score: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

function CircleScoreLight({ score, size = 56, strokeWidth = 4, color = '#14B8A6' }: {
  score: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

function AudienceRing({ percent, color, size = 80 }: { percent: number; color: string; size?: number }) {
  const sw = 7;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

function formatReach(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function getQualityLabel(q: number): string {
  if (q >= 85) return 'Excellent';
  if (q >= 70) return 'Good';
  if (q >= 55) return 'Moderate';
  return 'Low';
}

function QualityBadge({ quality }: { quality: string }) {
  const styles: Record<string, string> = {
    Excellent: 'text-primary border border-primary/30 bg-primary/8',
    Good:      'text-secondary border border-secondary/30 bg-secondary/8',
    Moderate:  'text-amber-600 border border-amber-300 bg-amber-50',
    Low:       'text-rose-500 border border-rose-300 bg-rose-50',
  };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${styles[quality] ?? styles.Low}`}>
      {quality}
    </span>
  );
}

const GEO_BAR: Record<string, { bar: string; badge: string; label: string }> = {
  high:   { bar: 'bg-primary',   badge: 'bg-primary/10 text-primary',         label: 'Strong' },
  medium: { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-600',          label: 'Growing' },
  low:    { bar: 'bg-rose-400',  badge: 'bg-rose-50 text-rose-500',            label: 'Weak' },
};

export default function Predict() {
  const { currentGoal, setCurrentGoal, lastAnalysis, setLastAnalysis } = useAppContext();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!content.trim() && !attachedImage) return;
    setIsAnalyzing(true);
    setOptimizedContent('');
    await new Promise(r => setTimeout(r, 1200));
    setLastAnalysis(analyzeContent(content, currentGoal));
    setIsAnalyzing(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setOptimizedContent(generateOptimizedContent(content, currentGoal));
    setIsGenerating(false);
  };

  const handleClear = () => {
    setContent('');
    setAttachedImage(null);
    setOptimizedContent('');
    setLastAnalysis(null);
    setIsDemo(false);
  };

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttachedImage(url);
    e.target.value = '';
  };

  const best = lastAnalysis?.platforms[0];
  const others = lastAnalysis?.platforms.slice(1) ?? [];

  return (
    <div className="px-10 py-10 max-w-4xl mx-auto space-y-10">

      {/* Hero */}
      <div>
        <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-3">AI Audience Copilot</p>
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight text-foreground">
          Predict Before<br /><span className="text-primary">You Post</span>
        </h1>
        <p className="mt-3 text-muted-foreground text-base">
          Paste content → get platform, timing, audience &amp; reach insights instantly.
        </p>
      </div>

      {/* Input card */}
      <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
              <FileText className="w-3.5 h-3.5" /> Content
            </div>
            {(content || attachedImage || lastAnalysis) && (
              <button onClick={handleClear}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 transition-colors">
                <RotateCcw className="w-3 h-3" /> New analysis
              </button>
            )}
          </div>

          {/* Image preview */}
          {attachedImage && (
            <div className="relative mb-3 inline-block">
              <img src={attachedImage} alt="Attached" className="h-28 rounded-xl object-cover border border-border/50 shadow-sm" />
              <button onClick={() => setAttachedImage(null)}
                className="absolute -top-2 -right-2 bg-white border border-border/60 rounded-full p-0.5 shadow-sm hover:bg-rose-50 transition-colors">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          )}

          <textarea
            data-testid="input-content"
            placeholder="Paste your caption, post, or campaign content — or upload an image above…"
            className="w-full min-h-[140px] text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none bg-transparent leading-relaxed"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        <div className="border-t border-border/40 px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Image upload */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageAttach} />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border border-border/50 rounded-full px-3 py-1.5 hover:bg-muted/50 hover:text-foreground transition-colors">
              <ImagePlus className="w-3.5 h-3.5" />
              {attachedImage ? 'Change image' : 'Add image'}
            </button>

            {/* Goal pills */}
            <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Goal</span>
            <div className="flex items-center gap-1">
              {(['applicants', 'viewers', 'sponsors'] as Goal[]).map(g => {
                const Icon = GOAL_ICONS[g];
                const active = currentGoal === g;
                return (
                  <button key={g} onClick={() => setCurrentGoal(g)} data-testid={`btn-goal-${g}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      active ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}>
                    <Icon className="w-3 h-3" />{g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <Button data-testid="btn-analyze" className="px-5 h-9 text-sm font-semibold rounded-full shadow-sm flex-shrink-0"
            onClick={handleAnalyze} disabled={isAnalyzing || (!content.trim() && !attachedImage)}>
            {isAnalyzing
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
              : <><Sparkles className="mr-2 h-4 w-4" />Analyze</>}
          </Button>
        </div>
      </div>

      {/* ── Results ── */}
      <AnimatePresence>
        {lastAnalysis && !isAnalyzing && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="space-y-10">

            {/* PLATFORM MATCH */}
            <Section label="Platform Match">
              {/* Dark hero card */}
              {best && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                  className="relative rounded-2xl overflow-hidden mb-4"
                  style={{ background: 'linear-gradient(135deg,#0f1f33 0%,#0d1b2e 60%,#0a1628 100%)' }}>
                  <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 80% 50%,#06B6D4 0%,transparent 60%)' }} />
                  <div className="relative p-7 flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-yellow-400 text-xs">🏆</span>
                        <span className="text-[11px] font-bold tracking-widest text-white/50 uppercase">Best Match</span>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        {React.createElement(PLATFORM_ICONS[best.id] ?? Globe, { className: 'w-9 h-9 text-white' })}
                        <span className="text-4xl font-extrabold text-white tracking-tight">{best.name}</span>
                      </div>
                      <p className="text-white/50 text-sm mb-5">
                        {lastAnalysis.goal === 'viewers' ? 'Highest viewer engagement for visual content'
                          : lastAnalysis.goal === 'sponsors' ? 'Best sponsor discovery and professional reach'
                          : 'Top platform for applicant attraction'}
                      </p>
                      <div className="flex gap-2">
                        <div className="bg-white/10 rounded-lg px-3 py-1.5">
                          <span className="text-[10px] text-white/40 uppercase tracking-wide block">Est. Reach</span>
                          <span className="text-sm font-bold text-white">{formatReach(best.reach)}</span>
                        </div>
                        <div className="bg-white/10 rounded-lg px-3 py-1.5">
                          <span className="text-[10px] text-white/40 uppercase tracking-wide block">Quality</span>
                          <span className="text-sm font-bold text-white">{getQualityLabel(best.reachQuality)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="relative">
                        <CircleScore score={best.score} size={90} strokeWidth={6} color="#06B6D4" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-extrabold text-white">{best.score}</span>
                        </div>
                      </div>
                      <span className="text-xs text-white/40">{best.confidence}% confidence</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Other platforms */}
              <div className="grid grid-cols-4 gap-3">
                {others.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }}
                    className="bg-white border border-border/50 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-shadow">
                    {React.createElement(PLATFORM_ICONS[p.id] ?? Globe, { className: 'w-6 h-6', style: { color: PLATFORM_COLORS[p.id] } })}
                    <span className="text-xs font-semibold text-foreground">{p.name}</span>
                    <div className="relative">
                      <CircleScoreLight score={p.score} size={52} strokeWidth={4} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-foreground">{p.score}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatReach(p.reach)}</span>
                  </motion.div>
                ))}
              </div>
            </Section>

            {/* POSTING STRATEGY */}
            <Section label="Posting Strategy">
              <div className="space-y-2">
                {lastAnalysis.platforms.map((p, i) => {
                  const quality = getQualityLabel(p.reachQuality);
                  return (
                    <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                      className="bg-white border border-border/50 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
                      {React.createElement(PLATFORM_ICONS[p.id] ?? Globe, { className: 'w-5 h-5 flex-shrink-0', style: { color: PLATFORM_COLORS[p.id] } })}
                      <span className="font-semibold text-sm text-foreground w-24 flex-shrink-0">{p.name}</span>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarDays className="w-3.5 h-3.5" />{p.bestDay}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />{p.bestTime}
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1,2,3].map(b => (
                            <div key={b} className={`w-0.5 rounded-full ${b <= (quality === 'Excellent' ? 3 : quality === 'Good' ? 2 : quality === 'Moderate' ? 1 : 0) ? 'bg-primary' : 'bg-muted'}`}
                              style={{ height: b === 1 ? 8 : b === 2 ? 12 : 16 }} />
                          ))}
                        </div>
                        <QualityBadge quality={quality} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Section>

            {/* AUDIENCE FIT */}
            <Section label="Audience Fit">
              <div className="grid grid-cols-3 gap-4">
                {lastAnalysis.audienceFit.map((seg, i) => {
                  const isGoal = seg.goal === lastAnalysis.goal;
                  return (
                    <motion.div key={seg.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
                      className={`bg-white rounded-2xl p-6 flex flex-col items-center gap-3 shadow-sm border-2 transition-all ${
                        isGoal ? 'border-primary shadow-primary/10 shadow-md' : 'border-border/50'
                      }`}>
                      <div className="relative">
                        <AudienceRing percent={seg.percent} color={seg.color} size={90} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-extrabold" style={{ color: seg.color }}>{seg.percent}%</span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{seg.label}</span>
                      {isGoal && (
                        <span className="text-[10px] font-bold tracking-wide text-primary border border-primary/30 bg-primary/5 px-2 py-0.5 rounded-full">
                          Your Goal
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </Section>

            {/* REGIONAL REACH */}
            <Section label="Regional Reach">
              <div className="bg-white border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 pt-5 pb-6 space-y-3">
                  {[...lastAnalysis.geographicReach]
                    .sort((a, b) => b.reach - a.reach)
                    .map((r, i) => {
                      const g = GEO_BAR[r.level];
                      return (
                        <motion.div key={r.region}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.06 }}
                          className="flex items-center gap-4">
                          <span className="text-sm font-medium text-foreground w-36 flex-shrink-0 truncate">{r.region}</span>
                          <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${g.bar}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${r.reach}%` }}
                              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 + i * 0.06 }}
                            />
                          </div>
                          <span className="text-sm font-bold text-foreground w-10 text-right flex-shrink-0">{r.reach}%</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-16 text-center flex-shrink-0 ${g.badge}`}>{g.label}</span>
                        </motion.div>
                      );
                    })}
                </div>
                <div className="flex items-center gap-6 px-6 py-3 border-t border-border/40 bg-muted/20">
                  {[['bg-primary','bg-primary/10 text-primary','Strong'],['bg-amber-400','bg-amber-50 text-amber-600','Growing'],['bg-rose-400','bg-rose-50 text-rose-500','Weak']].map(([bar, badge, label]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${bar}`} />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* AUDIENCE & REGION GAPS */}
            <Section label="Audience & Region Gaps">
              <div className="grid grid-cols-3 gap-4">
                {lastAnalysis.gaps.map((gap, i) => (
                  <motion.div key={gap.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
                    className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                    <div className="text-2xl">{gap.icon}</div>
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-semibold text-foreground">{gap.problem}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {gap.action}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      <span className="text-base font-bold text-primary">+{gap.potentialGain}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Section>

            {/* AI OPTIMIZATION */}
            <Section label="AI Optimization">
              <button
                data-testid="btn-generate-optimized"
                onClick={handleGenerate}
                disabled={isGenerating || !!optimizedContent}
                className="w-full rounded-2xl p-6 flex items-center justify-between group transition-all hover:opacity-90 disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg,#06B6D4 0%,#14B8A6 100%)' }}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 rounded-xl p-3">
                    {isGenerating
                      ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                      : optimizedContent
                      ? <CheckCircle2 className="w-6 h-6 text-white" />
                      : <Sparkles className="w-6 h-6 text-white" />}
                  </div>
                  <div className="text-left">
                    <p className="text-base font-bold text-white">
                      {isGenerating ? 'Optimizing Content...' : optimizedContent ? 'Content Optimized' : 'Generate Improved Version'}
                    </p>
                    <p className="text-sm text-white/70">Rewrite content aligned to your goal</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
              </button>

              {optimizedContent && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
                  {/* Optimized content full-width */}
                  <div className="bg-white border border-primary/20 rounded-2xl shadow-sm overflow-hidden">
                    <div className="bg-primary/5 px-5 py-3 border-b border-primary/10 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Optimized Content</span>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{optimizedContent}</p>
                      <button onClick={() => navigator.clipboard.writeText(optimizedContent)}
                        className="mt-4 text-xs font-semibold text-muted-foreground border border-border/50 rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-colors">
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Expected After 2×2 grid */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Expected After Posting</p>
                        <p className="text-xs text-muted-foreground mt-0.5">What you can expect if you post this optimized version now</p>
                      </div>
                      <button
                        onClick={handleGenerate}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
                        </svg>
                        Refresh
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {getBeforeAfterCards(currentGoal, lastAnalysis).map((card, i) => (
                        <BeforeAfterCard key={i} {...card} delay={i * 0.08} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </Section>

          </motion.div>
        )}
      </AnimatePresence>

      {!lastAnalysis && !isAnalyzing && (
        <div className="py-20 text-center text-muted-foreground/40">
          <Globe className="w-14 h-14 mx-auto mb-4" />
          <p className="text-base font-medium text-muted-foreground/60">Your analysis will appear here</p>
          <p className="text-sm mt-1">Paste content above and hit Analyze</p>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-4">{label}</p>
      {children}
    </section>
  );
}

interface BACard { label: string; before: string; after: string; gainPct: string; beforeNum: number; afterNum: number; maxVal: number; }

function getBeforeAfterCards(goal: Goal, analysis: AnalysisResult): BACard[] {
  const best = analysis.platforms[0];
  const platName = best?.name ?? 'Platform';
  if (goal === 'viewers') return [
    { label: `${platName} Score`,  before: '55',   after: '91',   gainPct: '+65%',  beforeNum: 55, afterNum: 91,  maxVal: 100 },
    { label: 'Viewer Reach',       before: '41%',  after: '84%',  gainPct: '+105%', beforeNum: 41, afterNum: 84,  maxVal: 100 },
    { label: 'Morocco Reach',      before: '18%',  after: '57%',  gainPct: '+217%', beforeNum: 18, afterNum: 57,  maxVal: 100 },
    { label: 'Avg Watch Time',     before: '22%',  after: '71%',  gainPct: '+223%', beforeNum: 22, afterNum: 71,  maxVal: 100 },
  ];
  if (goal === 'sponsors') return [
    { label: `${platName} Score`,      before: '55',  after: '89',  gainPct: '+62%',  beforeNum: 55, afterNum: 89, maxVal: 100 },
    { label: 'Sponsor Clicks',         before: '18%', after: '56%', gainPct: '+211%', beforeNum: 18, afterNum: 56, maxVal: 100 },
    { label: 'Decision Maker Reach',   before: '22%', after: '68%', gainPct: '+209%', beforeNum: 22, afterNum: 68, maxVal: 100 },
    { label: 'Content Engagement',     before: '15%', after: '52%', gainPct: '+247%', beforeNum: 15, afterNum: 52, maxVal: 100 },
  ];
  return [
    { label: `${platName} Score`,  before: '55',  after: '91',  gainPct: '+65%',  beforeNum: 55, afterNum: 91, maxVal: 100 },
    { label: 'Applicant Reach',    before: '41%', after: '84%', gainPct: '+105%', beforeNum: 41, afterNum: 84, maxVal: 100 },
    { label: 'Top Region Reach',   before: '18%', after: '57%', gainPct: '+217%', beforeNum: 18, afterNum: 57, maxVal: 100 },
    { label: 'Apply Rate',         before: '22%', after: '71%', gainPct: '+223%', beforeNum: 22, afterNum: 71, maxVal: 100 },
  ];
}

function BeforeAfterCard({ label, before, after, gainPct, beforeNum, afterNum, maxVal, delay }: BACard & { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="font-semibold text-sm text-foreground">{label}</span>
        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
          <TrendingUp className="w-3.5 h-3.5" />{gainPct}
        </div>
      </div>
      <div className="flex items-end gap-2 mb-4">
        <div>
          <span className="text-xs text-muted-foreground block mb-0.5">Before</span>
          <span className="text-2xl font-bold text-muted-foreground/60">{before}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground/40 mb-1.5 flex-shrink-0" />
        <div>
          <span className="text-xs text-primary block mb-0.5">After</span>
          <span className="text-2xl font-bold text-foreground">{after}</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: `${(beforeNum / maxVal) * 100}%` }}
          animate={{ width: `${(afterNum / maxVal) * 100}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: delay + 0.3 }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#06B6D4,#14B8A6)' }}
        />
      </div>
    </motion.div>
  );
}
