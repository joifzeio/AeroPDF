import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToolLayout } from '../components/ToolLayout';
import { Dropzone } from '../components/UI/Dropzone';
import { Loader } from '../components/UI/Loader';
import { jpgToPdf } from '../lib/pdfEngine';

interface ImageFile {
  file: File;
  id: string;
  url: string;
}

export function JpgToPdf() {
  const navigate = useNavigate();
  const [imagesList, setImagesList] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState('none');
  
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState('');

  // Revoke URLs on unmount
  useEffect(() => {
    return () => {
      imagesList.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [imagesList]);

  const handleFilesSelected = (files: File[]) => {
    const extendedImages = files.map((file) => ({
      file,
      id: Math.random().toString(36).substring(2, 9),
      url: URL.createObjectURL(file)
    }));
    setImagesList((prev) => [...prev, ...extendedImages]);
  };

  const removeImage = (id: string) => {
    setImagesList((prev) => {
      const match = prev.find((img) => img.id === id);
      if (match) URL.revokeObjectURL(match.url);
      return prev.filter((img) => img.id !== id);
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === imagesList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newList = [...imagesList];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    setImagesList(newList);
  };

  const executeJpgToPdf = async () => {
    if (imagesList.length === 0) return;
    setIsProcessing(true);
    try {
      const compiledBytes = await jpgToPdf(
        imagesList.map((i) => i.file),
        { size: pageSize, orientation, margin }
      );
      
      const blob = new Blob([compiledBytes as any], { type: 'application/pdf' });
      const name = `images_converted_${new Date().getTime()}.pdf`;

      setResultBlob(blob);
      setResultFileName(name);

      // Auto download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
    } catch (err) {
      console.error(err);
      alert('An error occurred during conversion to PDF.');
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
      q: 'What image formats are supported?',
      a: 'TCPDF natively supports JPG, JPEG, and PNG image conversions. All images are processed securely in your browser and compiled directly into vector-friendly PDF pages.'
    },
    {
      q: 'How does margin spacing work?',
      a: 'If you select "No Margin", the image scales to completely fill the sheet. Selecting "Normal Margin" wraps the image in a clean 0.5-inch border, centering it perfectly.'
    },
    {
      q: 'Is there a limit to how many images I can convert?',
      a: 'No. Since conversion occurs purely client-side on your hardware, you can stitch together dozens of photos without waiting for slow server uploads.'
    }
  ];

  return (
    <ToolLayout
      title="JPG to PDF Converter - 100% Secure & Free"
      description="Convert JPG and PNG images into a PDF document online. Clean browser compilation guarantees absolute privacy."
      headerTitle="JPG to PDF"
      headerSubtitle="Package your JPEG or PNG photos into a beautiful, standardized PDF document. Safe, instant, and local."
      faqs={faqs}
    >
      {isProcessing && <Loader title="Compiling document pages..." />}

      {resultBlob ? (
        <div className="success-layout">
          <div className="success-badge-box">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="success-title">Images Packaged to PDF!</h1>
            <p className="success-subtitle">Your compiled PDF has been created. Automatic download triggered.</p>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={triggerDownload} style={{ width: '100%', justifyContent: 'center' }}>
              Download PDF
            </button>
            <button className="btn-secondary" onClick={() => { setImagesList([]); setResultBlob(null); }} style={{ width: '100%', justifyContent: 'center' }}>
              Convert More Images
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
      ) : imagesList.length === 0 ? (
        <Dropzone
          onFilesSelected={handleFilesSelected}
          accept=".jpg,.jpeg,.png"
          title="Drag and drop your images here"
          subtitle="Supports JPG, JPEG, and PNG formats"
          buttonText="Select image files"
        />
      ) : (
        <div className="options-layout">
          <div className="options-workspace" style={{ alignItems: 'stretch' }}>
            <div className="workspace-actions" style={{ maxWidth: 'none', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-slate-700)' }}>
                {imagesList.length} photos selected
              </span>
            </div>

            <div className="file-grid" style={{ maxWidth: 'none' }}>
              {imagesList.map((item, index) => (
                <div className="file-card" key={item.id}>
                  <button className="file-card-remove" onClick={() => removeImage(item.id)}>×</button>

                  <button
                    className="file-card-rotate-btn"
                    style={{ top: '0.5rem', left: '0.5rem' }}
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0}
                  >
                    ←
                  </button>
                  <button
                    className="file-card-rotate-btn"
                    style={{ top: '0.5rem', left: '2.5rem' }}
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === imagesList.length - 1}
                  >
                    →
                  </button>

                  <div className="file-thumbnail" style={{ height: '140px' }}>
                    <img src={item.url} alt="Uploaded source" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div className="file-info">
                    <p className="file-name" title={item.file.name}>{item.file.name}</p>
                    <p className="file-size">{formatSize(item.file.size)}</p>
                  </div>
                </div>
              ))}

              <div
                className="file-card"
                style={{
                  border: '2px dashed var(--color-slate-300)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  height: '210px'
                }}
                onClick={() => document.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--color-slate-400)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-slate-500)', marginTop: '0.5rem' }}>Add More Images</span>
              </div>
            </div>
          </div>

          <div className="options-sidebar">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>Page Options</h3>

            <div className="form-group">
              <label htmlFor="page-size">Page Dimensions</label>
              <select id="page-size" className="form-input" value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                <option value="a4">A4 Standard Sheet</option>
                <option value="letter">US Letter Sheet</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="orientation">Layout Orientation</label>
              <select id="orientation" className="form-input" value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                <option value="portrait">Portrait (Vertical)</option>
                <option value="landscape">Landscape (Horizontal)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="margin">Page Padding</label>
              <select id="margin" className="form-input" value={margin} onChange={(e) => setMargin(e.target.value)}>
                <option value="none">No Padding (Fill Sheet)</option>
                <option value="normal">Normal (0.5-inch Border)</option>
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={executeJpgToPdf}
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
            >
              Compile to PDF
            </button>

            <button className="btn-secondary" onClick={() => setImagesList([])} style={{ width: '100%', justifyContent: 'center' }}>
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
