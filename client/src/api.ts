import axios from 'axios';
import type {
  PredictRankRequest,
  PredictRankResponse,
  PredictCollegesRequest,
  PredictCollegesResponse,
  College,
  Branch,
  CutoffHistoryEntry,
  MarksRankMap,
  StatsResponse,
} from '../../shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export async function predictRank(data: PredictRankRequest): Promise<PredictRankResponse> {
  const res = await api.post<PredictRankResponse>('/predict-rank', data);
  return res.data;
}

export async function predictColleges(data: PredictCollegesRequest): Promise<PredictCollegesResponse> {
  const res = await api.post<PredictCollegesResponse>('/predict-colleges', data);
  return res.data;
}

export async function getColleges(params?: {
  district?: string;
  type?: string;
  stream?: string;
}): Promise<College[]> {
  const res = await api.get<College[]>('/colleges', { params });
  return res.data;
}

export async function getBranches(): Promise<Branch[]> {
  const res = await api.get<Branch[]>('/branches');
  return res.data;
}

export async function getCutoffHistory(params: {
  college_id: number;
  branch_id: number;
  category?: string;
}): Promise<CutoffHistoryEntry[]> {
  const res = await api.get<CutoffHistoryEntry[]>('/cutoff-history', { params });
  return res.data;
}

export async function getMarksRankChart(year?: number): Promise<MarksRankMap[]> {
  const res = await api.get<MarksRankMap[]>('/marks-rank-chart', { params: { year } });
  return res.data;
}

export async function getStats(): Promise<StatsResponse> {
  const res = await api.get<StatsResponse>('/stats');
  return res.data;
}
