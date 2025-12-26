"use client";

import React from 'react';
import { Music, Zap, Layers, ArrowRight, Play, Globe, Shield, Smartphone } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden relative">
      
      {/* 1. BACKGROUND GRID PATTERN (Fondo Tecnológico) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Cuadrícula sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        {/* Viñeta para que el centro brille y los bordes sean oscuros */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#030303_0%,transparent_100%)] opacity-0"></div>
        {/* Luz superior "Aurora" */}
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
        
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          La nueva generación v2.0 ya está aquí
        </div>

        {/* Main Title con Gradiente Animado */}
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 leading-[1.1] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          El sistema operativo <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">para tu banda.</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          Olvida las hojas de papel y los PDFs desordenados. Sincroniza acordes, gestiona el equipo y domina el escenario con una plataforma diseñada para el futuro.
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

        {/* 3D APP PREVIEW (Efecto Inclinado) */}
        <div className="mt-20 w-full max-w-5xl relative group perspective-1000 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            {/* Glow detrás de la imagen */}
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/20 to-purple-600/20 blur-[60px] rounded-[40px] -z-10 group-hover:opacity-100 transition-opacity duration-700 opacity-50"></div>
            
            <div className="relative bg-[#0A0A0A] border border-white/10 rounded-t-[32px] p-2 shadow-2xl overflow-hidden transform transition-transform duration-700 group-hover:rotate-x-2">
                <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                {/* Mockup Interface */}
                <div className="bg-[#0f0f0f] rounded-t-[24px] overflow-hidden aspect-[16/9] relative">
                    {/* Header Mockup */}
                    <div className="h-12 border-b border-white/5 flex items-center px-6 gap-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                        <div className="h-2 w-32 bg-white/5 rounded-full mx-auto"></div>
                    </div>
                    {/* Content Mockup */}
                    <div className="p-8 flex gap-8 h-full">
                        <div className="w-64 hidden md:block space-y-4">
                            <div className="h-8 w-full bg-indigo-500/10 border border-indigo-500/20 rounded-lg"></div>
                            <div className="h-4 w-3/4 bg-white/5 rounded-md"></div>
                            <div className="h-4 w-1/2 bg-white/5 rounded-md"></div>
                            <div className="h-4 w-2/3 bg-white/5 rounded-md"></div>
                        </div>
                        <div className="flex-1 space-y-6">
                             <div className="h-12 w-full bg-white/5 rounded-xl border border-white/5 flex items-center px-4">
                                <div className="h-2 w-1/3 bg-white/10 rounded-full"></div>
                             </div>
                             <div className="grid grid-cols-3 gap-4">
                                <div className="h-32 bg-white/5 rounded-xl border border-white/5"></div>
                                <div className="h-32 bg-white/5 rounded-xl border border-white/5"></div>
                                <div className="h-32 bg-white/5 rounded-xl border border-white/5"></div>
                             </div>
                        </div>
                    </div>
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent"></div>
                </div>
            </div>
        </div>
      </div >

      {/* BENTO FEATURES */}
      <section className="py-24 px-6 relative z-10 bg-[#030303]">
        <div className="max-w-7xl mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Feature 1 */}
                <div className="md:col-span-2 bg-gradient-to-br from-[#111] to-[#050505] border border-white/10 rounded-3xl p-10 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 text-indigo-400"><Layers /></div>
                        <h3 className="text-3xl font-bold mb-4 text-white">Multi-Tenancy Nativo</h3>
                        <p className="text-gray-400 text-lg max-w-md">Cada organización vive en su propio universo seguro. Tus canciones, eventos y miembros están aislados criptográficamente.</p>
                    </div>
                    <div className="absolute right-0 bottom-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {/* Feature 2 */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 flex flex-col justify-between group hover:bg-[#0f0f0f] transition-all">
                    <Zap className="text-yellow-400 mb-4" size={32} />
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Live Sync™</h3>
                        <p className="text-gray-400 text-sm">Cambia una canción y se actualiza en el iPad de todos los músicos en &lt;100ms.</p>
                    </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 flex flex-col justify-between group hover:bg-[#0f0f0f] transition-all">
                     <Globe className="text-cyan-400 mb-4" size={32} />
                     <div>
                        <h3 className="text-xl font-bold text-white mb-2">Acceso Global</h3>
                        <p className="text-gray-400 text-sm">Desde el celular, tablet o laptop. Tu repertorio viaja contigo a donde vayas.</p>
                    </div>
                </div>

                {/* Feature 4 */}
                <div className="md:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-3xl p-10 flex items-center justify-between group overflow-hidden relative">
                    <div className="relative z-10">
                         <h3 className="text-2xl font-bold text-white mb-2">Seguridad Enterprise</h3>
                         <p className="text-gray-400">Autenticación robusta y backups diarios automáticos.</p>
                    </div>
                    <Shield className="text-green-500/20 group-hover:text-green-500 transition-colors duration-500 transform group-hover:scale-110" size={120} strokeWidth={1} />
                </div>

             </div>
        </div>
      </section>

      {/* CALL TO ACTION FOOTER */}
      <section className="py-32 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/20"></div>
         <div className="relative z-10 max-w-3xl mx-auto px-6">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8">Listo para sonar <br/>profesional?</h2>
            <button 
                onClick={onLoginClick}
                className="px-10 py-5 bg-white text-black text-lg font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)]"
            >
                Crear mi cuenta ahora
            </button>
            <p className="mt-8 text-gray-500 text-sm">No requiere tarjeta de crédito • Cancelación en cualquier momento</p>
         </div>
      </section>

      <footer className="border-t border-white/5 bg-black py-12 px-6 flex justify-center text-gray-600 text-sm">
         <p>© 2025 SetlistPro. Construido para la excelencia.</p>
      </footer>
    </div>
  );
}