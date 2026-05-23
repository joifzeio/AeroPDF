import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { removePages } from '../lib/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';

export function RemovePages() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [pagesToRemove, setPagesToRemove] = useState('');
  
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
    setPagesToRemove('');
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

  const executeRemove = async () => {
    if (!selectedFile || !pagesToRemove) return;
    setIsProcessing(true);
    try {
      const remainingBytes = await removePages(selectedFile, pagesToRemove);
      const blob = new Blob([remainingBytes as any], { type: 'application/pdf' });
      const name = `removed_${selectedFile.name}`;

      setResultBlob(blob);
      setResultFileName(name);

      // Auto download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred during page removal. Check your values.');
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
      q: 'How do I specify pages to delete?',
      a: 'You can remove page list items by typing page numbers separated by commas (e.g. "2, 4") or ranges with hyphens (e.g. "2-5" deletes pages 2, 3, 4, and 5). You can combine them as well.'
    },
    {
      q: 'Can I remove all pages in a document?',
      a: 'No. A PDF document must have at least one page. Attempting to delete every page will trigger a validation alert.'
    },
    {
      q: 'Is it safe to remove sensitive pages here?',
      a: 'Yes, AeroPDF processes all file removals in-browser on your local processor. The document is modified locally and is never uploaded anywhere, guaranteeing absolute privacy.'
    }
  ];

  return (
    <ToolLayout
      title="Remove PDF Pages Online - Free Page Deleter"
      description="Delete unwanted pages from your PDF online for free in seconds. 100% browser-based privacy guarantees absolute security."
      headerTitle="Remove PDF Pages"
      headerSubtitle="Permanently delete specific pages or ranges from your document. Instant, local, and 100% private."
      faqs={faqs}
    >
      {isProcessing && <Loader title="Trimming document pages..." />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">Pages Deleted!</h1>
            <p className="success-subtitle">The specified pages have been trimmed. Automatic download initiated.</p>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download PDF
            </button>
            <button className="btn-secondary" onClick={() => { setSelectedFile(null); setResultBlob(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Trim Another PDF
            </button>
          </div>

          <div className="success-next-steps">
            <h4>Chain your next task</h4>
            <div className="next-step-grid">
              <button className="next-step-card" onClick={() => chainToTool('/add-page-numbers')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
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
          subtitle="Delete unwanted pages"
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>Trimming options</h3>

            <div className="form-group">
              <label htmlFor="rem-pages">Pages to Remove</label>
              <input
                id="rem-pages"
                type="text"
                className="form-input"
                placeholder="e.g. 2, 4, 6-8"
                value={pagesToRemove}
                onChange={(e) => setPagesToRemove(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)' }}>
                Page numbers to strip out. Must leave at least one page.
              </span>
            </div>

            <button
              className="btn-primary"
              onClick={executeRemove}
              disabled={!pagesToRemove.trim()}
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: '1rem',
                opacity: !pagesToRemove.trim() ? 0.6 : 1
              }}
            >
              Trim PDF
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
