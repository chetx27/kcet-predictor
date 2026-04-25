import { z } from 'zod';

export const predictRankSchema = z.object({
  kcet_marks: z.number().min(0).max(180),
  board_physics: z.number().min(0).max(100),
  board_chemistry: z.number().min(0).max(100),
  board_math: z.number().min(0).max(100),
});

export const predictCollegesSchema = z.object({
  rank: z.number().int().positive(),
  vertical_category: z.enum(['GM', 'SC', 'ST', 'Cat1', '2A', '2B', '3A', '3B', 'EWS']),
  horizontal_flags: z.array(
    z.enum([
      'rural', 'kannada_medium', 'defence', 'ex_defence',
      'ncc', 'sports', 'pwd', 'hk_region', 'capf',
      'scouts_guides', 'ews',
    ])
  ).default([]),
  preferred_branches: z.array(z.string()).default([]),
  preferred_districts: z.array(z.string()).default([]),
  college_type: z.enum(['all', 'government', 'aided', 'private']).default('all'),
  stream: z.enum(['engineering', 'pharmacy', 'agriculture', 'architecture']).default('engineering'),
});

export const cutoffHistorySchema = z.object({
  college_id: z.coerce.number().int().positive(),
  branch_id: z.coerce.number().int().positive(),
  category: z.enum(['GM', 'SC', 'ST', 'Cat1', '2A', '2B', '3A', '3B', 'EWS']).default('GM'),
});

export const collegesQuerySchema = z.object({
  district: z.string().optional(),
  type: z.enum(['government', 'aided', 'private']).optional(),
  stream: z.enum(['engineering', 'pharmacy', 'agriculture', 'architecture']).optional(),
});

export const marksRankChartSchema = z.object({
  year: z.coerce.number().int().optional(),
});
