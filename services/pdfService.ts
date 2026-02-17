import { PDFExtractionResult } from '../types';

export const extractTextFromPdf = async (file: File): Promise<PDFExtractionResult> => {
  // Ensure worker is set up
  if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  if (!window.pdfjsLib) {
    throw new Error('PDF.js library not loaded.');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;

    let fullText = '';
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Simple text extraction. 
      // Ideally, we might want to sort items by y-coordinate to handle columns, 
      // but for a generic reader, standard flow is usually acceptable.
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += pageText + '\n\n';
    }

    return {
      text: fullText.trim(),
      pageCount: numPages
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to parse PDF file. Please ensure it is a valid PDF.');
  }
};