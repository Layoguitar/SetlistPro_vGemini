"use client";

import React from 'react';
import { Music, Calendar, Zap, Layout, CheckCircle2, ArrowRight, PlayCircle } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
          <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center">
            <Music size={18} className="text-white" />
          </div>
          SETLIST<span className="text-blue-500">PRO</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Características</a>
          <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
        </div>
        <button 
          onClick={onLoginClick}
          className="bg-white text-black px-5 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition-all"
        >
          Iniciar Sesión
        </button>
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-20 pb-32 px-6 text-center max-w-5xl mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full -z-10"></div>
        
        <span className="inline-block py-1 px-3 rounded-full bg-blue-900/30 border border-blue-800 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          Nueva Versión 2.0
        </span>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Tu banda, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">sincronizada.</span><br />
          Tus eventos, perfectos.
        </h1>
        
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          La plataforma definitiva para directores de alabanza y bandas. Gestiona repertorios, cifra acordes y coordina a tu equipo en un solo lugar.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <button 
            onClick={onLoginClick}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
          >
            Comenzar Gratis <ArrowRight size={20} />
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white border border-gray-800 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2">
            <PlayCircle size={20} /> Ver Demo
          </button>
        </div>
      </header>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-zinc-900/50 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-4 border border-purple-500/20">
                <Calendar size={24} />
              </div>
              <h3 className="text-xl font-bold">Planner Inteligente</h3>
              <p className="text-gray-400 leading-relaxed">Arrastra y suelta canciones. Estructura el servicio (Oración, Prédica, Cena) en segundos y notifica a todos.</p>
            </div>

            <div className="space-y-4">
               <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
                <Layout size={24} />
              </div>
              <h3 className="text-xl font-bold">Banco de Canciones</h3>
              <p className="text-gray-400 leading-relaxed">Guarda tus letras y acordes una sola vez. Usa el sistema Nashville o cifrado estándar. Transposición automática.</p>
            </div>

            <div className="space-y-4">
               <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-4 border border-green-500/20">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold">Modo En Vivo</h3>
              <p className="text-gray-400 leading-relaxed">Pantalla oscura optimizada para el escenario. Sin distracciones, solo lo que tienes que tocar ahora.</p>
            </div>

          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Planes para cada etapa</h2>
          <p className="text-gray-400">Comienza gratis, crece con tu ministerio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* FREE */}
          <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col">
            <div className="mb-4 text-gray-400 font-bold text-sm uppercase tracking-wider">Inicial</div>
            <div className="text-4xl font-black mb-6">$0</div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex gap-3 text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={20}/> Hasta 3 eventos</li>
              <li className="flex gap-3 text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={20}/> 10 Canciones</li>
              <li className="flex gap-3 text-gray-300"><CheckCircle2 className="text-blue-500 shrink-0" size={20}/> 2 Músicos</li>
            </ul>
            <button onClick={onLoginClick} className="w-full py-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 font-bold transition-all">Empezar</button>
          </div>

          {/* PRO - DESTACADO */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-blue-900/20 to-zinc-900 border border-blue-500/50 flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Más Popular</div>
            <div className="mb-4 text-blue-400 font-bold text-sm uppercase tracking-wider">Ministerio</div>
            <div className="text-4xl font-black mb-6">$15 <span className="text-lg text-gray-500 font-normal">/mes</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex gap-3 text-white"><CheckCircle2 className="text-blue-400 shrink-0" size={20}/> Eventos Ilimitados</li>
              <li className="flex gap-3 text-white"><CheckCircle2 className="text-blue-400 shrink-0" size={20}/> Canciones Ilimitadas</li>
              <li className="flex gap-3 text-white"><CheckCircle2 className="text-blue-400 shrink-0" size={20}/> Equipo Ilimitado</li>
              <li className="flex gap-3 text-white"><CheckCircle2 className="text-blue-400 shrink-0" size={20}/> Transposición Automática</li>
            </ul>
            <button onClick={onLoginClick} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/20">Prueba de 14 días</button>
          </div>

          {/* ENTERPRISE */}
          <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col">
            <div className="mb-4 text-gray-400 font-bold text-sm uppercase tracking-wider">Red de Iglesias</div>
            <div className="text-4xl font-black mb-6">Personal</div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex gap-3 text-gray-300"><CheckCircle2 className="text-gray-500 shrink-0" size={20}/> Multi-sede</li>
              <li className="flex gap-3 text-gray-300"><CheckCircle2 className="text-gray-500 shrink-0" size={20}/> Roles Avanzados</li>
              <li className="flex gap-3 text-gray-300"><CheckCircle2 className="text-gray-500 shrink-0" size={20}/> Soporte Prioritario</li>
            </ul>
            <button className="w-full py-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 font-bold transition-all">Contactar</button>
          </div>
        </div>
      </section>

      <footer className="py-12 text-center text-gray-600 text-sm border-t border-zinc-900">
        <p>© 2025 SetlistPro. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}