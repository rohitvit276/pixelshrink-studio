import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Main home page */}
          <Route path="/" element={<HomePage />} />
          
          {/* Dedicated tool routes for better SEO */}
          <Route path="/shrink-image" element={<HomePage activeTool="shrink" />} />
          <Route path="/remove-background" element={<HomePage activeTool="removebg" />} />
          <Route path="/crop-image" element={<HomePage activeTool="crop" />} />
          <Route path="/image-filters" element={<HomePage activeTool="filters" />} />
          <Route path="/moustachify" element={<HomePage activeTool="moustachify" />} />
          <Route path="/pdf-to-word" element={<HomePage activeTool="pdf2word" />} />
          <Route path="/word-to-pdf" element={<HomePage activeTool="word2pdf" />} />
          <Route path="/compress-video" element={<HomePage activeTool="compressvideo" />} />
          <Route path="/video-to-mp3" element={<HomePage activeTool="video2mp3" />} />
          <Route path="/ai-image-generator" element={<HomePage activeTool="aimagegen" />} />
          <Route path="/text-to-image" element={<HomePage activeTool="texttoimage" />} />
          <Route path="/convert-image" element={<HomePage activeTool="convert" />} />
          <Route path="/watermark-image" element={<HomePage activeTool="watermark" />} />
          <Route path="/exif-metadata" element={<HomePage activeTool="exif" />} />
          <Route path="/bulk-file-rename" element={<HomePage activeTool="batchrename" />} />
          <Route path="/meme-generator" element={<HomePage activeTool="meme" />} />
          <Route path="/image-collage" element={<HomePage activeTool="collage" />} />
          <Route path="/pdf-organizer" element={<HomePage activeTool="pdforganizer" />} />
          <Route path="/notepad" element={<HomePage activeTool="notepad" />} />
          <Route path="/json-formatter" element={<HomePage activeTool="jsonformatter" />} />
          <Route path="/password-generator" element={<HomePage activeTool="passwordgen" />} />
          <Route path="/diff-checker" element={<HomePage activeTool="diffchecker" />} />
          <Route path="/qr-code-generator" element={<HomePage activeTool="qrcode" />} />
          <Route path="/base64-encoder-decoder" element={<HomePage activeTool="base64" />} />
          <Route path="/markdown-previewer" element={<HomePage activeTool="mdpreview" />} />
          <Route path="/word-counter" element={<HomePage activeTool="wordcounter" />} />
          <Route path="/image-to-pdf" element={<HomePage activeTool="img2pdf" />} />
          <Route path="/increase-image-size" element={<HomePage activeTool="increaseimage" />} />
          <Route path="/increase-pdf-size" element={<HomePage activeTool="increasepdf" />} />
          {/* Fallback for any invalid routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

export default App;
