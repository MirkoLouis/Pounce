import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import GlobalSetup from './components/GlobalSetup';

const App = () => {
  return (
    <Router>
      <GlobalSetup>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </GlobalSetup>
    </Router>
  );
};

export default App;
