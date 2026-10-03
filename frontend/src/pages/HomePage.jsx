import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import ToolsShowcase from '../components/ToolsShowcase';
import NewToolsPromo from '../components/NewToolsPromo';
import FeaturesGrid from '../components/FeaturesGrid';
import ToolSection from '../components/ToolSection';
import InfoSections from '../components/InfoSections';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';
import MoustachifyShowcase from '../components/MoustachifyShowcase';

const SEO_META = {
  default: {
    title: 'PixelShrink Studio — Free Online Image, PDF & Video Tools',
    description: 'Free online tools to shrink images, increase image size in KB, increase PDF size, remove backgrounds, crop, convert PDF to Word and compress videos. 100% browser-based.',
    keywords: 'image resizer, image shrinker, increase image size, increase pdf size, remove background, crop image, ai image generator, text to image, pdf to word, word to pdf, compress video, video to mp3, moustachify, styled writing, free online tools',
  },
  shrink: {
    title: 'Free Image Resizer Online | Shrink Images Without Quality Loss',
    description: 'Resize and compress JPG, PNG, WEBP images online for free. Shrink images for web, email and social media while maintaining quality. No uploads needed.',
    keywords: 'image resizer, shrink image, compress image, resize image online, image compressor, reduce image size',
  },
  removebg: {
    title: 'Remove Background from Image | Free AI-Powered Background Remover',
    description: 'Remove image backgrounds instantly with AI. Get transparent PNGs for product photos, designs and social media. 100% browser-based, no uploads.',
    keywords: 'remove background, background remover, transparent PNG, AI background removal, remove white background',
  },
  crop: {
    title: 'Free Online Image Cropper | Crop Photos to Perfect Size',
    description: 'Crop images online with preset aspect ratios. Perfect for thumbnails, profile pictures and social media. Drag to select, download instantly.',
    keywords: 'image cropper, crop photo, resize aspect ratio, thumbnail maker, crop image online',
  },
  filters: {
    title: 'Free Online Photo Filters & Editor | Adjust Brightness, Contrast & Grayscale',
    description: 'Apply professional photo filters instantly. Adjust brightness, contrast, and grayscale on your images. No installation, no uploads required.',
    keywords: 'photo filters, image editor, brightness contrast adjustment, photo effects, online photo editor, grayscale filter',
  },
  aimagegen: {
    title: 'Free AI Image Generator | Create Images from Text Prompts',
    description: 'Generate stunning AI images from text prompts for free. No sign-up required. Create art, designs, and graphics instantly.',
    keywords: 'AI image generator, text to image, AI art, image generation, free AI generator, create images',
  },
  styledwriting: {
    title: 'Styled Writing & Text Card Creator | Design Beautiful Quotes & Cards',
    description: 'Create beautiful styled text cards with custom fonts, colors, and effects. Download as PNG/JPG for social media and designs. Perfect for quotes and creative posts.',
    keywords: 'styled text, text card creator, quote maker, creative writing, font styling, card design, text graphics',
  },
  moustachify: {
    title: 'Moustachify — Add Moustache to Photos | Free Face Detection Tool',
    description: 'Add fun moustaches to any face in your photos with AI face detection. Choose from 6 styles: handlebar, pencil, walrus, curly, chevron and dutch. Download instantly.',
    keywords: 'moustachify, add moustache, face detection, fun photo editor, mustache filter, face effects, photo fun app',
  },
  pdf2word: {
    title: 'Convert PDF to Word Online | Free PDF to Docx Converter',
    description: 'Convert text-based PDF files to editable Word documents online. Extract text and maintain formatting. No uploads, 100% browser-based.',
    keywords: 'pdf to word, convert pdf to docx, pdf converter, pdf to word converter, extract text from pdf',
  },
  word2pdf: {
    title: 'Convert Word to PDF Online | Free DOCX to PDF Converter',
    description: 'Convert Word documents (.docx) to PDF instantly. Create professional PDFs for sharing and printing. No uploads required.',
    keywords: 'word to pdf, convert docx to pdf, pdf converter, docx to pdf converter, word document to pdf',
  },
  compressvideo: {
    title: 'Compress Video Online | Free MP4, MOV & WebM Compressor',
    description: 'Reduce video file size without losing quality. Compress MP4, MOV, WebM files for email, messaging and social media. 100% browser-based.',
    keywords: 'video compressor, compress video, reduce video size, video compression online, mp4 compressor',
  },
  video2mp3: {
    title: 'Convert Video to MP3 | Free Audio Extraction Tool',
    description: 'Extract audio from videos and download as MP3. Works with MP4, MOV, WebM files. Perfect for podcasts and music clips.',
    keywords: 'video to mp3, extract audio, convert video to audio, mp3 converter, audio extractor',
  },
  convert: {
    title: 'Free Image Format Converter | PNG, JPG, WEBP & AVIF',
    description: 'Convert images between PNG, JPG, WEBP and AVIF online for free. Adjust quality and download instantly. 100% browser-based.',
    keywords: 'image converter, png to jpg, jpg to png, webp converter, avif converter, image format converter',
  },
  watermark: {
    title: 'Free Watermark Maker | Add Text or Logo Watermark to Photos',
    description: 'Add a text or logo watermark to your images online for free. Control position, opacity and size. No uploads required.',
    keywords: 'add watermark, watermark image, logo watermark, text watermark, watermark maker online',
  },
  exif: {
    title: 'Free EXIF Viewer & Metadata Remover | Strip GPS & Camera Data',
    description: 'View hidden EXIF metadata in your photos — camera model, GPS location, timestamps — and strip it all with one click before sharing.',
    keywords: 'exif viewer, remove metadata, strip exif, remove gps from photo, metadata remover, photo privacy',
  },
  batchrename: {
    title: 'Free Bulk File Renaming Tool | Rename Multiple Files at Once',
    description: "Rename dozens of files at once with one naming pattern and automatic numbering — no more renaming files one by one. Download them all as a ZIP. 100% browser-based.",
    keywords: 'bulk file renaming, bulk rename files, batch rename, rename multiple files, sequential file rename',
  },
  meme: {
    title: 'Free Meme Generator | Add Top & Bottom Captions to Photos',
    description: 'Create classic memes online for free. Add bold top and bottom captions to any image and download instantly.',
    keywords: 'meme generator, meme maker, create meme, caption generator, free meme maker online',
  },
  collage: {
    title: 'Free Photo Collage Maker | Merge Multiple Images into One',
    description: 'Combine 2 to 9 photos into a single grid collage online for free. Adjust columns, spacing and background color.',
    keywords: 'photo collage maker, image collage, merge photos, combine images, collage grid online',
  },
  pdforganizer: {
    title: 'Free PDF Merge, Split & Reorder Tool | Organize PDF Pages',
    description: 'Merge multiple PDFs into one, or split, delete and reorder pages in a single PDF. 100% browser-based, no uploads.',
    keywords: 'merge pdf, split pdf, reorder pdf pages, delete pdf pages, combine pdf files, pdf organizer online',
  },
  notepad: {
    title: 'PSnotepad — Free Online Notepad | Autosaving Browser Scratchpad',
    description: 'PSnotepad is a free online notepad that autosaves as you type. No sign-up, no uploads — your notes stay in your browser.',
    keywords: 'online notepad, free notepad, autosave notes, browser scratchpad, notepad online, PSnotepad',
  },
  jsonformatter: {
    title: 'Free JSON Formatter & Validator Online',
    description: 'Format, validate and minify JSON online for free. Instantly spot errors and get beautifully indented output.',
    keywords: 'json formatter, json validator, format json online, minify json, json beautifier',
  },
  passwordgen: {
    title: 'Free Secure Password Generator Online',
    description: 'Generate strong, random passwords online for free. Customize length and character types. Nothing sent over the network.',
    keywords: 'password generator, random password, secure password generator, strong password online',
  },
  diffchecker: {
    title: 'Free Online Text Diff Checker | Compare Two Texts',
    description: 'Compare two blocks of text online for free and instantly see additions and deletions highlighted.',
    keywords: 'diff checker, text compare, compare text online, text difference tool',
  },
  qrcode: {
    title: 'Free QR Code Generator Online | Text & URL to QR',
    description: 'Generate QR codes online for free from any text or URL. Download instantly as a PNG. No uploads required.',
    keywords: 'qr code generator, free qr code, create qr code, url to qr code, text to qr code',
  },
  base64: {
    title: 'Free Base64 Encoder & Decoder Online',
    description: 'Encode or decode Base64 online for free, with full Unicode support for emoji and non-Latin text.',
    keywords: 'base64 encoder, base64 decoder, encode base64, decode base64, base64 converter',
  },
  mdpreview: {
    title: 'Free Online Markdown Previewer & Editor',
    description: 'Write and preview Markdown live online for free. Perfect for README files, comments and documentation.',
    keywords: 'markdown previewer, markdown editor online, live markdown preview, md to html',
  },
  wordcounter: {
    title: 'Free Word Counter & Character Counter Online',
    description: 'Count words, characters, sentences and paragraphs online for free, with estimated reading time. Updates live.',
    keywords: 'word counter, character counter, count words online, reading time calculator',
  },
  img2pdf: {
    title: 'Free Image to PDF Converter Online | JPG, PNG to PDF',
    description: 'Convert JPG, PNG and WEBP images to PDF online for free. Combine multiple images into one PDF or export separate PDFs. No uploads.',
    keywords: 'image to pdf, jpg to pdf, png to pdf, convert images to pdf, photo to pdf converter',
  },
  increaseimage: {
    title: 'Increase Image Size in KB Online | Free JPG & PNG Size Increaser',
    description: 'Increase image size in KB or MB online for free. Make a JPG or PNG photo 20 KB, 50 KB, 100 KB or larger without losing quality, or enlarge it in pixels. No uploads.',
    keywords: 'increase image size, increase image size in kb, increase photo size, increase jpg size, increase jpeg size in kb, image size increaser, increase image size to 20kb, increase image size to 50kb, increase image size to 100kb, enlarge image',
  },
  increasepdf: {
    title: 'Increase PDF Size in KB Online | Free PDF File Size Increaser',
    description: 'Increase PDF file size in KB or MB online for free. Make a PDF 20 KB, 100 KB, 1 MB or larger to meet a minimum upload size — pages and text stay unchanged. No uploads.',
    keywords: 'increase pdf size, increase pdf size in kb, increase pdf file size, pdf size increaser, make pdf larger, increase pdf size to 100kb, increase pdf size to 1mb, increase pdf size online',
  },
};

