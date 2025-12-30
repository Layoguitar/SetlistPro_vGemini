"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Auth from '../components/Auth'; // Asegúrate que esta ruta sea correcta

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // ESCUCHAMOS CUANDO EL USUARIO SE CONECTA
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        
        // 1. ¿Tenía una invitación pendiente?
        const pendingCode = localStorage.getItem('pending_invite');
        
        if (pendingCode) {
            // ¡SÍ! Lo mandamos de vuelta a la invitación para que se una
            localStorage.removeItem('pending_invite'); // Ya no la necesitamos guardar
            router.push(`/join/${pendingCode}`);
        } else {
            // NO, es un login normal. Lo mandamos al Dashboard (o Inicio)
            router.push('/'); 
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Usamos tu componente Auth existente */}
        <Auth />
      </div>
    </div>
  );
}