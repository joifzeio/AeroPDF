import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { pdfToJpg } from '../lib/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

export function PdfToJpg() {
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [dpi, setDpi] = useState(150);
  
  const [progressText, setProgressText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  // Handle chaining state
  useEffect(() => {
    if (location.state?.chainFile) {
      handleFileSelected(location.state.chainFile);
    }
  }, [location.state]);

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setSelectedFile(file);
    setResultImages([]);
    setZipBlob(null);

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: fileArrayBuffer });
      const pdf = await loadingTask.promise;
      setPageCount(pdf.numPages);

      // Render cover thumbnail
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.35 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (context) {
        await page.render({
          canvasContext: context,
          viewport,
          canvas // Required in pdfjs v5
        }).promise;
        setThumbnail(canvas.toDataURL('image/jpeg', 0.8));
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      setThumbnail('');
      setPageCount(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeConversion = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProgressText('Extracting page structures...');
    
    try {
      const images = await pdfToJpg(selectedFile, dpi, (current, total) => {
        setProgressText(`Rendering page ${current} of ${total}...`);
      });
      
      setResultImages(images);

      // Package results
      if (images.length === 1) {
        const link = document.createElement('a');
        link.href = images[0];
        link.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_page1.jpg`;
        link.click();
      } else {
        setProgressText('Compiling ZIP archive...');
        const zip = new JSZip();
        
        images.forEach((imgUri, index) => {
          const base64Data = imgUri.split(',')[1];
          zip.file(`page_${index + 1}.jpg`, base64Data, { base64: true });
        });

        const content = await zip.generateAsync({ type: 'blob' });
        setZipBlob(content);

        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_images.zip`;
        link.click();
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during canvas rendering.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const triggerDownload = () => {
    if (resultImages.length === 0) return;
    if (resultImages.length === 1) {
      const link = document.createElement('a');
      link.href = resultImages[0];
      link.download = `${selectedFile?.name.replace(/\.[^/.]+$/, '')}_page1.jpg`;
      link.click();
    } else if (zipBlob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${selectedFile?.name.replace(/\.[^/.]+$/, '')}_images.zip`;
      link.click();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB'][i];
  };

  const faqs = [
    {
      q: 'What quality DPI should I select?',
      a: 'Choose "300 DPI (High)" for high-resolution graphics or printing, "150 DPI (Normal)" for standard digital viewing and sharing, or "72 DPI (Low)" for highly compact email attachments.'
    },
    {
      q: 'How will I receive the converted images?',
      a: 'If your PDF is a single page, it downloads as a single JPEG image directly. For multi-page PDFs, AeroPDF packages all pages into a single ZIP archive to save storage space and keep your device clean.'
    },
    {
      q: 'Are the files sent to a server for parsing?',
      a: 'No. AeroPDF does not have a backend server. The rendering of pages is completed strictly client-side inside your browser thread using canvas APIs, meaning your documents remain 100% private.'
    }
  ];

  return (
    <ToolLayout
      title="PDF to JPG Converter - 100% Free & Secure"
      description="Convert PDF pages to JPEG images online in seconds. Fully client-side processing guarantees your absolute document privacy."
      headerTitle="PDF to JPG"
      headerSubtitle="Extract pages of your PDF into high-quality JPEG images. Processed entirely in the browser."
      faqs={faqs}
    >
      {isProcessing && <Loader title={progressText || 'Extracting elements...'} />}

      {resultImages.length > 0 ? (
        <div className="success-layout" style={{ maxWidth: '850px' }}>
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">Conversion Complete!</h1>
            <p className="success-subtitle">
              {resultImages.length} pages converted. {resultImages.length === 1 ? 'Your JPEG has downloaded.' : 'Your ZIP archive has downloaded.'}
            </p>
          </div>

          <div className="success-actions" style={{ maxWidth: '400px' }}>
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download Converted Files
            </button>
            <button className="btn-secondary" onClick={() => { setSelectedFile(null); setResultImages([]); }} style={{ width: '100%', justifyContent: 'center' }}>
              Convert Another PDF
            </button>
          </div>

          <div style={{ marginTop: '2rem', width: '100%' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: '1rem', textAlign: 'left' }}>
              Rendered Page Previews
            </h3>
            <div className="file-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', width: '100%', maxWidth: 'none' }}>
              {resultImages.slice(0, 8).map((img, i) => (
                <div className="file-card" key={i} style={{ padding: '0.5rem', gap: '0.5rem' }}>
                  <div className="file-thumbnail" style={{ borderRadius: 'var(--radius-sm)' }}>
                    <img src={img} alt={`Page ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-slate-500)' }}>
                    Page {i+1}
                  </span>
                </div>
              ))}
              {resultImages.length > 8 && (
                <div className="file-card" style={{ justifyContent: 'center', background: 'var(--color-slate-100)', borderStyle: 'dashed' }}>
                  <span style={{ fontWeight: 700, color: 'var(--color-slate-500)' }}>
                    +{resultImages.length - 8} more pages
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : !selectedFile ? (
        <Dropzone
          onFilesSelected={(files) => handleFileSelected(files[0])}
          accept=".pdf"
          multiple={false}
          title="Drag and drop your PDF file here"
          subtitle="or click to search files"
          buttonText="Select PDF file"
        />
      ) : (
        <div className="options-layout">
          <div className="options-workspace">
            <div className="file-card" style={{ width: '220px', cursor: 'default' }}>
              <div className="file-thumbnail" style={{ height: '240px' }}>
                {thumbnail ? (
                  <img src={thumbnail} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25" />
                  </svg>
                )}
              </div>
              <div className="file-info">
                <p className="file-name" title={selectedFile.name}>{selectedFile.name}</p>
                <p className="file-size">{formatSize(selectedFile.size)}</p>
              </div>
              <span className="file-card-badge">{pageCount} pages</span>
            </div>
          </div>

          <div className="options-sidebar">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>Image Quality</h3>

            <div className="form-group">
              <label>Output DPI Resolution</label>
              
              <div
                className={`option-select-card ${dpi === 300 ? 'active' : ''}`}
                onClick={() => setDpi(300)}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>300 DPI — High Res</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Best quality, perfect for archiving and printing.</p>
                </div>
              </div>

              <div
                className={`option-select-card ${dpi === 150 ? 'active' : ''}`}
                onClick={() => setDpi(150)}
                style={{ marginTop: '0.5rem' }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>150 DPI — Standard</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Balanced speed and detail, perfect for web sharing.</p>
                </div>
              </div>

              <div
                className={`option-select-card ${dpi === 72 ? 'active' : ''}`}
                onClick={() => setDpi(72)}
                style={{ marginTop: '0.5rem' }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>72 DPI — Low Res</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>Super fast conversions, ultra-small file sizes.</p>
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={executeConversion}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            >
              Convert to JPG
            </button>

            <button className="btn-secondary" onClick={() => setSelectedFile(null)} style={{ width: '100%', justifyContent: 'center' }}>
              Choose Different File
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
