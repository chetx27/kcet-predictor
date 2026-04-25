import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { VerticalCategory, HorizontalFlag } from '../../../shared/types';

const categories: { code: VerticalCategory; name: string; desc: string }[] = [
  { code: 'GM', name: 'General Merit', desc: 'No caste-based reservation' },
  { code: 'SC', name: 'Scheduled Caste', desc: '15% of seats' },
  { code: 'ST', name: 'Scheduled Tribe', desc: '7.5% of seats' },
  { code: 'Cat1', name: 'Category 1', desc: 'OBC Category 1' },
  { code: '2A', name: 'Category 2A', desc: 'OBC Category 2A' },
  { code: '2B', name: 'Category 2B', desc: 'OBC Category 2B' },
  { code: '3A', name: 'Category 3A', desc: 'OBC Category 3A' },
  { code: '3B', name: 'Category 3B', desc: 'OBC Category 3B' },
  { code: 'EWS', name: 'Economically Weaker', desc: 'EWS reservation' },
];

const horizontalClaims: { flag: HorizontalFlag; icon: string; title: string; desc: string; hasSubOptions?: boolean }[] = [
  { flag: 'rural', icon: '🏡', title: 'Rural Quota', desc: 'Studied in a rural Karnataka school from Class 1–10. Unlocks 15% of seats in govt/aided colleges.' },
  { flag: 'kannada_medium', icon: '🔤', title: 'Kannada Medium', desc: 'Studied in Kannada medium from Class 1–10. Unlocks 5% of seats.' },
  { flag: 'defence', icon: '🎖️', title: 'Defence / Ex-Servicemen', desc: 'Ward of Defence Personnel or Ex-Serviceman of Karnataka origin.' },
  { flag: 'ncc', icon: '🎽', title: 'NCC', desc: 'Achieved NCC certification. Supernumerary seats — separate from regular pool.' },
  { flag: 'sports', icon: '🏆', title: 'Sports', desc: 'Represented at State, National, or International level. Supernumerary seats.' },
  { flag: 'pwd', icon: '♿', title: 'Persons with Disability', desc: 'Disability of 40%+, certified by govt medical board. 5% horizontal reservation.' },
  { flag: 'hk_region', icon: '🗺️', title: 'Hyderabad-Karnataka Region', desc: 'From Bidar, Kalaburagi, Yadgir, Raichur, Koppal, or Ballari. 70% HK seats reserved.' },
  { flag: 'scouts_guides', icon: '📜', title: 'Scouts & Guides', desc: "Received President's Award during Classes 8–12 in Karnataka." },
];

const branchOptions = [
  'CS', 'AI', 'DS', 'EC', 'IS', 'ME', 'CV', 'EE', 'CH', 'BT', 'AE', 'IE', 'ML', 'CY', 'IM',
];

