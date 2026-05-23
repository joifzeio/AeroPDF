import { useEffect } from 'react';

export interface SeoProps {
  title: string;
  description: string;
}

export function useSeo(title: string, description: string) {
  useEffect(() => {
    // Update Title
    const baseTitle = 'AeroPDF - 100% Secure Client-Side PDF Tools';
    document.title = title ? `${title} | AeroPDF` : baseTitle;

    // Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    
    metaDescription.setAttribute(
      'content',
      description || 'Merge, split, rotate, convert, and protect your PDF documents completely inside your browser. No file uploads, ultimate privacy.'
    );
  }, [title, description]);
}
