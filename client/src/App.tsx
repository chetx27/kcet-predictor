import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { RankPredictorPage } from './pages/RankPredictorPage';
import { CollegePredictorPage } from './pages/CollegePredictorPage';
import { CollegePredictorResultsPage } from './pages/CollegePredictorResultsPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { CollegeExplorerPage } from './pages/CollegeExplorerPage';
import { CollegeDetailPage } from './pages/CollegeDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/rank-predictor" element={<RankPredictorPage />} />
          <Route path="/college-predictor" element={<CollegePredictorPage />} />
          <Route path="/college-predictor/results" element={<CollegePredictorResultsPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/colleges" element={<CollegeExplorerPage />} />
          <Route path="/colleges/:code" element={<CollegeDetailPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
