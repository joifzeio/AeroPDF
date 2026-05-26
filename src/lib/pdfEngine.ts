import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Define the worker path dynamically matching our installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Helper to convert hex color string to RGB object
 */
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Helper to read a File object as an ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Helper to read a File object as a Data URL
 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * 1. MERGE PDF FILES
 */
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const fileBytes = await readFileAsArrayBuffer(file);
    const pdf = await PDFDocument.load(fileBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * 2. SPLIT / EXTRACT PAGES FROM PDF
 */
export async function splitPdf(file: File, rangesStr: string): Promise<Uint8Array> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const sourcePdf = await PDFDocument.load(fileBytes);
  const totalPages = sourcePdf.getPageCount();

  const newPdf = await PDFDocument.create();
  const pagesToExtract: number[] = [];

  const segments = rangesStr.split(',');
  for (const segment of segments) {
    const cleanSegment = segment.trim();
    if (cleanSegment.includes('-')) {
      const [startStr, endStr] = cleanSegment.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          pagesToExtract.push(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(cleanSegment, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pagesToExtract.push(pageNum - 1);
      }
    }
  }

  const uniquePages = Array.from(new Set(pagesToExtract)).sort((a, b) => a - b);

  if (uniquePages.length === 0) {
    throw new Error('No valid pages specified in range.');
  }

  const copiedPages = await newPdf.copyPages(sourcePdf, uniquePages);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

/**
 * 3. PDF TO JPG CONVERSION
 */
export async function pdfToJpg(
  file: File,
  dpi: number = 150,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({ data: fileBytes });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const imageUrls: string[] = [];
  const scale = dpi / 72;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      imageUrls.push(dataUrl);
    }

    if (onProgress) {
      onProgress(pageNum, numPages);
    }
  }

  return imageUrls;
}

/**
 * 4. JPG TO PDF CONVERSION
 */
export async function jpgToPdf(
  files: File[],
  layout: { size: string; orientation: string; margin: string }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  let pageWidth = 595.27;
  let pageHeight = 841.89;

  if (layout.size.toLowerCase() === 'letter') {
    pageWidth = 612;
    pageHeight = 792;
  }

  if (layout.orientation.toLowerCase() === 'landscape') {
    const temp = pageWidth;
    pageWidth = pageHeight;
    pageHeight = temp;
  }

  let margin = 0;
  if (layout.margin.toLowerCase() === 'normal') {
    margin = 36;
  }

  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  for (const file of files) {
    const imgDataUrl = await readFileAsDataURL(file);
    const isPng = file.type === 'image/png' || file.name.endsWith('.png');
    
    let embeddedImg;
    if (isPng) {
      embeddedImg = await pdfDoc.embedPng(imgDataUrl);
    } else {
      embeddedImg = await pdfDoc.embedJpg(imgDataUrl);
    }

    const { width: imgWidth, height: imgHeight } = embeddedImg.scale(1);
    const scale = Math.min(contentWidth / imgWidth, contentHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const x = margin + (contentWidth - drawWidth) / 2;
    const y = margin + (contentHeight - drawHeight) / 2;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImg, {
      x,
      y,
      width: drawWidth,
      height: drawHeight
    });
  }

  return await pdfDoc.save();
}

/**
 * 5. ROTATE PDF PAGES
 */
export async function rotatePdf(
  file: File,
  rotations: { [pageIndex: number]: number }
): Promise<Uint8Array> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const rot = rotations[i] || 0;
    if (rot !== 0) {
      const page = pages[i];
      const currentRotation = page.getRotation().angle;
      const nextRotation = (currentRotation + rot + 360) % 360;
      page.setRotation(degrees(nextRotation));
    }
  }

  return await pdfDoc.save();
}

/**
 * 6. REMOVE PAGES FROM PDF
 */
