"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Wifi, Maximize2, Minimize2, Type, Moon, Columns, FileText, AlignJustify, AlignLeft, Music, Menu, X } from 'lucide-react';
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
  
  // ESTADOS DE INTERFAZ
  // IMPORTANTE: Empezamos cerrado para evitar que tape la pantalla en móvil
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [isMobile, setIsMobile] = useState(true); 

  // CONFIGURACIÓN VISUAL
  const [fontSize, setFontSize] = useState(16);
  const [paperMode, setPaperMode] = useState(true); 
  const [twoColumns, setTwoColumns] = useState(true);
  const [columnFillBalance, setColumnFillBalance] = useState(false);

  // DETECTAR TAMAÑO DE PANTALLA
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // Detectamos si es pantalla chica
      setIsMobile(mobile);
      // Si es PC (pantalla grande), abrimos el menú automáticamente
      if (!mobile) setSidebarOpen(true);
    };
    
    handleResize(); // Ejecutar al inicio
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // --- PARSEADOR (Divide la canción en bloques) ---
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

  // --- PAGINADOR (Calcula cuándo cortar la hoja) ---
  const paginateSections = (sections: { title: string, body: string[] }[]) => {
    const pages: { title: string, body: string[] }[][] = [];
    let currentPage: { title: string, body: string[] }[] = [];
    let currentHeight = 0; 
    
    // En celular caben menos líneas, ajustamos el límite
    const PAGE_HEIGHT_LIMIT = isMobile ? 35 : (twoColumns ? 52 : 45); 

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

  // TEMAS DE COLORES
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
    metaText: paperMode ? 'text-gray-600' : 'text-gray-500'
  };

  return (
    <div className={`fixed inset-0 z-50 flex h-screen w-full overflow-hidden ${deskTheme.bg} transition-colors duration-300`}>
      
      {/* --- FONDO OSCURO PARA EL MENÚ EN MÓVIL --- */}
      {isMobile && sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- BARRA LATERAL (MENÚ) --- */}
      <div 
        className={`
            fixed top-0 left-0 h-full z-[70] flex flex-col border-r transition-transform duration-300 shadow-2xl
            ${deskTheme.sidebar}
            ${/* EN MÓVIL OCUPA 85%, EN PC ES FIJO DE 320PX */ ''}
            ${isMobile ? 'w-[85%]' : 'w-80 relative'}
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:overflow-hidden'}
        `}
      >
        <div className="p-4 border-b border-current/10 flex items-center justify-between shrink-0">
            <button onClick={onBack} className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                <ArrowLeft size={16} /> Salir
            </button>
            {/* Botón cerrar X solo en móvil */}
            {isMobile && (
                <button onClick={() => setSidebarOpen(false)} className="p-2 bg-white/10 rounded-full text-white">
                    <X size={20} />
                </button>
            )}
        </div>
        
        <div className="p-4 border-b border-current/10 shrink-0">
             <h2 className="font-bold text-lg leading-tight truncate text-white">{setlistName}</h2>
             <p className="text-xs mt-1 opacity-60 flex items-center gap-2">
                {items.length} canciones 
                {isConnected && <span className="text-emerald-400 font-bold">• LIVE</span>}
             </p>
        </div>

        <div className="flex-1 overflow-y-auto">
            {items.map((item, index) => (
                <div 
                    key={item.id} 
                    onClick={() => {
                        setSelectedItem(item);
                        if (isMobile) setSidebarOpen(false); // Al elegir canción, cerrar menú en móvil
                    }} 
                    className={`p-4 border-b border-transparent cursor-pointer flex gap-3 items-center border-l-4 hover:bg-white/5 ${selectedItem?.id === item.id ? deskTheme.itemActive : 'border-l-transparent'}`}
                >
                    <div className="font-mono font-bold w-6 text-center opacity-50">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${selectedItem?.id === item.id ? 'text-white' : ''}`}>{item.title_override || item.song?.title}</div>
                        {item.type === 'song' && <div className="text-xs opacity-60 mt-1">{item.key_override || item.song?.default_key} • {item.song?.bpm} bpm</div>}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* --- ÁREA PRINCIPAL (HOJA DE CANCIÓN) --- */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden w-full bg-transparent">
         
         {/* BARRA DE HERRAMIENTAS FLOTANTE */}
         <div className="absolute top-4 right-4 z-50 flex items-center gap-2 print:hidden">
            
            {/* Botón Menú Hamburguesa (Aparece si el menú está cerrado) */}
            {!sidebarOpen && (
                <button 
                    onClick={() => setSidebarOpen(true)} 
                    className="p-2.5 rounded-full bg-blue-600 text-white shadow-lg animate-in fade-in hover:bg-blue-500"
                >
                    <Menu size={20} />
                </button>
            )}

            {selectedItem?.type === 'song' && (
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
                    <button onClick={() => setPaperMode(!paperMode)} className="p-2 rounded-lg hover:bg-white/20 text-white">
                        {paperMode ? <FileText size={18} /> : <Moon size={18} />}
                    </button>
                    
                    {/* Botón columnas (oculto en móvil para no romper la hoja) */}
                    <button onClick={() => setTwoColumns(!twoColumns)} className="hidden lg:flex p-2 rounded-lg hover:bg-white/20 text-white">
                        <Columns size={18} />
                    </button>

                    <div className="w-px h-5 bg-white/20 mx-1"></div>
                    
                    <button onClick={() => setFontSize(s => Math.max(12, s - 1))} className="p-2 rounded-lg hover:bg-white/20 text-white"><Type size={14} className="scale-75"/></button>
                    <button onClick={() => setFontSize(s => Math.min(36, s + 1))} className="p-2 rounded-lg hover:bg-white/20 text-white"><Type size={18}/></button>
                </div>
            )}
         </div>

         {selectedItem ? (
            <div className={`flex-1 overflow-y-auto ${selectedItem.type === 'song' ? 'p-2 md:p-8' : 'p-0'} flex flex-col items-center gap-4 md:gap-6`}>
                
                {/* --- RENDERIZADO DE PÁGINAS --- */}
                {selectedItem.type === 'song' ? (
                   pages.length > 0 ? (
                     pages.map((pageSections, pageIndex) => (
                        <div 
                            key={pageIndex}
                            className={`
                                w-full transition-all duration-300 relative shrink-0
                                ${paperTheme.bg} ${paperTheme.text} ${paperTheme.shadow}
                                p-4 md:p-[15mm] rounded-sm flex flex-col
                                ${isMobile ? 'min-h-[85vh] mb-4' : 'max-w-[210mm] h-[297mm]'} 
                            `}
                            style={{ fontSize: `${isMobile ? fontSize + 2 : fontSize}px` }}
                        >
                            {/* CABECERA (Solo pág 1) */}
                            {pageIndex === 0 ? (
                                <div className={`mb-4 border-b-2 pb-2 flex justify-between items-end shrink-0 ${paperTheme.headerBorder}`}>
                                    <div className="max-w-[70%]">
                                        <h1 className="text-2xl md:text-3xl font-black leading-tight tracking-tight uppercase break-words">
                                            {selectedItem.title_override || selectedItem.song?.title}
                                        </h1>
                                        <p className={`text-xs md:text-sm mt-1 font-bold ${paperTheme.metaText}`}>
                                            {selectedItem.song?.artist || 'Autor desconocido'}
                                        </p>
                                    </div>
                                    <div className="text-right flex flex-col items-end shrink-0">
                                        <div className="text-2xl md:text-3xl font-bold">{selectedItem.key_override || selectedItem.song?.default_key}</div>
                                        <div className={`text-[10px] md:text-xs uppercase tracking-widest font-bold ${paperTheme.metaText}`}>
                                            {selectedItem.song?.bpm} BPM
                                        </div>
                                    </div>
                                </div>
                            ) : <div className="h-4 w-full shrink-0"></div>}

                            <div className="flex-1 min-h-0">
                                <div 
                                    className={`
                                        w-full font-mono whitespace-pre-wrap leading-relaxed
                                        ${twoColumns && !isMobile ? 'columns-2 gap-[10mm]' : 'columns-1'}
                                    `}
                                    style={{ columnFill: columnFillBalance ? 'balance' : 'auto' }} 
                                >
                                    {pageSections.map((section, idx) => (
                                        <div key={idx} className="break-inside-avoid mb-6 inline-block w-full">
                                            {section.title && (
                                                <div className="mb-2">
                                                    <span className={`
                                                        inline-block px-3 py-0.5 rounded-full text-[0.8em] font-black uppercase tracking-widest border shadow-sm
                                                        ${paperTheme.sectionTitleBg} ${paperTheme.sectionTitleText}
                                                    `}>
                                                        {section.title}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="opacity-90 pl-1">
                                                {section.body.map((line, lIdx) => (
                                                    <div key={lIdx} className="min-h-[1.2em]">
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
                   // --- MODO BLOQUE (SIMPLE) ---
                   <div className="flex-1 w-full h-full flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm min-h-[50vh]">
                      <div className="text-center w-full">
                          <h1 className="text-4xl md:text-8xl font-serif italic text-white/90 drop-shadow-2xl break-words">
                              {selectedItem.title_override}
                          </h1>
                          <div className="w-20 md:w-32 h-1 bg-white/30 mx-auto mt-6 md:mt-8 rounded-full"></div>
                      </div>
                   </div>
                )}
            </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                <Music size={48} className="mb-4 opacity-20 text-white" />
                <p className="text-gray-400">Selecciona una canción del menú</p>
                {!sidebarOpen && (
                    <button onClick={() => setSidebarOpen(true)} className="mt-4 text-blue-400 font-bold text-sm bg-white/10 px-4 py-2 rounded-full">
                        Abrir Menú
                    </button>
                )}
            </div>
         )}
      </div>
    </div>
  );
}