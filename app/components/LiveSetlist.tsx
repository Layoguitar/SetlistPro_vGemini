"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
// ✅ CORREGIDO: Agregué 'Music' a los imports
import { ArrowLeft, Wifi, Maximize2, Minimize2, Type, Moon, Columns, FileText, AlignJustify, AlignLeft, Music } from 'lucide-react';
import type { SetlistItem } from '@/types/database';

interface LiveSetlistProps {
  setlistId: string;
  onBack: () => void;
}

export default function LiveSetlist({ setlistId, onBack }: LiveSetlistProps) {
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [setlistName, setSetlistName] = useState("");
  const [selectedItem, setSelectedItem] = useState<SetlistItem | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // CONFIGURACIÓN VISUAL
  const [fontSize, setFontSize] = useState(14);
  const [paperMode, setPaperMode] = useState(true); 
  const [twoColumns, setTwoColumns] = useState(true);
  const [columnFillBalance, setColumnFillBalance] = useState(false);

  const fetchData = async () => {
    const { data: setlist } = await supabase.from('setlists').select('name').eq('id', setlistId).single();
    if (setlist) setSetlistName(setlist.name);

    const { data } = await supabase
      .from('setlist_items')
      .select(`*, song:songs(*)`)
      .eq('setlist_id', setlistId)
      .order('position', { ascending: true });

    if (data) {
      setItems(data);
      if (!selectedItem && data.length > 0) setSelectedItem(data[0]);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('live-setlist-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setlist_items', filter: `setlist_id=eq.${setlistId}` }, 
      () => fetchData())
      .subscribe((status) => { if (status === 'SUBSCRIBED') setIsConnected(true); });
    return () => { supabase.removeChannel(channel); };
  }, [setlistId]);

  // --- PARSEADOR ---
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
        if (line.trim() !== '') currentSection.body.push(line);
      }
    });
    if (currentSection.title || currentSection.body.length > 0) sections.push(currentSection);
    return sections;
  };

  // --- PAGINADOR ---
  const paginateSections = (sections: { title: string, body: string[] }[]) => {
    const pages: { title: string, body: string[] }[][] = [];
    let currentPage: { title: string, body: string[] }[] = [];
    let currentHeight = 0; 
    
    // Si estamos en 1 columna, caben menos cosas verticalmente porque se ve mejor con letra más grande
    // Si estamos en 2 columnas, aprovechamos más el alto.
    const PAGE_HEIGHT_LIMIT = twoColumns ? 52 : 45; 

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

  // TEMAS
  const deskTheme = {
    bg: paperMode ? 'bg-zinc-800' : 'bg-black',
    sidebar: paperMode ? 'bg-zinc-900 border-zinc-700 text-gray-400' : 'bg-black border-zinc-800 text-gray-500',
    itemActive: 'bg-blue-600 text-white border-blue-400',
  };

  const paperTheme = {
    bg: paperMode ? 'bg-white' : 'bg-slate-950',
    text: paperMode ? 'text-gray-900' : 'text-gray-200',
    shadow: paperMode ? 'shadow-2xl' : 'shadow-none border border-slate-800',
    headerBorder: paperMode ? 'border-gray-900' : 'border-slate-700',
    sectionTitleBg: paperMode ? 'bg-white border-gray-400' : 'bg-slate-800 border-slate-600',
    sectionTitleText: paperMode ? 'text-black' : 'text-yellow-400',
    metaText: paperMode ? 'text-gray-600' : 'text-gray-500'
  };

  return (
    <div className={`fixed inset-0 z-50 flex h-screen w-full overflow-hidden ${deskTheme.bg} transition-colors duration-300`}>
      
      {/* BARRA LATERAL */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r flex flex-col shrink-0 ${deskTheme.sidebar}`}>
        <div className="p-4 border-b border-current/10 flex items-center justify-between shrink-0">
            <button onClick={onBack} className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                <ArrowLeft size={16} /> Salir
            </button>
            {isConnected && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse flex gap-1"><Wifi size={10}/> LIVE</span>}
        </div>
        <div className="p-4 border-b border-current/10 shrink-0">
             <h2 className="font-bold text-lg leading-tight truncate text-white">{setlistName}</h2>
             <p className="text-xs mt-1 opacity-60">{items.length} ítems</p>
        </div>
        <div className="flex-1 overflow-y-auto">
            {items.map((item, index) => (
                <div key={item.id} onClick={() => setSelectedItem(item)} className={`p-4 border-b border-transparent cursor-pointer flex gap-3 items-center border-l-4 hover:bg-white/5 ${selectedItem?.id === item.id ? deskTheme.itemActive : 'border-l-transparent'}`}>
                    <div className="font-mono font-bold w-6 text-center opacity-50">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${selectedItem?.id === item.id ? 'text-white' : ''}`}>{item.title_override || item.song?.title}</div>
                        {item.type === 'song' && <div className="text-xs opacity-60 mt-1">{item.key_override || item.song?.default_key} • {item.song?.bpm} bpm</div>}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* VISOR */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
         
         {/* BARRA DE HERRAMIENTAS (Solo aparece si es una canción) */}
         {selectedItem?.type === 'song' && (
            <div className="absolute top-4 right-6 flex items-center gap-2 z-50 print:hidden">
                <button onClick={() => setPaperMode(!paperMode)} className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md shadow-sm" title="Tema">
                    {paperMode ? <FileText size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={() => setTwoColumns(!twoColumns)} className="hidden md:flex p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md shadow-sm" title="Columnas">
                    <Columns size={20} />
                </button>
                {twoColumns && (
                    <button onClick={() => setColumnFillBalance(!columnFillBalance)} className="hidden md:flex p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md shadow-sm" title="Relleno">
                        {columnFillBalance ? <AlignJustify size={20} /> : <AlignLeft size={20} />}
                    </button>
                )}
                <div className="w-px h-6 bg-white/20 mx-1"></div>
                <button onClick={() => setFontSize(s => Math.max(10, s - 1))} className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md"><Type size={14} className="scale-75"/></button>
                <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md"><Type size={18}/></button>
                <div className="w-px h-6 bg-white/20 mx-1"></div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md">
                    {sidebarOpen ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </button>
            </div>
         )}

         {selectedItem ? (
            <div className={`flex-1 overflow-y-auto ${selectedItem.type === 'song' ? 'p-4 md:p-8' : 'p-0'} flex flex-col items-center gap-6`}>
                
                {/* --- MODO CANCIÓN (HOJAS A4) --- */}
                {selectedItem.type === 'song' ? (
                   pages.length > 0 ? (
                     pages.map((pageSections, pageIndex) => (
                        <div 
                            key={pageIndex}
                            className={`
                                w-full max-w-[210mm] h-[297mm] transition-all duration-300 relative shrink-0
                                ${paperTheme.bg} ${paperTheme.text} ${paperTheme.shadow}
                                p-[15mm] rounded-sm flex flex-col
                            `}
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {pageIndex === 0 ? (
                                <div className={`mb-6 border-b-2 pb-2 flex justify-between items-end shrink-0 ${paperTheme.headerBorder}`}>
                                    <div>
                                        <h1 className="text-3xl font-black leading-tight tracking-tight uppercase truncate max-w-[400px]">
                                            {selectedItem.title_override || selectedItem.song?.title}
                                        </h1>
                                        <p className={`text-sm mt-1 font-bold ${paperTheme.metaText}`}>
                                            {selectedItem.song?.artist || 'Autor desconocido'}
                                        </p>
                                    </div>
                                    <div className="text-right flex flex-col items-end shrink-0">
                                        <div className="text-3xl font-bold">{selectedItem.key_override || selectedItem.song?.default_key}</div>
                                        <div className={`text-xs uppercase tracking-widest font-bold ${paperTheme.metaText}`}>
                                            {selectedItem.song?.bpm} BPM
                                        </div>
                                    </div>
                                </div>
                            ) : <div className="h-6 w-full shrink-0"></div>}

                            <div className="flex-1 min-h-0">
                                <div 
                                    className={`
                                        h-full w-full font-mono whitespace-pre-wrap leading-relaxed
                                        ${twoColumns ? 'columns-2 gap-[10mm]' : 'columns-1 max-w-3xl mx-auto'}
                                    `}
                                    style={{ columnFill: columnFillBalance ? 'balance' : 'auto' }} 
                                >
                                    {pageSections.map((section, idx) => (
                                        <div key={idx} className="break-inside-avoid mb-5 inline-block w-full">
                                            {section.title && (
                                                <div className="mb-1">
                                                    <span className={`
                                                        inline-block px-2 py-0.5 rounded text-[0.75em] font-black uppercase tracking-widest border
                                                        ${paperTheme.sectionTitleBg} ${paperTheme.sectionTitleText}
                                                    `}>
                                                        {section.title}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="opacity-90 pl-1">
                                                {section.body.map((line, lIdx) => (
                                                    <div key={lIdx} className="min-h-[1.1em]">
                                                    {paperMode && line.trim().length < 20 && /[A-G]/.test(line) 
                                                        ? <span className="font-bold text-blue-600">{line}</span> 
                                                        : line}
                                                    </div>
                                                ))}
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
                   ) : (
                     <div className="text-white opacity-50 mt-20">Sin contenido.</div>
                   )
                ) : (
                   // --- MODO BLOQUE (SIMPLE, PANTALLA COMPLETA) ---
                   <div className="flex-1 w-full h-full flex items-center justify-center p-10 bg-black/20 backdrop-blur-sm">
                      <div className="text-center">
                          <h1 className="text-6xl md:text-8xl font-serif italic text-white/90 drop-shadow-2xl">
                              {selectedItem.title_override}
                          </h1>
                          <div className="w-32 h-1 bg-white/30 mx-auto mt-8 rounded-full"></div>
                      </div>
                   </div>
                )}
            </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Music size={64} className="mb-4 opacity-20 text-white" />
                <p className="text-gray-400">Selecciona una canción</p>
            </div>
         )}
      </div>
    </div>
  );
}