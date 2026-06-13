import React from 'react';
import { useAppContext } from '@/lib/store';
import { Users, Globe, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Goal } from '@/lib/audienceAnalysis';

interface GrowthCard {
  icon: string;
  iconBg: string;
  title: string;
  reason: string;
  action: string;
  gain: string;
}

function buildData(goal: Goal): {
  audiences: GrowthCard[];
  regions: GrowthCard[];
  languages: GrowthCard[];
  growth: GrowthCard[];
} {
  if (goal === 'viewers') return {
    audiences: [
      { icon: '👥', iconBg: 'bg-purple-100', title: 'Gen Z (18–24)', reason: 'Only 12% resonance', action: 'Short-form, trend-led hooks', gain: '+58%' },
      { icon: '👥', iconBg: 'bg-purple-100', title: 'Night Owls (11PM–2AM)', reason: 'Zero prime-time posts', action: 'Schedule late-night drops', gain: '+41%' },
    ],
    regions: [
      { icon: '🌍', iconBg: 'bg-amber-100', title: 'MENA Region', reason: '< 3% reach', action: 'Arabic + French bilingual posts', gain: '+47%' },
      { icon: '🌏', iconBg: 'bg-amber-100', title: 'Southeast Asia', reason: 'Zero local content', action: 'Adapt for Bahasa + Thai', gain: '+52%' },
    ],
    languages: [
      { icon: '🔤', iconBg: 'bg-rose-100', title: 'Spanish Gap', reason: '350M+ speakers, 0 content', action: 'Translate + culturally adapt top 5', gain: '+65%' },
      { icon: '🔤', iconBg: 'bg-rose-100', title: 'Hindi Content', reason: '#1 Indian language untapped', action: 'Hindi captions + voiceovers', gain: '+38%' },
    ],
    growth: [
      { icon: '🚀', iconBg: 'bg-green-100', title: 'Cross-Platform', reason: '1.5 platforms avg', action: 'Auto-adapt to 3+ platforms', gain: '+120%' },
      { icon: '🚀', iconBg: 'bg-green-100', title: 'Posting Cadence', reason: 'Irregular schedule', action: '4×/week at optimal times', gain: '+28%' },
    ],
  };

  if (goal === 'sponsors') return {
    audiences: [
      { icon: '👥', iconBg: 'bg-purple-100', title: 'Enterprise Decision Makers', reason: 'No proof points', action: 'Add case studies + metrics', gain: '+41%' },
      { icon: '👥', iconBg: 'bg-purple-100', title: 'Mid-Market CTOs', reason: 'Zero tech content', action: 'Publish weekly data insights', gain: '+63%' },
    ],
    regions: [
      { icon: '🌍', iconBg: 'bg-amber-100', title: 'Western Europe', reason: 'Low brand presence', action: 'LinkedIn campaigns in DACH', gain: '+47%' },
      { icon: '🌎', iconBg: 'bg-amber-100', title: 'North America', reason: 'Cold outreach only', action: 'Warm up via content first', gain: '+55%' },
    ],
    languages: [
      { icon: '🔤', iconBg: 'bg-rose-100', title: 'German Gap', reason: 'DACH market untapped', action: 'German-language LinkedIn posts', gain: '+72%' },
      { icon: '🔤', iconBg: 'bg-rose-100', title: 'French Content', reason: '30M EU speakers missed', action: 'French business content', gain: '+44%' },
    ],
    growth: [
      { icon: '🚀', iconBg: 'bg-green-100', title: 'Case Studies', reason: 'No social proof posted', action: '3 client stories per month', gain: '+85%' },
      { icon: '🚀', iconBg: 'bg-green-100', title: 'LinkedIn Cadence', reason: 'Post once a month', action: '3× weekly thought leadership', gain: '+96%' },
    ],
  };

  return {
    audiences: [
      { icon: '👥', iconBg: 'bg-purple-100', title: 'Gen Z (18–24)', reason: 'Only 12% resonance', action: 'Short-form, trend-led hooks', gain: '+58%' },
      { icon: '👥', iconBg: 'bg-purple-100', title: 'Career Switchers', reason: 'No transition content', action: 'Show learning + growth path', gain: '+47%' },
    ],
    regions: [
      { icon: '🌏', iconBg: 'bg-amber-100', title: 'South Asia', reason: 'Low brand awareness', action: 'Post in IST morning hours', gain: '+52%' },
      { icon: '🌍', iconBg: 'bg-amber-100', title: 'MENA Region', reason: 'No Arabic job content', action: 'Arabic + English job posts', gain: '+44%' },
    ],
    languages: [
      { icon: '🔤', iconBg: 'bg-rose-100', title: 'Hindi Content', reason: '600M speakers missed', action: 'Hindi job descriptions', gain: '+61%' },
      { icon: '🔤', iconBg: 'bg-rose-100', title: 'Arabic Gap', reason: '400M speakers, 0 content', action: 'Arabic captions + posts', gain: '+48%' },
    ],
    growth: [
      { icon: '🚀', iconBg: 'bg-green-100', title: 'Video Job Posts', reason: 'Text-only listings', action: '60-sec video job previews', gain: '+110%' },
      { icon: '🚀', iconBg: 'bg-green-100', title: 'Posting Cadence', reason: 'Irregular schedule', action: 'Mon/Tue mornings for max reach', gain: '+32%' },
    ],
  };
}

function GrowthCardItem({ card, delay }: { card: GrowthCard; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
    >
      <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center text-lg`}>
        {card.icon}
      </div>
      <div>
        <h3 className="font-semibold text-base text-foreground">{card.title}</h3>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
        {card.reason}
      </div>
      <div className="flex items-center gap-1.5 text-sm text-foreground/80">
        <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        {card.action}
      </div>
      <div className="flex items-center gap-1.5 pt-1">
        <TrendingUp className="w-3.5 h-3.5 text-primary" />
        <span className="font-bold text-primary text-base">{card.gain}</span>
      </div>
    </motion.div>
  );
}

function SectionBlock({ label, cards, startDelay }: { label: string; cards: GrowthCard[]; startDelay: number }) {
  return (
    <section>
      <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-4">{label}</p>
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card, i) => (
          <GrowthCardItem key={card.title} card={card} delay={startDelay + i * 0.08} />
        ))}
      </div>
    </section>
  );
}

export default function AudienceGrowth() {
  const { currentGoal } = useAppContext();
  const data = buildData(currentGoal);

  return (
    <div className="px-10 py-10 max-w-4xl mx-auto space-y-10">
      {/* Hero */}
      <div>
        <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-3">Audience Intelligence</p>
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight text-foreground">
          Who You're<br /><span className="text-primary">Missing</span>
        </h1>
        <p className="mt-3 text-muted-foreground text-base">
          Unlock audiences, regions &amp; languages you haven't reached yet.
        </p>
      </div>

      <SectionBlock label="Most Missed Audiences" cards={data.audiences} startDelay={0.1} />
      <SectionBlock label="Most Missed Regions"   cards={data.regions}   startDelay={0.2} />
      <SectionBlock label="Language Opportunities" cards={data.languages} startDelay={0.3} />
      <SectionBlock label="Growth Opportunities"   cards={data.growth}    startDelay={0.4} />
    </div>
  );
}
