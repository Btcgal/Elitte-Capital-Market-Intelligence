/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Research from './pages/Research';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Assets from './pages/Assets';
import CreditProposal from './pages/CreditProposal';
import TaxPlanning from './pages/TaxPlanning';
import News from './pages/News';
import Tutorials from './pages/Tutorials';
import TutorialDetails from './pages/TutorialDetails';
import InvestmentTheses from './pages/InvestmentTheses';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><AppLayout><Clients /></AppLayout></ProtectedRoute>} />
        <Route path="/clients/:id" element={<ProtectedRoute><AppLayout><ClientDetails /></AppLayout></ProtectedRoute>} />
        <Route path="/assets" element={<ProtectedRoute><AppLayout><Assets /></AppLayout></ProtectedRoute>} />
        <Route path="/credit" element={<ProtectedRoute><AppLayout><CreditProposal /></AppLayout></ProtectedRoute>} />
        <Route path="/tax" element={<ProtectedRoute><AppLayout><TaxPlanning /></AppLayout></ProtectedRoute>} />
        <Route path="/research" element={<ProtectedRoute><AppLayout><Research /></AppLayout></ProtectedRoute>} />
        <Route path="/news" element={<ProtectedRoute><AppLayout><News /></AppLayout></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><AppLayout><Chat /></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
        <Route path="/tutorials" element={<ProtectedRoute><AppLayout><Tutorials /></AppLayout></ProtectedRoute>} />
        <Route path="/tutorials/:id" element={<ProtectedRoute><AppLayout><TutorialDetails /></AppLayout></ProtectedRoute>} />
        <Route path="/theses" element={<ProtectedRoute><AppLayout><InvestmentTheses /></AppLayout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
