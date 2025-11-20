import React, { useState, useCallback, useRef } from 'react';
import { AppMode, GeneratedImage, MockupPreset, AspectRatio } from './types';
import { generateMockup, generateImage } from './services/geminiService';
import { Spinner } from './components/Spinner';

const MOCKUP_PRESETS: MockupPreset[] = [
  { id: 'mug', name: 'Ceramic Mug', icon: '☕', promptTemplate: 'Place this logo realistically on a clean white ceramic coffee mug sitting on a wooden table. Professional product photography.' },
  { id: 'tshirt', name: 'T-Shirt', icon: '👕', promptTemplate: 'A high quality photo of a folded black cotton t-shirt with this design printed on the center chest. Studio lighting.' },
  { id: 'hoodie', name: 'Hoodie', icon: '🧥', promptTemplate: 'A model wearing a grey streetwear hoodie featuring this logo prominently on the front. Urban setting.' },
  { id: 'tote', name: 'Tote Bag', icon: '👜', promptTemplate: 'A canvas tote bag hanging on a coat rack with this logo printed on the side. Natural lighting.' },
  { id: 'sticker', name: 'Laptop Sticker', icon: '💻', promptTemplate: 'A die-cut vinyl sticker of this image stuck on a silver laptop cover. Close up macro shot.' },
  { id: 'sign', name: 'Neon Sign', icon: '✨', promptTemplate: 'A glowing neon sign on a brick wall in the shape and style of this image. Night time atmosphere.' },
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.MOCKUP);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('image/png');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('mug');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Extract the actual base64 data part for the API if needed, 
        // but for display and generic usage, keeping the full data URI is often easier.
        // The API service will parse it.
        // However, the Gemini API expects raw base64 without the prefix for `inlineData`.
        // We will handle stripping in the service call or here. 
        // Let's store the full string for display, and strip for service.
        setUploadedImage(base64String);
        setUploadedMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleMockupGenerate = async () => {
    if (!uploadedImage) return;
    
    setIsGenerating(true);
    try {
      // Strip data:image/xyz;base64, prefix
      const base64Data = uploadedImage.split(',')[1];
      
      // Determine final prompt: custom or preset?
      // If user typed something, append it or use it. 
      // Let's assume if user typed in the box, they want to override or augment.
      // For simplicity: if prompt is empty, use preset. If not empty, use prompt + " utilizing the input image".
      let finalPrompt = prompt.trim();
      if (!finalPrompt) {
         const preset = MOCKUP_PRESETS.find(p => p.id === selectedPreset);
         finalPrompt = preset ? preset.promptTemplate : "Place this design on a product.";
      }

      const resultImage = await generateMockup(base64Data, uploadedMimeType, finalPrompt);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: resultImage,
        prompt: finalPrompt,
        createdAt: Date.now(),
        type: 'mockup'
      };
      
      setGallery(prev => [newImage, ...prev]);
    } catch (err) {
      console.error(err);
      alert("Failed to generate mockup. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const resultImage = await generateImage(prompt, selectedAspectRatio);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: resultImage,
        prompt: prompt,
        createdAt: Date.now(),
        type: 'generation'
      };
      
      setGallery(prev => [newImage, ...prev]);
    } catch (err) {
      console.error(err);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `mockup-ai-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render Helpers ---

  const renderMockupPanel = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer
          ${uploadedImage ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800'}`}
        onClick={triggerFileUpload}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/png, image/jpeg, image/webp" 
          className="hidden" 
        />
        
        {uploadedImage ? (
          <div className="flex flex-col items-center">
            <img src={uploadedImage} alt="Uploaded" className="h-32 object-contain mb-4 rounded shadow-lg" />
            <p className="text-indigo-300 font-medium">Logo Uploaded! Click to change.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-400">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">Upload your Logo / Design</p>
            <p className="text-sm mt-2 opacity-70">PNG, JPG supported</p>
          </div>
        )}
      </div>

      {/* Presets */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Select Product Preset</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MOCKUP_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => {
                setSelectedPreset(preset.id);
                setPrompt(''); // Clear custom prompt when preset is clicked to encourage preset usage
              }}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3
                ${selectedPreset === preset.id 
                  ? 'border-indigo-500 bg-indigo-500/20 text-white' 
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800'}`}
            >
              <span className="text-2xl">{preset.icon}</span>
              <span className="font-medium text-sm">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt Override */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Or Describe Custom Edit <span className="text-slate-500 text-xs font-normal">(Overrides preset)</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., 'Add a vintage filter to this image' or 'Place this logo on a red sports car'"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none h-24"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleMockupGenerate}
        disabled={!uploadedImage || isGenerating}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
          ${!uploadedImage || isGenerating 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25'}`}
      >
        {isGenerating ? (
          <>
            <Spinner />
            Processing Mockup...
          </>
        ) : (
          <>
            <span>✨</span> Generate Mockup
          </>
        )}
      </button>
    </div>
  );

  const renderImageGenPanel = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Describe the Image</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., 'A futuristic city skyline at sunset with flying cars, cyberpunk style'"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none h-32 text-base"
        />
      </div>

      {/* Aspect Ratio Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Aspect Ratio</label>
        <div className="flex flex-wrap gap-2">
          {Object.values(AspectRatio).map((ratio) => (
            <button
              key={ratio}
              onClick={() => setSelectedAspectRatio(ratio)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all
                ${selectedAspectRatio === ratio
                  ? 'border-pink-500 bg-pink-500/20 text-white'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleImageGenerate}
        disabled={!prompt.trim() || isGenerating}
        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
          ${!prompt.trim() || isGenerating 
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-500/25'}`}
      >
        {isGenerating ? (
          <>
            <Spinner />
            Creating Image...
          </>
        ) : (
          <>
            <span>🎨</span> Generate Image
          </>
        )}
      </button>
      
      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <h4 className="text-slate-300 text-sm font-semibold mb-2">Powered by Imagen 4</h4>
        <p className="text-slate-400 text-xs">
          Create photorealistic assets, backgrounds for your mockups, or just explore ideas. 
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      
      {/* Sidebar / Control Panel */}
      <div className="w-full md:w-[450px] bg-slate-900 border-r border-slate-800 flex flex-col h-auto md:h-screen overflow-y-auto shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-xl">
              M
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">MockupAI Studio</h1>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => { setMode(AppMode.MOCKUP); setPrompt(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === AppMode.MOCKUP ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Logo Mockup
            </button>
            <button
              onClick={() => { setMode(AppMode.IMAGE_GEN); setPrompt(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === AppMode.IMAGE_GEN ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Image Gen
            </button>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="p-6 flex-1">
          {mode === AppMode.MOCKUP ? renderMockupPanel() : renderImageGenPanel()}
        </div>
      </div>

      {/* Main Gallery Area */}
      <div className="flex-1 bg-[#0f172a] h-screen overflow-y-auto relative">
        <header className="p-6 md:p-8 flex justify-between items-center max-w-7xl mx-auto w-full">
          <h2 className="text-2xl font-semibold text-slate-200">Gallery</h2>
          <span className="text-slate-500 text-sm">{gallery.length} generated items</span>
        </header>

        <div className="p-6 md:p-8 pt-0 max-w-7xl mx-auto w-full">
          {gallery.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
              <div className="w-20 h-20 mb-4 rounded-full bg-slate-800 flex items-center justify-center text-4xl opacity-50">
                🖼️
              </div>
              <p className="text-lg font-medium">No images yet</p>
              <p className="text-sm mt-2 opacity-70 max-w-xs text-center">
                Upload a logo and select a preset on the left to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {gallery.map((item) => (
                <div key={item.id} className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl transition-all hover:border-slate-600 hover:shadow-2xl animate-fade-in-up">
                  
                  {/* Image Container */}
                  <div className="aspect-square w-full overflow-hidden bg-slate-950 relative">
                     <img 
                      src={item.url} 
                      alt={item.prompt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                      <button 
                        onClick={() => downloadImage(item.url, item.id)}
                        className="p-3 bg-white text-slate-900 rounded-full hover:bg-indigo-50 transition-colors transform hover:scale-110 shadow-lg"
                        title="Download"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded 
                        ${item.type === 'mockup' ? 'bg-indigo-900/50 text-indigo-300' : 'bg-pink-900/50 text-pink-300'}`}>
                        {item.type === 'mockup' ? 'Gemini Flash' : 'Imagen 4'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2" title={item.prompt}>
                      {item.prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Warning / Overlay if needed, but responsive handled by flex-col */}
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default App;