"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Camera, Loader2, Save, Mail, Shield, Sparkles, LogOut, 
  Building2, Check, XCircle, CheckCircle2, UploadCloud, Music // <--- AQUÍ AGREGUÉ EL ICONO QUE FALTABA
} from 'lucide-react';

// Lista de instrumentos
const AVAILABLE_INSTRUMENTS = [
  "Voz", "Líder", "Guitarra Eléctrica", "Guitarra Acústica", 
  "Bajo", "Batería", "Piano", "Teclas", "Sintetizador",
  "Violín", "Cello", "Saxofón", "Trompeta", 
  "Sonido", "Multimedia", "Luces", "Streaming"
];

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  // Datos del perfil
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [instruments, setInstruments] = useState<string[]>([]);
  const [orgData, setOrgData] = useState<any>(null);

  // Sistema de Notificaciones (Toasts)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    getProfile();
  }, []);

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (!session) return;
      setEmail(session.user.email || '');

      const { data } = await supabase
        .from('profiles')
        .select(`full_name, website, avatar_url, main_instrument`)
        .eq('id', session.user.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setWebsite(data.website || '');
        setAvatarUrl(data.avatar_url);
        setInstruments(Array.isArray(data.main_instrument) ? data.main_instrument : []);
      }

      const { data: member } = await supabase
          .from('organization_members')
          .select('role, organization:organizations(name)')
          .eq('user_id', session.user.id)
          .maybeSingle();
      
      if (member) setOrgData(member);

    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!fullName.trim()) return showNotify('error', 'El nombre es obligatorio');

    try {
      setSaving(true);
      const updates = {
        id: session.user.id,
        full_name: fullName,
        website,
        avatar_url: avatarUrl,
        main_instrument: instruments,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      
      showNotify('success', '¡Perfil actualizado correctamente!');

    } catch (error: any) {
      showNotify('error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      showNotify('success', 'Imagen subida. No olvides guardar cambios.');

    } catch (error: any) {
      showNotify('error', 'Error al subir imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const leaveOrganization = async () => {
    if (!confirm("¿Estás seguro de que quieres salir de la organización? Perderás acceso a los eventos.")) return;
    
    try {
        const { error } = await supabase
            .from('organization_members')
            .delete()
            .eq('user_id', session.user.id);
        
        if (error) throw error;
        window.location.reload();
    } catch (error: any) {
        showNotify('error', error.message);
    }
  };

  const toggleInstrument = (inst: string) => {
    if (instruments.includes(inst)) {
      setInstruments(instruments.filter(i => i !== inst));
    } else {
      setInstruments([...instruments, inst]);
    }
  };

  if (loading && !session) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500 w-8 h-8"/></div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              {notification.type === 'success' ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}
              <span className="font-bold">{notification.message}</span>
          </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">Tu Perfil</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Personaliza cómo te ve tu equipo.</p>
        </div>
        {orgData && (
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-800">
                <Building2 size={16} />
                <span className="text-sm font-bold">{orgData.organization?.name || 'Organización'}</span>
                <span className="w-1 h-1 bg-indigo-400 rounded-full mx-1"></span>
                <span className="text-xs uppercase tracking-wider opacity-80">{orgData.role}</span>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         <div className="lg:col-span-1 space-y-6">
             <div className="bg-white dark:bg-[#111] rounded-[2rem] p-6 border border-gray-200 dark:border-zinc-800 shadow-sm text-center relative overflow-hidden group">
                 <div className="relative inline-block mx-auto mb-4">
                     <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-zinc-800 shadow-xl bg-gray-100 dark:bg-zinc-900">
                         {avatarUrl ? (
                             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center text-3xl font-black text-gray-300">
                                 {fullName.substring(0,2).toUpperCase() || 'YO'}
                             </div>
                         )}
                     </div>
                     <label className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110 active:scale-95">
                         {uploading ? <Loader2 className="animate-spin" size={18}/> : <Camera size={18}/>}
                         <input 
                           type="file" 
                           accept="image/*" 
                           onChange={handleAvatarUpload} 
                           disabled={uploading}
                           className="hidden" 
                         />
                     </label>
                 </div>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{fullName || 'Sin Nombre'}</h2>
                 <p className="text-sm text-gray-500 mb-6">{email}</p>
                 
                 <div className="border-t border-gray-100 dark:border-zinc-800 pt-6 mt-2">
                    <button onClick={leaveOrganization} className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 py-2 rounded-xl transition-colors text-sm font-bold">
                        <LogOut size={16}/> Salir de la Organización
                    </button>
                 </div>
             </div>
         </div>

         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#111] rounded-[2rem] p-8 border border-gray-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Sparkles className="text-indigo-500" size={20}/> Información Básica
                </h3>
                
                <div className="grid gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre Artístico</label>
                        <input 
                            type="text" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3.5 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:font-normal"
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Instagram / Usuario</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-400 font-bold">@</span>
                            <input 
                                type="text" 
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                className="w-full pl-8 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="usuario"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111] rounded-[2rem] p-8 border border-gray-200 dark:border-zinc-800 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Music className="text-purple-500" size={20}/> Tus Roles
                </h3>
                <p className="text-gray-500 text-sm mb-6">Selecciona todos los instrumentos o roles que puedes desempeñar.</p>

                <div className="flex flex-wrap gap-2">
                    {AVAILABLE_INSTRUMENTS.map(inst => {
                        const isSelected = instruments.includes(inst);
                        return (
                            <button
                                key={inst}
                                onClick={() => toggleInstrument(inst)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 active:scale-95
                                    ${isSelected 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                                        : 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600'
                                    }`}
                            >
                                {isSelected ? <CheckCircle2 size={16} /> : null}
                                {inst}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="sticky bottom-4 z-10">
                <button 
                    onClick={updateProfile} 
                    disabled={saving}
                    className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-lg shadow-2xl hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-70 disabled:translate-y-0 flex items-center justify-center gap-3"
                >
                    {saving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24} />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
         </div>
      </div>
    </div>
  );
}