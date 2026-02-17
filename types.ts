export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
}

export interface AudioGenerationState {
  isGenerating: boolean;
  progress: number; // 0 to 100
  error: string | null;
}

// Global declaration for PDF.js loaded via CDN
declare global {
  interface Window {
    pdfjsLib: any;
  }
}