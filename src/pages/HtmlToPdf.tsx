import { useState, useEffect, useRef } from 'react';
import { ToolLayout } from '../components/ToolLayout';

export function HtmlToPdf() {
  const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #333;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .invoice-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header-group {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #edf2f7;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .title {
      font-size: 2rem;
      color: #e53238;
      font-weight: bold;
    }
    .invoice-num {
      text-align: right;
      color: #718096;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1.5rem;
    }
    th, td {
      border-bottom: 1px solid #e2e8f0;
      padding: 0.75rem;
      text-align: left;
    }
    th {
      background-color: #f7fafc;
      font-weight: bold;
    }
    .total-row {
      font-weight: bold;
      font-size: 1.1rem;
      color: #1a202c;
    }
  </style>
</head>
<body>
  <div className="invoice-card">
    <div class="header-group">
      <div>
        <div class="title">TCPDF Invoice</div>
        <p>100% Private Client-Side Tools</p>
      </div>
      <div class="invoice-num">
        <h3>INVOICE</h3>
        <p>#INV-2026-05</p>
        <p>Date: May 24, 2026</p>
      </div>
    </div>

    <div>
      <h4>Billed To:</h4>
      <p>TCPDF Verified User</p>
      <p>Local Sandbox Environment</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>TCPDF Client-Side Merging</td>
          <td>1</td>
          <td>$0.00</td>
          <td>$0.00</td>
        </tr>
        <tr>
          <td>Page Stamping & Rotations</td>
          <td>1</td>
          <td>$0.00</td>
          <td>$0.00</td>
        </tr>
        <tr class="total-row">
          <td colspan="3" style="text-align: right;">Total Due:</td>
          <td>$0.00</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync iframe document with edited htmlCode reactively
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlCode);
      doc.close();
    }
  }, [htmlCode]);

  const executePrint = () => {
    if (iframeRef.current) {
      // Trigger iframe window printing letting users print or save as PDF natively
      iframeRef.current.contentWindow?.focus();
      iframeRef.current.contentWindow?.print();
    }
  };

  const faqs = [
    {
      q: 'How does HTML to PDF rendering work?',
      a: 'TCPDF sets up a secure, sandboxed iframe container to load your raw HTML and custom CSS rules. When you click "Export to PDF", it triggers the browser\'s high-performance native PDF printing engine. This lets you select "Save as PDF" to render pages with vector fonts and custom background colors.'
    },
    {
      q: 'Can I include external stylesheets or custom fonts?',
      a: 'Yes! You can link standard external stylesheets (e.g. from CDN JS libraries) or Google Fonts tags directly inside the HTML head. Since compilation runs locally inside your browser, the iframe loads these links seamlessly.'
    },
    {
      q: 'Are my HTML code or invoice tables secure?',
      a: 'Absolutely. TCPDF has no server connections. Your HTML is rendered completely client-side in the iframe viewport and exported locally on your hardware.'
    }
  ];

  return (
    <ToolLayout
      title="HTML to PDF Converter - Free split-screen code renderer"
      description="Compile custom HTML and CSS pages into standard PDFs online. Clean browser-sandboxed rendering guarantees privacy."
      headerTitle="HTML to PDF"
      headerSubtitle="Paste custom HTML web pages, view live sandboxed previews, and compile them into standardized PDFs instantly. 100% local."
      faqs={faqs}
    >
      <div className="options-layout" style={{ maxWidth: '1440px', gap: '1.5rem' }}>
        {/* Code Editor Panel */}
        <div className="options-workspace" style={{ flex: 1, alignItems: 'stretch' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-800)', marginBottom: '0.75rem' }}>
            HTML Source Code
          </h3>
          <textarea
            className="form-input"
            style={{
              width: '100%',
              height: '520px',
              fontFamily: 'Consolas, Courier, monospace',
              fontSize: '0.85rem',
              resize: 'none',
              padding: '1rem',
              background: '#1e293b',
              color: '#f8fafc',
              border: 'none',
              borderRadius: 'var(--radius-md)'
            }}
            value={htmlCode}
            onChange={(e) => setHtmlCode(e.target.value)}
          />
        </div>

        {/* Live Preview & Sandbox Control Panel */}
        <div className="options-sidebar" style={{ flex: 1.2, minWidth: '320px', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
              Live Sandbox Preview
            </h3>
            <button className="btn-primary" onClick={executePrint} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Export to PDF
            </button>
          </div>

          <div
            style={{
              border: '1px solid var(--color-slate-200)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: 'white',
              height: '520px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <iframe
              ref={iframeRef}
              title="HTML PDF Sandbox"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'white'
              }}
              sandbox="allow-scripts allow-same-origin allow-modals"
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
