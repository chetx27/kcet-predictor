import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getColleges } from '../api';
import { GlassCard } from '../components/GlassCard';
import { CollegeTypeIcon } from '../components/CollegeTypeIcon';
import { CardSkeleton } from '../components/Skeleton';
import type { College, CollegeType } from '../../../shared/types';

export function CollegeExplorerPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CollegeType>('all');

  const { data: colleges, isLoading } = useQuery({
    queryKey: ['colleges'],
    queryFn: () => getColleges(),
  });

  const filtered = (colleges || []).filter((c: College) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">
            College Explorer
          </h1>
          <p className="text-sm text-text-secondary mt-1.5">
            Browse all KEA engineering colleges in Karnataka
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2">
            {(['all', 'government', 'aided', 'private'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all border capitalize ${
                  typeFilter === t
                    ? 'bg-brand-indigo/10 text-brand-soft border-brand-indigo/25'
                    : 'bg-bg-elevated/50 text-text-muted border-bg-border'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-xs text-text-muted mb-4">
            {filtered.length} college{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard className="text-center py-12">
            <div className="text-4xl mb-4 opacity-30">🏫</div>
            <p className="text-sm text-text-muted">No colleges found</p>
            {colleges && colleges.length === 0 && (
              <p className="text-xs text-text-muted mt-2">
                Database is empty. Run the import scripts to load college data.
              </p>
            )}
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((college: College, i: number) => (
              <motion.div
                key={college.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
              >
                <Link to={`/colleges/${college.code}`}>
                  <GlassCard hover>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-text-muted font-mono">{college.code}</span>
                      <CollegeTypeIcon type={college.type} />
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary leading-snug mb-1">
                      {college.name}
                    </h3>
                    <p className="text-xs text-text-muted flex items-center gap-1">
                      📍 {college.district}
                      {college.naac_grade && (
                        <span className="ml-2">NAAC {college.naac_grade}</span>
                      )}
                    </p>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
