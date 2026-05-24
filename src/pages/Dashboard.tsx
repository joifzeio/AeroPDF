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
  const [activeTab, setActiveTab] = useState<'all' | 'organize' | 'convert' | 'security'>('all');

  useSeo(
    'AeroPDF - Free 100% Secure Client-Side PDF Tools',
    'Edit, merge, split, rotate, convert, watermark, and protect your PDF documents completely locally inside your browser. Absolute file privacy, no server uploads, ultra-fast.'
  );

  const tools: Tool[] = [
    {
      id: 'merge',
      title: 'Merge PDF',
      description: 'Combine PDFs in the order you want with the easiest PDF merger available.',
      path: '/merge-pdf',
      category: 'organize',
      icon: (
        <div className="card-icon-box" style={{ background: '#fef2f2', color: '#ef4444' }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l3-3m-3 3l-3-3M12 4.5L9 7.5m3-3l3 3" />
          </svg>
        </div>
      )
    },
    {
      id: 'split',
      title: 'Split PDF',
      description: 'Separate one page or a whole set for easy conversion into independent PDF files.',
      path: '/split-pdf',
      category: 'organize',
      icon: (
        <div className="card-icon-box" style={{ background: '#fff7ed', color: '#f97316' }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-9L16.5 3m0 0L12 7.5m4.5-4.5v13.5" />
          </svg>
        </div>
      )
    },
    {
      id: 'pdf-to-jpg',
      title: 'PDF to JPG',
      description: 'Convert each PDF page into a JPG or extract all images contained in a PDF.',
      path: '/pdf-to-jpg',
      category: 'convert',
      icon: (
        <div className="card-icon-box" style={{ background: '#fef9c3', color: '#eab308' }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 002.25-2.25" />
          </svg>
        </div>
      )
    },
    {
      id: 'jpg-to-pdf',
      title: 'JPG to PDF',
      description: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.',
      path: '/jpg-to-pdf',
      category: 'convert',
      icon: (
        <div className="card-icon-box" style={{ background: '#f0f9ff', color: '#0ea5e9' }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25V18M9 8.25V18m0-9.75h9m-9 9.75h9m0-9.75v9.75" />
          </svg>
        </div>
      )
    },
    {
      id: 'pdf-to-txt',
      title: 'PDF to Text',
      description: 'Extract raw text layers page-by-page from your PDF document locally.',
      path: '/pdf-to-txt',
      category: 'convert',
      icon: (
        <div className="card-icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
          </svg>
        </div>
      )
    },
    {
      id: 'txt-to-pdf',
      title: 'Text to PDF',
      description: 'Stitch raw plain text files (.txt) or typed paragraphs into formatted paginated PDFs.',
      path: '/txt-to-pdf',
      category: 'convert',
      icon: (
        <div className="card-icon-box" style={{ background: '#faf5ff', color: '#a855f7' }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25" />
          </svg>
        </div>
      )
    },
    {
      id: 'html-to-pdf',
      title: 'HTML to PDF',
      description: 'Paste custom HTML, view live sandboxed previews, and render them to PDFs.',
      path: '/html-to-pdf',
      category: 'convert',
      icon: (
        <div className="card-icon-box" style={{ background: '#fdf2f8', color: '#db2777' }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
        </div>
      )
    },
    {
      id: 'rotate',
      title: 'Rotate PDF',
      description: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!',
      path: '/rotate-pdf',
      category: 'organize',
      icon: (
        <div className="card-icon-box" style={{ background: '#f5f5f5', color: '#737373' }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </div>
      )
    },
    {
      id: 'remove-pages',
      title: 'Remove Pages',
      description: 'Delete pages from a PDF document in a quick and easy way.',
      path: '/remove-pages',
      category: 'organize',
      icon: (
        <div className="card-icon-box" style={{ background: '#fff1f2', color: '#f43f5e' }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    },
    {
      id: 'add-page-numbers',
      title: 'Page Numbers',
      description: 'Add page numbers into your PDF easily. Choose position, dimensions, and typography.',
      path: '/add-page-numbers',
      category: 'security',
      icon: (
        <div className="card-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 6h18m-18 6h18M5.25 3h15" />
          </svg>
        </div>
      )
    },
    {
      id: 'watermark',
      title: 'Watermark PDF',
      description: 'Stamp an image or text over your PDF in seconds. Choose transparency, sizing and typography.',
      path: '/watermark-pdf',
      category: 'security',
      icon: (
        <div className="card-icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685" />
          </svg>
        </div>
      )
    }
  ];

  const filteredTools = tools.filter((tool) => {
    if (activeTab === 'all') return true;
    return tool.category === activeTab;
  });

  return (
    <div className="dashboard-container">
      {/* Centered Hero Area matching screenshot */}
      <section className="hero-section" style={{ padding: '4rem 1rem 3rem 1rem' }}>
        <h1 className="hero-title" style={{ fontSize: '3rem', fontWeight: 800, color: '#1f242d', marginBottom: '1.5rem' }}>
          Every tool you need to work with PDFs in one place
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.25rem', color: '#656b7c', lineHeight: 1.6, maxWidth: '900px', margin: '0 auto' }}>
          Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
        </p>

        {/* Categories Filter Tabs / Pills matching screenshot */}
        <div className="pills-container">
          <button
            className={`pill-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`pill-btn ${activeTab === 'organize' ? 'active' : ''}`}
            onClick={() => setActiveTab('organize')}
          >
            Organize PDF
          </button>
          <button
            className={`pill-btn ${activeTab === 'convert' ? 'active' : ''}`}
            onClick={() => setActiveTab('convert')}
          >
            Convert PDF
          </button>
          <button
            className={`pill-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            PDF Security
          </button>
        </div>
      </section>

      {/* Grid container with left-aligned tiles and flat clean styling */}
      <div className="tools-grid-flat" style={{ marginBottom: '5rem' }}>
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className="tool-card-flat"
            onClick={() => navigate(tool.path)}
          >
            <div className="tool-card-icon-wrap">
              {tool.icon}
            </div>
            <h3 className="tool-card-title">{tool.title}</h3>
            <p className="tool-card-desc">{tool.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
