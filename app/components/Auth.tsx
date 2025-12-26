"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // Alternar entre Login y Registro

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('¡Registro exitoso! Revisa tu correo para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // El redireccionamiento lo maneja page.tsx automáticamente
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
      
      {/* TARJETA PRINCIPAL ESTILO VIDRIO */}
      <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* Luces decorativas superiores */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/20">
             <Sparkles className="text-white" size={20} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isSignUp ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            {isSignUp ? 'Únete para gestionar tu banda.' : 'Ingresa tus credenciales para continuar.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5 relative z-10">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Correo Electrónico</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
              <input
                type="email"
                required
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111] border border-white/10 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {isSignUp ? 'Registrarse Gratis' : 'Iniciar Sesión'} <ArrowRight size={18} />
                </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate gratis'}
          </button>
        </div>
      </div>
    </div>
  );
}