import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { predictRank } from '../api';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { RankBand } from '../components/RankBand';
import { GlassCard } from '../components/GlassCard';
import { ResultsSkeleton } from '../components/Skeleton';
import type { PredictRankResponse } from '../../../shared/types';

const schema = z.object({
  kcet_marks: z.number({ invalid_type_error: 'Enter your KCET marks' }).min(0, 'Min 0').max(180, 'Max 180'),
  board_physics: z.number({ invalid_type_error: 'Enter marks' }).min(0).max(100),
  board_chemistry: z.number({ invalid_type_error: 'Enter marks' }).min(0).max(100),
  board_math: z.number({ invalid_type_error: 'Enter marks' }).min(0).max(100),
});

type FormData = z.infer<typeof schema>;

export function RankPredictorPage() {
  const [result, setResult] = useState<PredictRankResponse | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { kcet_marks: undefined, board_physics: undefined, board_chemistry: undefined, board_math: undefined },
  });

  const kcetMarks = watch('kcet_marks');

  const mutation = useMutation({
    mutationFn: (data: FormData) => predictRank({
      kcet_marks: data.kcet_marks,
      board_physics: data.board_physics,
      board_chemistry: data.board_chemistry,
      board_math: data.board_math,
    }),
    onSuccess: (data) => setResult(data),
  });

  const onSubmit = (data: FormData) => {
    setResult(null);
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">
            KCET Rank Predictor
          </h1>
          <p className="text-sm text-text-secondary mt-1.5">
            Enter your scores to predict your expected KCET 2026 rank
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left — Form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* KCET Marks */}
              <div className="glass-card p-6">
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Total KCET Marks
                </label>
                <p className="text-xs text-text-muted mb-3">
                  Combined score out of 180 (Physics + Chemistry + Math/Biology)
                </p>
                <input
                  type="number"
                  placeholder="e.g. 142"
                  {...register('kcet_marks', { valueAsNumber: true })}
                />
                {errors.kcet_marks && (
                  <p className="text-xs text-status-reach mt-1.5">{errors.kcet_marks.message}</p>
                )}
                {kcetMarks !== undefined && !isNaN(kcetMarks) && (
                  <p className="text-xs text-text-muted mt-2">
                    Score: {kcetMarks}/180 ({((kcetMarks / 180) * 100).toFixed(1)}%)
                  </p>
                )}
              </div>

              {/* 12th / Board Marks */}
              <div className="glass-card p-6">
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  12th / PU Board PCM Marks
                </label>
                <p className="text-xs text-text-muted mb-4">
                  Enter your marks out of 100 for each subject. Engineering considers only Physics, Chemistry, and Math.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Physics</label>
                    <input
                      type="number"
                      placeholder="0-100"
                      {...register('board_physics', { valueAsNumber: true })}
                      className="w-full"
                    />
                    {errors.board_physics && (
                      <p className="text-[10px] text-status-reach mt-1">{errors.board_physics.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Chemistry</label>
                    <input
                      type="number"
                      placeholder="0-100"
                      {...register('board_chemistry', { valueAsNumber: true })}
                      className="w-full"
                    />
                    {errors.board_chemistry && (
                      <p className="text-[10px] text-status-reach mt-1">{errors.board_chemistry.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Math</label>
                    <input
                      type="number"
                      placeholder="0-100"
                      {...register('board_math', { valueAsNumber: true })}
                      className="w-full"
                    />
                    {errors.board_math && (
                      <p className="text-[10px] text-status-reach mt-1">{errors.board_math.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? 'Predicting...' : 'Predict My Rank'}
              </button>

              {mutation.isError && (
                <div className="glass-card p-4 border-status-reach/20">
                  <p className="text-sm text-status-reach">
                    Failed to predict rank. Please check your connection and try again.
                  </p>
                  <button
                    type="button"
                    onClick={() => mutation.reset()}
                    className="text-xs text-brand-soft mt-2 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}
            </form>
          </motion.div>

          {/* Right — Results */}
          <div>
            <AnimatePresence mode="wait">
              {mutation.isPending && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ResultsSkeleton count={2} />
                </motion.div>
              )}

              {result && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-5"
                >
                  {/* Expected Rank */}
                  <GlassCard>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Expected Rank</p>
                    <div className="text-4xl sm:text-5xl font-heading font-bold text-text-primary mb-4">
                      <AnimatedNumber value={result.rank_expected} />
                    </div>
                    <RankBand
                      pessimistic={result.rank_pessimistic}
                      expected={result.rank_expected}
                      optimistic={result.rank_optimistic}
                    />
                    <div className="flex items-center gap-2 mt-4">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        result.confidence === 'high'
                          ? 'bg-status-safe/10 text-status-safe'
                          : result.confidence === 'medium'
                          ? 'bg-status-moderate/10 text-status-moderate'
                          : 'bg-status-reach/10 text-status-reach'
                      }`}>
                        {result.confidence} confidence
                      </span>
                      <span className="text-xs text-text-muted">
                        Based on {result.basis_year} data
                      </span>
                    </div>
                  </GlassCard>

                  {/* Insight */}
                  <GlassCard>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Insight</p>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {result.insight}
                    </p>
                  </GlassCard>

                  {/* Chart */}
                  {result.marks_vs_rank_table.length > 0 && (
                    <GlassCard>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-4">
                        Marks vs Rank Trend
                      </p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={result.marks_vs_rank_table}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222233" />
                            <XAxis
                              dataKey="marks"
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
                            <Line
                              type="monotone"
                              dataKey="rank"
                              stroke="#6366F1"
                              strokeWidth={2}
                              dot={{ fill: '#6366F1', r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>
                  )}

                  {/* CTA */}
                  <Link
                    to={`/college-predictor?rank=${result.rank_expected}`}
                    className="btn-primary block text-center w-full"
                  >
                    Now find your colleges →
                  </Link>
                </motion.div>
              )}

              {!mutation.isPending && !result && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full min-h-[300px] text-center"
                >
                  <div className="text-4xl mb-4 opacity-30">📊</div>
                  <p className="text-sm text-text-muted">
                    Enter your scores on the left<br />to see your predicted rank
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
