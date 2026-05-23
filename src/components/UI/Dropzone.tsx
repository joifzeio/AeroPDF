import React, { useState, useRef } from 'react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  title: string;
  subtitle: string;
  buttonText?: string;
}

export function Dropzone({
  onFilesSelected,
  accept,
  multiple = true,
  title,
  subtitle,
  buttonText = 'Select Files'
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      // Filter based on accepted extensions
      const acceptedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());
      const filteredFiles = filesArray.filter(file => {
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        return acceptedExtensions.some(ext => ext === fileExt || accept === '*');
      });

      if (filteredFiles.length > 0) {
        onFilesSelected(filteredFiles);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      className={`dropzone-container ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleButtonClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
      />
      <div className="dropzone-icon-box">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <div>
        <h3 className="dropzone-title">{title}</h3>
        <p className="dropzone-subtitle">{subtitle}</p>
      </div>
      <button type="button" className="btn-primary">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        {buttonText}
      </button>
    </div>
  );
}
