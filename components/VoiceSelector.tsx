import React from 'react';
import { VoiceName } from '../types';

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onVoiceChange: (voice: VoiceName) => void;
  disabled?: boolean;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onVoiceChange, disabled }) => {
  return (
    <div className="w-full">
      <label htmlFor="voice-select" className="block text-sm font-medium text-stone-700 mb-2">
        Narrator Voice
      </label>
      <div className="relative">
        <select
          id="voice-select"
          value={selectedVoice}
          onChange={(e) => onVoiceChange(e.target.value as VoiceName)}
          disabled={disabled}
          className="block w-full pl-3 pr-10 py-2.5 text-base border-stone-300 focus:outline-none focus:ring-stone-500 focus:border-stone-500 sm:text-sm rounded-md bg-white shadow-sm disabled:bg-stone-100 disabled:text-stone-400"
        >
          {Object.values(VoiceName).map((voice) => (
            <option key={voice} value={voice}>
              {voice}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Choose a voice that matches the tone of your document.
      </p>
    </div>
  );
};

export default VoiceSelector;