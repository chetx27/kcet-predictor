import { motion } from 'framer-motion';

interface RankBandProps {
  pessimistic: number;
  expected: number;
  optimistic: number;
}

export function RankBand({ pessimistic, expected, optimistic }: RankBandProps) {
  const range = pessimistic - optimistic;
  const expectedPos = range > 0 ? ((pessimistic - expected) / range) * 100 : 50;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-text-muted mb-2">
        <span>Best case</span>
        <span>Worst case</span>
      </div>

      <div className="relative w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #34D399, #FBBF24, #F87171)',
          }}
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-bg-base shadow-lg"
          style={{ left: `${expectedPos}%` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-sm font-medium text-status-safe">
          {optimistic.toLocaleString('en-IN')}
        </span>
        <span className="text-sm font-semibold text-text-primary">
          ~{expected.toLocaleString('en-IN')}
        </span>
        <span className="text-sm font-medium text-status-reach">
          {pessimistic.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}
