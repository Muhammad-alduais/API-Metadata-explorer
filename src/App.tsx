import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/Header';
import Navbar from './components/Navbar';
import MainContainer from './components/MainContainer';
import Footer from './components/Footer';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <Navbar />
      <MainContainer />
      <Footer />
      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}

export default App;