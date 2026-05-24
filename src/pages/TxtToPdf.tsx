import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { textToPdf } from '../lib/pdfEngine';

export function TxtToPdf() {
  const location = useLocation();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Styling Configurations
  const [font, setFont] = useState('helvetica');
  const [size, setSize] = useState(12);
  const [spacing, setSpacing] = useState(1.25);
  const [sheet, setSheet] = useState('a4');
  const [margin, setMargin] = useState(54); // 0.75 in

  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');

  // Handle chaining state
  useEffect(() => {
    if (location.state?.chainText) {
      setText(location.state.chainText);
    }
  }, [location.state]);

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setSelectedFile(file);
    try {
      const fileText = await file.text();
      setText(fileText);
    } catch (err) {
      console.error(err);
      alert('Could not read text file.');
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeCompilation = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await textToPdf(text, {
        font,
        size,
        spacing,
        sheet,
        margin
      });

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const name = `text_${new Date().getTime()}.pdf`;

      setResultBlob(blob);
      setResultFileName(name);

      // Auto download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch (err) {
      console.error(err);
      alert('An error occurred during PDF compilation.');
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

  const faqs = [
    {
      q: 'How does long text get paginated?',
      a: 'AeroPDF features a custom greedy word-wrapping and line measurement compiler. It splits text into paragraphs, wraps sentences dynamically to ensure they never overflow your margins, and automatically spawns new pages when a sheet reaches its bottom boundary.'
    },
    {
      q: 'What standard fonts can I choose?',
      a: 'You can choose between professional standard vector fonts natively supported by the PDF standard: Helvetica (sans-serif), Times Roman (serif), or Courier (monospace).'
    },
    {
      q: 'Is my plain text sent to any server?',
      a: 'No. The compilation runs 100% locally in your browser thread using WebAssembly. Your plain text remains completely secure on your RAM.'
    }
  ];

  return (
    <ToolLayout
      title="Text to PDF Converter - Free online plain text compiler"
      description="Convert plain text files (.txt) or typed strings into a perfectly structured PDF. Complete browser privacy, no uploads."
      headerTitle="Text to PDF"
      headerSubtitle="Compile raw plain text or document files into a beautifully structured, highly readable PDF document. 100% local."
      faqs={faqs}
    >
      {isProcessing && <Loader title="Engraving page layouts..." />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">PDF Compiled successfully!</h1>
            <p className="success-subtitle">Your paginated PDF is ready. Automatic download triggered.</p>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download PDF
            </button>
            <button className="btn-secondary" onClick={() => { setText(''); setSelectedFile(null); setResultBlob(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Convert More Text
            </button>
          </div>

          <div className="success-next-steps">
            <h4>Chain your next task</h4>
            <div className="next-step-grid">
              <button className="next-step-card" onClick={() => chainToTool('/watermark-pdf')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                Add Watermark
              </button>
              <button className="next-step-card" onClick={() => chainToTool('/add-page-numbers')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 6h18m-18 6h18M5.25 3h15"/></svg>
                Add Page Numbers
              </button>
            </div>
          </div>
        </div>
      ) : !text && !selectedFile ? (
        <div className="workspace-wrapper">
          <Dropzone
            onFilesSelected={(files) => handleFileSelected(files[0])}
            accept=".txt"
            multiple={false}
            title="Drag and drop your .txt file here"
            subtitle="Supports standard UTF-8 encoded files"
            buttonText="Select text file"
          />
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-slate-400)', marginBottom: '0.75rem' }}>or write directly in the browser</span>
            <button className="btn-secondary" onClick={() => setText('Type or paste your text here...')}>
              Write Text Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="options-layout" style={{ maxWidth: '1200px' }}>
          <div className="options-workspace" style={{ flex: 2, alignItems: 'stretch' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: '0.75rem' }}>Text Editor</h3>
            <textarea
              className="form-input"
              style={{
                width: '100%',
                height: '420px',
                fontFamily: font === 'courier' ? 'monospace' : font === 'timesroman' ? 'Times New Roman, serif' : 'sans-serif',
                fontSize: `${size}px`,
                lineHeight: spacing,
                resize: 'none',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-inner)'
              }}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="options-sidebar" style={{ flex: 1, minWidth: '320px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>Compilation Options</h3>

            <div className="form-group">
              <label htmlFor="txt-font">Font Family</label>
              <select id="txt-font" className="form-input" value={font} onChange={(e) => setFont(e.target.value)}>
                <option value="helvetica">Helvetica (Sans-Serif)</option>
                <option value="timesroman">Times Roman (Serif)</option>
                <option value="courier">Courier (Monospace)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="txt-sheet">Sheet Sizing</label>
              <select id="txt-sheet" className="form-input" value={sheet} onChange={(e) => setSheet(e.target.value)}>
                <option value="a4">A4 Sheet</option>
                <option value="letter">US Letter Sheet</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="txt-size">Font Size ({size}pt)</label>
              <input
                id="txt-size"
                type="range"
                min="8"
                max="24"
                className="form-range"
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="txt-space">Line Spacing ({spacing}x)</label>
              <input
                id="txt-space"
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                className="form-range"
                value={spacing}
                onChange={(e) => setSpacing(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="txt-margin">Page Margin ({margin}pt)</label>
              <select id="txt-margin" className="form-input" value={margin} onChange={(e) => setMargin(parseInt(e.target.value))}>
                <option value="36">Narrow (36pt or 0.5-inch)</option>
                <option value="54">Normal (54pt or 0.75-inch)</option>
                <option value="72">Wide (72pt or 1-inch)</option>
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={executeCompilation}
              disabled={!text.trim()}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', opacity: !text.trim() ? 0.6 : 1 }}
            >
              Compile to PDF
            </button>

            <button
              className="btn-secondary"
              onClick={() => { setSelectedFile(null); setText(''); }}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Clear Workspace
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
