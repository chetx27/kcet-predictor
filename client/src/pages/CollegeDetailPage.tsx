import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getColleges, getCutoffHistory } from '../api';
import { GlassCard } from '../components/GlassCard';
import { CollegeTypeIcon } from '../components/CollegeTypeIcon';
import { Skeleton } from '../components/Skeleton';
import type { College, VerticalCategory } from '../../../shared/types';

const categoryOptions: VerticalCategory[] = ['GM', 'SC', 'ST', 'Cat1', '2A', '2B', '3A', '3B', 'EWS'];

export function CollegeDetailPage() {
  const { code } = useParams<{ code: string }>();
  const [selectedCategory, setSelectedCategory] = useState<VerticalCategory>('GM');

  const { data: colleges, isLoading: loadingCollege } = useQuery({
    queryKey: ['colleges'],
    queryFn: () => getColleges(),
  });

  const college = (colleges || []).find((c: College) => c.code === code);

  const { data: cutoffHistory, isLoading: loadingCutoffs } = useQuery({
    queryKey: ['cutoff-history', college?.id, selectedCategory],
    queryFn: () =>
      getCutoffHistory({
        college_id: college!.id,
        branch_id: 1,
        category: selectedCategory,
      }),
    enabled: !!college,
  });

  const chartData = (cutoffHistory || [])
    .filter((c) => c.round === 1)
    .map((c) => ({
      year: c.year,
      closing_rank: c.closing_rank,
      opening_rank: c.opening_rank || c.closing_rank,
    }));

  if (loadingCollege) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Skeleton className="w-48 h-8 mb-4" />
          <Skeleton lines={3} />
        </div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-4xl mb-4 opacity-30">🏫</div>
          <p className="text-text-secondary">College not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-text-muted font-mono">{college.code}</span>
              <CollegeTypeIcon type={college.type} />
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-text-primary">
              {college.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted mt-2">
              <span>📍 {college.district}</span>
              {college.naac_grade && <span>NAAC {college.naac_grade}</span>}
              {college.established_year && <span>Est. {college.established_year}</span>}
            </div>
            {college.website && (
              <a
                href={college.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-soft hover:underline mt-1 inline-block"
              >
                {college.website}
              </a>
            )}
          </div>

          {/* Category selector */}
          <div className="mb-6">
            <label className="text-xs text-text-muted mb-2 block">View cutoffs for category:</label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                    selectedCategory === c
                      ? 'bg-brand-indigo/10 text-brand-soft border-brand-indigo/25'
                      : 'bg-bg-elevated/50 text-text-muted border-bg-border'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Cutoff Chart */}
          <GlassCard className="mb-6">
            <h3 className="text-sm font-medium text-text-primary mb-4">
              Closing Rank Trend — {selectedCategory}
            </h3>
            {loadingCutoffs ? (
              <Skeleton className="h-48" />
            ) : chartData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222233" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 11, fill: '#4A4D5E' }}
                      axisLine={{ stroke: '#222233' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#4A4D5E' }}
                      axisLine={{ stroke: '#222233' }}
                      tickLine={false}
                      tickFormatter={(v: number) => v.toLocaleString('en-IN')}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#12121A',
                        border: '1px solid #222233',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#8B8FA3' }}
                      itemStyle={{ color: '#E8EAF0' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="closing_rank"
                      stroke="#6366F1"
                      fill="rgba(99,102,241,0.08)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-8">
                No cutoff data available for this combination.
              </p>
            )}
          </GlassCard>

          {/* Cutoff Table */}
          {cutoffHistory && cutoffHistory.length > 0 && (
            <GlassCard>
              <h3 className="text-sm font-medium text-text-primary mb-4">Cutoff History — {selectedCategory}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-text-muted border-b border-bg-border">
                      <th className="text-left py-2 pr-4">Year</th>
                      <th className="text-left py-2 pr-4">Round</th>
                      <th className="text-right py-2 pr-4">Opening</th>
                      <th className="text-right py-2">Closing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cutoffHistory.map((c, i) => (
                      <tr key={i} className="border-b border-bg-border/30">
                        <td className="py-2.5 pr-4 text-text-primary">{c.year}</td>
                        <td className="py-2.5 pr-4 text-text-muted">R{c.round}</td>
                        <td className="py-2.5 pr-4 text-right text-text-secondary">
                          {c.opening_rank?.toLocaleString('en-IN') || '—'}
                        </td>
                        <td className="py-2.5 text-right text-text-primary font-medium">
                          {c.closing_rank.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}
