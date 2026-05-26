import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { getMetadata, setMetadata } from '../lib/pdfEngine';

interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

export function EditMetadata() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [metadata, setMetadataFields] = useState<PDFMetadata>({
    title: '',
    author: '',
    subject: '',
    keywords: '',
    creator: '',
    producer: ''
  });

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
    setProgressText('Scanning document metadata...');
    setSelectedFile(file);
    setResultBlob(null);

    try {
      const meta = await getMetadata(file);
      setMetadataFields(meta);
    } catch (err) {
      console.error('Error scanning metadata:', err);
      alert('Could not scan PDF metadata.');
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const handleFieldChange = (key: keyof PDFMetadata, value: string) => {
    setMetadataFields((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const executeUpdate = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProgressText('Writing document properties...');

    try {
      const updatedBytes = await setMetadata(selectedFile, metadata);
      
      const blob = new Blob([updatedBytes as any], { type: 'application/pdf' });
      const name = `updated_${selectedFile.name}`;

      setResultBlob(blob);
      setResultFileName(name);

      // Auto download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating PDF properties.');
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
      q: 'Why should I edit PDF metadata?',
      a: 'Metadata properties are key for corporate branding and search engines. Setting clean Title, Keywords, and Author tags ensures your publications look professional, are searchable, and maintain correct corporate attributions.'
    },
    {
      q: 'Does editing metadata alter my page layouts?',
      a: 'No. AeroPDF updates the standard PDF header information tables natively without modifying any text layers, images, vectors, or margins.'
    },
    {
      q: 'Are these tags preserved when sharing?',
      a: 'Yes. The tags are embedded directly in the PDF binary, meaning they will be visible to anyone viewing the document properties in Adobe Acrobat, Chrome, macOS Finder, or Windows Explorer.'
    }
  ];

  return (
    <ToolLayout
      title="Edit PDF Metadata Online - Free Document Properties Editor"
      description="View and edit PDF metadata properties like Title, Author, Subject, and Keywords online. Safe browser-native metadata updates."
      headerTitle="Edit PDF Metadata"
      headerSubtitle="Customize and write PDF document details, titles, authors, and keywords securely inside your browser."
      faqs={faqs}
    >
      {isProcessing && <Loader title={progressText || 'Processing...'} />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box" style={{ background: '#ecfeff', color: '#0891b2' }}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">Metadata Updated!</h1>
            <p className="success-subtitle">
              The custom document details have been written into the PDF header. Automatic download triggered.
            </p>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download Updated PDF
            </button>
            <button className="btn-secondary" onClick={() => { setSelectedFile(null); setResultBlob(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Edit Another PDF
            </button>
          </div>

          <div className="success-next-steps">
            <h4>Chain your next task</h4>
            <div className="next-step-grid">
              <button className="next-step-card" onClick={() => chainToTool('/compress-pdf')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v12m0-12c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm0 0v6"/></svg>
                Compress PDF
              </button>
              <button className="next-step-card" onClick={() => chainToTool('/sign-pdf')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685"/></svg>
                Sign PDF
              </button>
            </div>
          </div>
        </div>
      ) : !selectedFile ? (
        <Dropzone
          onFilesSelected={(files) => handleFileSelected(files[0])}
          accept=".pdf"
          multiple={false}
          title="Drag and drop your PDF here to edit details"
          subtitle="View and edit title, author, subject, and keywords"
          buttonText="Select PDF file"
        />
      ) : (
        <div className="options-layout" style={{ maxWidth: '900px' }}>
          
          {/* Main Form Fields */}
          <div className="options-workspace" style={{ flex: 2, padding: '2rem', alignItems: 'stretch' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-slate-800)', marginBottom: '1.5rem' }}>
              Document Properties
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-600)', display: 'block', marginBottom: '0.4rem' }}>
                  Document Title
                </label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="e.g. Annual Financial Report"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    fontSize: '0.9rem',
                    border: '1.5px solid var(--color-slate-200)',
                    borderRadius: '0.375rem',
                    outline: 'none',
                    fontWeight: 600,
                    color: 'var(--color-slate-800)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-600)', display: 'block', marginBottom: '0.4rem' }}>
                  Author
                </label>
                <input
                  type="text"
                  value={metadata.author}
                  onChange={(e) => handleFieldChange('author', e.target.value)}
                  placeholder="e.g. John Doe / Corporate Team"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    fontSize: '0.9rem',
                    border: '1.5px solid var(--color-slate-200)',
                    borderRadius: '0.375rem',
                    outline: 'none',
                    fontWeight: 600,
                    color: 'var(--color-slate-800)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-600)', display: 'block', marginBottom: '0.4rem' }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={metadata.subject}
                  onChange={(e) => handleFieldChange('subject', e.target.value)}
                  placeholder="e.g. Q4 Performance Reviews"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    fontSize: '0.9rem',
                    border: '1.5px solid var(--color-slate-200)',
                    borderRadius: '0.375rem',
                    outline: 'none',
                    fontWeight: 600,
                    color: 'var(--color-slate-800)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-600)', display: 'block', marginBottom: '0.4rem' }}>
                  Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={metadata.keywords}
                  onChange={(e) => handleFieldChange('keywords', e.target.value)}
                  placeholder="e.g. finance, taxes, audit"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    fontSize: '0.9rem',
                    border: '1.5px solid var(--color-slate-200)',
                    borderRadius: '0.375rem',
                    outline: 'none',
                    fontWeight: 600,
                    color: 'var(--color-slate-800)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-600)', display: 'block', marginBottom: '0.4rem' }}>
                  Creator
                </label>
                <input
                  type="text"
                  value={metadata.creator}
                  onChange={(e) => handleFieldChange('creator', e.target.value)}
                  placeholder="e.g. AeroPDF Editor"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    fontSize: '0.9rem',
                    border: '1.5px solid var(--color-slate-200)',
                    borderRadius: '0.375rem',
                    outline: 'none',
                    fontWeight: 600,
                    color: 'var(--color-slate-800)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-slate-600)', display: 'block', marginBottom: '0.4rem' }}>
                  Producer
                </label>
                <input
                  type="text"
                  value={metadata.producer}
                  onChange={(e) => handleFieldChange('producer', e.target.value)}
                  placeholder="e.g. WebAssembly Compiler"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    fontSize: '0.9rem',
                    border: '1.5px solid var(--color-slate-200)',
                    borderRadius: '0.375rem',
                    outline: 'none',
                    fontWeight: 600,
                    color: 'var(--color-slate-800)'
                  }}
                />
              </div>
            </div>
          </div>

          <div className="options-sidebar" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>Details</h3>
            
            <div style={{ margin: '1rem 0', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-slate-500)' }}>File name:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-slate-700)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                  {selectedFile.name}
                </span>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={executeUpdate}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            >
              Update Properties
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
