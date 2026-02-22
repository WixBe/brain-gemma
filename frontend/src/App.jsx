import React from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Hero from './components/diagnosis/Hero';
import UploadSection from './components/diagnosis/UploadSection';
import ResultsSection from './components/diagnosis/ResultsSection';
import PipelineSection from './components/diagnosis/PipelineSection';
import './styles/main.css';

function App() {
  return (
    <div className="app-container">
      <Header />
      <main id="main-content">
        <Hero />
        <UploadSection />
        <ResultsSection />
        <PipelineSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
