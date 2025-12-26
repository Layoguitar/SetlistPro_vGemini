"use client";

import React from 'react';
import { Music, Zap, Layout, ArrowRight, Play, Check, ChevronRight, Star } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans overflow-x-hidden">
      
      {/* NAVBAR FLOTANTE (Glassmorphism Puro) */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center justify-between gap-12 shadow-2xl transition-all hover:bg-white/15">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-5 h-5 bg-white text-black rounded-full flex items-center justify-center">
               <Music size={12} strokeWidth={3} />
            </div>
            <span className="font-semibold text-sm tracking-tight">SetlistPro</span>
          </div>
          
          <div className="hidden md:flex gap-6 text-xs font-medium text-gray-300">
            <a href="#overview" className="hover:text-white transition-colors">Visión General</a>
            <a href="#specs" className="hover:text-white transition-colors">Especificaciones</a>
          </div>

          <button 
            onClick={onLoginClick}
            className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-transform active:scale-95"
          >
            Entrar
          </button>
        </div>
      </nav>

      {/* HERO SECTION - TIPO IPHONE */}
      <header className="relative pt-48 pb-32 flex flex-col items-center text-center px-6">
        
        {/* Glow sutil central */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-blue-500/20 blur-[150px] rounded-full -z-10 opacity-60"></div>

        <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter mb-6 leading-[1.05] animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">Tu banda.</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-b from-gray-400 to-gray-600">En perfecta sincronía.</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          La plataforma definitiva para directores de alabanza. <br className="hidden md:block"/>
          Potente. Intuitiva. Pro.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <button 
            onClick={onLoginClick}
            className="group px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-medium transition-all flex items-center gap-2 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)]"
          >
            Comenzar Gratis <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform"/>
          </button>
          <button className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors font-medium">
            Ver el video <Play size={16} fill="currentColor" />
          </button>
        </div>

      </header>

      {/* BENTO GRID - ESTILO APPLE SPECS */}
      <section id="overview" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">
          
          {/* Card 1: Main Feature (Dark) */}
          <div className="md:col-span-2 rounded-[32px] bg-[#111] border border-white/10 p-10 relative overflow-hidden group hover:border-white/20 transition-all duration-500">
            <div className="absolute top-10 left-10 z-10">
              <h3 className="text-gray-500 font-semibold text-sm mb-2 uppercase tracking-widest">Planner</h3>
              <p className="text-4xl font-semibold text-white tracking-tight leading-tight">Diseñado para <br/>el flujo del domingo.</p>
            </div>
            
            {/* Abstract UI representation */}
            <div className="absolute bottom-[-50px] right-[-50px] w-[80%] h-[70%] bg-zinc-900 rounded-tl-[32px] border-t border-l border-white/10 p-6 shadow-2xl transition-transform duration-700 group-hover:translate-x-[-10px] group-hover:translate-y-[-10px]">
               <div className="space-y-4 opacity-50">
                  <div className="flex gap-3">
                     <div className="w-12 h-12 rounded-xl bg-blue-600/20"></div>
                     <div className="space-y-2">
                        <div className="w-40 h-4 bg-zinc-800 rounded-full"></div>
                        <div className="w-24 h-4 bg-zinc-800 rounded-full"></div>
                     </div>
                  </div>
                  <div className="w-full h-32 bg-zinc-800/50 rounded-2xl border border-white/5"></div>
               </div>
            </div>
          </div>

          {/* Card 2: Glass Effect */}
          <div className="rounded-[32px] bg-gradient-to-b from-zinc-900 to-black border border-white/10 p-10 flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-600/20 blur-[80px] rounded-full"></div>
             
             <div>
               <h3 className="text-blue-500 font-semibold text-sm mb-2 uppercase tracking-widest">Live Mode</h3>
               <p className="text-3xl font-semibold text-white tracking-tight">Cero<br/>Distracciones.</p>
             </div>
             
             <div className="flex justify-end">
                <Zap size={64} className="text-zinc-800 group-hover:text-blue-500 transition-colors duration-500" strokeWidth={1} />
             </div>
          </div>

          {/* Card 3: Typography Focus */}
          <div className="rounded-[32px] bg-[#0A0A0A] border border-white/10 p-10 flex flex-col justify-center text-center group hover:bg-[#111] transition-colors duration-500">
             <div className="mx-auto w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                <Layout size={32} strokeWidth={1.5} />
             </div>
             <p className="text-3xl font-semibold text-white tracking-tight mb-2">Banco Infinito.</p>
             <p className="text-gray-500">Tus canciones, seguras en la nube.</p>
          </div>

           {/* Card 4: Detailed Spec */}
           <div className="md:col-span-2 rounded-[32px] bg-zinc-900 relative overflow-hidden p-10 flex items-center group">
              {/* Background Image/Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10 w-full">
                 <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-gray-400 font-semibold text-sm mb-2 uppercase tracking-widest">Sincronización</h3>
                        <p className="text-4xl font-semibold text-white tracking-tight max-w-md">Cambios en tiempo real para todo tu equipo.</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <Star className="text-yellow-400 fill-yellow-400" />
                    </div>
                 </div>
              </div>
           </div>

        </div>
      </section>

      {/* PRICING - SIMPLE & ELEGANT */}
      <section id="specs" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
           <h2 className="text-5xl font-semibold tracking-tighter mb-4">Elige tu plan.</h2>
           <p className="text-gray-400 text-lg mb-16">Potente para equipos. Gratuito para comenzar.</p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              
              {/* FREE CARD */}
              <div className="bg-[#111] border border-white/10 p-8 rounded-3xl hover:border-white/20 transition-all">
                  <div className="flex justify-between items-start mb-8">
                      <div>
                          <h3 className="font-semibold text-xl">Inicial</h3>
                          <p className="text-gray-500 text-sm mt-1">Para solistas y pruebas.</p>
                      </div>
                      <span className="text-3xl font-semibold">$0</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                      {['3 Eventos Mensuales', '10 Canciones', 'Modo Live Básico'].map(item => (
                          <li key={item} className="flex gap-3 text-gray-300 text-sm">
                              <Check size={16} className="text-gray-500" /> {item}
                          </li>
                      ))}
                  </ul>
                  <button onClick={onLoginClick} className="w-full py-4 rounded-full border border-white/20 hover:bg-white hover:text-black font-semibold transition-all">
                      Empezar Gratis
                  </button>
              </div>

              {/* PRO CARD */}
              <div className="bg-[#111] border border-blue-500/50 p-8 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  
                  <div className="flex justify-between items-start mb-8">
                      <div>
                          <h3 className="font-semibold text-xl text-white">Pro Team</h3>
                          <p className="text-blue-400 text-sm mt-1">La experiencia completa.</p>
                      </div>
                      <span className="text-3xl font-semibold">$15</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                      {['Eventos Ilimitados', 'Canciones Ilimitadas', 'Gestión de Roles', 'Soporte Prioritario'].map(item => (
                          <li key={item} className="flex gap-3 text-white text-sm">
                              <Check size={16} className="text-blue-500" /> {item}
                          </li>
                      ))}
                  </ul>
                  <button onClick={onLoginClick} className="w-full py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-900/20">
                      Obtener Pro
                  </button>
              </div>

           </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center text-gray-600 text-xs border-t border-white/5 bg-black">
        <div className="flex justify-center items-center gap-2 mb-4 opacity-50 hover:opacity-100 transition-opacity">
           <Music size={16} />
           <span className="font-semibold tracking-tight">SetlistPro</span>
        </div>
        <p>Designed in California. Coded for Worship.</p>
        <p className="mt-2">Copyright © 2025.</p>
      </footer>

    </div>
  );
}