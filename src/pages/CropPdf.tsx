import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { cropPdf } from '../lib/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';

interface PageDimensions {
  width: number;
  height: number;
  thumbnail: string;
}

export function CropPdf() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  
  // Page bounds and dimensions
  const [pageMeta, setPageMeta] = useState<PageDimensions | null>(null);
  
  // Margins in points (1/72 inch)
  const [marginTop, setMarginTop] = useState<number>(36); // default 0.5 inch
  const [marginBottom, setMarginBottom] = useState<number>(36);
  const [marginLeft, setMarginLeft] = useState<number>(36);
  const [marginRight, setMarginRight] = useState<number>(36);

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
    setProgressText('Rendering document preview...');
    setSelectedFile(file);
    setResultBlob(null);

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: fileArrayBuffer });
      const pdf = await loadingTask.promise;
      
      // Render the first page for visual margin reference
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (context) {
        await page.render({
          canvasContext: context,
          viewport,
          canvas
        }).promise;
      }

      // PDF units are in points, let's save the original page sizes
      const origViewport = page.getViewport({ scale: 1.0 });
      const width = origViewport.width;
      const height = origViewport.height;

      setPageMeta({
        width,
        height,
        thumbnail: canvas.toDataURL('image/jpeg', 0.8)
      });
    } catch (err) {
      console.error('Error rendering page:', err);
      alert('Could not render page preview.');
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const executeCropping = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProgressText('Cropping page coordinate bounds...');

    try {
      const croppedBytes = await cropPdf(selectedFile, {
        top: marginTop,
        bottom: marginBottom,
        left: marginLeft,
        right: marginRight
      });

      const blob = new Blob([croppedBytes as any], { type: 'application/pdf' });
      const name = `cropped_${selectedFile.name}`;

      setResultBlob(blob);
      setResultFileName(name);

      // Auto download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch (err) {
      console.error(err);
      alert('An error occurred during page cropping.');
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
      q: 'How does cropping a PDF work?',
      a: 'Cropping in PDF adjusts the "CropBox" bounding box properties of each page. Instead of deleting physical elements, it instructs PDF readers to hide the content outside the cropped boundaries, ensuring crisp vector alignment.'
    },
    {
      q: 'Will cropping reduce my file size?',
      a: 'Since cropping hides coordinates rather than permanently purging the binary graphical stream definitions, it does not significantly reduce file size. To reduce size, you should chain to the Compress PDF tool afterward.'
    },
    {
      q: 'Can I undo the crop after downloading?',
      a: 'Yes, cropped data is technically still present in the PDF structural tags, but standard viewers will display it only within your new cropped dimensions.'
    }
  ];

  // Calculate percentage margins for the visual shaded overlay
  const getPercentageStyle = () => {
    if (!pageMeta) return { top: 0, bottom: 0, left: 0, right: 0 };
    return {
      top: (marginTop / pageMeta.height) * 100,
      bottom: (marginBottom / pageMeta.height) * 100,
      left: (marginLeft / pageMeta.width) * 100,
      right: (marginRight / pageMeta.width) * 100
    };
  };

  const pct = getPercentageStyle();

  return (
    <ToolLayout
      title="Crop PDF Online - Free Tool to Crop PDF Pages"
      description="Crop your PDF pages visually online. Adjust left, right, top, and bottom margins securely inside your browser."
      headerTitle="Crop PDF Pages"
      headerSubtitle="Adjust and crop page coordinates visually using precision margin sliders. 100% serverless browser processing."
      faqs={faqs}
    >
      {isProcessing && <Loader title={progressText || 'Cropping document...'} />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">PDF Pages Cropped!</h1>
            <p className="success-subtitle">
              The page coordinate bounds have been updated. Automatic download triggered.
            </p>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download Cropped PDF
            </button>
            <button className="btn-secondary" onClick={() => { setSelectedFile(null); setPageMeta(null); setResultBlob(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Crop Another PDF
            </button>
          </div>

          <div className="success-next-steps">
            <h4>Chain your next task</h4>
            <div className="next-step-grid">
              <button className="next-step-card" onClick={() => chainToTool('/compress-pdf')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v12m0-12c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm0 0v6"/></svg>
                Compress PDF
              </button>
              <button className="next-step-card" onClick={() => chainToTool('/watermark-pdf')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685"/></svg>
                Watermark PDF
              </button>
            </div>
          </div>
        </div>
      ) : !selectedFile ? (
        <Dropzone
          onFilesSelected={(files) => handleFileSelected(files[0])}
          accept=".pdf"
          multiple={false}
          title="Drag and drop your PDF here to crop"
          subtitle="Precision coordinate margins cropper tool"
          buttonText="Select PDF file"
        />
      ) : (
        <div className="options-layout" style={{ maxWidth: '1100px', flexDirection: 'row', gap: '2rem' }}>
          
          {/* Main Visual Cropping preview */}
          <div className="options-workspace" style={{ flex: 1.5, alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-slate-800)', marginBottom: '1rem', width: '100%', textAlign: 'left' }}>
              Crop Bounding Box Preview
            </h3>

            {pageMeta && (
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '420px',
                aspectRatio: `${pageMeta.width} / ${pageMeta.height}`,
                border: '1px solid var(--color-slate-200)',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                background: 'var(--color-slate-50)'
              }}>
                {/* Visual cover page render */}
                <img
                  src={pageMeta.thumbnail}
                  alt="Page Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                />

                {/* Shaded Viewports representing margin cutoffs */}
                {/* Top shaded block */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: `${pct.top}%`,
                  background: 'rgba(15, 23, 42, 0.45)',
                  backdropFilter: 'blur(0.5px)',
                  borderBottom: '1px dashed #ef4444'
                }} />

                {/* Bottom shaded block */}
                <div style={{
                  position: 'absolute',
                  bottom: 0, left: 0, right: 0,
                  height: `${pct.bottom}%`,
                  background: 'rgba(15, 23, 42, 0.45)',
                  backdropFilter: 'blur(0.5px)',
                  borderTop: '1px dashed #ef4444'
                }} />

                {/* Left shaded block */}
                <div style={{
                  position: 'absolute',
                  top: `${pct.top}%`,
                  bottom: `${pct.bottom}%`,
                  left: 0,
                  width: `${pct.left}%`,
                  background: 'rgba(15, 23, 42, 0.45)',
                  backdropFilter: 'blur(0.5px)',
                  borderRight: '1px dashed #ef4444'
                }} />

                {/* Right shaded block */}
                <div style={{
                  position: 'absolute',
                  top: `${pct.top}%`,
                  bottom: `${pct.bottom}%`,
                  right: 0,
                  width: `${pct.right}%`,
                  background: 'rgba(15, 23, 42, 0.45)',
                  backdropFilter: 'blur(0.5px)',
                  borderLeft: '1px dashed #ef4444'
                }} />
              </div>
            )}
          </div>

          {/* Sidebar controls */}
          <div className="options-sidebar" style={{ flex: 1, minWidth: '300px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-slate-800)', marginBottom: '1.25rem' }}>
              Margin Trims
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {/* Top Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-600)', marginBottom: '0.3rem' }}>
                  <span>Top: {marginTop} pt</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  value={marginTop}
                  onChange={(e) => setMarginTop(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                />
              </div>

              {/* Bottom Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-600)', marginBottom: '0.3rem' }}>
                  <span>Bottom: {marginBottom} pt</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  value={marginBottom}
                  onChange={(e) => setMarginBottom(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                />
              </div>

              {/* Left Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-600)', marginBottom: '0.3rem' }}>
                  <span>Left: {marginLeft} pt</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  value={marginLeft}
                  onChange={(e) => setMarginLeft(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                />
              </div>

              {/* Right Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-600)', marginBottom: '0.3rem' }}>
                  <span>Right: {marginRight} pt</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  value={marginRight}
                  onChange={(e) => setMarginRight(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                />
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={executeCropping}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            >
              Crop PDF Document
            </button>

            <button className="btn-secondary" onClick={() => { setSelectedFile(null); setPageMeta(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Choose Different File
            </button>
          </div>

        </div>
      )}
    </ToolLayout>
  );
}
