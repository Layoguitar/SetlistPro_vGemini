"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Wifi, Type, Moon, FileText, Music, Menu, X, Minus, Plus, Radio, Zap, Play, Pause, ChevronsUp, ChevronsDown } from 'lucide-react';
import type { SetlistItem } from '@/types/database';

interface LiveSetlistProps {
  setlistId: string;
  onBack: () => void;
}

// --- MOTOR DE TRANSPOSICIÓN ---
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

// --- DETECTOR INTELIGENTE ---
const isChordLineStrict = (line: string) => {
    const words = line.trim().split(/\s+/);
    if (words.length === 0) return false;
    if (line.trim().startsWith("//")) return false;

    const chordRegex = /^[A-G][#b]?(m|maj|dim|aug|sus|add|2|4|5|6|7|9|11|13)*(\/[A-G][#b]?)?$/;
    const bannedWords = ["A", "En", "La", "Y", "O", "Tu", "Te", "Se", "Me", "Si", "No", "Es", "Un", "El", "Al", "Del", "Lo", "Le", "Con", "Por", "Sus", "Mis", "Las", "Los", "De", "Da", "Do", "Re", "Mi", "Fa", "Sol"];
    
    let chordCount = 0;
    words.forEach(w => {
        const cleanWord = w.replace(/[.,:;()]/g, '');
        if (chordRegex.test(cleanWord) && !bannedWords.includes(cleanWord)) chordCount++;
    });

    return chordCount > 0 && (chordCount / words.length) >= 0.5;
};

const transposeLine = (line: string, amount: number) => {
  if (amount === 0) return line;
  return line.replace(/\b[A-G][#b]?(?:m|maj|dim|aug|sus|add|2|5|7|9)*\d*(?:\/[A-G][#b]?)?\b/g, (match) => {
    if (["En", "La", "Tu", "Te", "A", "Con", "Por", "De"].includes(match)) return match;
    if (match.includes('/')) {
        const parts = match.split('/');
        return transposeChord(parts[0], amount) + '/' + transposeChord(parts[1], amount);
    }
    return transposeChord(match, amount);
  });
};

export default function LiveSetlist({ setlistId, onBack }: LiveSetlistProps) {
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [setlistName, setSetlistName] = useState("");
  const [selectedItem, setSelectedItem] = useState<SetlistItem | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [isMobile, setIsMobile] = useState(true); 

  // Ajustes visuales
  const [fontSize, setFontSize] = useState(16);
  const [paperMode, setPaperMode] = useState(true); 
  const [transposeStep, setTransposeStep] = useState(0);

  // --- AUTO SCROLL INTELIGENTE ---
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAccumulator = useRef(0); 

  // --- SINCRONIZACIÓN ---
  const [role, setRole] = useState<'admin' | 'member' | null>(null);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const itemsRef = useRef<SetlistItem[]>([]); 

  useEffect(() => { itemsRef.current = items; }, [items]);

  // Lógica de Auto-Scroll (CORREGIDA)
  useEffect(() => {
    let animationFrameId = 0; // CORRECCIÓN 1: Inicializamos en 0

    const scroll = () => {
        if (scrollContainerRef.current && isScrolling) {
            scrollAccumulator.current += (scrollSpeed * 0.5); 
            
            if (scrollAccumulator.current >= 1) {
                const pixelsToMove = Math.floor(scrollAccumulator.current);
                scrollContainerRef.current.scrollTop += pixelsToMove;
                scrollAccumulator.current -= pixelsToMove; 
            }
            
            if (scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >= scrollContainerRef.current.scrollHeight - 2) {
                setIsScrolling(false);
            } else {
                animationFrameId = requestAnimationFrame(scroll);
            }
        }
    };

    if (isScrolling) {
        animationFrameId = requestAnimationFrame(scroll);
    } 
    // CORRECCIÓN 2: Quitamos el 'else { cancelAnimationFrame }' que daba error.
    // La limpieza se hace automáticamente en el return de abajo.

    return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isScrolling, scrollSpeed]);

  useEffect(() => {
     setIsScrolling(false);
     scrollAccumulator.current = 0;
     if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [selectedItem?.id]);


  useEffect(() => {
    const checkRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (profile) setRole(profile.role);
        }
    };
    checkRole();
  }, []);

  useEffect(() => {
    const channel = supabase.channel(`setlist_room_${setlistId}`, { config: { broadcast: { self: false } } });

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setlist_items', filter: `setlist_id=eq.${setlistId}` }, () => fetchData())
      .on('broadcast', { event: 'song_change' }, ({ payload }) => {
        if (syncEnabled) {
            const newItem = itemsRef.current.find(i => i.id === payload.itemId);
            if (newItem) {
                setSelectedItem(newItem);
                setTransposeStep(0);
            }
        }
      })
      .subscribe((status) => { if (status === 'SUBSCRIBED') setIsConnected(true); });

    return () => { supabase.removeChannel(channel); };
  }, [setlistId, syncEnabled]);

  const handleSelectItem = async (item: SetlistItem) => {
    setSelectedItem(item);
    setTransposeStep(0);
    if (isMobile) setSidebarOpen(false);

    if (role === 'admin') {
        await supabase.channel(`setlist_room_${setlistId}`).send({
            type: 'broadcast', event: 'song_change', payload: { itemId: item.id }
        });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; 
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    const { data: setlist } = await supabase.from('setlists').select('name').eq('id', setlistId).single();
    if (setlist) setSetlistName(setlist.name);
    const { data } = await supabase.from('setlist_items').select(`*, song:songs(*)`).eq('setlist_id', setlistId).order('position', { ascending: true });
    if (data) {
      setItems(data);
      if (!selectedItem && data.length > 0) setSelectedItem(data[0]);
    }
  };

  useEffect(() => { fetchData(); }, [setlistId]);

  const parseSongSections = (content: string) => {
    if (!content) return [];
    const lines = content.split('\n');
    const sections: { title: string, body: string[] }[] = [];
    let currentSection = { title: '', body: [] as string[] };
    const headers = ['INTRO', 'VERSO', 'CORO', 'PUENTE', 'CHORUS', 'VERSE', 'BRIDGE', 'FINAL', 'OUTRO', 'SOLO', 'INSTRUMENTAL', 'PRE-CORO', 'PRE CORO', 'INTERLUDIO', 'PUENTE 2', 'RAP'];

    lines.forEach(line => {
      const trimmed = line.trim().toUpperCase();
      const isHeader = trimmed.startsWith('[') || trimmed.endsWith(':') || headers.some(h => trimmed.includes(h) && trimmed.length < 25);
      if (isHeader) {
        if (currentSection.title || currentSection.body.length > 0) sections.push(currentSection);
        currentSection = { title: line.replace(/[\[\]:]/g, ''), body: [] };
      } else {
        currentSection.body.push(line);
      }
    });
    if (currentSection.title || currentSection.body.length > 0) sections.push(currentSection);
    return sections;
  };

  const paginateSections = (sections: { title: string, body: string[] }[]) => {
    const pages: { title: string, body: string[] }[][] = [];
    let currentPage: { title: string, body: string[] }[] = [];
    let currentHeight = 0; 
    const PAGE_HEIGHT_LIMIT = isMobile ? 32 : 45; 

    sections.forEach(section => {
      const sectionHeight = 3 + section.body.length;
      if (currentHeight + sectionHeight > PAGE_HEIGHT_LIMIT && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }
      currentPage.push(section);
      currentHeight += sectionHeight;
    });

    if (currentPage.length > 0) pages.push(currentPage);
    return pages;
  };

  const allSections = selectedItem?.type === 'song' && selectedItem.song?.content 
    ? parseSongSections(selectedItem.song.content) 
    : [];
  
  const pages = paginateSections(allSections);

  const deskTheme = {
    bg: paperMode ? 'bg-zinc-800' : 'bg-black',
    sidebar: paperMode ? 'bg-zinc-900 border-zinc-700 text-gray-400' : 'bg-zinc-950 border-zinc-800 text-gray-500',
    itemActive: 'bg-blue-600 text-white border-blue-400',
  };

  const paperTheme = {
    bg: paperMode ? 'bg-white' : 'bg-slate-950',
    text: paperMode ? 'text-gray-900' : 'text-gray-200',
    shadow: paperMode ? 'shadow-2xl' : 'shadow-none border border-slate-800',
    headerBorder: paperMode ? 'border-gray-900' : 'border-slate-700',
    sectionTitleBg: paperMode ? 'bg-white border-gray-400' : 'bg-slate-800 border-slate-600',
    sectionTitleText: paperMode ? 'text-black' : 'text-yellow-400',
    metaText: paperMode ? 'text-gray-600' : 'text-gray-500',
    chordColor: paperMode ? 'text-blue-600' : 'text-blue-400'
  };

  return (
    <div className={`fixed inset-0 z-50 flex h-[100dvh] w-full overflow-hidden ${deskTheme.bg} transition-colors duration-300`}>
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* BARRA LATERAL */}
      <div className={`fixed top-0 left-0 h-full z-[70] flex flex-col border-r transition-transform duration-300 shadow-2xl ${deskTheme.sidebar} ${isMobile ? 'w-[85%]' : 'w-80 relative'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:overflow-hidden'}`}>
        <div className="p-4 border-b border-current/10 flex items-center justify-between shrink-0">
            <button onClick={onBack} className="flex items-center gap-2 text-sm hover:text-white transition-colors"><ArrowLeft size={16} /> Salir</button>
            {isMobile && <button onClick={() => setSidebarOpen(false)} className="p-2 bg-white/10 rounded-full text-white"><X size={20} /></button>}
        </div>
        <div className="p-4 border-b border-current/10 shrink-0">
             <h2 className="font-bold text-lg leading-tight truncate text-white">{setlistName}</h2>
             <div className="flex items-center gap-2 mt-1">
                 <p className="text-xs opacity-60 flex items-center gap-1">{items.length} canciones</p>
                 {isConnected && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold flex items-center gap-1 animate-pulse"><Radio size={8} /> LIVE</span>}
             </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {items.map((item, index) => (
                <div key={item.id} onClick={() => handleSelectItem(item)} className={`p-4 border-b border-transparent cursor-pointer flex gap-3 items-center border-l-4 hover:bg-white/5 ${selectedItem?.id === item.id ? deskTheme.itemActive : 'border-l-transparent'}`}>
                    <div className="font-mono font-bold w-6 text-center opacity-50">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${selectedItem?.id === item.id ? 'text-white' : ''}`}>{item.title_override || item.song?.title}</div>
                        {item.type === 'song' && <div className="text-xs opacity-60 mt-1">{item.key_override || item.song?.default_key} • {item.song?.bpm} bpm</div>}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden w-full bg-transparent">
         {/* HERRAMIENTAS */}
         <div className="absolute top-4 right-4 z-50 flex items-center gap-2 print:hidden flex-wrap justify-end">
            {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="p-2.5 rounded-full bg-blue-600 text-white shadow-lg animate-in fade-in hover:bg-blue-500"><Menu size={20} /></button>
            )}
            
            <div className="flex items-center gap-2">
                {/* BOTÓN PLAY */}
                {selectedItem?.type === 'song' && (
                    <div className="flex items-center gap-1 bg-blue-600 text-white p-1 rounded-xl shadow-lg animate-in fade-in">
                        <button onClick={() => setIsScrolling(!isScrolling)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            {isScrolling ? <Pause size={18} className="animate-pulse" /> : <Play size={18} className="ml-0.5" />}
                        </button>
                        <div className="flex flex-col gap-0.5 px-1 border-l border-white/20">
                            <button onClick={() => setScrollSpeed(s => Math.min(5, s + 0.5))} className="hover:text-blue-200"><ChevronsUp size={10} /></button>
                            <span className="text-[9px] font-bold font-mono leading-none text-center">{scrollSpeed}x</span>
                            <button onClick={() => setScrollSpeed(s => Math.max(0.5, s - 0.5))} className="hover:text-blue-200"><ChevronsDown size={10} /></button>
                        </div>
                    </div>
                )}

                {role && (
                    <button 
                        onClick={() => setSyncEnabled(!syncEnabled)} 
                        className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border backdrop-blur-md shadow-lg transition-all ${syncEnabled ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-black/60 text-gray-400 border-white/10 hover:bg-white/10'}`}
                    >
                        {syncEnabled ? <Zap size={14} className="fill-current"/> : <Radio size={14} />}
                        {syncEnabled ? (role === 'admin' ? 'TRANSMITIENDO' : 'SINCRONIZADO') : 'SYNC OFF'}
                    </button>
                )}

                {selectedItem?.type === 'song' && (
                    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
                        <div className="flex items-center bg-white/10 rounded-lg mx-1">
                            <button onClick={() => setTransposeStep(s => s - 1)} className="p-2 hover:bg-white/20 text-white rounded-l-lg" title="Bajar Tono"><Minus size={14} /></button>
                            <span className={`w-8 text-center text-xs font-bold ${transposeStep !== 0 ? 'text-yellow-400' : 'text-gray-400'}`}>{transposeStep > 0 ? `+${transposeStep}` : transposeStep}</span>
                            <button onClick={() => setTransposeStep(s => s + 1)} className="p-2 hover:bg-white/20 text-white rounded-r-lg" title="Subir Tono"><Plus size={14} /></button>
                        </div>
                        <div className="w-px h-5 bg-white/20 mx-1"></div>
                        <button onClick={() => setPaperMode(!paperMode)} className="p-2 rounded-lg hover:bg-white/20 text-white">{paperMode ? <FileText size={18} /> : <Moon size={18} />}</button>
                        <div className="w-px h-5 bg-white/20 mx-1 hidden md:block"></div>
                        <div className="hidden md:flex">
                            <button onClick={() => setFontSize(s => Math.max(12, s - 1))} className="p-2 rounded-lg hover:bg-white/20 text-white"><Type size={14} className="scale-75"/></button>
                            <button onClick={() => setFontSize(s => Math.min(48, s + 1))} className="p-2 rounded-lg hover:bg-white/20 text-white"><Type size={18}/></button>
                        </div>
                    </div>
                )}
            </div>
         </div>

         {selectedItem ? (
            <div 
                ref={scrollContainerRef}
                className={`flex-1 overflow-y-auto scroll-smooth ${selectedItem.type === 'song' ? 'p-2 md:p-8' : 'p-0'} flex flex-col items-center gap-4 md:gap-6`}
            >
                {selectedItem.type === 'song' ? (
                   pages.length > 0 ? (
                     pages.map((pageSections, pageIndex) => (
                        <div key={pageIndex} className={`w-full transition-all duration-300 relative shrink-0 ${paperTheme.bg} ${paperTheme.text} ${paperTheme.shadow} p-4 md:p-[20mm] rounded-sm flex flex-col ${isMobile ? 'min-h-[85vh] mb-4' : 'max-w-[210mm] h-[297mm]'}`} style={{ fontSize: `${fontSize}px` }}>
                            {pageIndex === 0 ? (
                                <div className={`mb-4 border-b-2 pb-2 flex justify-between items-end shrink-0 ${paperTheme.headerBorder}`}>
                                    <div className="max-w-[70%]">
                                        <h1 className="text-2xl md:text-3xl font-black leading-tight tracking-tight uppercase break-words">{selectedItem.title_override || selectedItem.song?.title}</h1>
                                        <p className={`text-xs md:text-sm mt-1 font-bold ${paperTheme.metaText}`}>{selectedItem.song?.artist || 'Autor desconocido'}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end shrink-0">
                                        <div className={`text-2xl md:text-3xl font-bold flex items-center gap-1 ${transposeStep !== 0 ? 'text-yellow-500' : ''}`}>{transposeChord(selectedItem.key_override || selectedItem.song?.default_key || 'C', transposeStep)}</div>
                                        <div className={`text-[10px] md:text-xs uppercase tracking-widest font-bold ${paperTheme.metaText}`}>{selectedItem.song?.bpm} BPM</div>
                                    </div>
                                </div>
                            ) : <div className="h-4 w-full shrink-0"></div>}

                            <div className="flex-1 min-h-0 w-full">
                                <div className="w-full font-mono whitespace-pre-wrap break-words leading-relaxed overflow-x-auto max-w-full">
                                    {pageSections.map((section, idx) => (
                                        <div key={idx} className="break-inside-avoid mb-6 block w-full">
                                            {section.title && (
                                                <div className="mb-2">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-[0.8em] font-black uppercase tracking-widest border shadow-sm ${paperTheme.sectionTitleBg} ${paperTheme.sectionTitleText}`}>{section.title}</span>
                                                </div>
                                            )}
                                            <div className="opacity-90 pl-1 w-full">
                                                {section.body.map((line, lIdx) => {
                                                    const isChord = isChordLineStrict(line);
                                                    const content = isChord ? transposeLine(line, transposeStep) : line;
                                                    return (
                                                        <div key={lIdx} className="min-h-[1.2em] w-full">
                                                            {paperMode && isChord ? <span className={`font-bold ${paperTheme.chordColor}`}>{content}</span> : (content || ' ')}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-auto pt-2 border-t border-current/10 flex justify-between text-[9px] opacity-40 uppercase tracking-widest font-bold shrink-0">
                                <span>SetlistPro</span>
                                <span>{pageIndex + 1} / {pages.length}</span>
                            </div>
                        </div>
                     ))
                   ) : <div className="text-white opacity-50 mt-20">Sin contenido.</div>
                ) : (
                   <div className="flex-1 w-full h-full flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm min-h-[50vh]">
                      <div className="text-center w-full">
                          <h1 className="text-4xl md:text-8xl font-serif italic text-white/90 drop-shadow-2xl break-words">{selectedItem.title_override}</h1>
                          <div className="w-20 md:w-32 h-1 bg-white/30 mx-auto mt-6 md:mt-8 rounded-full"></div>
                      </div>
                   </div>
                )}
            </div>
         ) : <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4 text-center"><Music size={48} className="mb-4 opacity-20 text-white" /><p className="text-gray-400">Selecciona una canción</p></div>}
      </div>
    </div>
  );
}