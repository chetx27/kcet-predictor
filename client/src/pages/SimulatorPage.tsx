import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { predictColleges } from '../api';
import { GlassCard } from '../components/GlassCard';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import type { VerticalCategory, HorizontalFlag } from '../../../shared/types';

const categories: VerticalCategory[] = ['GM', 'SC', 'ST', 'Cat1', '2A', '2B', '3A', '3B', 'EWS'];

export function SimulatorPage() {
  const [rank, setRank] = useState(10000);
  const [category, setCategory] = useState<VerticalCategory>('GM');
  const [flags] = useState<HorizontalFlag[]>([]);
  const [kcetMarks, setKcetMarks] = useState(120);
  const [boardPhysics, setBoardPhysics] = useState(80);
  const [boardChemistry, setBoardChemistry] = useState(80);
  const [boardMath, setBoardMath] = useState(80);
  const [mode, setMode] = useState<'rank' | 'score'>('rank');

  const effectiveRank = useMemo(() => {
    if (mode === 'rank') return rank;
    const puPercentage = ((boardPhysics + boardChemistry + boardMath) / 300) * 100;
    // Estimate rank from score
    return Math.max(1, Math.round((180 - kcetMarks) * 1200 - (puPercentage - 50) * 80));
  }, [mode, rank, kcetMarks, boardPhysics, boardChemistry, boardMath]);

  const { data, isLoading } = useQuery({
    queryKey: ['simulator', effectiveRank, category, flags],
    queryFn: () =>
      predictColleges({
        rank: effectiveRank,
        vertical_category: category,
        horizontal_flags: flags,
        preferred_branches: [],
        preferred_districts: [],
        college_type: 'all',
        stream: 'engineering',
      }),
    enabled: effectiveRank > 0,
  });

  const safeCount = data?.results.filter((r) => r.probability === 'safe').length || 0;
  const moderateCount = data?.results.filter((r) => r.probability === 'moderate').length || 0;
  const reachCount = data?.results.filter((r) => r.probability === 'reach').length || 0;
  const total = data?.total || 0;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">
            What-If Simulator
          </h1>
          <p className="text-sm text-text-secondary mt-1.5">
            Drag the slider to see how rank changes affect your options
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left — Controls */}
          <div className="lg:col-span-2 space-y-5">
            {/* Mode toggle */}
            <GlassCard>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setMode('rank')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all border ${
                    mode === 'rank'
                      ? 'bg-brand-indigo/10 text-brand-soft border-brand-indigo/25'
                      : 'bg-bg-elevated/50 text-text-muted border-bg-border'
                  }`}
                >
                  By Rank
                </button>
                <button
                  onClick={() => setMode('score')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all border ${
                    mode === 'score'
                      ? 'bg-brand-indigo/10 text-brand-soft border-brand-indigo/25'
                      : 'bg-bg-elevated/50 text-text-muted border-bg-border'
                  }`}
                >
                  By Score
                </button>
              </div>

              {mode === 'rank' ? (
                <div>
                  <label className="text-xs text-text-muted mb-2 block">
                    Rank: <span className="text-text-primary font-semibold">{rank.toLocaleString('en-IN')}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={150000}
                    step={100}
                    value={rank}
                    onChange={(e) => setRank(Number(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>1</span>
                    <span>1,50,000</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">
                      KCET Marks: <span className="text-text-primary font-semibold">{kcetMarks}/180</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={180}
                      step={1}
                      value={kcetMarks}
                      onChange={(e) => setKcetMarks(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">
                      Board Physics: <span className="text-text-primary font-semibold">{boardPhysics}/100</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={boardPhysics}
                      onChange={(e) => setBoardPhysics(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">
                      Board Chemistry: <span className="text-text-primary font-semibold">{boardChemistry}/100</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={boardChemistry}
                      onChange={(e) => setBoardChemistry(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-2 block">
                      Board Math: <span className="text-text-primary font-semibold">{boardMath}/100</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={boardMath}
                      onChange={(e) => setBoardMath(Number(e.target.value))}
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    Est. rank: <span className="text-text-primary font-semibold">{effectiveRank.toLocaleString('en-IN')}</span>
                  </p>
                </div>
              )}
            </GlassCard>

            {/* Category */}
            <GlassCard>
              <label className="text-xs text-text-muted mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                      category === c
                        ? 'bg-brand-indigo/10 text-brand-soft border-brand-indigo/25'
                        : 'bg-bg-elevated/50 text-text-muted border-bg-border'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Right — Live Results */}
          <div className="lg:col-span-3 space-y-5">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-3">
              <GlassCard className="p-4 text-center">
                <div className="text-2xl font-heading font-bold text-text-primary">
                  {isLoading ? <Skeleton className="w-12 h-8 mx-auto" /> : <AnimatedNumber value={total} />}
                </div>
                <p className="text-xs text-text-muted mt-1">Total</p>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <div className="text-2xl font-heading font-bold text-status-safe">
                  {isLoading ? <Skeleton className="w-8 h-8 mx-auto" /> : <AnimatedNumber value={safeCount} />}
                </div>
                <p className="text-xs text-text-muted mt-1">Safe</p>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <div className="text-2xl font-heading font-bold text-status-moderate">
                  {isLoading ? <Skeleton className="w-8 h-8 mx-auto" /> : <AnimatedNumber value={moderateCount} />}
                </div>
                <p className="text-xs text-text-muted mt-1">Moderate</p>
              </GlassCard>
              <GlassCard className="p-4 text-center">
                <div className="text-2xl font-heading font-bold text-status-reach">
                  {isLoading ? <Skeleton className="w-8 h-8 mx-auto" /> : <AnimatedNumber value={reachCount} />}
                </div>
                <p className="text-xs text-text-muted mt-1">Reach</p>
              </GlassCard>
            </div>

            {/* Top colleges preview */}
            <GlassCard>
              <h3 className="text-sm font-medium text-text-primary mb-3">Top Colleges at This Rank</h3>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : data && data.results.length > 0 ? (
                <div className="space-y-2">
                  {data.results.slice(0, 8).map((r) => (
                    <div
                      key={`${r.college.id}-${r.branch.id}`}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-bg-elevated/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-primary truncate">{r.college.name}</p>
                        <p className="text-xs text-text-muted">{r.branch.short_name || r.branch.name}</p>
                      </div>
                      <Badge variant={r.probability} className="ml-3 flex-shrink-0">
                        {r.probability}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted text-center py-6">
                  No colleges found. Try adjusting the rank or category.
                </p>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
