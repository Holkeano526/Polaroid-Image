
import React, { useState, useRef } from 'react';
import { PolaroidCard } from './components/PolaroidCard';
import { generatePolaroidImage, editToPolaroid, ImagePart } from './services/geminiService';
import { GenerationStatus, GenerationState, PolaroidImage } from './types';
import { Camera, Image as ImageIcon, Sparkles, Trash2, History, RotateCcw, UserPlus, Users, TreePalm, Monitor, Check, PlusCircle, X, Download } from 'lucide-react';
import { toPng } from 'html-to-image';

type BackgroundType = 'original' | 'black' | 'island' | 'custom';

const App: React.FC = () => {
  const getLimaDate = () => {
    return new Intl.DateTimeFormat('es-PE', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric', 
      timeZone: 'America/Lima' 
    }).format(new Date());
  };

  const [prompt, setPrompt] = useState("");
  const [caption, setCaption] = useState(getLimaDate());
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('original');
  const [hasChristmasHat, setHasChristmasHat] = useState(false);
  const [hasBlackGlasses, setHasBlackGlasses] = useState(false);
  const [hasRedCap, setHasRedCap] = useState(false);
  const [generation, setGeneration] = useState<GenerationState>({ status: GenerationStatus.IDLE });
  const [history, setHistory] = useState<PolaroidImage[]>([]);
  
  const [files, setFiles] = useState<({data: string, type: string} | null)[]>([null, null]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const polaroidRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newFiles = [...files];
        newFiles[index] = {
          data: reader.result as string,
          type: file.type
        };
        setFiles(newFiles);
      };
      reader.readAsDataURL(file);
    }
  };

  const addPersonSlot = () => {
    if (files.length < 5) {
      setFiles([...files, null]);
    }
  };

  const removePersonSlot = (index: number) => {
    if (files.length > 2) {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
    } else {
      clearFile(index);
    }
  };

  const getBackgroundDescription = () => {
    switch(backgroundType) {
      case 'black': return "A solid, deep black studio-style backdrop.";
      case 'island': return "A beautiful paradise island with turquoise water and palm trees in the background.";
      case 'custom': return prompt || "Original soft white curtains.";
      default: return "Soft white curtains backdrop.";
    }
  };

  const getAccessories = () => {
    const acc = [];
    if (hasChristmasHat) acc.push("a festive red and white Christmas hat");
    if (hasBlackGlasses) acc.push("stylish black sunglasses");
    if (hasRedCap) acc.push("a casual red baseball cap");
    return acc;
  };

  const handleGenerate = async () => {
    const activeFiles = files.filter(f => f !== null) as {data: string, type: string}[];
    setGeneration({ status: GenerationStatus.LOADING });

    try {
      let imageUrl: string;
      const bgDesc = getBackgroundDescription();
      const accList = getAccessories();
      
      if (activeFiles.length > 0) {
        const imageParts: ImagePart[] = activeFiles.map(f => ({
          data: f.data,
          mimeType: f.type
        }));
        imageUrl = await editToPolaroid(imageParts, prompt, bgDesc, accList);
      } else {
        imageUrl = await generatePolaroidImage(prompt, bgDesc, accList);
      }

      const newMoment: PolaroidImage = {
        id: Date.now().toString(),
        url: imageUrl,
        caption: caption || "Captured Moment",
        timestamp: Date.now(),
      };

      setGeneration({ 
        status: GenerationStatus.SUCCESS, 
        currentImage: imageUrl 
      });
      
      setHistory(prev => [newMoment, ...prev]);
    } catch (error: any) {
      console.error("Generation failed:", error);
      setGeneration({ 
        status: GenerationStatus.ERROR, 
        error: error.message || "An unexpected error occurred. Please try again." 
      });
    }
  };

  const handleDownload = async () => {
    if (!polaroidRef.current) return;
    
    try {
      // Create a high-quality capture of the DOM element
      const dataUrl = await toPng(polaroidRef.current, { 
        quality: 1.0,
        pixelRatio: 2, // Better resolution
        backgroundColor: 'transparent'
      });
      
      const link = document.createElement('a');
      link.download = `polaroid-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture Polaroid:', err);
    }
  };

  const clearFile = (index: number) => {
    const newFiles = [...files];
    newFiles[index] = null;
    setFiles(newFiles);
    const ref = fileInputRefs.current[index];
    if (ref) ref.value = '';
  };

  const handleClearAll = () => {
    setFiles([null, null]);
    setPrompt("");
    setCaption(getLimaDate());
    setBackgroundType('original');
    setHasChristmasHat(false);
    setHasBlackGlasses(false);
    setHasRedCap(false);
    setGeneration({ status: GenerationStatus.IDLE });
    fileInputRefs.current.forEach(ref => { if(ref) ref.value = ''; });
  };

  const hasAnyFiles = files.some(f => f !== null);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-800">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
              <Camera size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">InstantMoments</h1>
          </div>
          <button 
            onClick={handleClearAll}
            className="text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" />
                  Group Studio
                </h2>
                <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {files.length} People Max
                </span>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map((file, idx) => (
                    <div key={idx} className="space-y-1 relative">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block px-1">Person {idx + 1}</label>
                      <div 
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        className={`relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                          file ? 'border-slate-300' : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                        }`}
                      >
                        {file ? (
                          <>
                            <img src={file.data} alt={`Person ${idx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute top-1 right-1 flex gap-1">
                               <button 
                                onClick={(e) => { e.stopPropagation(); clearFile(idx); }}
                                className="p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <UserPlus size={20} className="text-slate-300 mb-1" />
                            <span className="text-[9px] font-medium text-slate-400">Add Photo</span>
                          </>
                        )}
                      </div>
                      {files.length > 2 && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); removePersonSlot(idx); }}
                           className="absolute -top-1 -right-1 p-1 bg-red-100 text-red-500 rounded-full hover:bg-red-200 shadow-sm border border-white"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                      <input 
                        type="file" 
                        ref={el => fileInputRefs.current[idx] = el} 
                        onChange={handleFileChange(idx)} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                  ))}
                  
                  {files.length < 5 && (
                    <button 
                      onClick={addPersonSlot}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-slate-400 transition-all text-slate-400"
                    >
                      <PlusCircle size={24} />
                      <span className="text-[9px] font-bold mt-1 uppercase">Add More</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Background</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'original', label: 'Default', icon: <ImageIcon size={14} /> },
                      { id: 'black', label: 'Black', icon: <div className="w-3 h-3 bg-black rounded-full" /> },
                      { id: 'island', label: 'Island', icon: <TreePalm size={14} /> },
                      { id: 'custom', label: 'Custom', icon: <Monitor size={14} /> },
                    ].map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setBackgroundType(bg.id as BackgroundType)}
                        className={`flex items-center justify-center gap-2 py-2 px-1 border rounded-lg text-xs font-medium transition-all ${
                          backgroundType === bg.id 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {bg.icon}
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Accessories (For All)</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${hasChristmasHat ? 'bg-red-500 border-red-500' : 'border-slate-300 group-hover:border-slate-400'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={hasChristmasHat} 
                          onChange={() => setHasChristmasHat(!hasChristmasHat)} 
                        />
                        {hasChristmasHat && <Check size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-slate-600">🎄 Christmas Hat</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${hasRedCap ? 'bg-red-600 border-red-600' : 'border-slate-300 group-hover:border-slate-400'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={hasRedCap} 
                          onChange={() => setHasRedCap(!hasRedCap)} 
                        />
                        {hasRedCap && <Check size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-slate-600">🧢 Red Cap</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${hasBlackGlasses ? 'bg-black border-black' : 'border-slate-300 group-hover:border-slate-400'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={hasBlackGlasses} 
                          onChange={() => setHasBlackGlasses(!hasBlackGlasses)} 
                        />
                        {hasBlackGlasses && <Check size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-slate-600">🕶️ Black Glasses</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {backgroundType === 'custom' ? "Custom Background Description" : "Extra Moment Details (Optional)"}
                  </label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={backgroundType === 'custom' ? "Describe the custom background you want..." : "Add details like lighting or atmosphere..."}
                    className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none transition-all resize-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Handwritten Caption</label>
                  <input 
                    type="text" 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="E.g., Winter 2024"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none transition-all text-sm font-pen text-xl"
                  />
                </div>

                {generation.status === GenerationStatus.ERROR && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-100">
                    {generation.error}
                  </div>
                )}

                <button 
                  onClick={handleGenerate}
                  disabled={generation.status === GenerationStatus.LOADING}
                  className={`w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                    generation.status === GenerationStatus.LOADING 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-black text-white hover:bg-slate-900 shadow-lg shadow-black/10 active:scale-[0.98]'
                  }`}
                >
                  {generation.status === GenerationStatus.LOADING ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                      Developing {files.filter(f=>!!f).length > 0 ? files.filter(f=>!!f).length : 2} People...
                    </>
                  ) : (
                    <>
                      {hasAnyFiles ? <Users size={20} /> : <Sparkles size={20} />}
                      {hasAnyFiles ? 'Combine into Polaroid' : 'Generate Group Moment'}
                    </>
                  )}
                </button>
              </div>
            </section>

            <section className="hidden lg:block bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
               <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <History size={16} />
                Recent History
              </h3>
              {history.length === 0 ? (
                <p className="text-slate-400 text-sm italic">Developed moments will appear here.</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {history.slice(0, 5).map((img) => (
                    <div key={img.id} className="flex-shrink-0 w-20 h-24 bg-white p-1 border border-slate-100 shadow-sm rounded-sm">
                      <img src={img.url} className="w-full h-full object-cover grayscale-[10%]" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-slate-50 rounded-3xl p-8 lg:p-12 min-h-[600px] flex items-center justify-center border-2 border-dashed border-slate-200">
              {generation.status === GenerationStatus.IDLE && history.length === 0 ? (
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 text-slate-300">
                    <Users size={32} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Group Shot Ready</h3>
                  <p className="text-slate-500 text-sm">Upload 2 to 5 people to capture a nostalgic instant memory together.</p>
                </div>
              ) : (
                <div className="w-full max-w-md flex flex-col items-center">
                  <div className="w-full transition-all duration-1000 transform" ref={polaroidRef}>
                    <PolaroidCard 
                      imageUrl={generation.currentImage || history[0]?.url || ''} 
                      caption={generation.status === GenerationStatus.LOADING ? "Developing..." : (history[0]?.caption || caption)} 
                      isDeveloping={generation.status === GenerationStatus.LOADING}
                      className="rotate-[-2deg]"
                    />
                  </div>
                  
                  {generation.status === GenerationStatus.SUCCESS && (
                    <div className="mt-12 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <button 
                        onClick={handleDownload}
                        className="px-6 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <Download size={16} />
                        Download
                      </button>
                      <button 
                        onClick={() => {
                          setGeneration({ status: GenerationStatus.IDLE });
                        }}
                        className="px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-black transition-colors shadow-sm flex items-center gap-2"
                      >
                        <RotateCcw size={14} />
                        New Shoot
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;