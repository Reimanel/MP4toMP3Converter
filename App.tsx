import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

// Type definitions for the application state
type OutputFormat = 'mp3' | 'wav';
type QualityOption = 'original' | 'compress';
type ConversionStatus = 'idle' | 'loading' | 'converting' | 'success' | 'error';

// Helper function to format file sizes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// --- UI Helper Components ---

const Spinner: React.FC = () => (
  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15v-6m-3 3l3-3 3 3" />
  </svg>
);

const AudioFileIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" />
    </svg>
);

const XCircleIcon: React.FC<{onClick: () => void}> = ({onClick}) => (
    <button onClick={onClick} className="absolute -top-2 -right-2 text-slate-400 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    </button>
);

// --- Main App Component ---

export default function App() {
  const [status, setStatus] = useState<ConversionStatus>('loading');
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp3');
  const [qualityOption, setQualityOption] = useState<QualityOption>('original');
  const [targetSize, setTargetSize] = useState<number>(10);
  const [progress, setProgress] = useState<number>(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const ffmpegRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const initializeFFmpeg = async () => {
      try {
        setLogs(prev => [...prev, "Initializing FFmpeg..."]);
        
        const ffmpeg = new FFmpeg();

        ffmpeg.on('log', ({ message }: { message: string }) => {
          setLogs(prev => [...prev, message]);
        });

        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          setProgress(Math.round(progress * 100));
        });
        
        setLogs(prev => [...prev, "Loading FFmpeg core files..."]);
        
        const baseURL = window.location.origin;
        setLogs(prev => [...prev, `Base URL: ${baseURL}`]);
        
        // Carregar arquivos diretamente via fetch
        setLogs(prev => [...prev, "Fetching ffmpeg-core.js..."]);
        const coreJsResponse = await fetch(`${baseURL}/ffmpeg-core.js`);
        if (!coreJsResponse.ok) {
          throw new Error(`Failed to fetch ffmpeg-core.js: ${coreJsResponse.status}`);
        }
        const coreJsBlob = await coreJsResponse.blob();
        const coreJsURL = URL.createObjectURL(coreJsBlob);
        setLogs(prev => [...prev, `ffmpeg-core.js loaded: ${coreJsBlob.size} bytes`]);
        
        setLogs(prev => [...prev, "Fetching ffmpeg-core.wasm..."]);
        const coreWasmResponse = await fetch(`${baseURL}/ffmpeg-core.wasm`);
        if (!coreWasmResponse.ok) {
          throw new Error(`Failed to fetch ffmpeg-core.wasm: ${coreWasmResponse.status}`);
        }
        const coreWasmBlob = await coreWasmResponse.blob();
        const coreWasmURL = URL.createObjectURL(coreWasmBlob);
        setLogs(prev => [...prev, `ffmpeg-core.wasm loaded: ${coreWasmBlob.size} bytes`]);
        
        await ffmpeg.load({
          coreURL: coreJsURL,
          wasmURL: coreWasmURL,
        });
        
        setLogs(prev => [...prev, "FFmpeg loaded successfully!"]);
        ffmpegRef.current = ffmpeg;
        setStatus('idle');
      } catch (error) {
        console.error("FFmpeg initialization failed:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setLogs(prev => [...prev, `Error: ${errorMessage}`]);
        setStatus('error');
      }
    };

    initializeFFmpeg();
  }, []);

  const resetState = useCallback(() => {
    setStatus('idle');
    setFile(null);
    setOutputUrl(null);
    setOutputBlob(null);
    setProgress(0);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, []);
  
  const getVideoDuration = (inputFile: File): Promise<number> => {
      return new Promise((resolve, reject) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
              window.URL.revokeObjectURL(video.src);
              resolve(video.duration);
          };
          video.onerror = () => {
              reject('Failed to load video metadata.');
          };
          video.src = URL.createObjectURL(inputFile);
      });
  };

  const handleConvert = async () => {
    if (!file) return;

    setStatus('converting');
    setProgress(0);
    setLogs([]);
    setOutputUrl(null);
    setOutputBlob(null);

    const ffmpeg = ffmpegRef.current;
    const inputFileName = 'input.mp4';
    const outputFileName = `output.${outputFormat}`;
    
    try {
        await ffmpeg.writeFile(inputFileName, await fetchFile(file));

        const args = ['-i', inputFileName, '-vn'];

        if (outputFormat === 'mp3') {
            if (qualityOption === 'original') {
                args.push('-q:a', '0');
            } else {
                const duration = await getVideoDuration(file);
                const targetBitrate = Math.round((targetSize * 1024 * 8) / duration);
                args.push('-b:a', `${targetBitrate}k`);
            }
        }
        
        args.push(outputFileName);

        await ffmpeg.exec(args);
        
        // Verificar se o arquivo de saída foi criado
        const data = await ffmpeg.readFile(outputFileName);
        
        if (!data || data.length === 0) {
          throw new Error('Output file is empty or was not created');
        }
        
        const blob = new Blob([data], { type: `audio/${outputFormat === 'mp3' ? 'mpeg' : 'wav'}` });
        const url = URL.createObjectURL(blob);
        
        setOutputBlob(blob);
        setOutputUrl(url);
        setStatus('success');
        
        // Limpar arquivos temporários
        try {
          await ffmpeg.deleteFile(inputFileName);
          await ffmpeg.deleteFile(outputFileName);
        } catch (cleanupError) {
          console.log('Cleanup warning (can be ignored):', cleanupError);
        }

    } catch (error) {
      console.error('Conversion error:', error);
      
      // Verificar se o erro é só no fechamento do arquivo mas a conversão funcionou
      try {
        const data = await ffmpeg.readFile(outputFileName);
        if (data && data.length > 0) {
          console.log('File was created successfully despite error message');
          const blob = new Blob([data], { type: `audio/${outputFormat === 'mp3' ? 'mpeg' : 'wav'}` });
          const url = URL.createObjectURL(blob);
          
          setOutputBlob(blob);
          setOutputUrl(url);
          setStatus('success');
          
          // Limpar
          try {
            await ffmpeg.deleteFile(inputFileName);
            await ffmpeg.deleteFile(outputFileName);
          } catch (e) {
            console.log('Cleanup warning:', e);
          }
          return;
        }
      } catch (readError) {
        console.log('Could not read output file:', readError);
      }
      
      setStatus('error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange called', e.target.files);
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('File selected:', files[0].name, files[0].size, files[0].type);
      // Limpar estados anteriores mas manter o status
      setOutputUrl(null);
      setOutputBlob(null);
      setProgress(0);
      setStatus('idle');
      // Agora sim setar o arquivo
      setFile(files[0]);
      console.log('File state updated');
    } else {
      console.log('No files selected');
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      console.log('handleDrop called');
      e.preventDefault();
      e.stopPropagation();
      if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          console.log('File dropped:', e.dataTransfer.files[0].name);
          // Limpar estados anteriores
          setOutputUrl(null);
          setOutputBlob(null);
          setProgress(0);
          setStatus('idle');
          // Setar o arquivo
          setFile(e.dataTransfer.files[0]);
          e.dataTransfer.clearData();
      }
  };

  const handleFileRemove = () => {
    setFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
        <Spinner />
        <p className="mt-4 text-lg text-slate-300">Initializing Converter...</p>
        <div className="w-full max-w-2xl bg-slate-800 rounded-lg p-4 text-left mt-6">
          <h3 className="font-semibold text-white mb-2">Initialization Log:</h3>
          <pre className="text-xs text-slate-300 bg-black/50 p-3 rounded-md max-h-60 overflow-y-auto">
            <code>
              {logs.join('\n')}
            </code>
          </pre>
        </div>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
        <h2 className="text-2xl font-semibold text-red-400 mb-4">Initialization Failed</h2>
        <p className="text-slate-400 mb-6 text-center max-w-lg">The video converter could not be loaded. See the log below for details.</p>
        <div className="w-full max-w-2xl bg-slate-800 rounded-lg p-4 text-left">
          <h3 className="font-semibold text-white mb-2">Error Log:</h3>
          <pre className="text-xs text-slate-300 bg-black/50 p-3 rounded-md max-h-60 overflow-y-auto">
            <code>
              {logs.join('\n')}
            </code>
          </pre>
        </div>
      </div>
    );
  }

  const outputFileName = `converted_audio.${outputFormat}`;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" onDragOver={e => e.preventDefault()} onDrop={e => e.preventDefault()}>
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">MP4 to Audio Converter</h1>
          <p className="text-slate-400 mt-2">Convert video files to high-quality MP3 or WAV audio.</p>
        </header>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-slate-700">
          
          {status === 'success' ? (
            <div className="text-center flex flex-col items-center">
                <h2 className="text-2xl font-semibold text-green-400 mb-4">Conversion Successful!</h2>
                <div className="bg-slate-700/50 rounded-lg p-6 w-full max-w-md flex items-center space-x-4">
                    <AudioFileIcon />
                    <div className="text-left flex-grow">
                        <p className="font-medium text-white">{outputFileName}</p>
                        <p className="text-sm text-slate-400">{outputBlob ? formatBytes(outputBlob.size) : ''}</p>
                    </div>
                    <a 
                      href={outputUrl!} 
                      download={outputFileName}
                      className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Download
                    </a>
                </div>
                <button 
                    onClick={resetState}
                    className="mt-8 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    Convert Another File
                </button>
            </div>
          ) : (
            <>
            {!file ? (
                <div 
                    className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-brand-500 hover:bg-slate-800 transition-colors"
                    onClick={() => {
                      console.log('Upload area clicked');
                      fileInputRef.current?.click();
                    }}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                >
                    <input 
                      type="file" 
                      accept="video/*,audio/*" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                    <UploadIcon />
                    <p className="mt-2 text-slate-300">
                        <span className="font-semibold text-brand-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">Video or audio files</p>
                </div>
            ) : null}

            {file && (
            <div className="mt-6 space-y-6">
                {/* Mostrar arquivo selecionado com botão de remover */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-grow">
                            <p className="font-medium text-white">{file.name}</p>
                            <p className="text-sm text-slate-400">{formatBytes(file.size)}</p>
                        </div>
                        <button 
                            onClick={handleFileRemove}
                            className="ml-4 text-slate-400 hover:text-red-400 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-white mb-2">Output Format</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setOutputFormat('mp3')} className={`p-4 rounded-lg text-center font-medium transition-all ${outputFormat === 'mp3' ? 'bg-brand-600 text-white ring-2 ring-brand-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>MP3</button>
                        <button onClick={() => setOutputFormat('wav')} className={`p-4 rounded-lg text-center font-medium transition-all ${outputFormat === 'wav' ? 'bg-brand-600 text-white ring-2 ring-brand-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>WAV</button>
                    </div>
                </div>

                {outputFormat === 'mp3' && (
                    <div>
                        <h3 className="font-semibold text-white mb-2">Audio Quality</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setQualityOption('original')} className={`p-4 rounded-lg text-center font-medium transition-all ${qualityOption === 'original' ? 'bg-brand-600 text-white ring-2 ring-brand-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>Original</button>
                            <button onClick={() => setQualityOption('compress')} className={`p-4 rounded-lg text-center font-medium transition-all ${qualityOption === 'compress' ? 'bg-brand-600 text-white ring-2 ring-brand-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>Compress</button>
                        </div>
                    </div>
                )}
                
                {outputFormat === 'mp3' && qualityOption === 'compress' && (
                    <div>
                        <h3 className="font-semibold text-white mb-2">Target Size: <span className="text-brand-400 font-bold">{targetSize} MB</span></h3>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={targetSize}
                            onChange={(e) => setTargetSize(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                    </div>
                )}

                <div className="pt-4">
                    {status === 'converting' ? (
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-4">
                              <Spinner />
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-4 mb-2">
                              <div className="bg-brand-600 h-4 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                          </div>
                          <p className="text-sm text-slate-300 font-medium">Converting... {progress}%</p>
                        </div>
                    ) : (
                        <button 
                            onClick={() => {
                              console.log('Convert button clicked!');
                              handleConvert();
                            }}
                            disabled={!file || status === 'converting'}
                            className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors text-xl shadow-lg hover:shadow-xl"
                        >
                            🎵 Convert to {outputFormat.toUpperCase()}
                        </button>
                    )}
                     {status === 'error' && <p className="text-red-400 text-center mt-4">An error occurred during conversion.</p>}
                </div>
            </div>
            )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
