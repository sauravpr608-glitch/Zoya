export async function playPCM(base64Data: string): Promise<void> {
  if (!base64Data) return;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("AudioContext not supported");
      return;
    }
    
    // Use a singleton-like pattern for AudioContext to avoid hitting limits
    if (!(window as any).zoyaAudioCtx) {
      (window as any).zoyaAudioCtx = new AudioContextClass({ sampleRate: 24000 });
    }
    const audioCtx = (window as any).zoyaAudioCtx;
    
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Ensure the buffer is even-sized for Int16Array
    const validByteLength = bytes.length - (bytes.length % 2);
    const alignedBuffer = bytes.buffer.slice(0, validByteLength);
    const buffer = new Int16Array(alignedBuffer);
    
    const audioBuffer = audioCtx.createBuffer(1, buffer.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      channelData[i] = buffer[i] / 32768.0;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
    
    return new Promise<void>(resolve => {
      source.onended = () => resolve();
    });
  } catch (error) {
    console.error("Error playing audio:", error);
  }
}
