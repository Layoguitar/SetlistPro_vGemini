import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LogOut, Users, UserPlus, Music, Loader2, ArrowRight, X, PlayCircle } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await supabase.auth.signOut(); window.location.reload(); } 
    catch (error) { setIsLoggingOut(false); }
  };

  const handleJoinBand = async () => {
    if (!inviteCode.trim()) return alert("Ingresa un código válido.");
    setJoining(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No usuario");

      const { error } = await supabase.from('organization_members').insert({
          organization_id: inviteCode.trim(),
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;
      alert("¡Bienvenido al equipo!");
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      alert("Error al unirse: Verifica el código.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-6 relative overflow-hidden font-sans">
      
      {/* Fondo Ambient (Degradado sutil detrás) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* --- EL LOGO QUE TE GUSTÓ --- */}
      <div className="relative z-10 flex flex-col items-center mb-12 animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
           <Music className="w-12 h-12 text-white drop-shadow-md" strokeWidth={2.5} />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
          Setlist Pro
        </h1>
        <p className="text-gray-400 text-lg font-medium">Bienvenido al equipo.</p>
      </div>

      {/* --- CAJA DE ACCIONES --- */}
      <div className="relative z-10 w-full max-w-sm space-y-4 animate-in slide-in-from-bottom-8 duration-700 delay-150">
        
        {!showJoinInput ? (
            <div className="space-y-3">
                {/* Botón Crear (Futuro) */}
                <button 
                  onClick={() => console.log("Crear - Proximamente")}
                  className="w-full bg-[#111] border border-white/10 hover:border-indigo-500/50 hover:bg-[#151515] p-4 rounded-2xl flex items-center gap-4 transition-all group"
                >
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <PlayCircle size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-white">Crear Banda</h3>
                    <p className="text-xs text-gray-500">Soy líder o director</p>
                  </div>
                </button>

                {/* Botón Unirse */}
                <button 
                  onClick={() => setShowJoinInput(true)}
                  className="w-full bg-white text-black hover:bg-gray-200 p-4 rounded-2xl flex items-center gap-4 transition-all shadow-lg group"
                >
                  <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                     <Users size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold">Unirme a un Equipo</h3>
                    <p className="text-xs text-gray-600 font-medium">Tengo un código</p>
                  </div>
                </button>
            </div>
        ) : (
            // INPUT CÓDIGO
            <div className="bg-[#111] border border-white/10 p-6 rounded-3xl animate-in zoom-in-95 duration-200 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white text-lg">Ingresa tu código</h3>
                    <button onClick={() => setShowJoinInput(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X size={16}/></button>
                </div>
                
                <input 
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Ej: 1808bbfb..."
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white mb-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-mono text-sm text-center tracking-wide"
                    autoFocus
                />

                <button 
                    onClick={handleJoinBand}
                    disabled={joining || !inviteCode}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                    {joining ? <Loader2 className="animate-spin"/> : <ArrowRight size={20} />}
                    {joining ? 'Entrando...' : 'Confirmar'}
                </button>
            </div>
        )}

      </div>

      <div className="mt-12 relative z-10">
        <button onClick={handleLogout} disabled={isLoggingOut} className="text-xs font-bold text-zinc-600 hover:text-red-400 flex items-center gap-2 transition-colors py-2 px-4 rounded-full hover:bg-white/5 disabled:opacity-50">
          {isLoggingOut ? <Loader2 className="animate-spin" size={12} /> : <LogOut size={12} />}
          Cerrar sesión actual
        </button>
      </div>
    </div>
  );
}