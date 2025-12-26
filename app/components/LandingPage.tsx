"use client";

import React from 'react';
import { Music, Zap, BarChart3, ArrowDownCircle, ArrowRight, Play, Check, X } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden relative">
      
      {/* 1. BACKGROUND GRID PATTERN */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#030303_0%,transparent_100%)]"></div>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030303]/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Music size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Setlist<span className="text-gray-500">Pro</span></span>
          </div>
          <button 
            onClick={onLoginClick}
            className="bg-white text-black px-5 py-2 rounded-full text-xs font-bold hover:bg-gray-200 transition-all transform hover:scale-105"
          >
            Iniciar Sesión
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Nueva Versión 2.0 Disponible
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-[1.1] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          El sistema operativo <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">para tu banda.</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          Mantén a todos tus músicos en el mismo tono, siempre. Olvida los PDFs desactualizados y coordina tu ministerio con precisión profesional.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <button 
            onClick={onLoginClick}
            className="h-12 px-8 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            Empezar Gratis <ArrowRight size={16} />
          </button>
          <button className="h-12 px-8 rounded-full border border-white/10 hover:bg-white/5 text-gray-300 font-bold text-sm transition-all flex items-center gap-2 backdrop-blur-sm">
            <Play size={16} /> Ver Demo
          </button>
        </div>

        {/* 3D APP PREVIEW (CON TU IMAGEN) */}
        <div className="mt-20 w-full max-w-5xl relative group perspective-1000 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/20 to-purple-600/20 blur-[60px] rounded-[40px] -z-10 group-hover:opacity-100 transition-opacity duration-700 opacity-50"></div>
            
            <div className="relative bg-[#0A0A0A] border border-white/10 rounded-xl p-2 shadow-2xl overflow-hidden transform transition-transform duration-700 group-hover:rotate-x-2">
                {/* AQUI VA TU IMAGEN REAL. 
                   Asegúrate de guardar tu imagen como 'hero-image.jpg' en la carpeta 'public'.
                */}
                <img 
                    src="/hero-image.jpg" 
                    alt="SetlistPro Dashboard" 
                    className="w-full rounded-lg shadow-inner border border-white/5"
                />
                
                {/* Reflejo de vidrio sobre la imagen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none rounded-lg"></div>
            </div>
        </div>
      </div >

      {/* BENTO FEATURES */}
      <section className="py-24 px-6 relative z-10 bg-[#030303]">
        <div className="max-w-7xl mx-auto">
             <div className="mb-12 text-center md:text-left">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Todo lo que necesitas <br /><span className="text-gray-500">para el domingo perfecto.</span></h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Feature 1: Banco */}
                <div className="md:col-span-2 bg-gradient-to-br from-[#111] to-[#050505] border border-white/10 rounded-3xl p-10 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 text-indigo-400"><Music /></div>
                        <h3 className="text-2xl font-bold mb-4 text-white">Banco Centralizado</h3>
                        <p className="text-gray-400 text-lg max-w-md">Todas tus canciones, tonos y cifrados en una sola nube segura. Crea una vez, úsalo para siempre en cualquier evento.</p>
                    </div>
                </div>

                {/* Feature 2: Ranking */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 flex flex-col justify-between group hover:bg-[#0f0f0f] transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full"></div>
                    <BarChart3 className="text-purple-400 mb-4 relative z-10" size={32} />
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-2">Ranking Inteligente</h3>
                        <p className="text-gray-400 text-sm">¿Repites mucho las mismas canciones? Visualiza qué tocas más y qué has olvidado.</p>
                    </div>
                </div>

                {/* Feature 3: Live View */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 flex flex-col justify-between group hover:bg-[#0f0f0f] transition-all">
                     <Zap className="text-yellow-400 mb-4" size={32} />
                     <div>
                        <h3 className="text-xl font-bold text-white mb-2">Vista En Vivo</h3>
                        <p className="text-gray-400 text-sm">Modo oscuro de alto contraste diseñado para el escenario. Sin distracciones.</p>
                    </div>
                </div>

                {/* Feature 4: Auto Scroll */}
                <div className="md:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-3xl p-10 flex items-center justify-between group overflow-hidden relative">
                    <div className="relative z-10 max-w-md">
                         <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center mb-4"><ArrowDownCircle size={20}/></div>
                         <h3 className="text-2xl font-bold text-white mb-2">Autodesplazamiento</h3>
                         <p className="text-gray-400">Manos libres. La app calcula la duración y baja la letra automáticamente mientras tocas.</p>
                    </div>
                    {/* Abstract Scroll UI */}
                    <div className="hidden md:block w-32 h-full bg-zinc-900/50 border-l border-white/5 absolute right-0 top-0 p-4 space-y-3 opacity-50 group-hover:translate-y-[-20px] transition-transform duration-1000">
                        <div className="w-full h-2 bg-white/10 rounded-full"></div>
                        <div className="w-3/4 h-2 bg-white/10 rounded-full"></div>
                        <div className="w-full h-2 bg-white/10 rounded-full"></div>
                        <div className="w-5/6 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        <div className="w-full h-2 bg-white/10 rounded-full"></div>
                    </div>
                </div>

             </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24 px-6 border-t border-white/5 relative bg-black">
         <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">Planes flexibles</h2>
            <p className="text-gray-400 text-center mb-16">Comienza gratis y crece con tu ministerio.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                
                {/* PLAN INICIAL */}
                <div className="p-8 rounded-3xl border border-white/10 bg-[#050505] hover:border-white/20 transition-colors">
                    <h3 className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-2">Inicial</h3>
                    <div className="text-4xl font-bold text-white mb-6">$0</div>
                    <p className="text-gray-400 text-sm mb-8">Perfecto para probar la plataforma.</p>
                    
                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-white"/> 10 Canciones máximo</li>
                        <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-white"/> 1 Evento al mes</li>
                        <li className="flex items-center gap-3 text-sm text-gray-500"><X size={16}/> Sin Vista En Vivo</li>
                        <li className="flex items-center gap-3 text-sm text-gray-500"><X size={16}/> Sin Autoscroll</li>
                    </ul>

                    <button onClick={onLoginClick} className="w-full py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white hover:text-black transition-all">
                        Crear cuenta gratis
                    </button>
                </div>

                {/* PLAN PRO BAND */}
                <div className="p-8 rounded-3xl border border-indigo-500/50 bg-[#0A0A0A] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Más Popular</div>
                    <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-colors"></div>
                    
                    <h3 className="text-indigo-400 font-bold text-sm uppercase tracking-widest mb-2">Pro Band</h3>
                    <div className="text-4xl font-bold text-white mb-6">$9.99 <span className="text-lg text-gray-500 font-normal">/mes</span></div>
                    <p className="text-gray-400 text-sm mb-8">Poder ilimitado para toda la banda.</p>
                    
                    <ul className="space-y-4 mb-8 relative z-10">
                        <li className="flex items-center gap-3 text-sm text-white"><Check size={16} className="text-indigo-400"/> Canciones Ilimitadas</li>
                        <li className="flex items-center gap-3 text-sm text-white"><Check size={16} className="text-indigo-400"/> Eventos Ilimitados</li>
                        <li className="flex items-center gap-3 text-sm text-white"><Check size={16} className="text-indigo-400"/> Modo En Vivo + Autoscroll</li>
                        <li className="flex items-center gap-3 text-sm text-white"><Check size={16} className="text-indigo-400"/> Transposición Automática</li>
                    </ul>

                    <button onClick={onLoginClick} className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20 relative z-10">
                        Obtener Pro Band
                    </button>
                </div>

            </div>
         </div>
      </section>

      <footer className="border-t border-white/5 bg-black py-12 px-6 flex justify-center text-gray-600 text-sm">
         <p>© 2025 SetlistPro. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
