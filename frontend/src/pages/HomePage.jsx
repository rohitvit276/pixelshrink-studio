import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ToolSection from '../components/ToolSection';
import InfoSections from '../components/InfoSections';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';

export default function HomePage({ activeTool: routeTool }) {
  // Initialize state
  const [activeTool, setActiveTool] = useState(routeTool || 'shrink');
  const [uploadedImage, setUploadedImage] = useState(null);

  // Sync state if route changes
  useEffect(() => {
    if (routeTool) {
      setActiveTool(routeTool);
    }
  }, [routeTool]);

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      {/* Helmet is now correctly inside the component */}
      <Helmet>
        <title>Free Online Image Filters & Photo Editor | PixelShrink Studio</title>
        <meta name="description" content="Apply professional photo filters and adjust brightness, contrast, and grayscale instantly in your browser. No sign-up required." />
      </Helmet>
      
      <Header onToolSelect={setActiveTool} />
      <main>
        <ToolSection 
          activeTool={activeTool} 
          onToolChange={setActiveTool}
          imageSrc={uploadedImage}
          setUploadedImage={setUploadedImage}
        />
        
        {/* Only show landing page content if no specific tool is active */}
        {!routeTool && (
          <>
            <InfoSections />
            <FAQSection />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
