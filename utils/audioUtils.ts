/**
 * Decodes a base64 string into a Uint8Array.
 */
export const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Converts raw PCM data (Float32) to a WAV Blob.
 * This allows the browser to treat the raw audio as a standard file for playback/download.
 */
export const createWavBlob = (pcmData: Float32Array, sampleRate: number): Blob => {
  const numChannels = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length * bytesPerSample;
  const bufferSize = 44 + dataSize;
  
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, byteRate, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < pcmData.length; i++) {
    // Clamp the value to -1.0 to 1.0
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    // Convert to 16-bit PCM
    const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, val, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

/**
 * Decodes raw PCM bytes (Int16 usually from Gemini) into an AudioBuffer.
 * Note: Gemini returns raw PCM.
 */
export const decodeGeminiAudio = async (
  base64Data: string,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  const bytes = decodeBase64(base64Data);
  
  // Gemini TTS usually returns raw PCM 24kHz mono (check model specs, usually 24000)
  // The guidelines imply we need to handle Int16 to Float32 conversion manually if it's raw bytes.
  
  const int16Data = new Int16Array(bytes.buffer);
  const float32Data = new Float32Array(int16Data.length);
  
  for (let i = 0; i < int16Data.length; i++) {
    float32Data[i] = int16Data[i] / 32768.0;
  }

  const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
  buffer.getChannelData(0).set(float32Data);
  
  return buffer;
};

export const getPcmDataFromBase64 = (base64Data: string): Float32Array => {
    const bytes = decodeBase64(base64Data);
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
    }
    return float32Data;
}
