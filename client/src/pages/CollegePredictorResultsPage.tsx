import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { predictColleges } from '../api';
import { GlassCard } from '../components/GlassCard';
import { Badge } from '../components/Badge';
import { TrendSparkline } from '../components/TrendSparkline';
import { CollegeTypeIcon } from '../components/CollegeTypeIcon';
import { ResultsSkeleton } from '../components/Skeleton';
import type {
  VerticalCategory,
  HorizontalFlag,
  CollegePrediction,
  ProbabilityTier,
} from '../../../shared/types';

const tierLabels: Record<ProbabilityTier, { label: string; emoji: string }> = {
  safe: { label: 'Safe Bets', emoji: '🟢' },
  moderate: { label: 'Worth Trying', emoji: '🟡' },
  reach: { label: 'Stretch Goals', emoji: '🔴' },
};

export function CollegePredictorResultsPage() {
  const [params] = useSearchParams();

  const rank = Number(params.get('rank') || 0);
  const category = (params.get('category') || 'GM') as VerticalCategory;
  const flags = (params.get('flags') || '').split(',').filter(Boolean) as HorizontalFlag[];
  const branches = (params.get('branches') || '').split(',').filter(Boolean);
  const districts = (params.get('districts') || '').split(',').filter(Boolean);
  const collegeType = (params.get('type') || 'all') as 'all' | 'government' | 'aided' | 'private';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['predict-colleges', rank, category, flags, branches, districts, collegeType],
    queryFn: () =>
      predictColleges({
        rank,
        vertical_category: category,
        horizontal_flags: flags,
        preferred_branches: branches,
        preferred_districts: districts,
        college_type: collegeType,
        stream: 'engineering',
      }),
    enabled: rank > 0,
  });

  const grouped: Record<ProbabilityTier, CollegePrediction[]> = {
    safe: [],
    moderate: [],
    reach: [],
  };

  if (data?.results) {
    for (const r of data.results) {
      grouped[r.probability].push(r);
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">
            KCET College Predictor
          </h1>

          {/* Summary */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-sm text-text-secondary">
              Rank: <span className="font-semibold text-text-primary">{rank.toLocaleString('en-IN')}</span>
            </span>
            <span className="text-text-muted">·</span>
            <Badge variant="quota">{category}</Badge>
            {flags.map((f) => (
              <Badge key={f} variant="info">{f.replace('_', ' ')}</Badge>
            ))}
          </div>
        </motion.div>

        {/* Fee waiver notice */}
        {data?.fee_waiver_eligible && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 mb-6 border-status-safe/20"
          >
            <p className="text-sm text-status-safe font-medium">💚 Fee Waiver Eligible</p>
            <p className="text-xs text-text-secondary mt-1">{data.fee_waiver_details}</p>
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && <ResultsSkeleton count={5} />}

        {/* Error */}
        {isError && (
          <GlassCard>
            <p className="text-sm text-status-reach mb-3">Failed to fetch predictions.</p>
            <button onClick={() => refetch()} className="text-sm text-brand-soft hover:underline">
              Try again
            </button>
          </GlassCard>
        )}

        {/* Empty state */}
        {data && data.total === 0 && (
          <GlassCard className="text-center py-12">
            <div className="text-4xl mb-4 opacity-30">🏫</div>
            <p className="text-text-secondary text-sm mb-2">No colleges found for this combination.</p>
            <p className="text-text-muted text-xs mb-4">
              This could mean the database hasn't been populated yet, or no cutoffs match your criteria.
            </p>
            <Link to="/college-predictor" className="text-sm text-brand-soft hover:underline">
              ← Adjust your criteria
            </Link>
          </GlassCard>
        )}

        {/* Results */}
        {data && data.total > 0 && (
          <div className="space-y-8">
            <p className="text-sm text-text-muted">
              {data.total} college{data.total !== 1 ? 's' : ''} found
            </p>

            {(['safe', 'moderate', 'reach'] as ProbabilityTier[]).map((tier) => {
              const items = grouped[tier];
              if (items.length === 0) return null;

              return (
                <div key={tier}>
                  <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                    <span>{tierLabels[tier].emoji}</span>
                    <span>{tierLabels[tier].label}</span>
                    <span className="text-text-muted">({items.length})</span>
                  </h2>

                  <div className="space-y-3">
                    {items.map((item, i) => (
                      <CollegeResultCard key={`${item.college.id}-${item.branch.id}`} item={item} index={i} rank={rank} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CollegeResultCard({ item, index, rank }: { item: CollegePrediction; index: number; rank: number }) {
  const trendData = item.trend_data.map((t) => ({ year: t.year, value: t.closing_rank }));
  const bufferPositive = item.rank_buffer > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <GlassCard hover className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <Badge variant={item.probability}>{item.probability}</Badge>
            {item.is_special_quota && (
              <Badge variant="quota" className="ml-2">{item.special_quota_type || 'quota'}</Badge>
            )}
          </div>
          <CollegeTypeIcon type={item.college.type} />
        </div>

        {/* College info */}
        <h3 className="text-base font-semibold text-text-primary leading-snug">{item.college.name}</h3>
        <p className="text-sm text-text-secondary mt-0.5">{item.branch.name}</p>

        {/* Divider */}
        <div className="border-t border-bg-border/50 my-4" />

        {/* Rank details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-muted text-xs">Your rank</span>
            <p className="font-semibold text-text-primary">{rank.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs">Closing rank (latest)</span>
            <p className="font-semibold text-text-primary">
              {item.closing_rank_your_category.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className={`text-xs font-medium ${bufferPositive ? 'text-status-safe' : 'text-status-reach'}`}>
            Buffer: {bufferPositive ? '+' : ''}{item.rank_buffer.toLocaleString('en-IN')} ranks
            {bufferPositive ? ' safer ✓' : ''}
          </span>

          <div className="flex items-center gap-2">
            <TrendSparkline data={trendData} trend={item.trend} />
            <span className={`text-xs ${
              item.trend === 'improving' ? 'text-status-safe' :
              item.trend === 'tightening' ? 'text-status-reach' : 'text-text-muted'
            }`}>
              {item.trend === 'improving' ? '↗' : item.trend === 'tightening' ? '↘' : '→'}
              {' '}{item.trend}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-bg-border/50 my-4" />

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-3">
            <span>📍 {item.college.district}</span>
            {item.college.naac_grade && <span>NAAC {item.college.naac_grade}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span>₹{(item.fee_estimate / 1000).toFixed(0)}K/yr</span>
            {item.fee_waiver_applicable && (
              <span className="text-status-safe">💚 Waiver</span>
            )}
          </div>
        </div>

        <div className="text-xs text-text-muted mt-2">
          Likely in Round {item.round_likely}
        </div>
      </GlassCard>
    </motion.div>
  );
}
