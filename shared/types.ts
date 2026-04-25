// ═══════════════════════════════════════════════════
// KCET Compass — Shared TypeScript Types
// ═══════════════════════════════════════════════════

// ── Enums / Union Types ──────────────────────────

export type VerticalCategory =
  | 'GM'
  | 'SC'
  | 'ST'
  | 'Cat1'
  | '2A'
  | '2B'
  | '3A'
  | '3B'
  | 'EWS';

export type HorizontalFlag =
  | 'rural'
  | 'kannada_medium'
  | 'defence'
  | 'ex_defence'
  | 'ncc'
  | 'sports'
  | 'pwd'
  | 'hk_region'
  | 'capf'
  | 'scouts_guides'
  | 'ews';

export type ProbabilityTier = 'safe' | 'moderate' | 'reach';

export type TrendDirection = 'improving' | 'stable' | 'tightening';

export type CollegeType = 'government' | 'aided' | 'private';

export type StreamType = 'engineering' | 'pharmacy' | 'agriculture' | 'architecture';

export type QuotaType =
  | 'ncc'
  | 'sports'
  | 'pwd'
  | 'scouts_guides'
  | 'defence'
  | 'ex_defence'
  | 'capf'
  | 'jk_migrant'
  | 'anglo_indian'
  | 'hk_region';

export type SubjectCombo = 'pcm' | 'pcb' | 'pcmb';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

// ── Database Models ──────────────────────────────

export interface College {
  id: number;
  code: string;
  name: string;
  short_name: string | null;
  district: string;
  taluk: string | null;
  type: CollegeType;
  naac_grade: string | null;
  established_year: number | null;
  address: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Branch {
  id: number;
  code: string;
  name: string;
  short_name: string | null;
  stream: StreamType;
}

export interface CollegeBranch {
  id: number;
  college_id: number;
  branch_id: number;
  total_seats: number | null;
}

export interface Cutoff {
  id: number;
  college_id: number;
  branch_id: number;
  year: number;
  round: 1 | 2 | 3;
  vertical_category: VerticalCategory;
  horizontal_flags: HorizontalFlag[];
  opening_rank: number | null;
  closing_rank: number;
}

export interface MarksRankMap {
  id: number;
  year: number;
  kcet_marks: number;
  pu_percentage: number | null;
  rank_min: number;
  rank_max: number;
}

export interface SpecialQuotaSeat {
  id: number;
  college_id: number;
  quota_type: QuotaType;
  branch_id: number;
  seats_available: number | null;
  year: number;
  notes: string | null;
}

export interface SearchLog {
  id: number;
  session_id: string | null;
  rank_input: number | null;
  vertical_category: VerticalCategory | null;
  horizontal_flags: HorizontalFlag[] | null;
  preferred_branches: string[] | null;
  preferred_districts: string[] | null;
  result_count: number | null;
  created_at: string;
}

// ── API: Rank Prediction ─────────────────────────

export interface PredictRankRequest {
  kcet_marks: number;
  board_physics: number;
  board_chemistry: number;
  board_math: number;
}

export interface MarksRankPoint {
  marks: number;
  rank: number;
  year: number;
}

export interface PredictRankResponse {
  rank_pessimistic: number;
  rank_expected: number;
  rank_optimistic: number;
  confidence: ConfidenceLevel;
  basis_year: number;
  marks_vs_rank_table: MarksRankPoint[];
  insight: string;
}

// ── API: College Prediction ──────────────────────

export interface PredictCollegesRequest {
  rank: number;
  vertical_category: VerticalCategory;
  horizontal_flags: HorizontalFlag[];
  preferred_branches: string[];
  preferred_districts: string[];
  college_type: 'all' | CollegeType;
  stream: StreamType;
}

export interface YearRank {
  year: number;
  closing_rank: number;
  round: number;
}

export interface CollegePrediction {
  college: College;
  branch: Branch;
  probability: ProbabilityTier;
  closing_rank_your_category: number;
  closing_rank_gm: number;
  rank_buffer: number;
  trend: TrendDirection;
  trend_data: YearRank[];
  round_likely: 1 | 2 | 3;
  is_special_quota: boolean;
  special_quota_type?: QuotaType;
  fee_estimate: number;
  fee_waiver_applicable: boolean;
}

export interface PredictCollegesResponse {
  results: CollegePrediction[];
  total: number;
  applied_quotas: string[];
  fee_waiver_eligible: boolean;
  fee_waiver_details: string;
}

// ── API: Stats ───────────────────────────────────

export interface StatsResponse {
  total_colleges: number;
  total_branches: number;
  years_of_data: number;
  last_updated: string;
}

// ── API: Cutoff History ──────────────────────────

export interface CutoffHistoryParams {
  college_id: number;
  branch_id: number;
  category: VerticalCategory;
}

export interface CutoffHistoryEntry {
  year: number;
  round: number;
  opening_rank: number | null;
  closing_rank: number;
  vertical_category: VerticalCategory;
}

// ── API: Simulator ───────────────────────────────

export interface SimulatorQuery {
  rank: number;
  vertical_category: VerticalCategory;
  horizontal_flags: HorizontalFlag[];
  preferred_branches: string[];
  stream: StreamType;
}

export interface SimulatorResult {
  total_colleges: number;
  safe_count: number;
  moderate_count: number;
  reach_count: number;
  top_colleges: CollegePrediction[];
  next_unlock: {
    rank_needed: number;
    college_name: string;
    branch_name: string;
  } | null;
}

// ── API Error ────────────────────────────────────

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}
