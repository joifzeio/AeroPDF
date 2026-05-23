import React from 'react';
import { useSeo } from '../hooks/useSeo';

interface FAQ {
  q: string;
  a: string;
}

interface ToolLayoutProps {
  title: string;
  description: string;
  headerTitle: string;
  headerSubtitle: string;
  faqs: FAQ[];
  children: React.ReactNode;
}

export function ToolLayout({
  title,
  description,
  headerTitle,
  headerSubtitle,
  faqs,
  children
}: ToolLayoutProps) {
  // Activate SEO tags automatically
  useSeo(title, description);

  return (
    <div className="tool-container">
      <header className="tool-header">
        <h1>{headerTitle}</h1>
        <p>{headerSubtitle}</p>
      </header>

      <main className="tool-workspace">
        {children}
      </main>

      {faqs && faqs.length > 0 && (
        <section className="faq-section">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <article className="faq-card" key={index}>
                <h3 className="faq-q">{faq.q}</h3>
                <p className="faq-a">{faq.a}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
