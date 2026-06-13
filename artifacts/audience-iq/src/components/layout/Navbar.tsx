import React from 'react';
import { Link, useLocation } from 'wouter';
import { Target, TrendingUp, Lightbulb } from 'lucide-react';

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Predict & Optimize', icon: Target },
    { path: '/audience-growth', label: 'Audience Growth', icon: TrendingUp },
    { path: '/insights', label: 'Insights', icon: Lightbulb },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center mx-auto px-4 md:px-8">
        <div className="flex items-center gap-2 mr-8">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <Target className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">AudienceIQ</span>
          <span className="ml-2 inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent ring-1 ring-inset ring-accent/20">
            AI Powered
          </span>
        </div>
        
        <div className="flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`transition-colors hover:text-foreground/80 flex items-center gap-2 ${
                  isActive ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
