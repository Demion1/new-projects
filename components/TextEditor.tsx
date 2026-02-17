import React from 'react';

interface TextEditorProps {
  text: string;
  onChange: (text: string) => void;
  disabled?: boolean;
}

const TextEditor: React.FC<TextEditorProps> = ({ text, onChange, disabled }) => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="text-editor" className="block text-sm font-medium text-stone-700">
          Extracted Text Preview
        </label>
        <span className="text-xs text-stone-500 italic">
          Edit text to improve pronunciation or remove artifacts
        </span>
      </div>
      <textarea
        id="text-editor"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1 w-full p-4 border border-stone-200 rounded-md shadow-inner font-serif text-lg leading-relaxed text-stone-800 bg-white resize-none focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none disabled:bg-stone-50 disabled:text-stone-400"
        placeholder="Extracted text will appear here..."
      />
    </div>
  );
};

export default TextEditor;