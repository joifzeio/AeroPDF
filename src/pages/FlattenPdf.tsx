import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { flattenPdf } from '../lib/pdfEngine';

export function FlattenPdf() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
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

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setResultBlob(null);
  };

  const executeFlattening = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProgressText('Scanning document schema...');

    const steps = [
      'Locating interactive form fields...',
      'Fusing interactive text layers...',
      'Flattening visual annotations...',
      'Compiling static vector graphics...',
      'Saving optimized file structure...'
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProgressText(steps[stepIndex]);
        stepIndex++;
      }
    }, 850);

    try {
      const flattenedBytes = await flattenPdf(selectedFile);
      
      clearInterval(interval);
      setProgressText('Finalizing...');

      const blob = new Blob([flattenedBytes as any], { type: 'application/pdf' });
      const name = `flattened_${selectedFile.name}`;

      setResultBlob(blob);
      setResultFileName(name);

      // Auto download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch (err) {
      console.error(err);
      alert('An error occurred while flattening the PDF.');
    } finally {
      clearInterval(interval);
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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB'][i];
  };

  const faqs = [
    {
      q: 'What does flattening a PDF do?',
      a: 'Flattening merges interactive form elements (like check boxes, text fields, and radio buttons) directly into the primary graphical layer. The text remains readable but becomes solid vector shapes that can no longer be edited, typed in, or changed.'
    },
    {
      q: 'Is flattening secure enough for signed contracts?',
      a: 'Yes. Flattening is a standard security practice for legal documents and digital receipts. It blocks easy form editing and prevents viewers from accidentally changing signature checkboxes or typing new data.'
    },
    {
      q: 'Are my form documents safe on this site?',
      a: 'AeroPDF executes all scripts entirely inside your local browser tab. No forms, documents, or personal inputs are uploaded to a server.'
    }
  ];

  return (
    <ToolLayout
      title="Flatten PDF Online - Free Tool to Lock Form Fields"
      description="Flatten interactive forms and annotations in your PDF files securely online. 100% browser-based serverless vector fusing."
      headerTitle="Flatten PDF Forms"
      headerSubtitle="Fuse all fillable fields and annotations permanently into the PDF page layers to prevent further editing."
      faqs={faqs}
    >
      {isProcessing && <Loader title={progressText || 'Flattening forms...'} />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box" style={{ background: '#f1f5f9', color: '#475569' }}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">PDF Flattened!</h1>
            <p className="success-subtitle">
              All form fields have been securely converted to static layout shapes. Automatic download triggered.
            </p>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download Flattened PDF
            </button>
            <button className="btn-secondary" onClick={() => { setSelectedFile(null); setResultBlob(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Flatten Another PDF
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
          title="Drag and drop your PDF here to flatten"
          subtitle="Fuse form fields and signatures into non-editable shapes"
          buttonText="Select PDF file"
        />
      ) : (
        <div className="options-layout" style={{ maxWidth: '600px' }}>
          
          <div className="options-workspace" style={{ flex: 2, padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-slate-800)', marginBottom: '1rem' }}>
              Confirm Form Flattening
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-slate-500)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              You are about to flatten all form fields in <strong>{selectedFile.name}</strong> ({formatSize(selectedFile.size)}).
              This action is permanent for the output file: viewers will see your typed answers exactly as placed, but they will not be able to click on form inputs, change check boxes, or re-type anything.
            </p>

            <div style={{ padding: '1rem', border: '1px solid var(--color-slate-200)', borderRadius: '0.5rem', backgroundColor: '#f8fafc', fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
              🔒 <strong>Compliance Notice:</strong> This process runs completely client-side in secure isolated sandbox memory. Your sensitive documentation is never uploaded or cached.
            </div>
          </div>

          <div className="options-sidebar" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>Actions</h3>
            
            <button
              className="btn-primary"
              onClick={executeFlattening}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            >
              Flatten PDF Fields
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
