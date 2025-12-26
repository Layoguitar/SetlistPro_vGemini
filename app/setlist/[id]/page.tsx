"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Importamos tus componentes desde la carpeta de componentes
import LiveSetlist from '@/app/components/LiveSetlist';
import SetlistEditor from '@/app/components/SetlistEditor';

export default function SetlistPage({ params }: { params: { id: string } }) {
  // Truco para Next.js 15: Desempaquetamos los params de forma segura
  const { id } = React.use(params as any) as { id: string };

  const [mode, setMode] = useState<'live' | 'edit'>('live');
  const [role, setRole] = useState<'admin' | 'member' | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: member } = await supabase
            .from('organization_members')
            .select('role')
            .eq('user_id', user.id)
            .single();
        setRole(member?.role || 'member');
        
        // AUTO-DETECTAR: Si eres admin y el setlist está vacío, te manda directo a editar
        if (member?.role === 'admin') {
            const { count } = await supabase
                .from('setlist_items')
                .select('*', { count: 'exact', head: true })
                .eq('setlist_id', id);
            
            if (count === 0) setMode('edit');
        }
    }
    setLoading(false);
  };

  if (loading) {
    return (
        <div className="h-screen w-full bg-black flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
    );
  }

  // --- MODO EDITOR (Solo Admins) ---
  if (mode === 'edit' && role === 'admin') {
      return (
          <SetlistEditor 
            setlistId={id} 
            onBack={() => setMode('live')} 
          />
      );
  }

  // --- MODO EN VIVO (Para todos) ---
  return (
    <div className="relative h-full w-full bg-black">
        {/* Botón Flotante para Editar (Solo visible para el Líder) */}
        {role === 'admin' && (
            <button 
                onClick={() => setMode('edit')}
                className="fixed bottom-6 right-6 z-[60] bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-105 flex items-center gap-2 font-bold animate-in fade-in"
                title="Editar Setlist"
            >
                <Edit size={24} /> 
            </button>
        )}
        
        <LiveSetlist 
            setlistId={id} 
            onBack={() => router.push('/')} 
        />
    </div>
  );
}