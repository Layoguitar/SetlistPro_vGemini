"use client";

import React, { useState } from 'react';
import { Music, Calendar, Zap, Layout, CheckCircle2, ArrowRight, PlayCircle, Users, Layers, Sparkles, Star } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500 selection:text-white overflow-x-hidden font-sans">
      
      {/* BACKGROUND GLOWS - LUCES DE FONDO */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] opacity-40"></div>
      </div>

      {/* FLOATING NAVBAR - MENÚ FLOTANTE */}
      <div className="fixed top-6 left-0 w-full z-50 px-6 flex justify-center">
        <nav className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-8 shadow-2xl">
          <div className="flex items-center gap-2 font-black text-lg tracking-tight">
            <div className="bg-gradient-to-tr from-purple-600 to-blue-600 w-6 h-6 rounded-md flex items-center justify-center shadow-lg">
              <Music size={14} className="text-white" />
            </div>
            <span>SETLIST<span className="text-gray-400">PRO</span></span>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Características</a>
            <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
          </div>
          <button 
            onClick={onLoginClick}
            className="bg-white text-black px-4 py-1.5 rounded-full font-bold text-xs hover:bg-gray-200 transition-all transform hover:scale-105"
          >
            Entrar
          </button>
        </nav>
      </div>

      {/* HERO SECTION - PORTADA */}
      <header className="relative pt-40 pb-32 px-6 text-center max-w-5xl mx-auto flex flex-col items-center">
        
        {/* Badge "Nuevo" */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Sparkles size={12} />
          <span>La nueva forma de gestionar tu banda</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          Sincroniza <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">tu Ministerio.</span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          SetlistPro elimina el caos de los ensayos. Planifica servicios, cifra acordes y coordina a tu equipo en tiempo real.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <button 
            onClick={onLoginClick}
            className="group relative px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <span className="flex items-center gap-2 relative z-10">Comenzar Gratis <ArrowRight size={18} /></span>
          </button>
          
          <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-2 backdrop-blur-sm">
            <PlayCircle size={20} className="text-gray-400" /> Ver Demo
          </button>
        </div>

        {/* Hero Image Mockup (Abstracto) */}
        <div className="mt-20 w-full max-w-4xl h-[400px] bg-gradient-to-b from-gray-900 to-black rounded-t-3xl border-t border-x border-white/10 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="w-20 h-20 bg-purple-500 rounded-2xl mx-auto mb-4 blur-3xl opacity-50"></div>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Dashboard Preview</p>
            </div>
        </div>
      </header>

      {/* BENTO GRID FEATURES - CARACTERÍSTICAS ESTILO CAJAS */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Todo lo que necesitas. <br/><span className="text-gray-500">Nada que no uses.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
            
            {/* Feature 1: Grande */}
            <div className="md:col-span-2 row-span-2 bg-zinc-900/50 border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-600/20 blur-[100px] rounded-full group-hover:bg-purple-600/30 transition-all"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white"><Layout /></div>
                <h3 className="text-3xl font-bold mb-4">Planner Definitivo</h3>
                <p className="text-gray-400 text-lg max-w-md">Arrastra canciones, inserta bloques de predicación y calcula el tiempo total del servicio automáticamente.</p>
              </div>
              {/* Mock UI */}
              <div className="absolute bottom-0 right-0 w-2/3 h-1/2 bg-black border-t border-l border-white/10 rounded-tl-3xl p-6 shadow-2xl translate-y-4 translate-x-4 transition-transform group-hover:translate-x-2 group-hover:translate-y-2">
                 <div className="flex gap-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                 </div>
                 <div className="space-y-3">
                    <div className="h-8 bg-zinc-800 rounded-lg w-full"></div>
                    <div className="h-8 bg-zinc-800 rounded-lg w-3/4"></div>
                    <div className="h-8 bg-zinc-800 rounded-lg w-5/6"></div>
                 </div>
              </div>
            </div>

            {/* Feature 2: Banco */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
               <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4"><Music size={20} /></div>
               <h3 className="text-xl font-bold mb-2">Banco de Canciones</h3>
               <p className="text-gray-500 text-sm">Cifrados Nashville y letras sincronizadas en la nube.</p>
            </div>

            {/* Feature 3: Live Mode */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-green-500/30 transition-colors">
               <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center mb-4"><Zap size={20} /></div>
               <h3 className="text-xl font-bold mb-2">Modo En Vivo</h3>
               <p className="text-gray-500 text-sm">Interfaz oscura libre de distracciones para el escenario.</p>
            </div>
            
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-10 border-y border-white/5 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-mono text-gray-500 mb-8 uppercase tracking-widest">Confían en nosotros</p>
            <div className="flex flex-wrap justify-center gap-12 grayscale opacity-50">
                {/* Placeholder logos */}
                <div className="flex items-center gap-2 font-bold text-xl"><Star size={20}/> GRACE CITY</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Layers size={20}/> ELEVATION</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Users size={20}/> HILLSONG</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Music size={20}/> MAVERICKS</div>
            </div>
        </div>
      </section>

      {/* PRICING - PRECIOS SIMPLES */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Inversión transparente</h2>
            <p className="text-gray-400">Sin contratos forzosos. Cancela cuando quieras.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* FREE */}
            <div className="p-8 rounded-3xl bg-black border border-zinc-800 flex flex-col hover:border-zinc-600 transition-colors">
                <span className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-4">Start</span>
                <div className="text-4xl font-black mb-2">$0</div>
                <p className="text-gray-500 text-sm mb-8">Para líderes solistas.</p>
                <button onClick={onLoginClick} className="w-full py-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 font-bold transition-all mb-8">Crear cuenta</button>
                <ul className="space-y-3 text-sm text-gray-400">
                    <li className="flex gap-2"><CheckCircle2 size={16} className="text-zinc-600"/> 3 Eventos / mes</li>
                    <li className="flex gap-2"><CheckCircle2 size={16} className="text-zinc-600"/> 10 Canciones</li>
                </ul>
            </div>

            {/* PRO */}
            <div className="p-8 rounded-3xl bg-zinc-900 border border-purple-500/50 flex flex-col relative shadow-2xl shadow-purple-900/20 transform scale-105">
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl rounded-tr-2xl uppercase">Recomendado</div>
                <span className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-4">Pro Band</span>
                <div className="text-4xl font-black mb-2">$15</div>
                <p className="text-gray-400 text-sm mb-8">Para bandas activas.</p>
                <button onClick={onLoginClick} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all mb-8 shadow-lg shadow-purple-600/20">Prueba de 14 días</button>
                <ul className="space-y-3 text-sm text-gray-300">
                    <li className="flex gap-2"><CheckCircle2 size={16} className="text-purple-500"/> Eventos Ilimitados</li>
                    <li className="flex gap-2"><CheckCircle2 size={16} className="text-purple-500"/> Canciones Ilimitadas</li>
                    <li className="flex gap-2"><CheckCircle2 size={16} className="text-purple-500"/> Transposición (1-Click)</li>
                    <li className="flex gap-2"><CheckCircle2 size={16} className="text-purple-500"/> Gestión de Equipo</li>
                </ul>
            </div>

            {/* ENTERPRISE */}
            <div className="p-8 rounded-3xl bg-black border border-zinc-800 flex flex-col hover:border-zinc-600 transition-colors">
                <span className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-4">Church</span>
                <div className="text-4xl font-black mb-2">Custom</div>
                <p className="text-gray-500 text-sm mb-8">Para múltiples sedes.</p>
                <button className="w-full py-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 font-bold transition-all mb-8">Contactar</button>
                <ul className="space-y-3 text-sm text-gray-400">
                    <li className="flex gap-2"><CheckCircle2 size={16} className="text-zinc-600"/> Roles avanzados</li>
                    <li className="flex gap-2"><CheckCircle2 size={16} className="text-zinc-600"/> Soporte dedicado</li>
                </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center border-t border-white/5 bg-black">
        <div className="flex items-center justify-center gap-2 font-black text-xl tracking-tight mb-4 opacity-50">
            <div className="bg-white/10 w-6 h-6 rounded flex items-center justify-center">
              <Music size={12} className="text-white" />
            </div>
            <span>SETLIST<span className="text-gray-600">PRO</span></span>
          </div>
        <p className="text-gray-600 text-xs">© 2025 SetlistPro Inc. Hecho para músicos.</p>
      </footer>
    </div>
  );
}