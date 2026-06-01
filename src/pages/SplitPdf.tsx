import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { splitPdf } from '../lib/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';

export function SplitPdf() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');

  // Handle chaining state
  useEffect(() => {
    if (location.state?.chainFile) {
      handleFileSelected(location.state.chainFile);
    }
  }, [location.state]);

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setSelectedFile(file);
    setRanges('');
    setResultBlob(null);

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: fileArrayBuffer });
      const pdf = await loadingTask.promise;
      setPageCount(pdf.numPages);
      setRanges(`1-${pdf.numPages}`); // default to all pages

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
      setRanges('1');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeSplit = async () => {
    if (!selectedFile || !ranges) return;
    setIsProcessing(true);
    try {
      const splitBytes = await splitPdf(selectedFile, ranges);
      const blob = new Blob([splitBytes as any], { type: 'application/pdf' });
      const name = `extracted_${new Date().getTime()}.pdf`;
      
      setResultBlob(blob);
      setResultFileName(name);

      // Auto download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch (err) {
      console.error(err);
      alert('An error occurred during page extraction. Please check your range values (e.g. 1-3, 5).');
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerDownload = () => {
    if (!resultBlob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(resultBlob);
    link.download = resultFileName;
    link.click();
  };

  const chainToTool = (path: string) => {
    if (!resultBlob) return;
    const file = new File([resultBlob], resultFileName, { type: 'application/pdf' });
    navigate(path, { state: { chainFile: file } });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB'][i];
  };

  const faqs = [
    {
      q: 'How do I specify pages to extract?',
      a: 'You can extract ranges of pages by putting a hyphen between pages (e.g. "1-4") or specific individual pages separated by commas (e.g. "1, 3, 5"). You can even mix them: "1-3, 5, 8-10".'
    },
    {
      q: 'Are my document contents visible to anyone?',
      a: 'No. TCPDF performs all splitting, compiling, and extraction operations strictly client-side. The file never leaves your web browser, ensuring full local privacy.'
    },
    {
      q: 'Can I split a password-protected document?',
      a: 'If a document is encrypted with an open password, you must first unlock it using our "Unlock PDF" tool before splitting or extracting pages.'
    }
  ];

  return (
    <ToolLayout
      title="Split PDF Online - Extract Pages for Free"
      description="Extract specific pages or page ranges from a PDF document in seconds. 100% secure client-side browser processing."
      headerTitle="Split PDF File"
      headerSubtitle="Extract individual pages or ranges from your document into a separate PDF. Instant, safe, and private."
      faqs={faqs}
    >
      {isProcessing && <Loader title="Slicing document chapters..." />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">Pages Extracted!</h1>
            <p className="success-subtitle">Your split PDF has been compiled. Automatic download triggered.</p>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download Extracted PDF
            </button>
            <button className="btn-secondary" onClick={() => { setSelectedFile(null); setResultBlob(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Split Another File
            </button>
          </div>

          <div className="success-next-steps">
            <h4>Chain your next task</h4>
            <div className="next-step-grid">
              <button className="next-step-card" onClick={() => chainToTool('/add-page-numbers')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 6h18m-18 6h18M5.25 3h15"/></svg>
                Add Page Numbers
              </button>
              <button className="next-step-card" onClick={() => chainToTool('/watermark-pdf')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                Add Watermark
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
          subtitle="or click to browse from device"
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 15h6M9 18h6" />
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>Extraction Settings</h3>
            
            <div className="form-group">
              <label htmlFor="pages-input">Pages to Extract</label>
              <input
                id="pages-input"
                type="text"
                className="form-input"
                placeholder="e.g. 1-3, 5, 8-10"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                Use comma separation for discrete pages or dash separation for intervals.
              </span>
            </div>

            <button
              className="btn-primary"
              onClick={executeSplit}
              disabled={!ranges.trim()}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', opacity: !ranges.trim() ? 0.6 : 1 }}
            >
              Split PDF
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
