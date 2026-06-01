import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { rotatePdf } from '../lib/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';

interface RenderedPage {
  pageIndex: number;
  thumbnail: string;
  rotation: number; // 0, 90, 180, 270 relative
}

export function RotatePdf() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pagesList, setPagesList] = useState<RenderedPage[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
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
    setProgressText('Analyzing pages...');
    setSelectedFile(file);
    setPagesList([]);
    setResultBlob(null);

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: fileArrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const rendered: RenderedPage[] = [];
      const scale = 0.25;

      for (let i = 1; i <= numPages; i++) {
        setProgressText(`Generating page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        
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
        }

        rendered.push({
          pageIndex: i - 1,
          thumbnail: canvas.toDataURL('image/jpeg', 0.8),
          rotation: 0
        });
      }

      setPagesList(rendered);
    } catch (err) {
      console.error('Error rendering pages:', err);
      alert('Could not render document pages. Encryption or file corruption might be present.');
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const rotatePage = (index: number) => {
    setPagesList((prev) =>
      prev.map((p) => (p.pageIndex === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const rotateAll = (deg: number) => {
    setPagesList((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + deg + 360) % 360 })));
  };

  const executeRotate = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProgressText('Re-aligning sheets...');

    const rotationsMap: { [key: number]: number } = {};
    pagesList.forEach((p) => {
      if (p.rotation !== 0) {
        rotationsMap[p.pageIndex] = p.rotation;
      }
    });

    try {
      const rotatedBytes = await rotatePdf(selectedFile, rotationsMap);
      const blob = new Blob([rotatedBytes as any], { type: 'application/pdf' });
      const name = `rotated_${new Date().getTime()}.pdf`;

      setResultBlob(blob);
      setResultFileName(name);

      // Auto download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch (err) {
      console.error(err);
      alert('An error occurred during rotations.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
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

  const faqs = [
    {
      q: 'Will rotating pages degrade my text or vector resolution?',
      a: 'No. TCPDF modifies the rotation tag values of pages natively within the PDF structure. The underlying vector text, fonts, and images are completely untouched and preserve their crisp quality.'
    },
    {
      q: 'Can I rotate individual pages differently?',
      a: 'Yes, our visual interface allows you to click on individual cards to rotate a single page, or apply a batch 90/180 degree rotation to all pages in the PDF simultaneously.'
    },
    {
      q: 'Is my file processed locally?',
      a: 'Yes, like all other TCPDF utilities, the rotation compiles entirely in your browser using local resources. Your files never get sent over the network.'
    }
  ];

  return (
    <ToolLayout
      title="Rotate PDF Online - Free Page Orientation Editor"
      description="Rotate PDF pages clockwise or counter-clockwise online in seconds. High-resolution local browser compilation."
      headerTitle="Rotate PDF"
      headerSubtitle="Rotate individual or all pages within your document. Keep high-fidelity resolutions, completely local."
      faqs={faqs}
    >
      {isProcessing && <Loader title={progressText || 'Stitching document angles...'} />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">Pages Rotated!</h1>
            <p className="success-subtitle">Your PDF pages have been oriented. Automatic download triggered.</p>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download PDF
            </button>
            <button className="btn-secondary" onClick={() => { setSelectedFile(null); setPagesList([]); setResultBlob(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Rotate Another File
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
          title="Drag and drop your PDF file here"
          subtitle="or click to browse local files"
          buttonText="Select PDF file"
        />
      ) : (
        <div className="options-layout" style={{ maxWidth: '1200px' }}>
          <div className="options-workspace" style={{ flex: 3, alignItems: 'stretch' }}>
            <div className="workspace-actions" style={{ maxWidth: 'none', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-slate-700)' }}>
                {pagesList.length} pages ready
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={() => rotateAll(90)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Rotate All ↻
                </button>
                <button className="btn-secondary" onClick={() => rotateAll(-90)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Rotate All ↺
                </button>
              </div>
            </div>

            <div className="file-grid" style={{ maxWidth: 'none', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {pagesList.map((page) => (
                <div
                  className="file-card"
                  key={page.pageIndex}
                  onClick={() => rotatePage(page.pageIndex)}
                  style={{ cursor: 'pointer' }}
                >
                  <button
                    className="file-card-rotate-btn"
                    style={{ top: '0.5rem', right: '0.5rem', left: 'auto' }}
                  >
                    ↻
                  </button>

                  <div
                    className="file-thumbnail"
                    style={{
                      height: '160px',
                      transition: 'transform 0.3s ease',
                      transform: `rotate(${page.rotation}deg)`
                    }}
                  >
                    <img src={page.thumbnail} alt={`Page ${page.pageIndex + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>

                  <div className="file-info" style={{ marginTop: '0.25rem' }}>
                    <p className="file-name" style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>
                      Page {page.pageIndex + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="options-sidebar" style={{ flex: 1, minWidth: '260px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>Rotate PDF</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', lineHeight: 1.5 }}>
              Click on individual pages in the grid to rotate them clockwise by 90°.
            </p>

            <button
              className="btn-primary"
              onClick={executeRotate}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            >
              Apply Rotations
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