export async function removePages(file: File, pagesStr: string): Promise<Uint8Array> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const totalPages = pdfDoc.getPageCount();

  const indicesToRemove: number[] = [];
  const segments = pagesStr.split(',');

  for (const segment of segments) {
    const cleanSegment = segment.trim();
    if (cleanSegment.includes('-')) {
      const [startStr, endStr] = cleanSegment.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          indicesToRemove.push(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(cleanSegment, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indicesToRemove.push(pageNum - 1);
      }
    }
  }

  const uniqueIndices = Array.from(new Set(indicesToRemove)).sort((a, b) => b - a);

  if (uniqueIndices.length === 0) {
    throw new Error('No valid page numbers entered.');
  }

  if (uniqueIndices.length === totalPages) {
    throw new Error('Cannot delete every page in the document.');
  }

  for (const index of uniqueIndices) {
    pdfDoc.removePage(index);
  }

  return await pdfDoc.save();
}

/**
 * 7. ADD PAGE NUMBERS TO PDF
 */
export async function addPageNumbers(
  file: File,
  position: 'bottom-center' | 'bottom-right' | 'top-right'
): Promise<Uint8Array> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const text = `Page ${i + 1} of ${pages.length}`;
    const textSize = 10;
    const textWidth = font.widthOfTextAtSize(text, textSize);
    const textHeight = font.heightAtSize(textSize);

    let x = width / 2 - textWidth / 2;
    let y = 30;

    if (position === 'bottom-right') {
      x = width - textWidth - 36;
    } else if (position === 'top-right') {
      x = width - textWidth - 36;
      y = height - textHeight - 30;
    }

    page.drawText(text, {
      x,
      y,
      size: textSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
      opacity: 0.7
    });
  }

  return await pdfDoc.save();
}

/**
 * 8. ADD WATERMARK TO PDF
 */
export async function addWatermark(
  file: File,
  options: {
    text: string;
    size: number;
    color: string;
    opacity: number;
    rotation: number;
    position: string;
  }
): Promise<Uint8Array> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pages = pdfDoc.getPages();
  
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const rgbColor = hexToRgb(options.color);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.size);
    const textHeight = font.heightAtSize(options.size);

    let x = (width - textWidth) / 2;
    let y = (height - textHeight) / 2;

    switch (options.position.toLowerCase()) {
      case 'top-left':
        x = 36;
        y = height - textHeight - 36;
        break;
      case 'top-right':
        x = width - textWidth - 36;
        y = height - textHeight - 36;
        break;
      case 'bottom-left':
        x = 36;
        y = 36;
        break;
      case 'bottom-right':
        x = width - textWidth - 36;
        y = 36;
        break;
      case 'center':
      default:
        x = (width - textWidth) / 2;
        y = (height - textHeight) / 2;
        break;
    }

    page.drawText(options.text, {
      x,
      y,
      size: options.size,
      font,
      color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
      opacity: options.opacity,
      rotate: degrees(options.rotation),
    });
  }

  return await pdfDoc.save();
}

/**
 * 9. PDF TO TEXT CONVERSION
 */
export async function pdfToText(file: File): Promise<string> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({ data: fileBytes });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  let fullText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    fullText += `--- PAGE ${pageNum} ---\n${pageText}\n\n`;
  }

  return fullText.trim();
}

/**
 * 10. TEXT TO PDF CONVERSION
 */
