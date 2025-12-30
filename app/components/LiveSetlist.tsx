"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  ArrowLeft, Type, Moon, Sun, Music, Menu, X, Minus, Plus, Radio, 
  Play, Pause, ChevronsUp, ChevronsDown, FileText, Clock, Maximize2, Minimize2,
  ChevronLeft, ChevronRight
} from 'lucide-react';

// --- 1. MOTOR DE MÚSICA (Sin cambios, tu lógica es buena) ---
const NOTES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const transposeChord = (chord: string, amount: number) => {
  if (amount === 0) return chord;
  const regex = /^([A-G][#b]?)(.*)$/;
  const match = chord.match(regex);
  if (!match) return chord;
  const note = match[1];
  const suffix = match[2];
  const useFlats = note.includes("b") || note === "F" || amount < 0; 
  const list = useFlats ? NOTES_FLAT : NOTES_SHARP;
  let index = list.indexOf(note);
  if (index === -1) index = (useFlats ? NOTES_SHARP : NOTES_FLAT).indexOf(note);
  if (index === -1) return chord;
  let newIndex = (index + amount) % 12;
  if (newIndex < 0) newIndex += 12;
  return list[newIndex] + suffix;
};

const transposeLine = (line: string, amount: number) => {
  if (amount === 0) return line;
  return line.replace(/\b[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|2|4|5|6|7|9|11|13)*\d*(?:\/[A-G][#b]?)?\b/g, (match) => {
    if (["En", "La", "Tu", "Te", "A", "Con", "Por", "De", "Si", "Es", "Y", "O", "Lo", "Le", "Me"].includes(match)) return match;
    if (match.includes('/')) {
        const parts = match.split('/');
        return transposeChord(parts[0], amount) + '/' + transposeChord(parts[1], amount);
    }
    return transposeChord(match, amount);
  });
};

const isChordLineStrict = (line: string) => {
    const words = line.trim().split(/\s+/);
    if (words.length === 0) return false;
    if (line.trim().startsWith("//")) return false; 
    
    const chordRegex = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|2|4|5|6|7|9|11|13)*(\/[A-G][#b]?)?$/;
    const bannedWords = ["A", "En", "La", "Y", "O", "Tu", "Te", "Se", "Me", "Si", "No", "Es", "Un", "El", "Al", "Del", "Lo", "Le", "Con", "Por", "Sus", "Mis", "Las", "Los", "De", "Da", "Do", "Re", "Mi", "Fa", "Sol"];
    
    let chordCount = 0;
    words.forEach(w => {
        const cleanWord = w.replace(/[.,:;()]/g, '');
        if (chordRegex.test(cleanWord) && !bannedWords.includes(cleanWord)) chordCount++;
    });
    return chordCount > 0 && (chordCount / words.length) >= 0.5;
};

const getProp = (item: any, key: string) => {
    if (!item) return '';
    if (item[key] !== undefined && item[key] !== null) return item[key];
    if (item.song && item.song[key] !== undefined) return item.song[key];
    return '';
};

// --- 2. COMPONENTE VISUAL MEJORADO ---
interface LiveSetlistProps {
  setlistId: string;
  onBack: () => void;
  initialItems?: any[];
}

export default function LiveSetlist({ setlistId, onBack, initialItems = [] }: LiveSetlistProps) {
  const [items, setItems] = useState<any[]>(initialItems);
  const [setlistName, setSetlistName] = useState("En Vivo");
  const [selectedItem, setSelectedItem] = useState<any | null>(items.length > 0 ? items[0] : null);
  
  // Estados UI
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [paperMode, setPaperMode] = useState(false);
  const [transposeStep, setTransposeStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Reloj y Scroll
  const [currentTime, setCurrentTime] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastFrameTime = useRef<number>(0);
  const scrollAccumulator = useRef(0);
  const animationFrameId = useRef<number>(0);

  // Índices para navegación
  const currentIndex = useMemo(() => items.findIndex(i => i.uniqueId === selectedItem?.uniqueId), [items, selectedItem]);

  // --- EFECTOS ---
  
  // 1. Cargar datos
  useEffect(() => {
    const fetchData = async () => {
        const { data: setlist } = await supabase.from('setlists').select('name').eq('id', setlistId).single();
        if (setlist) setSetlistName(setlist.name);
        
        if (initialItems.length === 0) {
            const { data } = await supabase.from('setlist_items')
                .select(`*, song:songs(*)`)
                .eq('setlist_id', setlistId)
                .order('position', { ascending: true });
            if (data) {
                setItems(data);
                if (!selectedItem && data.length > 0) setSelectedItem(data[0]);
            }
        }
    };
    fetchData();
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) setSidebarOpen(true);
  }, [setlistId]);

  // 2. Reloj
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Atajos de Teclado (Flechas para cambiar canción)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') {
          if (document.fullscreenElement) document.exitFullscreen();
          else onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, items]);

  // 4. Auto-Scroll Motor
  useEffect(() => {
    const scroll = (timestamp: number) => {
        if (!isScrolling || !scrollContainerRef.current) return;
        if (lastFrameTime.current === 0) { lastFrameTime.current = timestamp; animationFrameId.current = requestAnimationFrame(scroll); return; }
        const deltaTime = timestamp - lastFrameTime.current;
        lastFrameTime.current = timestamp;
        const pixelsToMove = (30 * scrollSpeed * deltaTime) / 1000;
        scrollAccumulator.current += pixelsToMove;
        if (scrollAccumulator.current >= 1) {
            const move = Math.floor(scrollAccumulator.current);
            scrollContainerRef.current.scrollBy(0, move);
            scrollAccumulator.current -= move;
        }
        animationFrameId.current = requestAnimationFrame(scroll);
    };
    if (isScrolling) { lastFrameTime.current = 0; scrollAccumulator.current = 0; animationFrameId.current = requestAnimationFrame(scroll); } 
    else { cancelAnimationFrame(animationFrameId.current); }
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [isScrolling, scrollSpeed]);

  // --- ACCIONES ---

  const handleSelectItem = (item: any) => {
      setSelectedItem(item);
      setTransposeStep(0);
      setIsScrolling(false);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const goNext = () => { if (currentIndex < items.length - 1) handleSelectItem(items[currentIndex + 1]); };
  const goPrev = () => { if (currentIndex > 0) handleSelectItem(items[currentIndex - 1]); };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // --- PROCESAMIENTO DE PÁGINAS ---
  const pages = useMemo(() => {
    const content = getProp(selectedItem, 'content');
    if (selectedItem?.type !== 'song' || !content) return [];
    
    const lines = content.split('\n');
    const sections: { title: string, body: string[] }[] = [];
    let currentSection = { title: '', body: [] as string[] };
    const headerRegex = /^\[?((?:INTRO|VERSO|CORO|PUENTE|CHORUS|VERSE|BRIDGE|FINAL|OUTRO|SOLO|INSTRUMENTAL|PRE-CORO|INTERLUDIO|RAP).*?)\]?:?$/i;

    lines.forEach((line: string) => {
      const trimmed = line.trim();
      const match = trimmed.match(headerRegex);
      if (match) {
        if (currentSection.title || currentSection.body.length > 0) sections.push(currentSection);
        currentSection = { title: match[1].toUpperCase(), body: [] };
      } else {
        currentSection.body.push(line);
      }
    });
    if (currentSection.title || currentSection.body.length > 0) sections.push(currentSection);

    const pagesList: typeof sections[] = [];
    let currentPage: typeof sections = [];
    let currentHeight = 0;
    const PAGE_LIMIT = 32;

    sections.forEach(section => {
      const h = 2 + section.body.length;
      if (currentHeight + h > PAGE_LIMIT && currentPage.length > 0) {
        pagesList.push(currentPage); currentPage = []; currentHeight = 0;
      }
      currentPage.push(section); currentHeight += h;
    });
    if (currentPage.length > 0) pagesList.push(currentPage);
    
    return pagesList;
  }, [selectedItem]);

  const theme = paperMode ? {
    bgApp: 'bg-zinc-100', sidebar: 'bg-white border-zinc-200 text-zinc-600', sheetBg: 'bg-white shadow-xl text-zinc-900',
    chord: 'text-blue-600', sectionTitle: 'bg-zinc-100 text-zinc-800 border-zinc-300', activeItem: 'bg-blue-50 text-blue-700 border-l-blue-600',
  } : {
    bgApp: 'bg-black', sidebar: 'bg-zinc-950 border-zinc-800 text-zinc-400', sheetBg: 'bg-zinc-900 border border-zinc-800 text-zinc-100',
    chord: 'text-yellow-400', sectionTitle: 'bg-zinc-800 text-zinc-300 border-zinc-700', activeItem: 'bg-zinc-800 text-white border-l-blue-500',
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col h-[100dvh] w-full overflow-hidden ${theme.bgApp} transition-colors duration-300 font-sans`}>
      <div className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}/>

      {/* --- ÁREA PRINCIPAL (SIDEBAR + VISOR) --- */}
      <div className="flex-1 flex overflow-hidden relative">
          
          {/* SIDEBAR */}
          <aside className={`absolute top-0 left-0 h-full z-50 flex flex-col border-r transition-transform duration-300 w-[85%] max-w-sm lg:relative lg:w-80 lg:translate-x-0 ${theme.sidebar} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 border-b border-current/10 flex items-center justify-between shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium hover:opacity-70"><ArrowLeft size={18} /> Salir</button>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2"><X size={20}/></button>
            </div>
            <div className="p-5 border-b border-current/10 shrink-0">
                <h2 className="font-black text-2xl leading-tight truncate mb-1">{setlistName}</h2>
                <div className="text-xs opacity-60 font-bold uppercase tracking-wider">{items.length} canciones</div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
                {items.map((item, index) => (
                    <div key={item.uniqueId || index} onClick={() => handleSelectItem(item)} className={`px-4 py-3.5 cursor-pointer flex gap-3 items-center border-l-4 border-transparent hover:bg-current/5 transition-all ${selectedItem?.uniqueId === item.uniqueId ? theme.activeItem : ''}`}>
                        <span className="font-mono font-bold text-xs opacity-40 w-5 text-center">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold truncate text-sm leading-snug">{item.title_override || getProp(item, 'title')}</div>
                            {item.type === 'song' && <div className="text-xs opacity-60 mt-0.5 font-medium">{item.key_override || getProp(item, 'default_key') || '?'} • {getProp(item, 'bpm')} bpm</div>}
                        </div>
                    </div>
                ))}
            </div>
          </aside>

          {/* VISOR CENTRAL */}
          <main className="flex-1 flex flex-col relative h-full w-full">
            
            {/* CONTROLES FLOTANTES SUPERIORES */}
            <div className="absolute top-4 right-4 z-40 flex items-center gap-2 print:hidden pointer-events-none">
                <div className="flex gap-2 pointer-events-auto">
                    {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-3 rounded-full bg-indigo-600 text-white shadow-lg"><Menu size={20}/></button>}
                    
                    {/* RELOJ */}
                    <div className="flex items-center gap-2 bg-zinc-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-xl border border-white/10">
                        <Clock size={14} className="text-indigo-400"/>
                        <span className="font-mono font-bold">{currentTime}</span>
                    </div>

                    {selectedItem?.type === 'song' && (
                        <>
                            {/* CONTROL DE SCROLL */}
                            <div className="flex items-center gap-1 bg-zinc-900/95 backdrop-blur-md text-white p-1.5 rounded-xl shadow-xl border border-white/10">
                                <button onClick={() => setIsScrolling(!isScrolling)} className={`p-2 rounded-lg ${isScrolling ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10'}`}>{isScrolling ? <Pause size={18}/> : <Play size={18}/>}</button>
                                <div className="flex flex-col gap-0.5 px-1 border-l border-white/10 h-8 justify-center min-w-[2rem]">
                                    <button onClick={() => setScrollSpeed(s => Math.min(5, s + 0.5))} className="hover:text-blue-400 h-3 flex items-center justify-center"><ChevronsUp size={12}/></button>
                                    <span className="text-[9px] font-bold font-mono text-center select-none">{scrollSpeed}x</span>
                                    <button onClick={() => setScrollSpeed(s => Math.max(0.5, s - 0.5))} className="hover:text-blue-400 h-3 flex items-center justify-center"><ChevronsDown size={12}/></button>
                                </div>
                            </div>
                            
                            {/* TRANSPOSICIÓN Y VISTA */}
                            <div className="hidden md:flex items-center gap-1 bg-zinc-900/95 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl text-white">
                                <div className="flex items-center bg-white/10 rounded-lg mx-1">
                                    <button onClick={() => setTransposeStep(s => s - 1)} className="p-2 hover:bg-white/10 rounded-l-lg"><Minus size={14}/></button>
                                    <span className={`w-8 text-center text-xs font-bold ${transposeStep !== 0 ? 'text-yellow-400' : 'text-gray-300'}`}>{transposeStep > 0 ? `+${transposeStep}` : transposeStep}</span>
                                    <button onClick={() => setTransposeStep(s => s + 1)} className="p-2 hover:bg-white/10 rounded-r-lg"><Plus size={14}/></button>
                                </div>
                                <div className="w-px h-5 bg-white/20 mx-1"></div>
                                <button onClick={() => setPaperMode(!paperMode)} className="p-2 rounded-lg hover:bg-white/10">{paperMode ? <Moon size={18}/> : <Sun size={18}/>}</button>
                                <div className="flex items-center gap-1 ml-1">
                                    <button onClick={() => setFontSize(s => Math.max(12, s - 2))} className="p-2 rounded-lg hover:bg-white/10"><Type size={14}/></button>
                                    <button onClick={() => setFontSize(s => Math.min(60, s + 2))} className="p-2 rounded-lg hover:bg-white/10"><Type size={20}/></button>
                                </div>
                            </div>
                        </>
                    )}
                    
                    <button onClick={toggleFullscreen} className="p-3 bg-zinc-900/95 text-white rounded-xl shadow-xl border border-white/10 hover:bg-zinc-800">
                        {isFullscreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}
                    </button>
                </div>
            </div>

            {/* CONTENIDO SCROLLEABLE */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth pb-24">
                {selectedItem ? (
                    <div className={`min-h-full flex flex-col items-center p-4 md:p-10 ${selectedItem.type === 'block' ? 'justify-center' : ''}`}>
                        {selectedItem.type === 'song' ? (
                           pages.length > 0 ? pages.map((pageSections, pIdx) => (
                                <div key={pIdx} className={`w-full max-w-4xl mb-8 rounded-sm flex flex-col shrink-0 transition-colors duration-300 ${theme.sheetBg} ${typeof window !== 'undefined' && window.innerWidth < 768 ? 'min-h-[85vh]' : 'aspect-[1/1.414]'} p-6 md:p-14`} style={{ fontSize: `${fontSize}px` }}>
                                    
                                    {pIdx === 0 && (
                                        <div className={`mb-8 border-b-2 ${paperMode ? 'border-zinc-900' : 'border-zinc-700'} pb-6 flex justify-between items-end`}>
                                            <div className="max-w-[75%]">
                                                <h1 className="text-3xl md:text-5xl font-black uppercase leading-none tracking-tight">
                                                    {selectedItem.title_override || getProp(selectedItem, 'title')}
                                                </h1>
                                                <p className="text-sm md:text-base mt-2 font-bold uppercase opacity-60 tracking-wide">
                                                    {getProp(selectedItem, 'artist') || 'Autor desconocido'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-4xl md:text-5xl font-black ${transposeStep !== 0 ? 'text-yellow-500' : ''}`}>
                                                    {transposeChord(selectedItem.key_override || getProp(selectedItem, 'default_key') || getProp(selectedItem, 'key') || 'C', transposeStep)}
                                                </div>
                                                <div className="text-xs font-bold uppercase mt-1 opacity-60 tracking-widest">
                                                    {getProp(selectedItem, 'bpm')} BPM
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex-1 font-mono whitespace-pre-wrap leading-relaxed">
                                        {pageSections.map((section, idx) => (
                                            <div key={idx} className="mb-8 break-inside-avoid">
                                                {section.title && <div className="mb-3"><span className={`inline-block px-3 py-1 rounded-md text-[0.6em] font-black uppercase tracking-widest border ${theme.sectionTitle}`}>{section.title}</span></div>}
                                                <div className="pl-1">
                                                    {section.body.map((line, lIdx) => {
                                                        const isChord = isChordLineStrict(line);
                                                        const content = isChord ? transposeLine(line, transposeStep) : line;
                                                        return (
                                                            <div key={lIdx} className="min-h-[1.5em]">
                                                                {isChord ? <span className={`font-bold ${theme.chord}`}>{content}</span> : <span className="opacity-90">{content}</span>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`mt-auto pt-4 border-t flex justify-between text-[10px] uppercase font-bold tracking-widest opacity-30 ${paperMode ? 'border-black' : 'border-white'}`}><span>SetlistPro Live</span><span>{pIdx + 1} / {pages.length}</span></div>
                                </div>
                           )) : <div className="text-center opacity-50 mt-20"><FileText size={48} className="mx-auto mb-4"/><p>Sin contenido lírico</p></div>
                        ) : (
                           /* VISTA DE BLOQUE */
                           <div className="text-center max-w-3xl animate-in zoom-in duration-500">
                              <h1 className="text-5xl md:text-8xl font-black italic text-white drop-shadow-2xl mb-8 leading-tight">
                                  {selectedItem.title_override || getProp(selectedItem, 'title')}
                              </h1>
                              <div className="w-32 h-2 bg-indigo-500 mx-auto rounded-full"></div>
                              <p className="mt-8 text-2xl opacity-50 font-medium">Siguiente: {items[currentIndex + 1]?.title || items[currentIndex + 1]?.song?.title || 'Fin'}</p>
                           </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-6">
                        <Music size={80} className="opacity-20 animate-pulse"/>
                        <p className="text-xl font-medium">Cargando evento...</p>
                    </div>
                )}
            </div>
          </main>
      </div>

      {/* --- NUEVA BARRA DE NAVEGACIÓN INFERIOR (STAGE FOOTER) --- */}
      <div className={`p-3 shrink-0 border-t z-50 flex items-center gap-3 ${paperMode ? 'bg-white border-zinc-200' : 'bg-black border-zinc-800'}`}>
         <button 
            onClick={goPrev} 
            disabled={currentIndex === 0}
            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg active:scale-95 transition-all ${paperMode ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-30' : 'bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-30'}`}
         >
             <ChevronLeft size={24}/> <span className="hidden sm:inline">Anterior</span>
         </button>
         
         <div className="px-4 text-center hidden sm:block">
             <div className={`text-xs font-bold uppercase tracking-widest ${paperMode ? 'text-gray-400' : 'text-zinc-500'}`}>Canción actual</div>
             <div className={`font-mono text-xl font-black ${paperMode ? 'text-gray-900' : 'text-white'}`}>{currentIndex + 1} <span className="text-base opacity-40">/ {items.length}</span></div>
         </div>

         <button 
            onClick={goNext} 
            disabled={currentIndex === items.length - 1}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
         >
             <span className="hidden sm:inline">Siguiente</span> <ChevronRight size={24}/>
         </button>
      </div>
    </div>
  );
}