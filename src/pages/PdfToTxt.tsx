import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { pdfToText } from '../lib/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';

export function PdfToTxt() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState('');
  const [pageCount, setPageCount] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Handle chaining state
  useEffect(() => {
    if (location.state?.chainFile) {
      handleFileSelected(location.state.chainFile);
    }
  }, [location.state]);

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setSelectedFile(file);
    setExtractedText('');
    setIsCopied(false);

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
          viewport: viewport,
          canvas: canvas
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

  const executeExtraction = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
      const text = await pdfToText(selectedFile);
      setExtractedText(text);

      // Trigger automatic .txt file download
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_extracted.txt`;
      link.click();
    } catch (err) {
      console.error(err);
      alert('An error occurred during text extraction. Verify that the document text is searchable (not scanned images).');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const triggerDownload = () => {
    if (!extractedText || !selectedFile) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_extracted.txt`;
    link.click();
  };

  const chainToTextToPdf = () => {
    if (!extractedText || !selectedFile) return;
    // Pass extracted text directly in routing state
    navigate('/txt-to-pdf', { state: { chainText: extractedText } });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB'][i];
  };

  const faqs = [
    {
      q: 'Will OCR (scanned text extraction) be performed?',
      a: 'AeroPDF client-side extracts standard digital vector text content. If your document consists of photo-scans without pre-recognized text layers, it may extract as blank. An active text layer is required.'
    },
    {
      q: 'Are my document characters secure?',
      a: 'Yes, text extraction happens 100% inside your browser session. Characters are parsed on your device RAM and never uploaded to any remote server, giving you maximum file security.'
    },
    {
      q: 'Is there a limit on file page lengths?',
      a: 'No! You can upload documents of massive lengths. The extraction processes page-by-page in-browser and compiles a plain txt download in seconds.'
    }
  ];

  return (
    <ToolLayout
      title="PDF to Text Converter - 100% Secure & Free"
      description="Extract text characters from your PDF files online for free. Complete browser-based local parsing secures privacy."
      headerTitle="PDF to Text"
      headerSubtitle="Extract structured text layers from your PDF document and download them as a plain text file. 100% local."
      faqs={faqs}
    >
      {isProcessing && <Loader title="Scanning document structures..." />}

      {extractedText ? (
        <div className="success-layout" style={{ maxWidth: '850px' }}>
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">Text Extracted!</h1>
            <p className="success-subtitle">Raw characters have been parsed. Automatic .txt download triggered.</p>
          </div>

          <div className="success-actions" style={{ flexDirection: 'row', maxWidth: '500px' }}>
            <button className="btn-primary" onClick={triggerDownload} style={{ flex: 1, justifyContent: 'center' }}>
              Download Text File
            </button>
            <button className="btn-secondary" onClick={copyToClipboard} style={{ flex: 1, justifyContent: 'center' }}>
              {isCopied ? 'Copied! ✓' : 'Copy to Clipboard'}
            </button>
          </div>

          <div style={{ width: '100%', marginTop: '1.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: '0.5rem' }}>Text Preview</h3>
            <textarea
              className="form-input"
              style={{
                width: '100%',
                height: '200px',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                background: 'var(--color-slate-50)',
                color: 'var(--color-slate-700)',
                resize: 'vertical'
              }}
              readOnly
              value={extractedText.slice(0, 3000) + (extractedText.length > 3000 ? '\n\n... [Truncated for preview] ...' : '')}
            />
          </div>

          <div className="success-next-steps" style={{ width: '100%' }}>
            <h4>Chain your next task</h4>
            <div className="next-step-grid">
              <button className="next-step-card" onClick={chainToTextToPdf}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                Convert Text to PDF
              </button>
              <button className="next-step-card" onClick={() => { setSelectedFile(null); setExtractedText(''); }}>
                Extract Another PDF
              </button>
            </div>
          </div>
        </div>
      ) : !selectedFile ? (
        <Dropzone
          onFilesSelected={(files) => handleFileSelected(files[0])}
          accept=".pdf"
          multiple={false}
          title="Drag and drop your PDF here"
          subtitle="Extract standard text characters"
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>Extraction</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', lineHeight: 1.5 }}>
              AeroPDF will scan your file structures page-by-page and compile a text buffer for download.
            </p>

            <button
              className="btn-primary"
              onClick={executeExtraction}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            >
              Extract Text
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
