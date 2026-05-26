import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { MergePdf } from './pages/MergePdf';
import { SplitPdf } from './pages/SplitPdf';
import { PdfToJpg } from './pages/PdfToJpg';
import { JpgToPdf } from './pages/JpgToPdf';
import { RotatePdf } from './pages/RotatePdf';
import { RemovePages } from './pages/RemovePages';
import { AddPageNumbers } from './pages/AddPageNumbers';
import { WatermarkPdf } from './pages/WatermarkPdf';
import { PdfToTxt } from './pages/PdfToTxt';
import { TxtToPdf } from './pages/TxtToPdf';
import { HtmlToPdf } from './pages/HtmlToPdf';
import { OrganizePages } from './pages/OrganizePages';
import { SignPdf } from './pages/SignPdf';
import { CompressPdf } from './pages/CompressPdf';
import { FlattenPdf } from './pages/FlattenPdf';
import { EditMetadata } from './pages/EditMetadata';
import { CropPdf } from './pages/CropPdf';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <Router>
      <div className="app-container">
        {/* Global Header */}
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <Link to="/" className="logo">
              Aero<span className="logo-heart">♥</span>PDF
            </Link>
            <nav className="nav-links">
              <Link to="/merge-pdf" className="nav-link">Merge PDF</Link>
              <Link to="/split-pdf" className="nav-link">Split PDF</Link>
              <Link to="/compress-pdf" className="nav-link">Compress PDF</Link>
              <Link to="/" className="nav-link">
                Convert PDF <span style={{ fontSize: '0.65rem', marginLeft: '0.15rem' }}>▼</span>
              </Link>
              <Link to="/" className="nav-link">
                All PDF Tools <span style={{ fontSize: '0.65rem', marginLeft: '0.15rem' }}>▼</span>
              </Link>
            </nav>
          </div>

          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to night mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to night mode'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem' }}>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2rem', height: '1.2rem' }}>
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
        </header>

        {/* Core Workspace Wrapper */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/merge-pdf" element={<MergePdf />} />
            <Route path="/split-pdf" element={<SplitPdf />} />
            <Route path="/pdf-to-jpg" element={<PdfToJpg />} />
            <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
            <Route path="/rotate-pdf" element={<RotatePdf />} />
            <Route path="/remove-pages" element={<RemovePages />} />
            <Route path="/add-page-numbers" element={<AddPageNumbers />} />
            <Route path="/watermark-pdf" element={<WatermarkPdf />} />
            <Route path="/pdf-to-txt" element={<PdfToTxt />} />
            <Route path="/txt-to-pdf" element={<TxtToPdf />} />
            <Route path="/html-to-pdf" element={<HtmlToPdf />} />
            <Route path="/organize-pages" element={<OrganizePages />} />
            <Route path="/sign-pdf" element={<SignPdf />} />
            <Route path="/compress-pdf" element={<CompressPdf />} />
            <Route path="/flatten-pdf" element={<FlattenPdf />} />
            <Route path="/edit-metadata" element={<EditMetadata />} />
            <Route path="/crop-pdf" element={<CropPdf />} />
          </Routes>
        </main>

        {/* Global SEO-friendly Footer */}
        <footer className="footer">
          <div className="footer-grid">
            <div className="footer-col" style={{ paddingRight: '2rem' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 900, fontSize: '1.2rem' }}>
                Aero<span style={{ color: 'var(--color-primary)' }}>♥</span>PDF
              </h4>
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', lineHeight: 1.6, color: '#64748b' }}>
                The ultimate 100% private, client-side PDF utility editor. All compilations run securely in-browser. Your files never leave your computer.
              </p>
            </div>
            
            <div className="footer-col">
              <h4>Organize PDF</h4>
              <ul>
                <li><Link to="/merge-pdf">Merge PDF</Link></li>
                <li><Link to="/split-pdf">Split PDF</Link></li>
                <li><Link to="/rotate-pdf">Rotate PDF</Link></li>
                <li><Link to="/remove-pages">Remove Pages</Link></li>
                <li><Link to="/organize-pages">Organize Pages</Link></li>
                <li><Link to="/crop-pdf">Crop PDF</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Convert PDF</h4>
              <ul>
                <li><Link to="/pdf-to-jpg">PDF to JPG</Link></li>
                <li><Link to="/jpg-to-pdf">JPG to PDF</Link></li>
                <li><Link to="/pdf-to-txt">PDF to Text</Link></li>
                <li><Link to="/txt-to-pdf">Text to PDF</Link></li>
                <li><Link to="/html-to-pdf">HTML to PDF</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Security & Stamping</h4>
              <ul>
                <li><Link to="/add-page-numbers">Add Page Numbers</Link></li>
                <li><Link to="/watermark-pdf">Watermark PDF</Link></li>
                <li><Link to="/sign-pdf">Sign PDF</Link></li>
                <li><Link to="/compress-pdf">Compress PDF</Link></li>
                <li><Link to="/flatten-pdf">Flatten PDF</Link></li>
                <li><Link to="/edit-metadata">Edit Metadata</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} AeroPDF. MIT Licensed. 100% Secure Client-Side Web App.</p>
             <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
               <span>Privacy Guaranteed</span>
               <span>No Cookies Tracking</span>
             </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

