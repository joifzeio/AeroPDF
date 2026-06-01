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
    return 'light';
  });

  const [menuOpen, setMenuOpen] = useState(false);

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
              TC<span className="logo-heart">♥</span>PDF
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

            <button 
              className="mobile-menu-toggle"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              title="Open navigation menu"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <div className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
        <div className={`mobile-menu-drawer ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
              TC<span className="logo-heart">♥</span>PDF
            </Link>
            <button className="mobile-menu-close" onClick={() => setMenuOpen(false)}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="mobile-nav-links">
            <div className="mobile-nav-section">PDF Tools</div>
            <Link to="/merge-pdf" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <span className="mobile-nav-bullet icon-red" /> Merge PDF
            </Link>
            <Link to="/split-pdf" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <span className="mobile-nav-bullet icon-orange" /> Split PDF
            </Link>
            <Link to="/compress-pdf" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <span className="mobile-nav-bullet icon-blue" /> Compress PDF
            </Link>
            <Link to="/rotate-pdf" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <span className="mobile-nav-bullet icon-yellow" /> Rotate PDF
            </Link>
            <Link to="/organize-pages" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <span className="mobile-nav-bullet icon-emerald" /> Organize PDF
            </Link>
            
            <div className="mobile-nav-section">Security & Stamps</div>
            <Link to="/sign-pdf" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <span className="mobile-nav-bullet icon-amber" /> Sign PDF
            </Link>
            <Link to="/watermark-pdf" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <span className="mobile-nav-bullet icon-violet" /> Watermark PDF
            </Link>
            <Link to="/add-page-numbers" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <span className="mobile-nav-bullet icon-blue" /> Page Numbers
            </Link>
            
            <div className="mobile-nav-section">Convert Files</div>
            <Link to="/pdf-to-jpg" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <span className="mobile-nav-bullet icon-rose" /> PDF to JPG
            </Link>
            <Link to="/jpg-to-pdf" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <span className="mobile-nav-bullet icon-cyan" /> JPG to PDF
            </Link>
          </nav>
        </div>

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
                TC<span style={{ color: 'var(--color-primary)' }}>♥</span>PDF
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
            <p>&copy; {new Date().getFullYear()} TCPDF. MIT Licensed. 100% Secure Client-Side Web App.</p>
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