const ROUTE_PATH_MAP = {
  shrink: '/shrink-image',
  removebg: '/remove-background',
  crop: '/crop-image',
  filters: '/image-filters',
  aimagegen: '/ai-image-generator',
  styledwriting: '/styled-writing',
  texttoimage: '/text-to-image',
  moustachify: '/moustachify',
  pdf2word: '/pdf-to-word',
  word2pdf: '/word-to-pdf',
  compressvideo: '/compress-video',
  video2mp3: '/video-to-mp3',
  convert: '/convert-image',
  watermark: '/watermark-image',
  exif: '/exif-metadata',
  batchrename: '/bulk-file-rename',
  meme: '/meme-generator',
  collage: '/image-collage',
  pdforganizer: '/pdf-organizer',
  notepad: '/notepad',
  jsonformatter: '/json-formatter',
  passwordgen: '/password-generator',
  diffchecker: '/diff-checker',
  qrcode: '/qr-code-generator',
  base64: '/base64-encoder-decoder',
  mdpreview: '/markdown-previewer',
  wordcounter: '/word-counter',
  img2pdf: '/image-to-pdf',
  increaseimage: '/increase-image-size',
  increasepdf: '/increase-pdf-size',
};

const SITE_URL = 'https://pixelshrinkstudio.com';