export async function textToPdf(
  text: string,
  options: { font: string; size: number; spacing: number; sheet: string; margin: number }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  let standardFont = StandardFonts.Helvetica;
  if (options.font.toLowerCase() === 'courier') {
    standardFont = StandardFonts.Courier;
  } else if (options.font.toLowerCase() === 'timesroman') {
    standardFont = StandardFonts.TimesRoman;
  }
  const font = await pdfDoc.embedFont(standardFont);

  let pageWidth = 595.27;
  let pageHeight = 841.89;
  if (options.sheet.toLowerCase() === 'letter') {
    pageWidth = 612;
    pageHeight = 792;
  }

  const margin = options.margin;
  const contentWidth = pageWidth - margin * 2;
  
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }

    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, options.size);
      
      if (testWidth <= contentWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  const lineHeight = options.size * options.spacing;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  for (const line of lines) {
    if (currentY - lineHeight < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }

    if (line.trim() !== '') {
      page.drawText(line, {
        x: margin,
        y: currentY - options.size,
        size: options.size,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    currentY -= lineHeight;
  }

  return await pdfDoc.save();
}

/**
 * 11. ORGANIZE PDF PAGES
 * restructures page orders and inserts new blank sheets
 */
export async function organizePdf(
  file: File,
  pageSequence: { type: 'page' | 'blank'; originalIndex?: number }[]
): Promise<Uint8Array> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const sourcePdf = await PDFDocument.load(fileBytes);
  const newPdf = await PDFDocument.create();

  for (const item of pageSequence) {
    if (item.type === 'page' && typeof item.originalIndex === 'number') {
      const copied = await newPdf.copyPages(sourcePdf, [item.originalIndex]);
      newPdf.addPage(copied[0]);
    } else if (item.type === 'blank') {
      // standard A4 sheet
      newPdf.addPage([595.27, 841.89]);
    }
  }

  return await newPdf.save();
}

/**
 * 12. COMPRESS PDF
 * shrinks pdf binary via stream level objectStream optimizations
 */
export async function compressPdf(file: File): Promise<Uint8Array> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(fileBytes);

  return await pdfDoc.save({
    useObjectStreams: true
  });
}

/**
 * 13. STAMP SIGNATURE (E-SIGN)
 * stamps signature PNG data onto exact sheet coordinates
 */
export async function stampSignature(
  file: File,
  signatureUri: string,
  stamp: { pageIndex: number; x: number; y: number; width: number; height: number }
): Promise<Uint8Array> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(fileBytes);
  
  // Embed PNG signature image
  const signatureImage = await pdfDoc.embedPng(signatureUri);
  const pages = pdfDoc.getPages();
  const page = pages[stamp.pageIndex];

  // Stamp onto page
  page.drawImage(signatureImage, {
    x: stamp.x,
    y: stamp.y,
    width: stamp.width,
    height: stamp.height
  });

  return await pdfDoc.save();
}

/**
 * 14. FLATTEN PDF
 * fuses interactive forms into flat visual vector blocks
 */
export async function flattenPdf(file: File): Promise<Uint8Array> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const form = pdfDoc.getForm();
  form.flatten();
  return await pdfDoc.save();
}

/**
 * 15. GET PDF METADATA
 * extracts file information tags from a PDF document
 */
export async function getMetadata(file: File): Promise<{
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(fileBytes);
  return {
    title: pdfDoc.getTitle() || '',
    author: pdfDoc.getAuthor() || '',
    subject: pdfDoc.getSubject() || '',
    keywords: pdfDoc.getKeywords() || '',
    creator: pdfDoc.getCreator() || '',
    producer: pdfDoc.getProducer() || ''
  };
}

/**
 * 16. SET PDF METADATA
 * writes customized file information tags to a PDF document
 */
export async function setMetadata(
  file: File,
  meta: { title: string; author: string; subject: string; keywords: string; creator: string; producer: string }
): Promise<Uint8Array> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(fileBytes);

  pdfDoc.setTitle(meta.title);
  pdfDoc.setAuthor(meta.author);
  pdfDoc.setSubject(meta.subject);
  pdfDoc.setKeywords(meta.keywords.split(',').map((k) => k.trim()).filter((k) => k !== ''));
  pdfDoc.setCreator(meta.creator);
  pdfDoc.setProducer(meta.producer);

  return await pdfDoc.save();
}

/**
 * 17. CROP PDF PAGES
 * adjusts CropBox boundary values for all pages
 */
export async function cropPdf(
  file: File,
  margins: { top: number; bottom: number; left: number; right: number }
): Promise<Uint8Array> {
  const fileBytes = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    
    // Margins represent inset offsets in PDF points
    const x = margins.left;
    const y = margins.bottom;
    const w = Math.max(10, width - margins.left - margins.right);
    const h = Math.max(10, height - margins.top - margins.bottom);
    
    page.setCropBox(x, y, w, h);
  }

  return await pdfDoc.save();
}
