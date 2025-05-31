import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ApiAnalyzerPage from './pages/ApiAnalyzerPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <ApiAnalyzerPage />
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;