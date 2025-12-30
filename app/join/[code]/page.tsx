"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando invitación...');
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    const processInvite = async () => {
      const inviteCode = params?.code;
      if (!inviteCode) return;

      // 1. ¿EL USUARIO ESTÁ LOGUEADO?
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
         // Guardamos a dónde quería ir y lo mandamos al login
         localStorage.setItem('pending_invite', inviteCode as string);
         router.push('/login'); 
         return;
      }

      // 2. BUSCAR LA ORGANIZACIÓN
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('invite_code', inviteCode)
        .single();

      if (orgError || !org) {
        setStatus('error');
        setMessage('Este enlace de invitación no existe o ha caducado.');
        return;
      }

      setOrgName(org.name);

      // 3. UNIR AL USUARIO AL EQUIPO
      const { error: joinError } = await supabase
        .from('organization_members')
        .insert({
           organization_id: org.id,
           user_id: user.id,
           role: 'member'
        });

      // Si da error, verificamos si es porque YA era miembro
      if (joinError) {
        if (joinError.code === '23505' || joinError.message.includes('duplicate')) {
            setStatus('success');
            setMessage(`¡Ya eres parte de ${org.name}! Redirigiendo...`);
            // CORRECCIÓN: Mandar al Home '/' en vez de '/dashboard'
            setTimeout(() => router.push('/'), 2000); 
        } else {
            setStatus('error');
            setMessage('Hubo un error al unirte: ' + joinError.message);
        }
      } else {
         // ÉXITO TOTAL
         setStatus('success');
         setMessage(`¡Bienvenido a ${org.name}!`);
         // CORRECCIÓN: Mandar al Home '/' en vez de '/dashboard'
         setTimeout(() => router.push('/'), 2000);
      }
    };

    processInvite();
  }, [params, router]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="bg-[#111] border border-zinc-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
        
        {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
                <h2 className="text-xl font-bold animate-pulse">{message}</h2>
            </div>
        )}

        {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8 animate-in zoom-in">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle size={32} />
                </div>
                <h2 className="text-2xl font-black text-white">{orgName}</h2>
                <p className="text-green-400 font-medium">{message}</p>
                <p className="text-zinc-500 text-sm mt-4">Te estamos llevando a tu panel...</p>
            </div>
        )}

        {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-2">
                    <XCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-white">Ups, algo salió mal</h2>
                <p className="text-red-400">{message}</p>
                {/* CORRECCIÓN: Botón redirige al Home '/' */}
                <button onClick={() => router.push('/')} className="mt-6 bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                    Ir al Inicio <ArrowRight size={18}/>
                </button>
            </div>
        )}

      </div>
    </div>
  );
}