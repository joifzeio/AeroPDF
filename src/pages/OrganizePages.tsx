import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { organizePdf } from '../lib/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';

interface PageItem {
  id: string;
  type: 'page' | 'blank';
  originalIndex?: number; // 0-indexed original page
  thumbnail: string;
}

export function OrganizePages() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  
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
    setProgressText('Extracting pages...');
    setSelectedFile(file);
    setPages([]);
    setResultBlob(null);

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: fileArrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const items: PageItem[] = [];
      const scale = 0.25;

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
          id: Math.random().toString(36).substring(2, 9),
          type: 'page',
          originalIndex: i - 1,
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

  const deletePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const insertBlankPage = () => {
    setPages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        type: 'blank',
        thumbnail: '' // Blank sheet has no preview
      }
    ]);
  };

  const movePage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pages.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newList = [...pages];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    setPages(newList);
  };

  const executeOrganize = async () => {
    if (!selectedFile || pages.length === 0) return;
    setIsProcessing(true);
    setProgressText('Restructuring page orders...');

    try {
      const organizedBytes = await organizePdf(
        selectedFile,
        pages.map((p) => ({ type: p.type, originalIndex: p.originalIndex }))
      );

      const blob = new Blob([organizedBytes as any], { type: 'application/pdf' });
      const name = `organized_${selectedFile.name}`;

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
      q: 'Will reordering degrade vector elements?',
      a: 'No. AeroPDF performs reordering natively within the structure, preserving vector text layers, hyperlinks, and embedded fonts without degradation.'
    },
    {
      q: 'Can I add multiple blank pages?',
      a: 'Yes, clicking "Add Blank Page" will inject blank sheets at the end of the list. You can then use reordering controls to position them anywhere.'
    },
    {
      q: 'Are my pages uploaded to a server?',
      a: 'Absolutely not. Restructuring compiles 100% locally in your browser thread, keeping your files completely confidential.'
    }
  ];

  return (
    <ToolLayout
      title="Organize PDF Pages Online - Restructure PDF Files for Free"
      description="Sort, reorder, delete, or insert blank sheets inside your PDF online. Safe browser-native processing."
      headerTitle="Organize PDF Pages"
      headerSubtitle="Sort, delete, and insert blank pages inside your PDF visual canvas. 100% secure and browser-based."
      faqs={faqs}
    >
      {isProcessing && <Loader title={progressText || 'Restructuring sheets...'} />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">PDF Restructured!</h1>
            <p className="success-subtitle">The page organization has been compiled. Automatic download triggered.</p>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download Organized PDF
            </button>
            <button className="btn-secondary" onClick={() => { setSelectedFile(null); setPages([]); setResultBlob(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Sort Another PDF
            </button>
          </div>

          <div className="success-next-steps">
            <h4>Chain your next task</h4>
            <div className="next-step-grid">
              <button className="next-step-card" onClick={() => chainToTool('/sign-pdf')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685"/></svg>
                Sign PDF
              </button>
              <button className="next-step-card" onClick={() => chainToTool('/compress-pdf')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v12m0-12c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm0 0v6"/></svg>
                Compress PDF
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
          subtitle="Sort, reorder and edit pages visually"
          buttonText="Select PDF file"
        />
      ) : (
        <div className="options-layout" style={{ maxWidth: '1200px' }}>
          <div className="options-workspace" style={{ flex: 3, alignItems: 'stretch' }}>
            <div className="workspace-actions" style={{ maxWidth: 'none', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-slate-700)' }}>
                {pages.length} sheets in sequence
              </span>
              <button className="btn-secondary" onClick={insertBlankPage} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                + Add Blank Page
              </button>
            </div>

            <div className="file-grid" style={{ maxWidth: 'none', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {pages.map((page, index) => (
                <div className="file-card" key={page.id} style={{ cursor: 'default' }}>
                  {/* Delete Page button */}
                  <button className="file-card-remove" onClick={() => deletePage(page.id)} style={{ opacity: 1 }}>
                    ×
                  </button>

                  {/* Reordering arrows */}
                  <button
                    className="file-card-rotate-btn"
                    style={{ top: '0.5rem', left: '0.5rem' }}
                    onClick={() => movePage(index, 'up')}
                    disabled={index === 0}
                  >
                    ←
                  </button>
                  <button
                    className="file-card-rotate-btn"
                    style={{ top: '0.5rem', left: '2.5rem' }}
                    onClick={() => movePage(index, 'down')}
                    disabled={index === pages.length - 1}
                  >
                    →
                  </button>

                  <div className="file-thumbnail" style={{ height: '160px', background: page.type === 'blank' ? '#f8fafc' : 'white' }}>
                    {page.type === 'page' ? (
                      <img src={page.thumbnail} alt={`Page ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--color-slate-400)' }}>
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '2.5rem', height: '2.5rem' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25" />
                        </svg>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Blank Page</span>
                      </div>
                    )}
                  </div>

                  <div className="file-info" style={{ marginTop: '0.25rem' }}>
                    <p className="file-name" style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>
                      {page.type === 'page' ? `Original Page ${page.originalIndex! + 1}` : 'Blank Page'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="options-sidebar" style={{ flex: 1, minWidth: '260px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>Compile Restructure</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', lineHeight: 1.5 }}>
              Use arrow buttons on cards to rearrange order, click × to delete pages, or insert new blank pages.
            </p>

            <button
              className="btn-primary"
              onClick={executeOrganize}
              disabled={pages.length === 0}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', opacity: pages.length === 0 ? 0.6 : 1 }}
            >
              Compile PDF
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
