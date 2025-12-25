"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';

export default function ProfileSettings({ userId, onBack }: { userId: string, onBack: () => void }) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("musician");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) {
        setFullName(data.full_name || "");
        setRole(data.role || "musician");
      }
    };
    loadData();
  }, [userId]);

  const handleSave = async () => {
    setLoading(true);
    await supabase.from('profiles').update({ full_name: fullName, role: role }).eq('id', userId);
    setLoading(false);
    onBack(); // Volver al dashboard
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-3xl shadow-xl mt-10 border border-gray-100">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 mb-6 font-bold hover:text-black"><ArrowLeft /> Volver</button>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Ajustes de Perfil</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tu Nombre Real</label>
          <input className="w-full p-4 bg-gray-50 border rounded-xl text-gray-900 font-bold" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tu Rol</label>
          <select className="w-full p-4 bg-gray-50 border rounded-xl text-gray-900 font-bold" value={role} onChange={e => setRole(e.target.value)}>
            <option value="admin">Director (Puede crear eventos)</option>
            <option value="musician">Músico (Solo lectura)</option>
          </select>
        </div>
        <button onClick={handleSave} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg hover:bg-blue-700">
          {loading ? <Loader2 className="animate-spin" /> : <Save />} Guardar y Aplicar
        </button>
      </div>
    </div>
  );
}