"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        // REGISTRO
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName } // Esto se manda al Trigger SQL
          }
        });
        if (error) throw error;
        // Si desactivaste la confirmación de email, esto no es necesario,
        // pero es buen mensaje por si acaso.
        alert("¡Cuenta creada! Si no entras automáticamente, inicia sesión.");
      } else {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Error de autenticación:", error.message);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Clase base para los inputs (ahora con texto oscuro)
  const inputClassName = "w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder:text-gray-400 bg-white";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8 border border-gray-100">
        
        <div className="text-center">
          <div className="bg-black w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="text-white font-bold text-lg">SP</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Bienvenido a SetlistPro</h1>
          <p className="text-gray-500 mt-2">
            {isSignUp ? "Crea tu cuenta de músico gratis" : "Inicia sesión para ver tus eventos"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Nombre Completo</label>
              <input 
                type="text" 
                required 
                className={inputClassName}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Pedro Baterista"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Correo Electrónico</label>
            <input 
              type="email" 
              required 
              className={inputClassName}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Contraseña</label>
            <input 
              type="password" 
              required 
              className={inputClassName}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              minLength={6}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-black text-white py-3.5 rounded-lg font-bold text-lg hover:bg-gray-800 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex justify-center shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (isSignUp ? "Registrarse" : "Entrar")}
          </button>
        </form>

        <div className="text-center text-sm pt-2">
          <button 
            onClick={() => {
              setIsSignUp(!isSignUp);
              setEmail(''); setPassword(''); setFullName(''); // Limpiar formulario al cambiar
            }}
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate gratis"}
          </button>
        </div>

      </div>
    </div>
  );
}