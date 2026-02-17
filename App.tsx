import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Play, Download, RefreshCw, Volume2, BookOpen } from 'lucide-react';
import { extractTextFromPdf } from './services/pdfService';
import { generateSpeech } from './services/geminiService';
import { VoiceName } from './types';
import Button from './components/Button';
import VoiceSelector from './components/VoiceSelector';
import TextEditor from './components/TextEditor';
import { getPcmDataFromBase64, createWavBlob } from './utils/audioUtils';

const App: React.FC = () => {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [voice, setVoice] = useState<VoiceName>(VoiceName.Kore);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle File Upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setAudioUrl(null); // Reset audio if new file
    setIsExtracting(true);

    try {
      const result = await extractTextFromPdf(selectedFile);
      // Take first 2000 characters for demo purposes if too long, or just let user edit.
      // Gemini Flash TTS has a decent input limit, but for a full book, we'd need chunking logic.
      // For this specific single-file constraint demo, we'll limit initial extraction to avoid massive tokens errors immediately,
      // but allow the user to see it.
      setExtractedText(result.text); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text');
      setFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle TTS Generation
  const handleGenerateAudio = async () => {
    if (!extractedText) return;
    
    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      // Limit text length for the demo to prevent hitting quota/timeouts on a single request
      // Real app would implement a chunking queue system.
      const charLimit = 4000; 
      let textToProcess = extractedText;
      
      if (textToProcess.length > charLimit) {
        // Simple truncation notification
        console.warn(`Text too long (${textToProcess.length} chars). Truncating to ${charLimit} for demo stability.`);
        textToProcess = textToProcess.substring(0, charLimit);
        // Ideally, we'd loop through chunks here.
      }

      const base64Audio = await generateSpeech(textToProcess, voice);
      
      // Process audio data for playback and download
      const pcmData = getPcmDataFromBase64(base64Audio);
      // 24000 Hz is standard for Gemini Flash TTS
      const wavBlob = createWavBlob(pcmData, 24000); 
      const url = URL.createObjectURL(wavBlob);
      
      setAudioUrl(url);
    } catch (err) {
      setError('Failed to generate audio. Please try again or reduce text length.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setExtractedText('');
    setAudioUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-stone-900 p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight font-serif">Lumina Audiobooks</h1>
          </div>
          <div className="text-sm text-stone-500 hidden sm:block">
            Powered by Gemini 2.5 Flash TTS
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Input & Configuration */}
        <div className="w-full lg:w-1/3 space-y-6">
          
          {/* File Upload Card */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-stone-500" />
              Upload Document
            </h2>
            
            {!file ? (
              <div 
                className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center hover:border-stone-500 transition-colors cursor-pointer bg-stone-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="application/pdf" 
                  className="hidden" 
                />
                <FileText className="h-10 w-10 mx-auto text-stone-400 mb-3" />
                <p className="text-sm font-medium text-stone-900">Click to upload PDF</p>
                <p className="text-xs text-stone-500 mt-1">PDF files up to 10MB</p>
              </div>
            ) : (
              <div className="bg-stone-50 rounded-lg p-4 flex items-center justify-between border border-stone-200">
                <div className="flex items-center overflow-hidden">
                  <div className="bg-red-100 p-2 rounded-md mr-3 flex-shrink-0">
                    <FileText className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-stone-900 truncate">{file.name}</p>
                    <p className="text-xs text-stone-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={handleReset}
                  className="p-1.5 hover:bg-stone-200 rounded-full text-stone-500 transition-colors"
                  title="Remove file"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Configuration Card */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center">
              <Volume2 className="h-5 w-5 mr-2 text-stone-500" />
              Audio Settings
            </h2>
            <VoiceSelector 
              selectedVoice={voice} 
              onVoiceChange={setVoice} 
              disabled={isGenerating || isExtracting} 
            />
            
            <div className="mt-6">
               <Button 
                onClick={handleGenerateAudio} 
                className="w-full"
                disabled={!extractedText || isGenerating || isExtracting}
                isLoading={isGenerating}
              >
                <Play className="h-4 w-4 mr-2" />
                Generate Audiobook
              </Button>
            </div>
            
            {extractedText.length > 4000 && (
               <p className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                 Note: For this demo, text longer than 4000 characters will be truncated during generation.
               </p>
            )}
          </div>

          {/* Audio Player Card (Sticky when available) */}
          {audioUrl && (
            <div className="bg-stone-900 rounded-xl shadow-lg border border-stone-800 p-6 text-white sticky top-24">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-white">
                <Play className="h-5 w-5 mr-2 text-green-400" />
                Now Playing
              </h2>
              <audio 
                ref={audioRef} 
                controls 
                src={audioUrl} 
                className="w-full mb-4 accent-green-500" 
                autoPlay
              />
              <a 
                href={audioUrl} 
                download={`audiobook-${file?.name.replace('.pdf', '') || 'generated'}.wav`}
                className="flex items-center justify-center w-full px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-md text-sm font-medium transition-colors border border-stone-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download WAV
              </a>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
              <strong className="font-semibold block mb-1">Error</strong>
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Text Preview */}
        <div className="w-full lg:w-2/3 h-[calc(100vh-12rem)] min-h-[500px]">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 h-full flex flex-col">
            {isExtracting ? (
              <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800 mb-4"></div>
                <p>Extracting text from PDF...</p>
              </div>
            ) : extractedText ? (
              <TextEditor 
                text={extractedText} 
                onChange={setExtractedText} 
                disabled={isGenerating} 
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-100 rounded-lg bg-stone-50">
                <BookOpen className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg font-medium text-stone-300">No document loaded</p>
                <p className="text-sm mt-2 text-stone-300">Upload a PDF to view and edit text here</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;