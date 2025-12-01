import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import BadgesPage from './pages/BadgesPage';
import HistoryPage from './pages/HistoryPage';
import StatsPage from './pages/StatsPage';
import StationsPage from './pages/StationsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Nouvelle interface tableau de bord */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/stations" element={<StationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Page d'analyse existante conservée pour le flux « Nouveau trajet » */}
          <Route path="/analysis" element={<AnalysisPage />} />

          {/* Ancienne page marketing (facultative) */}
          <Route path="/landing" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;