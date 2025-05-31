import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ExplorerPage from './pages/ExplorerPage';
import MetadataPage from './pages/MetadataPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header />
          <Navbar />
          <Routes>
            <Route path="/" element={<ExplorerPage />} />
            <Route path="/metadata" element={<MetadataPage />} />
          </Routes>
          <Footer />
          <ToastContainer position="bottom-right" autoClose={2000} />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;