const districtOptions = [
  'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Mangaluru', 'Hubballi-Dharwad',
  'Belagavi', 'Kalaburagi', 'Ballari', 'Raichur', 'Shivamogga', 'Tumakuru',
  'Davanagere', 'Hassan', 'Udupi', 'Mandya', 'Chitradurga', 'Vijayapura',
  'Bagalkot', 'Haveri', 'Gadag', 'Koppal', 'Yadgir', 'Bidar', 'Chamarajanagar',
  'Kodagu', 'Chikkamagaluru', 'Dharwad', 'Uttara Kannada', 'Ramanagara',
];

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export function CollegePredictorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [rank, setRank] = useState(searchParams.get('rank') ? Number(searchParams.get('rank')) : 0);
  const [category, setCategory] = useState<VerticalCategory>('GM');
  const [flags, setFlags] = useState<Set<HorizontalFlag>>(new Set());
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [collegeType, setCollegeType] = useState<'all' | 'government' | 'aided' | 'private'>('all');

  const toggleFlag = (flag: HorizontalFlag) => {
    const next = new Set(flags);
    if (next.has(flag)) next.delete(flag);
    else next.add(flag);
    setFlags(next);
  };

  const toggleBranch = (b: string) => {
    setSelectedBranches((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const toggleDistrict = (d: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const handleSubmit = () => {
    const params = new URLSearchParams({
      rank: String(rank),
      category,
      flags: Array.from(flags).join(','),
      branches: selectedBranches.join(','),
      districts: selectedDistricts.join(','),
      type: collegeType,
    });
    navigate(`/college-predictor/results?${params.toString()}`);
  };

  const canNext = () => {
    if (step === 1) return rank > 0;
    return true;
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">
            KCET College Predictor
          </h1>
          <p className="text-sm text-text-secondary mt-1.5">
            Find colleges that match your rank, category, and preferences
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-300 ${
                  s === step
                    ? 'bg-brand-indigo/20 text-brand-soft border border-brand-indigo/30'
                    : s < step
                    ? 'bg-bg-elevated text-text-primary border border-bg-border'
                    : 'bg-bg-elevated/50 text-text-muted border border-bg-border/50'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 4 && (
                <div className={`w-8 sm:w-12 h-px ${s < step ? 'bg-brand-indigo/30' : 'bg-bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {/* Step 1: Rank */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-text-primary mb-1">Your Rank</h2>
                <p className="text-sm text-text-muted mb-6">Enter your expected or actual KCET rank</p>

                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={rank || ''}
                  onChange={(e) => setRank(Number(e.target.value))}
                  className="text-2xl font-heading font-bold text-center py-4"
                />

                <p className="text-xs text-text-muted text-center mt-3">
                  <button
                    onClick={() => navigate('/rank-predictor')}
                    className="text-brand-soft hover:underline"
                  >
                    Don't know your rank? Predict from marks →
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-text-primary mb-1">Your Category</h2>
                <p className="text-sm text-text-muted mb-6">
                  Select your vertical reservation category
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.code}
                      onClick={() => setCategory(cat.code)}
                      className={`p-4 rounded-xl text-left transition-all duration-200 border ${
                        category === cat.code
                          ? 'bg-brand-indigo/10 border-brand-indigo/30'
                          : 'bg-bg-elevated/50 border-bg-border hover:border-bg-border/80'
                      }`}
                    >
                      <div className="text-base font-semibold text-text-primary">{cat.code}</div>
                      <div className="text-xs text-text-muted mt-0.5">{cat.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Horizontal Claims */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-text-primary mb-1">Additional Claims</h2>
                <p className="text-sm text-text-muted mb-6">
                  Select all that apply — these unlock separate seat pools
                </p>

                <div className="space-y-3">
                  {horizontalClaims.map((claim) => {
                    const active = flags.has(claim.flag);
                    return (
                      <button
                        key={claim.flag}
                        onClick={() => toggleFlag(claim.flag)}
                        className={`w-full p-4 rounded-xl text-left transition-all duration-200 border ${
                          active
                            ? 'bg-brand-indigo/8 border-brand-indigo/25'
                            : 'bg-bg-elevated/30 border-bg-border hover:border-bg-border/80'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg mt-0.5">{claim.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-text-primary">{claim.title}</div>
                            <div className="text-xs text-text-muted mt-0.5 leading-relaxed">{claim.desc}</div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                            active ? 'border-brand-indigo bg-brand-indigo' : 'border-bg-border'
                          }`}>
                            {active && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-text-muted mt-4 leading-relaxed">
                  You can combine multiple claims. For example: SC + Rural + Kannada Medium all apply together.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 4: Preferences */}
          {step === 4 && (
            <motion.div
              key="step4"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-text-primary mb-1">Preferences</h2>
                <p className="text-sm text-text-muted mb-6">
                  All optional — leave blank to see everything
                </p>

                {/* Branch preferences */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-primary mb-2">Preferred Branches</label>
                  <div className="flex flex-wrap gap-2">
                    {branchOptions.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBranch(b)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                          selectedBranches.includes(b)
                            ? 'bg-brand-indigo/10 text-brand-soft border-brand-indigo/25'
                            : 'bg-bg-elevated/50 text-text-muted border-bg-border hover:text-text-secondary'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* District preferences */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-primary mb-2">Preferred Districts</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
                    {districtOptions.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDistrict(d)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                          selectedDistricts.includes(d)
                            ? 'bg-brand-indigo/10 text-brand-soft border-brand-indigo/25'
                            : 'bg-bg-elevated/50 text-text-muted border-bg-border hover:text-text-secondary'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* College type */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">College Type</label>
                  <div className="flex gap-2">
                    {(['all', 'government', 'aided', 'private'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCollegeType(t)}
                        className={`px-4 py-2 text-xs font-medium rounded-lg transition-all border capitalize ${
                          collegeType === t
                            ? 'bg-brand-indigo/10 text-brand-soft border-brand-indigo/25'
                            : 'bg-bg-elevated/50 text-text-muted border-bg-border hover:text-text-secondary'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="btn-secondary flex-1">
              ← Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={rank <= 0}
              className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Find My Colleges →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
