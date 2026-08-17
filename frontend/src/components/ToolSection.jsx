import React from 'react';
import ShrinkPanel from './panels/ShrinkPanel';
import RemoveBgPanel from './panels/RemoveBgPanel';
import CropPanel from './panels/CropPanel';
import PdfToWordPanel from './panels/PdfToWordPanel';
import WordToPdfPanel from './panels/WordToPdfPanel';
import VideoCompressPanel from './panels/VideoCompressPanel';
import VideoToMp3Panel from './panels/VideoToMp3Panel';
import FilterPanel from './panels/FilterPanel';
import MoustachifyPanel from './panels/MoustachifyPanel';
import TextToImagePanel from './panels/TextToImagePanel';
import AIImageGeneratorPanel from './panels/AIImageGeneratorPanel';
import ConvertPanel from './panels/ConvertPanel';
import WatermarkPanel from './panels/WatermarkPanel';
import ExifPanel from './panels/ExifPanel';
import BatchRenamePanel from './panels/BatchRenamePanel';
import MemePanel from './panels/MemePanel';
import CollagePanel from './panels/CollagePanel';
import PdfOrganizerPanel from './panels/PdfOrganizerPanel';
import NotepadPanel from './panels/NotepadPanel';
import JsonFormatterPanel from './panels/JsonFormatterPanel';
import PasswordGeneratorPanel from './panels/PasswordGeneratorPanel';
import DiffCheckerPanel from './panels/DiffCheckerPanel';
import QrCodeGeneratorPanel from './panels/QrCodeGeneratorPanel';
import Base64Panel from './panels/Base64Panel';
import MarkdownPreviewerPanel from './panels/MarkdownPreviewerPanel';
import WordCounterPanel from './panels/WordCounterPanel';
import ImageToPdfPanel from './panels/ImageToPdfPanel';

export default function ToolSection({ activeTool, imageSrc, setUploadedImage }) {
  const renderTool = () => {
    switch (activeTool) {
      case 'shrink': return <ShrinkPanel />;
      case 'removebg': return <RemoveBgPanel />;
      case 'crop': return <CropPanel />;
      case 'pdf2word': return <PdfToWordPanel />;
      case 'word2pdf': return <WordToPdfPanel />;
      case 'compressvideo': return <VideoCompressPanel />;
      case 'video2mp3': return <VideoToMp3Panel />;
      case 'filters':
        return <FilterPanel imageSrc={imageSrc} setUploadedImage={setUploadedImage} />;
      case 'moustachify': return <MoustachifyPanel />;
      case 'aimagegen': return <AIImageGeneratorPanel />;
      case 'texttoimage': return <TextToImagePanel />;
      case 'convert': return <ConvertPanel />;
      case 'watermark': return <WatermarkPanel />;
      case 'exif': return <ExifPanel />;
      case 'batchrename': return <BatchRenamePanel />;
      case 'meme': return <MemePanel />;
      case 'collage': return <CollagePanel />;
      case 'pdforganizer': return <PdfOrganizerPanel />;
      case 'notepad': return <NotepadPanel />;
      case 'jsonformatter': return <JsonFormatterPanel />;
      case 'passwordgen': return <PasswordGeneratorPanel />;
      case 'diffchecker': return <DiffCheckerPanel />;
      case 'qrcode': return <QrCodeGeneratorPanel />;
      case 'base64': return <Base64Panel />;
      case 'mdpreview': return <MarkdownPreviewerPanel />;
      case 'wordcounter': return <WordCounterPanel />;
      case 'img2pdf': return <ImageToPdfPanel />;
      default: return <ShrinkPanel />;
    }
  };

  return (
    <section id="tool" className="py-12 px-4 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        {renderTool()}
      </div>
    </section>
  );
}
