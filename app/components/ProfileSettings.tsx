"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Camera, Loader2, Save, Mail, Shield, Sparkles } from 'lucide-react';

export default function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  // Datos del perfil
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (!session) return;
      
      setEmail(session.user.email || '');

      const { data, error } = await supabase
        .from('profiles')
        .select(`full_name, website, avatar_url`)
        .eq('id', session.user.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setWebsite(data.website || '');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  // LOGICA DEL AVATAR INTELIGENTE
  // Si hay URL real (subida), úsala.
  // Si no, genera una con las iniciales del nombre (o el email si no hay nombre).
  const getDisplayAvatar = () => {
    if (avatarUrl) return avatarUrl;
    
    // Generador de Avatar por Iniciales (Servicio gratuito ui-avatars)
    const nameForAvatar = fullName || email || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}&background=4f46e5&color=fff&size=256&bold=true`;
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      const { user } = session;

      const updates = {
        id: user.id,
        full_name: fullName,
        website,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      
      alert('¡Perfil actualizado con éxito!');
    } catch (error) {
      alert('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir al bucket "avatars"
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl); 

    } catch (error: any) {
      alert('Error subiendo imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading && !session) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-white"/></div>;

  return (
    <div className="max-w-3xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
      
      <div className="mb-8 flex items-end justify-between">
        <div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">Tu Perfil</h1>
            <p className="text-gray-400">Gestiona tu identidad en la banda.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            <Sparkles size={14} /> Perfil Profesional
        </div>
      </div>

      <div className="bg-[#111] rounded-2xl shadow-sm border border-white/10 overflow-hidden">
        
        {/* BANNER SUPERIOR */}
        <div className="h-32 bg-gradient-to-r from-indigo-900 to-purple-900 w-full relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

        <div className="px-8 pb-8 relative">
            {/* FOTO DE PERFIL SUPERPUESTA */}
            <div className="flex flex-col sm:flex-row items-end sm:items-end gap-6 -mt-16 mb-6">
                
                {/* Contenedor de la foto */}
                <div className="relative group mx-auto sm:mx-0">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-[6px] border-[#111] bg-[#111] shadow-xl">
                        <img 
                            src={getDisplayAvatar()} 
                            alt="Avatar" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    
                    {/* Botón flotante cámara */}
                    <label className="absolute bottom-1 right-1 bg-white text-black p-2.5 rounded-full cursor-pointer shadow-lg hover:bg-gray-200 transition-all transform hover:scale-105" title="Cambiar foto">
                        {uploading ? <Loader2 size={16} className="animate-spin"/> : <Camera size={16} />}
                        <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading}/>
                    </label>
                </div>

                {/* Textos al lado de la foto */}
                <div className="text-center sm:text-left flex-1 pb-2">
                    <h2 className="text-2xl font-bold text-white">{fullName || 'Usuario Nuevo'}</h2>
                    <div className="flex items-center gap-2 text-gray-400 justify-center sm:justify-start text-sm mt-1">
                       <Mail size={14} /> <span>{email}</span>
                    </div>
                </div>
                
                {/* Badge de Verificado */}
                <div className="pb-3 hidden sm:block">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-900/20 text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                        <Shield size={12} fill="currentColor" /> Verificado
                     </span>
                </div>
            </div>

            <hr className="border-white/10 mb-8" />

            {/* FORMULARIO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre Artístico / Completo</label>
                    <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-medium text-white placeholder:text-gray-700"
                        placeholder="Ej. Eladio Martínez"
                    />
                    <p className="text-[10px] text-gray-500">Este nombre aparecerá en los setlists y chats.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sitio Web / Red Social</label>
                    <input 
                        type="text" 
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-medium text-white placeholder:text-gray-700"
                        placeholder="instagram.com/tu_usuario"
                    />
                </div>
            </div>

            <div className="pt-8 flex justify-end">
                <button 
                    onClick={updateProfile}
                    disabled={loading}
                    className="bg-white hover:bg-gray-200 text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-70"
                >
                    {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />}
                    Guardar Cambios
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}