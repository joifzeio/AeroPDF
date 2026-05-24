import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo';

interface Tool {
  id: string;
  title: string;
  description: string;
  path: string;
  category: 'organize' | 'convert' | 'security';
  icon: React.ReactNode;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useSeo(
    'AeroPDF - Free 100% Secure Client-Side PDF Tools',
    'Edit, merge, split, rotate, convert, watermark, and protect your PDF documents completely locally inside your browser. Absolute file privacy, no server uploads, ultra-fast.'
  );

  const tools: Tool[] = [
    {
      id: 'merge',
      title: 'Merge PDF',
      description: 'Combine multiple PDF files into a single document in any custom order.',
      path: '/merge-pdf',
      category: 'organize',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      )
    },
    {
      id: 'split',
      title: 'Split PDF',
      description: 'Extract specific pages or groups of pages from your PDF file into a new document.',
      path: '/split-pdf',
      category: 'organize',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5m16.5-16.5v16.5M12 3v18M3.75 12h16.5" />
        </svg>
      )
    },
    {
      id: 'pdf-to-jpg',
      title: 'PDF to JPG',
      description: 'Convert every PDF page into a high-quality JPEG image download.',
      path: '/pdf-to-jpg',
      category: 'convert',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 00-1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      )
    },
    {
      id: 'jpg-to-pdf',
      title: 'JPG to PDF',
      description: 'Convert and package multiple JPEG/PNG images into a single clean PDF document.',
      path: '/jpg-to-pdf',
      category: 'convert',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    {
      id: 'pdf-to-txt',
      title: 'PDF to Text',
      description: 'Extract raw text strings page-by-page from your PDF document locally.',
      path: '/pdf-to-txt',
      category: 'convert',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    {
      id: 'txt-to-pdf',
      title: 'Text to PDF',
      description: 'Stitch raw plain text files (.txt) or typed paragraphs into formatted paginated PDFs.',
      path: '/txt-to-pdf',
      category: 'convert',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zM9 15h6M9 18h6" />
        </svg>
      )
    },
    {
      id: 'html-to-pdf',
      title: 'HTML to PDF',
      description: 'Paste custom HTML, view live sandboxed previews, and render them to standardized PDFs.',
      path: '/html-to-pdf',
      category: 'convert',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
      )
    },
    {
      id: 'rotate',
      title: 'Rotate PDF',
      description: 'Rotate individual pages of your PDF clockwise or counterclockwise.',
      path: '/rotate-pdf',
      category: 'organize',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      )
    },
    {
      id: 'remove-pages',
      title: 'Remove Pages',
      description: 'Permanently delete unwanted pages from your PDF file.',
      path: '/remove-pages',
      category: 'organize',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'add-page-numbers',
      title: 'Page Numbers',
      description: 'Stripe page numbering (Page X of Y) onto the footer or header of every page.',
      path: '/add-page-numbers',
      category: 'security',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 6h18m-18 6h18M5.25 3h15" />
        </svg>
      )
    },
    {
      id: 'watermark',
      title: 'Watermark PDF',
      description: 'Stamp custom transparent text overlays with size and rotation parameters onto every page.',
      path: '/watermark-pdf',
      category: 'security',
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      )
    }
  ];

  const filteredTools = tools.filter((tool) =>
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = {
    organize: 'Organize & Edit',
    convert: 'Convert Files',
    security: 'Stamps & Overlays'
  };

  return (
    <div className="dashboard-container">
      <section className="hero-section">
        <h1 className="hero-title">
          Every tool you need to work with <span>PDFs</span>, 100% private
        </h1>
        <p className="hero-subtitle">
          Secure, client-side PDF utility suite. Your sensitive documents never leave your computer.
        </p>
        
        <div className="search-container">
          <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search for a tool... (e.g. PDF to Text, Watermark)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {Object.entries(categories).map(([catKey, catLabel]) => {
        const catTools = filteredTools.filter((t) => t.category === catKey);
        if (catTools.length === 0) return null;
        
        return (
          <div key={catKey} style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--color-slate-900)' }}>
              {catLabel}
            </h2>
            <div className="tools-grid">
              {catTools.map((tool) => (
                <div
                  key={tool.id}
                  className="tool-card"
                  onClick={() => navigate(tool.path)}
                >
                  <div className="tool-icon-wrapper">
                    {tool.icon}
                  </div>
                  <h3 className="tool-title">{tool.title}</h3>
                  <p className="tool-desc">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
