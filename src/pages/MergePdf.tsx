import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { mergePdfs } from '../lib/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';

interface ExtendedFile {
  file: File;
  id: string;
  thumbnail: string;
  pages: number;
}

export function MergePdf() {
  const navigate = useNavigate();
  const [filesList, setFilesList] = useState<ExtendedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');

  // Clean local URLs on unmount
  useEffect(() => {
    return () => {
      filesList.forEach((f) => {
        if (f.thumbnail.startsWith('blob:')) {
          URL.revokeObjectURL(f.thumbnail);
        }
      });
    };
  }, [filesList]);

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    const newExtendedFiles: ExtendedFile[] = [];

    for (const file of files) {
      try {
        const fileArrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: fileArrayBuffer });
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;

        // Render cover page as thumbnail
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.35 });
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

        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);

        newExtendedFiles.push({
          file,
          id: Math.random().toString(36).substring(2, 9),
          thumbnail,
          pages: pageCount
        });
      } catch (err) {
        console.error('Error rendering thumbnail:', err);
        newExtendedFiles.push({
          file,
          id: Math.random().toString(36).substring(2, 9),
          thumbnail: '',
          pages: 1
        });
      }
    }

    setFilesList((prev) => [...prev, ...newExtendedFiles]);
    setIsProcessing(false);
  };

  const removeFile = (id: string) => {
    setFilesList((prev) => prev.filter((f) => f.id !== id));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === filesList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newList = [...filesList];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    setFilesList(newList);
  };

  const sortAlphabetically = () => {
    const sorted = [...filesList].sort((a, b) => a.file.name.localeCompare(b.file.name));
    setFilesList(sorted);
  };

  const executeMerge = async () => {
    if (filesList.length < 2) return;
    setIsProcessing(true);
    try {
      const mergedBytes = await mergePdfs(filesList.map((f) => f.file));
      const blob = new Blob([mergedBytes as any], { type: 'application/pdf' });
      const name = `merged_${new Date().getTime()}.pdf`;
      
      setResultBlob(blob);
      setResultFileName(name);

      // Trigger instant automatic download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch (err) {
      console.error(err);
      alert('An error occurred while merging your PDF files.');
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const faqs = [
    {
      q: 'Is it safe to merge my PDFs here?',
      a: 'Absolutely. TCPDF works 100% inside your browser using WebAssembly. Your files are processed locally on your hardware and never sent to our servers, assuring maximum security.'
    },
    {
      q: 'Is there a limit on file quantity or size?',
      a: 'No! Since merging runs on your local machine, there are no artificial file limits. You are only limited by your device\'s RAM and hardware capability.'
    },
    {
      q: 'Can I reorder documents before compiling?',
      a: 'Yes, our visual canvas grid allows you to easily sort files alphabetically or rearrange them manually using ordering controls to ensure perfect pagination.'
    }
  ];

  return (
    <ToolLayout
      title="Merge PDF Files Online - 100% Free & Secure"
      description="Combine multiple PDF documents into a single file in seconds. Complete local browser processing ensures your file privacy."
      headerTitle="Merge PDF Files"
      headerSubtitle="Combine multiple PDFs into a single, perfectly structured document. Fast, easy, and completely secure."
      faqs={faqs}
    >
      {isProcessing && <Loader title="Stitching document elements..." />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">PDFs Merged Successfully!</h1>
            <p className="success-subtitle">Your download should start automatically. If it didn't, click the button below.</p>
          </div>
          
          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Merged PDF
            </button>
            <button className="btn-secondary" onClick={() => { setResultBlob(null); setFilesList([]); }} style={{ width: '100%', justifyContent: 'center' }}>
              Merge More Files
            </button>
          </div>

          <div className="success-next-steps">
            <h4>Chain your next task</h4>
            <div className="next-step-grid">
              <button className="next-step-card" onClick={() => chainToTool('/add-page-numbers')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 6h18m-18 6h18M5.25 3h15"/></svg>
                Add Page Numbers
              </button>
              <button className="next-step-card" onClick={() => chainToTool('/watermark-pdf')}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                Add Watermark
              </button>
            </div>
          </div>
        </div>
      ) : filesList.length === 0 ? (
        <Dropzone
          onFilesSelected={handleFilesSelected}
          accept=".pdf"
          title="Drag and drop your PDFs here"
          subtitle="or click to browse local files"
          buttonText="Select PDF files"
        />
      ) : (
        <div className="workspace-wrapper">
          <div className="workspace-actions">
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-slate-700)' }}>
                {filesList.length} files selected
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={sortAlphabetically}>
                Sort A-Z
              </button>
              <button
                className="btn-primary"
                onClick={executeMerge}
                disabled={filesList.length < 2}
                style={{ opacity: filesList.length < 2 ? 0.6 : 1 }}
              >
                Merge PDF
              </button>
            </div>
          </div>

          <div className="file-grid">
            {filesList.map((item, index) => (
              <div className="file-card" key={item.id}>
                <button className="file-card-remove" onClick={() => removeFile(item.id)}>×</button>
                
                {/* Reordering Controls */}
                <button
                  className="file-card-rotate-btn"
                  style={{ top: '0.5rem', left: '0.5rem' }}
                  onClick={() => moveFile(index, 'up')}
                  disabled={index === 0}
                >
                  ←
                </button>
                <button
                  className="file-card-rotate-btn"
                  style={{ top: '0.5rem', left: '2.5rem' }}
                  onClick={() => moveFile(index, 'down')}
                  disabled={index === filesList.length - 1}
                >
                  →
                </button>

                <div className="file-thumbnail">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="Cover Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12h4.5m-8.25-3h8.25M6 18h8.25M11.25 3v11.25a9 9 0 00-9-9z" />
                    </svg>
                  )}
                </div>

                <div className="file-info">
                  <p className="file-name" title={item.file.name}>{item.file.name}</p>
                  <p className="file-size">{formatSize(item.file.size)}</p>
                </div>
                
                <span className="file-card-badge">{item.pages} pgs</span>
              </div>
            ))}
            
            {/* FAB Append trigger */}
            <div
              className="file-card"
              style={{
                border: '2px dashed var(--color-slate-300)',
                background: 'rgba(255, 255, 255, 0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => document.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--color-slate-400)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-slate-500)', marginTop: '0.5rem' }}>Add More Files</span>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
