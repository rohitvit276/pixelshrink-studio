// Mock data for PixelShrink Studio (frontend-only)
import { Scissors, Eraser, Crop as CropIcon, FileText, FileType2 } from 'lucide-react';

export const TOOLS = [
  {
    key: 'shrink',
    label: 'Shrink Image',
    short: 'Shrink',
    icon: Scissors,
    headline: 'Image Shrinker — resize images online, free.',
    sub: 'Shrink JPG, PNG, WEBP and more without losing crispness. Perfect for socials, email and the web.',
  },
  {
    key: 'removebg',
    label: 'Remove Background',
    short: 'No-BG',
    icon: Eraser,
    headline: 'Remove Background — instant, AI-powered, free.',
    sub: 'Erase backgrounds in one click. Get crisp transparent PNGs ready for product shots, designs and social posts.',
  },
  {
    key: 'crop',
    label: 'Crop Image',
    short: 'Crop',
    icon: CropIcon,
    headline: 'Crop Image — pick the perfect frame, free.',
    sub: 'Drag to crop, lock to a preset aspect ratio, and download the result. All in your browser.',
  },
  {
    key: 'pdf2word',
    label: 'PDF → Word',
    short: 'PDF→Word',
    icon: FileText,
    headline: 'PDF to Word — extract text from PDFs, free.',
    sub: 'Convert text-based PDFs into editable Word documents. Layout-light PDFs convert best.',
  },
  {
    key: 'word2pdf',
    label: 'Word → PDF',
    short: 'Word→PDF',
    icon: FileType2,
    headline: 'Word to PDF — turn docs into PDFs, free.',
    sub: 'Drop your .docx file and get back a clean, shareable PDF in seconds.',
  },
];

export const NAV_LINKS = TOOLS.map(({ key, label }) => ({ label, tool: key, href: '#tool' }));

export const FAQ_ITEMS = [
  {
    q: 'Are all the tools really free?',
    a: 'Yes. Shrinking, background removal, cropping, PDF → Word and Word → PDF — all completely free, no sign-up required.',
  },
  {
    q: 'Do my files get uploaded to a server?',
    a: 'No. Every tool runs entirely in your browser. Your photos and documents never leave your device.',
  },
  {
    q: 'How accurate is the PDF → Word conversion?',
    a: 'It extracts the text and turns each page into Word paragraphs. Plain, text-heavy PDFs convert beautifully. Complex layouts, scanned PDFs, tables and images may not survive the trip — use a dedicated server-side converter for those.',
  },
  {
    q: 'How accurate is the Word → PDF conversion?',
    a: 'Standard documents with text, headings and lists convert cleanly. Heavily styled documents with custom fonts and complex tables may render slightly differently.',
  },
  {
    q: 'Which file formats are supported?',
    a: 'Images: JPG, PNG, WEBP, BMP, GIF. Documents: PDF (input/output) and DOCX (input/output, depending on tool).',
  },
  {
    q: 'Can I use these tools on my phone?',
    a: 'Yes. Everything works in modern mobile browsers — though background removal and document conversion are faster on a desktop.',
  },
];

export const USE_CASES = [
  'Publishing photos on websites for faster page loading',
  'Creating product shots with transparent backgrounds',
  'Cropping headshots and thumbnails to perfect dimensions',
  'Turning PDF notes back into editable Word documents',
  'Sharing Word reports as polished PDF attachments',
  'Preparing assets for social, e-commerce and email',
];
