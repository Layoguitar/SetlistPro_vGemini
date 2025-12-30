"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserPlus, Copy, Loader2, Trash2, Crown, CheckCircle, Link as LinkIcon } from 'lucide-react';

interface GlobalTeamProps { orgId: string; userRole: string | null; }

export default function GlobalTeam({ orgId, userRole }: GlobalTeamProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  useEffect(() => { 
      if (orgId) {
          fetchMembers();
          if (isAdmin) fetchInviteCode();
      }
  }, [orgId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('organization_members')
        .select(`user_id, role, profile:profiles ( full_name, avatar_url, email, main_instrument )`)
        .eq('organization_id', orgId);
      if (data) setMembers(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // NUEVA FUNCIÓN: Trae el código corto que generamos en SQL
  const fetchInviteCode = async () => {
      const { data } = await supabase.from('organizations')
        .select('invite_code')
        .eq('id', orgId)
        .single();
      if (data) setInviteCode(data.invite_code);
  };

  const removeMember = async (id: string) => {
    if (!confirm("¿Eliminar usuario de la organización?")) return;
    await supabase.from('organization_members').delete().eq('organization_id', orgId).eq('user_id', id);
    setMembers(members.filter(m => m.user_id !== id));
  };

  const copyInviteLink = () => {
      if (!inviteCode) return;
      // Genera el link automático usando la dirección actual de tu web
      const link = `${window.location.origin}/join/${inviteCode}`;
      
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Tu Banda</h1>
            <p className="text-gray-500 dark:text-zinc-400 mt-2 text-lg">Gestiona quién tiene acceso a los eventos.</p>
        </div>
        {isAdmin && (
            <button 
                onClick={() => setShowInvite(!showInvite)} 
                className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg hover:-translate-y-1 ${showInvite ? 'bg-gray-200 text-gray-800 dark:bg-zinc-800 dark:text-white' : 'bg-black dark:bg-white text-white dark:text-black'}`}
            >
                {showInvite ? <XIcon /> : <UserPlus size={20}/>} 
                {showInvite ? 'Cerrar' : 'Invitar Miembro'}
            </button>
        )}
      </div>

      {/* TARJETA DE INVITACIÓN MEJORADA */}
      {showInvite && isAdmin && (
        <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-900/20 flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-top-4">
            <div className="space-y-1">
                <h3 className="text-2xl font-bold flex items-center gap-2"><LinkIcon className="text-indigo-300"/> Link de Invitación</h3>
                <p className="text-indigo-200 max-w-md">Envía este enlace por WhatsApp. Al hacer clic, los músicos se unirán automáticamente a tu equipo.</p>
            </div>
            
            <div className="flex w-full md:w-auto bg-black/20 p-2 pl-6 rounded-2xl items-center gap-4 border border-white/10 backdrop-blur-sm">
                <code className="font-mono font-bold text-lg truncate max-w-[200px] md:max-w-xs text-indigo-100">
                    {inviteCode ? `${typeof window !== 'undefined' ? window.location.host : ''}/join/${inviteCode}` : 'Cargando...'}
                </code>
                <button 
                    onClick={copyInviteLink} 
                    disabled={!inviteCode}
                    className="p-3 bg-white text-indigo-600 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md font-bold flex items-center gap-2"
                >
                    {copied ? <CheckCircle size={20}/> : <Copy size={20}/>}
                    {copied ? '¡Copiado!' : 'Copiar'}
                </button>
            </div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin mb-4" size={32}/>
            <p>Cargando equipo...</p>
        </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {members.map((m) => (
                  <div key={m.user_id} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-zinc-800 p-5 rounded-3xl flex items-center gap-4 hover:border-indigo-500/50 hover:shadow-lg dark:hover:shadow-indigo-900/10 transition-all group relative overflow-hidden">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-gray-500 dark:text-gray-300 overflow-hidden shrink-0 border-2 border-white dark:border-zinc-700 shadow-sm">
                          {m.profile?.avatar_url ? (
                              <img src={m.profile.avatar_url} className="w-full h-full object-cover"/>
                          ) : (
                              <span className="text-lg">{m.profile?.full_name?.substring(0,2) || '?'}</span>
                          )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0 z-10">
                          <div className="flex justify-between items-center mb-1">
                              <h4 className="font-bold text-gray-900 dark:text-white truncate text-lg">{m.profile?.full_name || 'Sin Nombre'}</h4>
                              {m.role === 'admin' || m.role === 'owner' ? (
                                  <Crown size={16} className="text-yellow-500 fill-yellow-500 shrink-0 drop-shadow-sm"/>
                              ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${m.role === 'owner' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-500'}`}>
                                  {m.role === 'owner' ? 'Dueño' : m.role === 'admin' ? 'Admin' : 'Músico'}
                              </span>
                              {m.profile?.main_instrument && (
                                  <span className="text-xs text-gray-400 truncate max-w-[120px]">
                                      • {Array.isArray(m.profile.main_instrument) ? m.profile.main_instrument[0] : m.profile.main_instrument}
                                  </span>
                              )}
                          </div>
                      </div>

                      {/* Botón Borrar (Solo Admin) */}
                      {isAdmin && m.role !== 'owner' && m.user_id !== members.find(me => me.role === 'owner')?.user_id && (
                          <button 
                            onClick={() => removeMember(m.user_id)} 
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-sm translate-x-10 group-hover:translate-x-0"
                            title="Expulsar miembro"
                          >
                              <Trash2 size={18}/>
                          </button>
                      )}
                  </div>
              ))}
              
              {/* Card Vacía / Placeholder */}
              {members.length === 0 && (
                  <div className="col-span-full py-10 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl">
                      <p>No hay nadie aquí... ¡Invita a tu equipo!</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}

// Icono simple para cerrar
function XIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    )
}