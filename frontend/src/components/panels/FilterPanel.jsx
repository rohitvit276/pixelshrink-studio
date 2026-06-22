import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';

export default function FilterPanel({ imageSrc }) {
  const [filters, setFilters] = useState({ 
    brightness: 100, 
    contrast: 100, 
    grayscale: 0 
  });
  
  const imageRef = useRef(null);

  const filterString = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) grayscale(${filters.grayscale}%)`;

  const handleDownload = async () => {
    if (imageRef.current) {
      const canvas = await html2canvas(imageRef.current, { 
        backgroundColor: null,
        useCORS: true,
        allowTaint: true 
      });
      
      const link = document.createElement('a');
      link.download = 'pixelshrink-filtered.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!imageSrc) {
    return <div className="p-10 text-center">Please upload an image to start editing.</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div ref={imageRef} className="relative w-fit">
        <img 
          src={imageSrc} 
          style={{ filter: filterString }} 
          className="max-w-md" 
          alt="Filtered" 
        />
      </div>
      
      <div className="space-y-4">
        <label>Brightness ({filters.brightness}%)</label>
        <Slider 
          value={[filters.brightness]} 
          min={0} max={200} 
          onValueChange={(v) => setFilters({...filters, brightness: v[0]})} 
        />

        <label>Contrast ({filters.contrast}%)</label>
        <Slider 
          value={[filters.contrast]} 
          min={0} max={200} 
          onValueChange={(v) => setFilters({...filters, contrast: v[0]})} 
        />
        
        <Button onClick={handleDownload} className="w-full">
          Download Filtered Image
        </Button>
      </div>
    </div>
  );
}
