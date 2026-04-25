import { Router, Request, Response } from 'express';
import { supabase } from './db';
import {
  predictRankSchema,
  predictCollegesSchema,
  cutoffHistorySchema,
  collegesQuerySchema,
  marksRankChartSchema,
} from './validators';
import { ZodError } from 'zod';
import type {
  PredictRankResponse,
  PredictCollegesResponse,
  CollegePrediction,
  College,
  Branch,
  YearRank,
  TrendDirection,
  ProbabilityTier,
  StatsResponse,
  CutoffHistoryEntry,
  MarksRankMap,
  VerticalCategory,
} from '../../shared/types';

const router = Router();

// ── Helper: format Zod errors ────────────────────
function formatZodError(err: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const path = issue.path.join('.') || '_root';
    if (!details[path]) details[path] = [];
    details[path].push(issue.message);
  }
  return details;
}

// ── Helper: linear regression slope ──────────────
function linearSlope(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0;
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

// ── Helper: determine trend from slope ───────────
function getTrend(slope: number): TrendDirection {
  if (slope > 200) return 'improving';
  if (slope < -200) return 'tightening';
  return 'stable';
}

// ── Helper: fee estimation ───────────────────────
function estimateFee(collegeType: string): number {
  switch (collegeType) {
    case 'government': return 25000;
    case 'aided': return 45000;
    case 'private': return 150000;
    default: return 100000;
  }
}

// ── Helper: fee waiver logic ─────────────────────
function checkFeeWaiver(category: VerticalCategory): { eligible: boolean; details: string } {
  switch (category) {
    case 'SC':
    case 'ST':
      return {
        eligible: true,
        details: 'You may be eligible for full fee reimbursement under the Karnataka SC/ST Post-Matric Scholarship scheme. Government and aided college fees are fully covered.',
      };
    case 'EWS':
      return {
        eligible: true,
        details: 'Partial fee waiver may be available under the EWS reservation scheme for government and aided colleges.',
      };
    case 'Cat1':
    case '2A':
    case '2B':
    case '3A':
    case '3B':
      return {
        eligible: true,
        details: 'OBC students from families with annual income below ₹8 lakh may be eligible for fee concessions under state backward classes scholarship.',
      };
    default:
      return { eligible: false, details: '' };
  }
}

// ═══════════════════════════════════════════════════
// POST /api/v1/predict-rank
// ═══════════════════════════════════════════════════
router.post('/predict-rank', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = predictRankSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(parsed.error) });
      return;
    }

    const { kcet_marks, board_physics, board_chemistry, board_math } = parsed.data;

    // Calculate PU Percentage specifically from PCM marks
    const pu_percentage = ((board_physics + board_chemistry + board_math) / 300) * 100;

    // Combined score mirrors KEA formula: 50% KCET + 50% PU
    const combinedScore = (kcet_marks / 180) * 100 * 0.5 + pu_percentage * 0.5;

    // Query marks_rank_map for last 5 years around this score
    const { data: rankData, error: rankError } = await supabase
      .from('marks_rank_map')
      .select('*')
      .gte('kcet_marks', kcet_marks - 2)
      .lte('kcet_marks', kcet_marks + 2)
      .order('year', { ascending: false })
      .limit(50);

    if (rankError) {
      console.error('DB error in predict-rank:', rankError);
      res.status(500).json({ error: 'Failed to query rank data' });
      return;
    }

    // If no data in DB, generate synthetic estimates
    if (!rankData || rankData.length === 0) {
      // Estimation formula based on typical KCET distributions
      const baseRank = Math.round(Math.max(1, (180 - kcet_marks) * 1200 - (pu_percentage - 50) * 80));
      const response: PredictRankResponse = {
        rank_pessimistic: Math.round(baseRank * 1.25),
        rank_expected: baseRank,
        rank_optimistic: Math.round(baseRank * 0.75),
        confidence: 'low',
        basis_year: new Date().getFullYear() - 1,
        marks_vs_rank_table: [
          { marks: kcet_marks - 10, rank: Math.round(baseRank * 1.8), year: new Date().getFullYear() - 1 },
          { marks: kcet_marks - 5, rank: Math.round(baseRank * 1.35), year: new Date().getFullYear() - 1 },
          { marks: kcet_marks, rank: baseRank, year: new Date().getFullYear() - 1 },
          { marks: kcet_marks + 5, rank: Math.round(baseRank * 0.7), year: new Date().getFullYear() - 1 },
          { marks: kcet_marks + 10, rank: Math.round(baseRank * 0.45), year: new Date().getFullYear() - 1 },
        ],
        insight: `Estimated rank based on scoring model. Import KEA data using the data pipeline scripts for accurate predictions based on historical data.`,
      };
      res.json(response);
      return;
    }

    // Group by year and find closest match per year
    const yearMap = new Map<number, { rank_min: number; rank_max: number }>();
    for (const row of rankData) {
      if (!yearMap.has(row.year)) {
        yearMap.set(row.year, { rank_min: row.rank_min, rank_max: row.rank_max });
      }
    }

    const years = Array.from(yearMap.keys()).sort((a, b) => b - a);
    const ranks = years.map((y) => {
      const d = yearMap.get(y)!;
      return { year: y, rank: Math.round((d.rank_min + d.rank_max) / 2) };
    });

    // Calculate trend using linear regression
    const points = ranks.map((r) => ({ x: r.year, y: r.rank }));
    const slope = linearSlope(points);

    // p10/p50/p90 approximation
    const allRanks = ranks.map((r) => r.rank).sort((a, b) => a - b);
    const p10 = allRanks[Math.floor(allRanks.length * 0.1)] || allRanks[0];
    const p50 = allRanks[Math.floor(allRanks.length * 0.5)] || allRanks[0];
    const p90 = allRanks[Math.floor(allRanks.length * 0.9)] || allRanks[allRanks.length - 1];

    // Apply YoY trend for pessimistic
    const trendAdjusted = Math.round(p90 + (slope < 0 ? Math.abs(slope) : 0));

    const latestYear = years[0] || new Date().getFullYear() - 1;

    // Build marks vs rank table for chart
    const { data: chartData } = await supabase
      .from('marks_rank_map')
      .select('kcet_marks, rank_min, rank_max, year')
      .eq('year', latestYear)
      .order('kcet_marks', { ascending: true })
      .limit(20);

    const marksTable = (chartData || []).map((row: any) => ({
      marks: row.kcet_marks,
      rank: Math.round((row.rank_min + row.rank_max) / 2),
      year: row.year,
    }));

    const yoyChange = ranks.length >= 2
      ? Math.round(((ranks[0].rank - ranks[1].rank) / ranks[1].rank) * 100)
      : 0;
    const yoyDirection = yoyChange > 0 ? 'relaxed' : 'tightened';

    const confidence = ranks.length >= 4 ? 'high' : ranks.length >= 2 ? 'medium' : 'low';

    const response: PredictRankResponse = {
      rank_pessimistic: trendAdjusted,
      rank_expected: p50,
      rank_optimistic: p10,
      confidence,
      basis_year: latestYear,
      marks_vs_rank_table: marksTable,
      insight: `Based on ${ranks.length} years of data (${years[years.length - 1]}–${latestYear}). Competition ${yoyDirection} ${Math.abs(yoyChange)}% year-over-year. In ${latestYear}, this score typically yielded rank ~${ranks[0].rank.toLocaleString()}.`,
    };

    res.json(response);
  } catch (err) {
    console.error('Unexpected error in predict-rank:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// POST /api/v1/predict-colleges
// ═══════════════════════════════════════════════════
router.post('/predict-colleges', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = predictCollegesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(parsed.error) });
      return;
    }

    const {
      rank,
      vertical_category,
      horizontal_flags,
      preferred_branches,
      preferred_districts,
      college_type,
      stream,
    } = parsed.data;

    // Log the search
    await supabase.from('search_logs').insert({
      rank_input: rank,
      vertical_category,
      horizontal_flags,
      preferred_branches,
      preferred_districts,
      result_count: 0,
    }).then(() => {/* fire and forget */});

    // Determine the max rank we'd consider (reach territory = 1.3x cutoff)
    const maxCutoffRank = Math.round(rank * 1.3);

    // Build cutoffs query
    let cutoffQuery = supabase
      .from('cutoffs')
      .select(`
        *,
        colleges:college_id (*),
        branches:branch_id (*)
      `)
      .eq('vertical_category', vertical_category)
      .gte('closing_rank', Math.round(rank * 0.5))
      .order('closing_rank', { ascending: false });

    // Get latest year's data
    const { data: latestYearData } = await supabase
      .from('cutoffs')
      .select('year')
      .order('year', { ascending: false })
      .limit(1);

    const latestYear = latestYearData?.[0]?.year || new Date().getFullYear() - 1;

    // Filter to round 1 of latest year for primary results
    cutoffQuery = cutoffQuery.eq('year', latestYear).eq('round', 1);

    const { data: cutoffs, error: cutoffError } = await cutoffQuery.limit(500);

    if (cutoffError) {
      console.error('DB error in predict-colleges:', cutoffError);
      res.status(500).json({ error: 'Failed to query cutoff data' });
      return;
    }

    // If no data, return empty with message
    if (!cutoffs || cutoffs.length === 0) {
      const feeWaiver = checkFeeWaiver(vertical_category);
      res.json({
        results: [],
        total: 0,
        applied_quotas: [vertical_category, ...horizontal_flags],
        fee_waiver_eligible: feeWaiver.eligible,
        fee_waiver_details: feeWaiver.details,
      } as PredictCollegesResponse);
      return;
    }

    // Process each cutoff into a CollegePrediction
    const predictions: CollegePrediction[] = [];

    for (const cutoff of cutoffs) {
      const college = cutoff.colleges as unknown as College;
      const branch = cutoff.branches as unknown as Branch;

      if (!college || !branch) continue;

      // Apply filters
      if (college_type !== 'all' && college.type !== college_type) continue;
      if (preferred_districts.length > 0 && !preferred_districts.includes(college.district)) continue;
      if (preferred_branches.length > 0 && !preferred_branches.includes(branch.code)) continue;
      if (branch.stream !== stream) continue;

      const closingRank = cutoff.closing_rank;

      // Determine probability tier
      let probability: ProbabilityTier;
      if (rank <= closingRank * 0.85) {
        probability = 'safe';
      } else if (rank <= closingRank * 1.10) {
        probability = 'moderate';
      } else if (rank <= closingRank * 1.30) {
        probability = 'reach';
      } else {
        continue; // unlikely, skip
      }

      // Fetch trend data (last 5 years)
      const { data: trendData } = await supabase
        .from('cutoffs')
        .select('year, closing_rank, round')
        .eq('college_id', college.id)
        .eq('branch_id', branch.id)
        .eq('vertical_category', vertical_category)
        .eq('round', 1)
        .order('year', { ascending: true })
        .limit(5);

      const trendPoints: YearRank[] = (trendData || []).map((t: { year: number; closing_rank: number; round: number }) => ({
        year: t.year,
        closing_rank: t.closing_rank,
        round: t.round,
      }));

      const slope = linearSlope(trendPoints.map((t) => ({ x: t.year, y: t.closing_rank })));
      const trend = getTrend(slope);

      // Get GM closing rank for comparison
      const { data: gmData } = await supabase
        .from('cutoffs')
        .select('closing_rank')
        .eq('college_id', college.id)
        .eq('branch_id', branch.id)
        .eq('vertical_category', 'GM')
        .eq('year', latestYear)
        .eq('round', 1)
        .limit(1);

      const gmClosingRank = gmData?.[0]?.closing_rank || closingRank;

      // Determine likely round
      let roundLikely: 1 | 2 | 3 = 1;
      if (probability === 'moderate') roundLikely = 2;
      if (probability === 'reach') roundLikely = 3;

      // Check for special quota
      let isSpecialQuota = false;
      let specialQuotaType: string | undefined;
      const specialFlags = ['ncc', 'sports', 'pwd', 'scouts_guides'];
      for (const flag of horizontal_flags) {
        if (specialFlags.includes(flag)) {
          isSpecialQuota = true;
          specialQuotaType = flag;
          break;
        }
      }

      const fee = estimateFee(college.type);
      const feeWaiverApplicable = ['SC', 'ST'].includes(vertical_category) && college.type !== 'private';

      predictions.push({
        college,
        branch,
        probability,
        closing_rank_your_category: closingRank,
        closing_rank_gm: gmClosingRank,
        rank_buffer: closingRank - rank,
        trend,
        trend_data: trendPoints,
        round_likely: roundLikely,
        is_special_quota: isSpecialQuota,
        special_quota_type: specialQuotaType as CollegePrediction['special_quota_type'],
        fee_estimate: fee,
        fee_waiver_applicable: feeWaiverApplicable,
      });
    }

    // Sort: safe first, then moderate, then reach; within tier by reputation proxy
    const tierOrder: Record<ProbabilityTier, number> = { safe: 0, moderate: 1, reach: 2 };
    const typeOrder: Record<string, number> = { government: 0, aided: 1, private: 2 };
    const gradeOrder: Record<string, number> = { 'A++': 0, 'A+': 1, 'A': 2, 'B++': 3, 'B+': 4, 'B': 5 };

    predictions.sort((a, b) => {
      const tierDiff = tierOrder[a.probability] - tierOrder[b.probability];
      if (tierDiff !== 0) return tierDiff;
      const typeDiff = (typeOrder[a.college.type] || 2) - (typeOrder[b.college.type] || 2);
      if (typeDiff !== 0) return typeDiff;
      const gradeA = gradeOrder[a.college.naac_grade || ''] ?? 6;
      const gradeB = gradeOrder[b.college.naac_grade || ''] ?? 6;
      return gradeA - gradeB;
    });

    const feeWaiver = checkFeeWaiver(vertical_category);

    const appliedQuotas: string[] = [vertical_category];
    if (horizontal_flags.includes('rural')) appliedQuotas.push('Rural Quota (+15% seats)');
    if (horizontal_flags.includes('kannada_medium')) appliedQuotas.push('Kannada Medium (+5% seats)');
    if (horizontal_flags.includes('defence')) appliedQuotas.push('Defence Quota');
    if (horizontal_flags.includes('hk_region')) appliedQuotas.push('HK Region (70% reservation)');
    if (horizontal_flags.includes('ncc')) appliedQuotas.push('NCC (Supernumerary)');
    if (horizontal_flags.includes('sports')) appliedQuotas.push('Sports (Supernumerary)');
    if (horizontal_flags.includes('pwd')) appliedQuotas.push('PwD (5% horizontal)');

    // Update search log with result count
    const response: PredictCollegesResponse = {
      results: predictions,
      total: predictions.length,
      applied_quotas: appliedQuotas,
      fee_waiver_eligible: feeWaiver.eligible,
      fee_waiver_details: feeWaiver.details,
    };

    res.json(response);
  } catch (err) {
    console.error('Unexpected error in predict-colleges:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// GET /api/v1/colleges
// ═══════════════════════════════════════════════════
router.get('/colleges', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = collegesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(parsed.error) });
      return;
    }

    let query = supabase.from('colleges').select('*').order('name');

    if (parsed.data.district) {
      query = query.eq('district', parsed.data.district);
    }
    if (parsed.data.type) {
      query = query.eq('type', parsed.data.type);
    }

    const { data, error } = await query.limit(500);

    if (error) {
      console.error('DB error in colleges:', error);
      res.status(500).json({ error: 'Failed to query colleges' });
      return;
    }

    res.json(data || []);
  } catch (err) {
    console.error('Unexpected error in colleges:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// GET /api/v1/branches
// ═══════════════════════════════════════════════════
router.get('/branches', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name');

    if (error) {
      console.error('DB error in branches:', error);
      res.status(500).json({ error: 'Failed to query branches' });
      return;
    }

    res.json(data || []);
  } catch (err) {
    console.error('Unexpected error in branches:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// GET /api/v1/cutoff-history
// ═══════════════════════════════════════════════════
router.get('/cutoff-history', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = cutoffHistorySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(parsed.error) });
      return;
    }

    const { college_id, branch_id, category } = parsed.data;

    const { data, error } = await supabase
      .from('cutoffs')
      .select('year, round, opening_rank, closing_rank, vertical_category')
      .eq('college_id', college_id)
      .eq('branch_id', branch_id)
      .eq('vertical_category', category)
      .order('year', { ascending: true })
      .order('round', { ascending: true });

    if (error) {
      console.error('DB error in cutoff-history:', error);
      res.status(500).json({ error: 'Failed to query cutoff history' });
      return;
    }

    const entries: CutoffHistoryEntry[] = (data || []).map((row: {
      year: number;
      round: number;
      opening_rank: number | null;
      closing_rank: number;
      vertical_category: string;
    }) => ({
      year: row.year,
      round: row.round,
      opening_rank: row.opening_rank,
      closing_rank: row.closing_rank,
      vertical_category: row.vertical_category as VerticalCategory,
    }));

    res.json(entries);
  } catch (err) {
    console.error('Unexpected error in cutoff-history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// GET /api/v1/marks-rank-chart
// ═══════════════════════════════════════════════════
router.get('/marks-rank-chart', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = marksRankChartSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: formatZodError(parsed.error) });
      return;
    }

    let query = supabase
      .from('marks_rank_map')
      .select('*')
      .order('kcet_marks', { ascending: true });

    if (parsed.data.year) {
      query = query.eq('year', parsed.data.year);
    }

    const { data, error } = await query.limit(500);

    if (error) {
      console.error('DB error in marks-rank-chart:', error);
      res.status(500).json({ error: 'Failed to query marks rank data' });
      return;
    }

    res.json(data || []);
  } catch (err) {
    console.error('Unexpected error in marks-rank-chart:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════
// GET /api/v1/stats
// ═══════════════════════════════════════════════════
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [collegeRes, branchRes, yearRes] = await Promise.all([
      supabase.from('colleges').select('id', { count: 'exact', head: true }),
      supabase.from('branches').select('id', { count: 'exact', head: true }),
      supabase.from('cutoffs').select('year').order('year', { ascending: false }).limit(1),
    ]);

    const totalColleges = collegeRes.count || 0;
    const totalBranches = branchRes.count || 0;

    // Get year range
    const { data: minYearData } = await supabase
      .from('cutoffs')
      .select('year')
      .order('year', { ascending: true })
      .limit(1);

    const maxYear = yearRes.data?.[0]?.year || 0;
    const minYear = minYearData?.[0]?.year || maxYear;
    const yearsOfData = maxYear > 0 ? maxYear - minYear + 1 : 0;

    const stats: StatsResponse = {
      total_colleges: totalColleges,
      total_branches: totalBranches,
      years_of_data: yearsOfData,
      last_updated: new Date().toISOString(),
    };

    res.json(stats);
  } catch (err) {
    console.error('Unexpected error in stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
