import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AnimatedNumber } from '../components/AnimatedNumber';

const features = [
  {
    title: 'Every quota understood',
    desc: 'SC, ST, OBC (2A/2B/3A/3B), EWS — plus horizontal reservations like Rural, Kannada Medium, Defence, NCC, Sports, HK Region. We model how they stack.',
  },
  {
    title: 'Real KEA cutoff data',
    desc: 'We parse actual KEA published cutoff PDFs — not estimates, not crowd-sourced guesses. Round 1, 2, and 3 closing ranks across every category.',
  },
  {
    title: 'Round-by-round intelligence',
    desc: 'Know whether you\'ll likely get allotted in Round 1, 2, or 3 — and see how closing ranks relax in later rounds with historical trends.',
  },
];

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  },
};

export function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="mesh-gradient" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-text-primary leading-tight mb-6">
              Know exactly where<br />
              <span className="gradient-text">you stand.</span>
            </h1>

            <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed">
              The only KCET predictor that understands every quota — 
              SC, ST, OBC, Rural, Kannada Medium, NCC, Sports, Defence, HK&nbsp;Region. 
              Real KEA data. Completely free.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/rank-predictor" className="btn-primary text-center w-full sm:w-auto">
                Predict My Rank →
              </Link>
              <Link to="/college-predictor" className="btn-secondary text-center w-full sm:w-auto">
                Find My Colleges →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-bg-border/50 bg-bg-surface/50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: 250, suffix: '+', label: 'Colleges' },
              { value: 40, suffix: '+', label: 'Branches' },
              { value: 10, suffix: '', label: 'Years of Data' },
              { value: 12, suffix: '', label: 'Quota Categories' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">
                  <AnimatedNumber value={stat.value} />
                  <span>{stat.suffix}</span>
                </div>
                <div className="text-sm text-text-muted mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary mb-3">
              Why KCET Compass is different
            </h2>
            <p className="text-text-secondary text-sm sm:text-base">
              Built specifically for how Karnataka's seat allocation actually works.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-5"
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={stagger.item}
                className="glass-card p-6"
              >
                <h3 className="text-base font-semibold text-text-primary mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-bg-border/50 py-10 text-center">
        <span className="text-sm text-text-muted">
          <span className="font-heading font-semibold gradient-text">KCET Compass</span>
          <span className="mx-2">·</span>
          Built for Karnataka students
        </span>
      </footer>
    </div>
  );
}