// Update the tags already in index.html in place, so each route has exactly one of each.
function setHeadTag(selector, tagName, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(tagName);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
}

export default function HomePage({ activeTool: routeTool }) {
  const [activeTool, setActiveTool] = useState(routeTool || 'shrink');
  const [uploadedImage, setUploadedImage] = useState(null);

  useEffect(() => {
    if (routeTool) setActiveTool(routeTool);
  }, [routeTool]);

  const scrollToTool = (toolKey) => {
    if (toolKey) setActiveTool(toolKey);
    setTimeout(() => {
      const el = document.getElementById('tool');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Get SEO meta for current tool or use default
  const currentSeo = SEO_META[routeTool] || SEO_META.default;
  const canonicalPath = routeTool ? (ROUTE_PATH_MAP[routeTool] || '/') : '/';

  useEffect(() => {
    const { title, description, keywords } = currentSeo;
    const url = `${SITE_URL}${canonicalPath}`;
    document.title = title;
    setHeadTag('meta[name="description"]', 'meta', { name: 'description', content: description });
    setHeadTag('meta[name="keywords"]', 'meta', { name: 'keywords', content: keywords });
    setHeadTag('meta[property="og:title"]', 'meta', { property: 'og:title', content: title });
    setHeadTag('meta[property="og:description"]', 'meta', { property: 'og:description', content: description });
    setHeadTag('meta[property="og:url"]', 'meta', { property: 'og:url', content: url });
    setHeadTag('meta[name="twitter:title"]', 'meta', { name: 'twitter:title', content: title });
    setHeadTag('meta[name="twitter:description"]', 'meta', { name: 'twitter:description', content: description });
    setHeadTag('link[rel="canonical"]', 'link', { rel: 'canonical', href: url });
  }, [currentSeo, canonicalPath]);

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      <Header onToolSelect={setActiveTool} activeTool={activeTool} />
      <main>
        {!routeTool && <HeroSection onGetStarted={() => scrollToTool(null)} />}
        {!routeTool && <NewToolsPromo onToolSelect={scrollToTool} />}
        {!routeTool && <ToolsShowcase onToolSelect={scrollToTool} />}
        {!routeTool && <MoustachifyShowcase onTryNow={scrollToTool} />}
        <ToolSection 
          activeTool={activeTool} 
          imageSrc={uploadedImage} 
          setUploadedImage={setUploadedImage} 
        />
        {!routeTool && (
          <>
            <FeaturesGrid />
            <InfoSections />
            <FAQSection />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
