import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { stampSignature } from '../lib/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';

interface PageRenderInfo {
  pageIndex: number;
  width: number;
  height: number;
  thumbnail: string;
}

type SignMode = 'draw' | 'type';
type StrokeColor = '#000000' | '#0f172a' | '#1d4ed8' | '#b91c1c'; // Black, Dark Slate, Blue, Red
type FontStyle = 'dancing' | 'vibes' | 'satisfy' | 'yellowtail';

export function SignPdf() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Page rendering states
  const [pages, setPages] = useState<PageRenderInfo[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  
  // Signature generator states
  const [signMode, setSignMode] = useState<SignMode>('draw');
  const [strokeColor, setStrokeColor] = useState<StrokeColor>('#000000');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState<FontStyle>('dancing');
  const [signatureImageUri, setSignatureImageUri] = useState<string | null>(null);
  
  // Placement states
  const [sigWidth, setSigWidth] = useState<number>(180);
  const [sigHeight, setSigHeight] = useState<number>(75);
  const [sigX, setSigX] = useState<number>(50); // percentage (0-100)
  const [sigY, setSigY] = useState<number>(50); // percentage (0-100)
  
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');

  // Canvas Refs
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Load cursive fonts dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Dancing+Script:wght@700&family=Great+Vibes&family=Satisfy&family=Yellowtail&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      // clean up link if needed (optional)
    };
  }, []);

  // Handle chaining file
  useEffect(() => {
    if (location.state?.chainFile) {
      handleFileSelected(location.state.chainFile);
    }
  }, [location.state]);

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setProgressText('Loading document pages...');
    setSelectedFile(file);
    setPages([]);
    setSelectedPageIndex(0);
    setResultBlob(null);

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: fileArrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const items: PageRenderInfo[] = [];
      const scale = 0.8; // higher scale for signature placement accuracy

      for (let i = 1; i <= numPages; i++) {
        setProgressText(`Rendering page ${i} of ${numPages}...`);
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
            canvas
          }).promise;
        }

        items.push({
          pageIndex: i - 1,
          width: viewport.width,
          height: viewport.height,
          thumbnail: canvas.toDataURL('image/jpeg', 0.8)
        });
      }

      setPages(items);
    } catch (err) {
      console.error('Error rendering pages:', err);
      alert('Could not render document pages.');
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  // Drawing Canvas operations
  useEffect(() => {
    if (signMode === 'draw' && drawCanvasRef.current) {
      const canvas = drawCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signMode, strokeColor]);

  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Calculate position taking into account css scaling
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const getCanvasTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas || e.touches.length === 0) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: ((touch.clientX - rect.left) / rect.width) * canvas.width,
      y: ((touch.clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDrawing = (x: number, y: number) => {
    isDrawingRef.current = true;
    lastPosRef.current = { x, y };
  };

  const draw = (x: number, y: number) => {
    if (!isDrawingRef.current || !drawCanvasRef.current) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPosRef.current = { x, y };
    }
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    extractSignatureImage();
  };

  const clearCanvas = () => {
    if (!drawCanvasRef.current) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureImageUri(null);
    }
  };

  // Convert typed name to digital script image
  const renderTypedSignature = () => {
    if (!typedName.trim()) {
      setSignatureImageUri(null);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // clear with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let fontFamily = "'Dancing Script', cursive";
      if (selectedFont === 'vibes') {
        fontFamily = "'Great Vibes', cursive";
      } else if (selectedFont === 'satisfy') {
        fontFamily = "'Satisfy', cursive";
      } else if (selectedFont === 'yellowtail') {
        fontFamily = "'Yellowtail', cursive";
      }

      ctx.fillStyle = strokeColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Dynamic scaling for long names
      let fontSize = 48;
      ctx.font = `700 ${fontSize}px ${fontFamily}`;
      const textWidth = ctx.measureText(typedName).width;
      if (textWidth > canvas.width - 40) {
        fontSize = Math.max(20, Math.floor((canvas.width - 40) / textWidth * fontSize));
        ctx.font = `700 ${fontSize}px ${fontFamily}`;
      }

      ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
      
      // optional visual underline for cursive realism
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(40, canvas.height - 40);
      ctx.bezierCurveTo(
        canvas.width / 3, canvas.height - 35, 
        (2 * canvas.width) / 3, canvas.height - 45, 
        canvas.width - 40, canvas.height - 38
      );
      ctx.stroke();

      setSignatureImageUri(canvas.toDataURL('image/png'));
    }
  };

  useEffect(() => {
    if (signMode === 'type') {
      renderTypedSignature();
    }
  }, [typedName, selectedFont, strokeColor, signMode]);

  const extractSignatureImage = () => {
    if (!drawCanvasRef.current) return;
    const canvas = drawCanvasRef.current;
    
    // Check if canvas is empty
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const buffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    const hasDrawings = buffer.some(color => color !== 0);

    if (hasDrawings) {
      setSignatureImageUri(canvas.toDataURL('image/png'));
    } else {
      setSignatureImageUri(null);
    }
  };

  // Dragging handlers for interactive preview
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Position signature center on click bounds
    setSigX(Math.max(0, Math.min(100, x)));
    setSigY(Math.max(0, Math.min(100, y)));
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1 || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSigX(Math.max(0, Math.min(100, x)));
    setSigY(Math.max(0, Math.min(100, y)));
  };

  const handleTouchDrag = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0 || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setSigX(Math.max(0, Math.min(100, x)));
    setSigY(Math.max(0, Math.min(100, y)));
  };

  const executeStamping = async () => {
    if (!selectedFile || !signatureImageUri || pages.length === 0) return;
    setIsProcessing(true);
    setProgressText('Embedding signature digitally...');

    try {
      const activePage = pages[selectedPageIndex];
      
      // Calculate coordinates: convert screen percentage coordinates back to PDF points
      // PDF Coordinates: Bottom-Left is (0,0), Top-Right is (width, height)
      // Screen Coordinates: Top-Left is (0,0), Bottom-Right is (width, height)
      
      // 1. Sig visual dimensions inside the container
      const containerWidth = activePage.width;
      const containerHeight = activePage.height;
      
      // 2. Sig width/height as visual points
      const pdfX = (sigX / 100) * containerWidth - (sigWidth / 2);
      // In PDF, Y starts from bottom, so invert the top-based Y coordinate
      // Also adjust for signature center displacement
      const visualYTop = (sigY / 100) * containerHeight;
      const pdfY = containerHeight - visualYTop - (sigHeight / 2);

      const stampedBytes = await stampSignature(selectedFile, signatureImageUri, {
        pageIndex: selectedPageIndex,
        x: Math.max(0, Math.min(containerWidth - sigWidth, pdfX)),
        y: Math.max(0, Math.min(containerHeight - sigHeight, pdfY)),
        width: sigWidth,
        height: sigHeight
      });

      const blob = new Blob([stampedBytes as any], { type: 'application/pdf' });
      const name = `signed_${selectedFile.name}`;

      setResultBlob(blob);
      setResultFileName(name);

      // Auto download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch (err) {
      console.error(err);
      alert('An error occurred while signing the PDF.');
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
      q: 'Is my digital signature secure?',
      a: 'Absolutely. TCPDF is 100% serverless. Your signature and PDF documents remain entirely inside your local browser memory space. Nothing is uploaded or cached on external servers.'
    },
    {
      q: 'Can I type a custom name in a realistic signature script?',
      a: 'Yes! Select the "Type Signature" mode, enter your name, and choose from beautiful hand-drawn font typefaces.'
    },
    {
      q: 'Will the stamped signature print correctly?',
      a: 'Yes. TCPDF embeds the signature natively as high-resolution raster objects vector-aligned to the coordinate grid, ensuring high printing and zoom fidelity.'
    }
  ];

  return (
    <ToolLayout
      title="Sign PDF Online - Free Digital E-Signatures"
      description="Draw or type your signature online and place it visually onto your PDF document. 100% secure client-side digital stamps."
      headerTitle="Sign PDF Document"
      headerSubtitle="Sign your PDFs with beautiful drawn signatures or elegant script lettering in seconds. Completely private."
      faqs={faqs}
    >
      {isProcessing && <Loader title={progressText || 'Embedding signature...'} />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">PDF Digitally Signed!</h1>
            <p className="success-subtitle">Your visual signature has been permanently embedded. Automatic download triggered.</p>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download Signed PDF
            </button>
            <button className="btn-secondary" onClick={() => { setSelectedFile(null); setPages([]); setResultBlob(null); setSignatureImageUri(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Sign Another PDF
            </button>
          </div>

          <div className="success-next-steps">
            <h4>Chain your next task</h4>
            <div className="next-step-grid">
              <button className="next-step-card" onClick={() => chainToTool('/compress-pdf')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v12m0-12c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm0 0v6"/></svg>
                Compress PDF
              </button>
              <button className="next-step-card" onClick={() => chainToTool('/rotate-pdf')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/></svg>
                Rotate PDF
              </button>
            </div>
          </div>
        </div>
      ) : !selectedFile ? (
        <Dropzone
          onFilesSelected={(files) => handleFileSelected(files[0])}
          accept=".pdf"
          multiple={false}
          title="Drag and drop your PDF here to sign"
          subtitle="Place drawn or typed signatures visually"
          buttonText="Select PDF file"
        />
      ) : (
        <div className="options-layout" style={{ maxWidth: '1200px', flexDirection: 'row', gap: '2rem' }}>
          
          {/* Main Visual Placement Area */}
          <div className="options-workspace" style={{ flex: 2, alignItems: 'center', minWidth: '320px' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-slate-700)' }}>
                Page Selection:
              </span>
              <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', maxWidth: '300px', paddingBottom: '0.2rem' }}>
                {pages.map((p, idx) => (
                  <button
                    key={p.pageIndex}
                    onClick={() => setSelectedPageIndex(idx)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: selectedPageIndex === idx ? 'var(--color-primary)' : 'var(--color-slate-100)',
                      color: selectedPageIndex === idx ? 'white' : 'var(--color-slate-600)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Page container with Signature visual overlay */}
            {pages.length > 0 && (
              <div 
                ref={previewContainerRef}
                onClick={handlePreviewClick}
                onMouseMove={handleDrag}
                onTouchMove={handleTouchDrag}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: `${pages[selectedPageIndex].width}px`,
                  aspectRatio: `${pages[selectedPageIndex].width} / ${pages[selectedPageIndex].height}`,
                  border: '2px dashed var(--color-slate-200)',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  background: 'white',
                  cursor: 'crosshair',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'
                }}
              >
                {/* Background Page Render */}
                <img 
                  src={pages[selectedPageIndex].thumbnail} 
                  alt="PDF Page Render" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
                />

                {/* Floating Absolute Draggable Signature Block */}
                {signatureImageUri && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${sigX}%`,
                      top: `${sigY}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${sigWidth}px`,
                      height: `${sigHeight}px`,
                      border: '2px solid var(--color-primary)',
                      borderRadius: '0.25rem',
                      background: 'rgba(253, 242, 248, 0.4)',
                      backdropFilter: 'blur(1px)',
                      pointerEvents: 'none', // lets underlying click adjust bounds
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  >
                    <img 
                      src={signatureImageUri} 
                      alt="Signature Overlay" 
                      style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '-1.25rem',
                      background: 'var(--color-primary)',
                      color: 'white',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '0.25rem',
                      whiteSpace: 'nowrap'
                    }}>
                      Drag to Place Signature
                    </div>
                  </div>
                )}
              </div>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.75rem', textAlign: 'center' }}>
              Click anywhere inside the document preview to position the signature, or drag your mouse/finger across the canvas.
            </p>
          </div>

          {/* Sidebar controls for drawing or typing signature */}
          <div className="options-sidebar" style={{ flex: 1.2, minWidth: '300px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-slate-800)', marginBottom: '1rem' }}>
              Create Signature
            </h3>

            {/* Mode selection tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid var(--color-slate-100)', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setSignMode('draw')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: signMode === 'draw' ? 'var(--color-primary)' : 'var(--color-slate-500)',
                  borderBottom: signMode === 'draw' ? '2px solid var(--color-primary)' : 'none',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Draw Mode
              </button>
              <button
                onClick={() => setSignMode('type')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: signMode === 'type' ? 'var(--color-primary)' : 'var(--color-slate-500)',
                  borderBottom: signMode === 'type' ? '2px solid var(--color-primary)' : 'none',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Type Mode
              </button>
            </div>

            {/* Style Selection: Ink Stroke Color */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-500)', display: 'block', marginBottom: '0.5rem' }}>
                Ink Stroke Color:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['#000000', '#0f172a', '#1d4ed8', '#b91c1c'] as StrokeColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: strokeColor === color ? '3px solid var(--color-slate-300)' : '1px solid var(--color-slate-200)',
                      cursor: 'pointer',
                      boxShadow: strokeColor === color ? '0 0 0 2px var(--color-primary)' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Render subcomponents based on Draw vs Type Mode */}
            {signMode === 'draw' ? (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-500)', display: 'block', marginBottom: '0.5rem' }}>
                  Draw signature below:
                </label>
                <div style={{ border: '2px solid var(--color-slate-200)', borderRadius: '0.5rem', overflow: 'hidden', background: '#f8fafc', position: 'relative' }}>
                  <canvas
                    ref={drawCanvasRef}
                    width={400}
                    height={180}
                    style={{ display: 'block', width: '100%', height: '140px', background: 'transparent', cursor: 'pointer' }}
                    onMouseDown={(e) => {
                      const pos = getCanvasMousePos(e);
                      startDrawing(pos.x, pos.y);
                    }}
                    onMouseMove={(e) => {
                      const pos = getCanvasMousePos(e);
                      draw(pos.x, pos.y);
                    }}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={(e) => {
                      const pos = getCanvasTouchPos(e);
                      startDrawing(pos.x, pos.y);
                    }}
                    onTouchMove={(e) => {
                      const pos = getCanvasTouchPos(e);
                      draw(pos.x, pos.y);
                    }}
                    onTouchEnd={stopDrawing}
                  />
                  <button 
                    onClick={clearCanvas}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      bottom: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: '0.25rem',
                      backgroundColor: 'var(--color-slate-200)',
                      border: 'none',
                      color: 'var(--color-slate-700)',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Drawing
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-500)', display: 'block', marginBottom: '0.5rem' }}>
                  Type your name:
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="e.g. John Doe"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.9rem',
                    border: '2px solid var(--color-slate-200)',
                    borderRadius: '0.375rem',
                    outline: 'none',
                    fontWeight: 600,
                    color: 'var(--color-slate-800)',
                    marginBottom: '1rem'
                  }}
                />

                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-500)', display: 'block', marginBottom: '0.5rem' }}>
                  Select handwriting style:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {([
                    { id: 'dancing', name: 'Dancing Script', font: "'Dancing Script', cursive" },
                    { id: 'vibes', name: 'Great Vibes', font: "'Great Vibes', cursive" },
                    { id: 'satisfy', name: 'Satisfy', font: "'Satisfy', cursive" },
                    { id: 'yellowtail', name: 'Yellowtail', font: "'Yellowtail', cursive" }
                  ] as { id: FontStyle, name: string, font: string }[]).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFont(f.id)}
                      className={`font-select-btn ${selectedFont === f.id ? 'active' : ''}`}
                      style={{
                        fontFamily: f.font,
                        color: strokeColor
                      }}
                    >
                      {typedName || f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Visual scaling sliders */}
            {signatureImageUri && (
              <div style={{ padding: '1rem', border: '1px solid var(--color-slate-100)', borderRadius: '0.5rem', background: 'var(--color-slate-50)', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-slate-700)', marginBottom: '0.75rem' }}>
                  Stamping Dimensions:
                </h4>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-slate-500)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span>Width: {sigWidth} px</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={400}
                    value={sigWidth}
                    onChange={(e) => {
                      const newWidth = parseInt(e.target.value);
                      setSigWidth(newWidth);
                      // keep original 2.4:1 ratio roughly
                      setSigHeight(Math.round(newWidth / 2.4));
                    }}
                    style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                  />
                </div>
              </div>
            )}

            {/* Stamp execution button */}
            <button
              className="btn-primary"
              onClick={executeStamping}
              disabled={!signatureImageUri}
              style={{
                width: '100%',
                justifyContent: 'center',
                opacity: signatureImageUri ? 1 : 0.6,
                cursor: signatureImageUri ? 'pointer' : 'not-allowed'
              }}
            >
              Stamp Signature onto PDF
            </button>

            <button
              className="btn-secondary"
              onClick={() => { setSelectedFile(null); setPages([]); setSignatureImageUri(null); }}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Choose Different File
            </button>
          </div>

        </div>
      )}
    </ToolLayout>
  );
}
