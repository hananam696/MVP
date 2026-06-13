import React from 'react';
import { useAppContext } from '@/lib/store';
import { motion } from 'framer-motion';
import { Smartphone, Users, Clock, TrendingUp, Target, ArrowRight, Sparkles, Star } from 'lucide-react';
import { Goal } from '@/lib/audienceAnalysis';

interface MetricCard {
  label: string;
  title: string;
  value: string;
  unit: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

interface ActionItem {
  action: string;
  priority: 'High' | 'Mid';
}

interface InsightData {
  metrics: MetricCard[];
  summaryText: React.ReactNode;
  summaryTags: string[];
  actions: ActionItem[];
}

function buildInsights(goal: Goal): InsightData {
  if (goal === 'viewers') return {
    metrics: [
      { label: 'Top Platform',   title: 'Instagram',   value: '88',    unit: '/100',      icon: Smartphone,  iconColor: 'text-rose-500',   iconBg: 'bg-rose-50' },
      { label: 'Core Audience',  title: '25–34',       value: '2.3×',  unit: 'eng',       icon: Users,       iconColor: 'text-purple-500', iconBg: 'bg-purple-50' },
      { label: 'Peak Window',    title: 'Mon / Wed',   value: '+43%',  unit: '',          icon: Clock,       iconColor: 'text-amber-500',  iconBg: 'bg-amber-50' },
      { label: 'Growth Play',    title: 'TikTok',      value: '89K',   unit: 'reach',     icon: TrendingUp,  iconColor: 'text-primary',    iconBg: 'bg-primary/10' },
      { label: 'Next Move',      title: 'Go Viral Now', value: '↑',    unit: 'reach',     icon: Target,      iconColor: 'text-green-500',  iconBg: 'bg-green-50' },
    ],
    summaryText: <>Posts with strong visual hooks get <span className="text-primary font-bold">2.7× more views</span> and <span className="text-primary font-bold">41% more shares</span> in the first hour.</>,
    summaryTags: ['Visual Content', 'Short-form', 'MENA'],
    actions: [
      { action: 'Post during peak window (Mon/Wed 6PM)', priority: 'High' },
      { action: 'Add Arabic captions for MENA reach',   priority: 'Mid' },
      { action: 'Repurpose top posts → TikTok',         priority: 'Mid' },
    ],
  };

  if (goal === 'sponsors') return {
    metrics: [
      { label: 'Top Platform',  title: 'LinkedIn',      value: '91',   unit: '/100',   icon: Smartphone,  iconColor: 'text-blue-600',   iconBg: 'bg-blue-50' },
      { label: 'Core Audience', title: '35–44',         value: '1.8×', unit: 'eng',   icon: Users,       iconColor: 'text-purple-500', iconBg: 'bg-purple-50' },
      { label: 'Peak Window',   title: 'Tue / Thu',     value: '+38%', unit: '',       icon: Clock,       iconColor: 'text-amber-500',  iconBg: 'bg-amber-50' },
      { label: 'Growth Play',   title: 'YouTube',       value: '76K',  unit: 'reach', icon: TrendingUp,  iconColor: 'text-primary',    iconBg: 'bg-primary/10' },
      { label: 'Next Move',     title: 'Get a Deal',    value: '↑',    unit: 'clicks',icon: Target,      iconColor: 'text-green-500',  iconBg: 'bg-green-50' },
    ],
    summaryText: <>Posts with real numbers get <span className="text-primary font-bold">2.7× more sponsor clicks</span> and <span className="text-primary font-bold">41% more shares</span> from decision-makers.</>,
    summaryTags: ['Sponsor Strategy', 'Data-Driven', 'Enterprise'],
    actions: [
      { action: 'LinkedIn post with 3 client results',  priority: 'High' },
      { action: 'Translate top posts → Spanish',        priority: 'Mid' },
      { action: 'Repurpose Instagram → LinkedIn',       priority: 'Mid' },
    ],
  };

  return {
    metrics: [
      { label: 'Top Platform',  title: 'LinkedIn',      value: '89',   unit: '/100',   icon: Smartphone,  iconColor: 'text-blue-600',   iconBg: 'bg-blue-50' },
      { label: 'Core Audience', title: '22–28',         value: '2.1×', unit: 'eng',   icon: Users,       iconColor: 'text-purple-500', iconBg: 'bg-purple-50' },
      { label: 'Peak Window',   title: 'Mon / Tue',     value: '+52%', unit: '',       icon: Clock,       iconColor: 'text-amber-500',  iconBg: 'bg-amber-50' },
      { label: 'Growth Play',   title: 'Instagram',     value: '65K',  unit: 'reach', icon: TrendingUp,  iconColor: 'text-primary',    iconBg: 'bg-primary/10' },
      { label: 'Next Move',     title: 'Get Applicants', value: '↑',   unit: 'apply', icon: Target,      iconColor: 'text-green-500',  iconBg: 'bg-green-50' },
    ],
    summaryText: <>Video job posts get <span className="text-primary font-bold">3.2× more applicants</span> and <span className="text-primary font-bold">58% higher quality</span> candidates than text-only posts.</>,
    summaryTags: ['Hiring Content', 'Video First', 'LinkedIn'],
    actions: [
      { action: 'Video job post on LinkedIn + Instagram', priority: 'High' },
      { action: 'Post in Hindi for South Asia reach',     priority: 'Mid' },
      { action: 'Schedule Mon/Tue 8AM posts',             priority: 'Mid' },
    ],
  };
}

export default function Insights() {
  const { currentGoal } = useAppContext();
  const data = buildInsights(currentGoal);

  return (
    <div className="px-10 py-10 max-w-4xl mx-auto space-y-10">
      {/* Hero */}
      <div>
        <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-3">Strategic Insights</p>
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight text-foreground">
          What's <span className="text-primary">Working</span>
        </h1>
        <p className="mt-3 text-muted-foreground text-base">
          AI-distilled signals from your content patterns.
        </p>
      </div>

      {/* 5 metric cards */}
      <div className="grid grid-cols-3 gap-4">
        {data.metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              data-testid={`card-metric-${i}`}
              className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className={`w-9 h-9 rounded-xl ${m.iconBg} flex items-center justify-center`}>
                <Icon className={`w-4.5 h-4.5 ${m.iconColor}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">{m.label}</p>
                <p className="font-bold text-base text-foreground">{m.title}</p>
              </div>
              <div className={`text-2xl font-extrabold ${m.iconColor}`}>
                {m.value}<span className="text-sm font-semibold ml-1 text-muted-foreground">{m.unit}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* AI Summary dark card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        data-testid="card-ai-insight"
        className="rounded-2xl p-7 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f1f33 0%,#0d1b2e 60%,#0a1628 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%,#06B6D4 0%,transparent 60%)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white/15 rounded-lg p-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-white/70">AI Summary</span>
          </div>
          <p className="text-xl font-bold text-white leading-snug mb-5">
            {data.summaryText}
          </p>
          <div className="flex flex-wrap gap-2">
            {data.summaryTags.map(tag => (
              <span key={tag} className="bg-white/10 text-white/70 text-xs font-medium px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Next Actions */}
      <section>
        <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-4">Next Actions</p>
        <div className="bg-white border border-border/50 rounded-2xl shadow-sm overflow-hidden divide-y divide-border/40">
          {data.actions.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              className="flex items-center gap-4 px-5 py-4"
            >
              <Star className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-foreground">{item.action}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                item.priority === 'High'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>{item.priority}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
