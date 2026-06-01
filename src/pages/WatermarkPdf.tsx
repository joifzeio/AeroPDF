import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { addWatermark } from '../lib/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';

export function WatermarkPdf() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState('');
  const [pageCount, setPageCount] = useState(0);

  // Watermark Settings
  const [text, setText] = useState('TCPDF CONFIDENTIAL');
  const [size, setSize] = useState(48);
  const [color, setColor] = useState('#ef4444');
  const [opacity, setOpacity] = useState(0.4);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState('center');
  
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
      const viewport = page.getViewport({ scale: 0.5 });
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
        setThumbnail(canvas.toDataURL('image/jpeg', 0.85));
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      setThumbnail('');
      setPageCount(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeWatermark = async () => {
    if (!selectedFile || !text) return;
    setIsProcessing(true);
    try {
      const watermarkedBytes = await addWatermark(selectedFile, {
        text,
        size,
        color,
        opacity,
        rotation,
        position
      });

      const blob = new Blob([watermarkedBytes as any], { type: 'application/pdf' });
      const name = `watermarked_${selectedFile.name}`;

      setResultBlob(blob);
      setResultFileName(name);

      // Auto download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch (err) {
      console.error(err);
      alert('An error occurred during watermarking.');
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

  const getOverlayStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      color,
      opacity,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      transformOrigin: 'center center',
      fontSize: `${size / 3}px`,
      fontWeight: 'bold',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      fontFamily: 'Helvetica, Arial, sans-serif'
    };

    switch (position.toLowerCase()) {
      case 'top-left':
        return {
          ...base,
          top: '15%',
          left: '25%',
          transform: `rotate(${rotation}deg)`
        };
      case 'top-right':
        return {
          ...base,
          top: '15%',
          left: '75%',
          transform: `rotate(${rotation}deg)`
        };
      case 'bottom-left':
        return {
          ...base,
          top: '85%',
          left: '25%',
          transform: `rotate(${rotation}deg)`
        };
      case 'bottom-right':
        return {
          ...base,
          top: '85%',
          left: '75%',
          transform: `rotate(${rotation}deg)`
        };
      case 'center':
      default:
        return {
          ...base,
          top: '50%',
          left: '50%'
        };
    }
  };

  const faqs = [
    {
      q: 'Will the watermark be stamped on all pages?',
      a: 'Yes. TCPDF applies the designated text watermark with your selected dimensions, angles, transparency, and alignments to every page in the PDF document.'
    },
    {
      q: 'Can I choose my font family and colors?',
      a: 'To guarantee standard cross-platform rendering, TCPDF utilizes embedded Helvetica Bold fonts. You can choose any hex color via our integrated spectrum picker.'
    },
    {
      q: 'Are the files sent to an external server?',
      a: 'No. The stamp operation is processed locally within the browser page thread. Your security and privacy are fully preserved since no documents are uploaded.'
    }
  ];

  return (
    <ToolLayout
      title="Add Watermark to PDF Online - Free PDF Stamp Editor"
      description="Overlay text watermarks on PDF documents online for free in seconds. Complete local browser processing secures document privacy."
      headerTitle="Watermark PDF"
      headerSubtitle="Add transparent text watermarks to your PDF pages. Position, rotate, and style your stamp locally."
      faqs={faqs}
    >
      {isProcessing && <Loader title="Applying digital stamps..." />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">PDF Watermarked!</h1>
            <p className="success-subtitle">Your watermarks have been oriented. Automatic download triggered.</p>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download PDF
            </button>
            <button className="btn-secondary" onClick={() => { setSelectedFile(null); setResultBlob(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Watermark Another File
            </button>
          </div>

          <div className="success-next-steps">
            <h4>Chain your next task</h4>
            <div className="next-step-grid">
              <button className="next-step-card" onClick={() => chainToTool('/add-page-numbers')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 6h18m-18 6h18M5.25 3h15"/></svg>
                Add Page Numbers
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
          subtitle="Add custom text watermarks"
          buttonText="Select PDF file"
        />
      ) : (
        <div className="options-layout" style={{ maxWidth: '1100px' }}>
          <div className="options-workspace" style={{ flex: 2 }}>
            <div
              className="file-card"
              style={{
                width: '320px',
                padding: '0.75rem',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div className="file-thumbnail" style={{ height: '400px', position: 'relative' }}>
                {thumbnail ? (
                  <>
                    <img src={thumbnail} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <div style={getOverlayStyles()}>{text || 'PREVIEW'}</div>
                  </>
                ) : (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25" />
                  </svg>
                )}
              </div>
              <div className="file-info" style={{ marginTop: '0.75rem' }}>
                <p className="file-name" title={selectedFile.name}>{selectedFile.name}</p>
                <p className="file-size">{formatSize(selectedFile.size)}</p>
              </div>
              <span className="file-card-badge">{pageCount} pages</span>
            </div>
          </div>

          <div className="options-sidebar" style={{ flex: 1, minWidth: '320px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>Watermark Settings</h3>

            <div className="form-group">
              <label htmlFor="stamp-text">Watermark Text</label>
              <input
                id="stamp-text"
                type="text"
                className="form-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="CONFIDENTIAL, DRAFT, etc."
              />
            </div>

            <div className="form-group">
              <label htmlFor="stamp-pos">Position Alignment</label>
              <select id="stamp-pos" className="form-input" value={position} onChange={(e) => setPosition(e.target.value)}>
                <option value="center">Center</option>
                <option value="top-left">Top-Left</option>
                <option value="top-right">Top-Right</option>
                <option value="bottom-left">Bottom-Left</option>
                <option value="bottom-right">Bottom-Right</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="stamp-size">Font Size ({size}pt)</label>
              <input
                id="stamp-size"
                type="range"
                min="12"
                max="96"
                className="form-range"
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="stamp-opacity">Opacity ({Math.round(opacity * 100)}%)</label>
              <input
                id="stamp-opacity"
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                className="form-range"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="stamp-rot">Rotation Degrees ({rotation}°)</label>
              <input
                id="stamp-rot"
                type="range"
                min="-180"
                max="180"
                step="5"
                className="form-range"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="stamp-col">Stamp Color</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  id="stamp-col"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    border: 'none',
                    width: '3.5rem',
                    height: '2.25rem',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    background: 'none'
                  }}
                />
                <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--color-slate-500)' }}>
                  {color.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={executeWatermark}
              disabled={!text.trim()}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', opacity: !text.trim() ? 0.6 : 1 }}
            >
              Apply Watermark
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
