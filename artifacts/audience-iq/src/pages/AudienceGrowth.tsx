import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Info, ChevronRight, Target, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Galaxy() {
  const { analysisResult } = useAppStore();
  const [selectedPlanet, setSelectedPlanet] = useState<any>(null);

  if (!analysisResult) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_50px_rgba(168,85,247,0.3)]">
          <Rocket className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold">Galaxy Uncharted</h1>
        <p className="text-xl text-muted-foreground max-w-lg">
          No content has been analyzed yet. Head back to the bridge to chart your course.
        </p>
        <Link href="/">
          <Button size="lg" className="bg-primary hover:bg-primary/90 mt-4">
            Go to Analyze
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate orbits
  const planets = analysisResult.audiences.map((aud, i) => {
    const score = aud.matchScore || aud.score;
    // Map score (0-100) to orbit distance (closer is better, so reverse it)
    const distance = 100 + (100 - score) * 3; // orbit radius in px
    const duration = 20 + (100 - score) * 0.5; // orbit speed in seconds
    const color = score >= 70 ? "bg-cyan-400" : score >= 45 ? "bg-purple-400" : "bg-yellow-400";
    const shadowColor = score >= 70 ? "rgba(34,211,238,0.5)" : score >= 45 ? "rgba(192,132,252,0.5)" : "rgba(250,204,21,0.5)";
    
    return { ...aud, score, distance, duration, color, shadowColor, index: i };
  });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center pb-20">
      <div className="w-full mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Audience Galaxy</h1>
        <p className="text-muted-foreground">The closer the planet, the stronger the match.</p>
      </div>

      {/* Solar System container */}
      <div className="relative w-full max-w-4xl aspect-square flex items-center justify-center mb-16">
        {/* Central Star (The Content) */}
        <div className="absolute z-10 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-200 to-orange-500 shadow-[0_0_60px_rgba(249,115,22,0.8)] animate-pulse flex items-center justify-center">
          <span className="text-black font-bold text-xs">Content</span>
        </div>

        {/* Orbit Rings & Planets */}
        {planets.map((planet) => (
          <div key={planet.name} className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Ring */}
            <div 
              className="absolute border border-white/5 rounded-full"
              style={{ width: planet.distance * 2, height: planet.distance * 2 }}
            />
            {/* Planet wrapper for rotation */}
            <motion.div
              className="absolute flex items-center justify-center pointer-events-auto"
              style={{ width: planet.distance * 2, height: planet.distance * 2 }}
              animate={{ rotate: 360 }}
              transition={{ duration: planet.duration, repeat: Infinity, ease: "linear" }}
            >
              {/* Planet itself */}
              <div
                className="absolute top-0 -translate-y-1/2 cursor-pointer group"
                onClick={() => setSelectedPlanet(planet)}
              >
                <div 
                  className={`w-6 h-6 rounded-full ${planet.color} relative transition-transform hover:scale-150`}
                  style={{ boxShadow: `0 0 20px ${planet.shadowColor}` }}
                >
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs border border-white/10 pointer-events-none">
                    {planet.name}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Bottom Data Section */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Target className="w-6 h-6 text-cyan-400" />
            Content DNA Profile
          </h2>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6 space-y-5">
              {analysisResult.scores.map((score, i) => (
                <div key={score.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-white">{score.label}</span>
                    <span className="text-cyan-400 font-bold">{score.score}/100</span>
                  </div>
                  <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${score.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="absolute left-0 top-0 bottom-0 bg-cyan-400" 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            Audience Opportunities
          </h2>
          <div className="space-y-4">
            {analysisResult.missingAudiences.map((miss, i) => (
              <Card key={i} className="bg-yellow-500/5 border-yellow-500/20">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-yellow-500 mb-1">{miss.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{miss.whyMissing}</p>
                  <div className="bg-black/30 p-3 rounded-md border border-white/5">
                    <p className="text-xs font-medium text-white mb-1">How to reach:</p>
                    <p className="text-xs text-gray-400">{miss.howToReach}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {selectedPlanet && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed right-0 top-0 h-screen w-96 bg-card/95 backdrop-blur-2xl border-l border-white/10 z-50 p-6 overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${selectedPlanet.color}`} />
                <h2 className="text-xl font-bold text-white">{selectedPlanet.name}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPlanet(null)}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <span className="text-muted-foreground">Match Score</span>
                <span className="text-2xl font-bold text-white">{selectedPlanet.score}%</span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Why it matches
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed bg-white/5 p-3 rounded-md">
                  {selectedPlanet.whyMatches}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-2">Key Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPlanet.interests?.map((int: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
                      {int}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-xs text-muted-foreground block mb-1">Platform</span>
                  <span className="text-sm font-medium text-white">{selectedPlanet.recommendedPlatform}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-xs text-muted-foreground block mb-1">Format</span>
                  <span className="text-sm font-medium text-white">{selectedPlanet.suggestedFormat}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
