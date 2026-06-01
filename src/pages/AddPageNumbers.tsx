import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { addPageNumbers } from '../lib/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';

export function AddPageNumbers() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');
  
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
    setResultBlob(null);

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

  const executeAddNumbers = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
      const numberedBytes = await addPageNumbers(selectedFile, position);
      const blob = new Blob([numberedBytes as any], { type: 'application/pdf' });
      const name = `numbered_${selectedFile.name}`;

      setResultBlob(blob);
      setResultFileName(name);

      // Auto download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch (err) {
      console.error(err);
      alert('An error occurred during page numbering.');
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
      q: 'Will the page numbering adapt to orientation changes?',
      a: 'Yes! TCPDF calculates coordinates dynamically for each sheet. Whether a page is landscape or portrait, the numbering is positioned correctly.'
    },
    {
      q: 'What font format is used for page numbering?',
      a: 'We use the standardized vector-based Helvetica font to guarantee that page numbers look clean, professional, and display correctly on all devices.'
    },
    {
      q: 'Is my file processed locally?',
      a: 'Absolutely. TCPDF embeds numbering natively within the document inside your browser session. Your documents remain 100% confidential.'
    }
  ];

  return (
    <ToolLayout
      title="Add PDF Page Numbers - Free Online Numbering Tool"
      description="Insert custom page numbering into your PDF online for free. Clean in-browser compilation preserves file safety."
      headerTitle="Add Page Numbers"
      headerSubtitle="Insert clean page numbering overlays on every sheet in your PDF. Safe, instant, and local."
      faqs={faqs}
    >
      {isProcessing && <Loader title="Engraving page numbering..." />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">Page Numbers Added!</h1>
            <p className="success-subtitle">The page numbering has been engraved. Automatic download triggered.</p>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download Numbered PDF
            </button>
            <button className="btn-secondary" onClick={() => { setSelectedFile(null); setResultBlob(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Number Another PDF
            </button>
          </div>

          <div className="success-next-steps">
            <h4>Chain your next task</h4>
            <div className="next-step-grid">
              <button className="next-step-card" onClick={() => chainToTool('/watermark-pdf')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                Add Watermark
              </button>
              <button className="next-step-card" onClick={() => navigate('/')}>
                Back to Toolkit
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
          subtitle="Add dynamic page numbers"
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>Stamping options</h3>

            <div className="form-group">
              <label htmlFor="num-pos">Position Alignment</label>
              <select
                id="num-pos"
                className="form-input"
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
              >
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="top-right">Top Right</option>
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={executeAddNumbers}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            >
              Number PDF
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
