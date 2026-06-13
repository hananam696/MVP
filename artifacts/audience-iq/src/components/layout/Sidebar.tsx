import React from 'react';
import { Link, useLocation } from 'wouter';
import { Target, TrendingUp, Lightbulb, Zap } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Predict & Optimize', boldLabel: 'Predict', restLabel: ' & Optimize', icon: Target },
  { path: '/audience-growth', label: 'Audience Growth', boldLabel: 'Audience', restLabel: ' Growth', icon: TrendingUp },
  { path: '/insights', label: 'Insights', boldLabel: 'Insights', restLabel: '', icon: Lightbulb },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-56 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-background border-r border-border/50 py-6 px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="bg-primary text-primary-foreground w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
          <Zap className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-bold text-base leading-tight text-foreground">AudienceIQ</div>
          <div className="text-xs font-medium text-primary">AI Copilot</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-primary/8 text-foreground border-l-2 border-primary pl-[10px]'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
                />
                <span>
                  <span className={`font-semibold ${isActive ? 'text-foreground' : ''}`}>{item.boldLabel}</span>
                  <span className={`font-normal ${isActive ? 'text-muted-foreground' : ''}`}>{item.restLabel}</span>
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* AI Active badge */}
      <div className="px-2">
        <div className="bg-primary/8 border border-primary/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
          <span className="text-xs font-semibold text-primary">AI Active</span>
        </div>
      </div>
    </aside>
  );
}
