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

export default function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Global Premium Header */}
        <header className="header">
          <Link to="/" className="logo">
            <div className="logo-icon">A</div>
            <span>Aero<span>PDF</span></span>
          </Link>
          <nav className="nav-links">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/merge-pdf" className="nav-link">Merge</Link>
            <Link to="/split-pdf" className="nav-link">Split</Link>
            <Link to="/remove-pages" className="nav-link">Remove Pages</Link>
            <Link to="/add-page-numbers" className="nav-link">Page Numbers</Link>
          </nav>
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
          </Routes>
        </main>

        {/* Global SEO-friendly Footer */}
        <footer className="footer">
          <div className="footer-grid">
            <div className="footer-col">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'var(--color-primary)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>A</span>
                AeroPDF
              </h4>
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', lineHeight: 1.6 }}>
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
              </ul>
            </div>

            <div className="footer-col">
              <h4>Convert PDF</h4>
              <ul>
                <li><Link to="/pdf-to-jpg">PDF to JPG</Link></li>
                <li><Link to="/jpg-to-pdf">JPG to PDF</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Document Stamping</h4>
              <ul>
                <li><Link to="/add-page-numbers">Add Page Numbers</Link></li>
                <li><Link to="/watermark-pdf">Watermark PDF</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} AeroPDF. MIT Licensed. 100% Secure Client-Side Web App.</p>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
              <span>Privacy Guaranteed 🔒</span>
              <span>No Cookies Tracking 🍪</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
