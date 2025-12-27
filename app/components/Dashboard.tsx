"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Music, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Bell, 
  Grid, 
  X 
} from "lucide-react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  date: string;
  songs_count?: number;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Músico");
  
  // ESTADOS NUEVOS PARA EL MODAL DE CREAR
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Músico");
      }
    };

    fetchEvents();
    getUser();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error cargando eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN PARA CREAR EL EVENTO
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDate) return;

    setIsCreating(true);
    try {
      // 1. Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("Debes iniciar sesión para crear eventos");
        return;
      }

      // 2. Insertar en Supabase
      const { data, error } = await supabase
        .from("events")
        .insert([
          { 
            title: newEventTitle, 
            date: newEventDate,
            user_id: user.id // Asumiendo que tu tabla events tiene esta columna
          }
        ])
        .select();

      if (error) throw error;

      // 3. Actualizar la lista y cerrar modal
      if (data) {
        setEvents([...events, ...data]);
        setIsModalOpen(false);
        setNewEventTitle("");
        setNewEventDate("");
      }

    } catch (error) {
      console.error("Error creando evento:", error);
      alert("Hubo un error al crear el evento. Revisa la consola.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
      
      {/* --- MODAL PARA CREAR EVENTO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nuevo Evento</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nombre del Evento</label>
                <input 
                  type="text" 
                  placeholder="Ej: Culto Dominical"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 disabled:opacity-50"
                >
                  {isCreating ? "Creando..." : "Crear Evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- BARRA DE NAVEGACIÓN SUPERIOR --- */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Music className="w-6 h-6" />
          <span className="font-bold text-lg">SetListPro</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <Grid className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <Bell className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium hidden sm:block">{userName}</span>
          </div>

           {/* Botón Logout temporal */}
           <button onClick={handleSignOut} className="ml-4 text-xs text-red-500 hover:underline">
            Salir
          </button>
        </div>
      </header>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="p-6 max-w-4xl mx-auto space-y-8">
        
        {/* Header de Bienvenida */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Buenos días, {userName}</h1>
          <p className="text-gray-500 dark:text-gray-400">Tu centro de comando.</p>
        </div>

        {/* --- SECCIÓN PRÓXIMO SERVICIO / EVENTOS --- */}
        <section className="space-y-4">
          <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              PRÓXIMOS SERVICIOS
            </h2>
            
            {/* --- BOTÓN AHORA ACTIVO --- */}
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
              <button 
                onClick={() => setIsModalOpen(true)} // <--- AQUI ESTÁ LA MAGIA
                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <Plus className="w-6 h-6 text-gray-900 dark:text-white" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Cargando eventos...</div>
            ) : events.length === 0 ? (
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center space-y-2">
                <Music className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-gray-500">Aún no has agregado eventos.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="text-blue-500 font-medium hover:underline"
                >
                  Crear el primero
                </button>
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="group border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-black dark:hover:border-white transition-colors cursor-pointer bg-white dark:bg-gray-900 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{event.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {new Date(event.date).toLocaleDateString("es-CL", { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-xs font-bold border border-black dark:border-white px-2 py-1 rounded">
                      {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Music className="w-4 h-4" />
                      <span>{event.songs_count || 0} Canciones</span>
                    </div>
                  </div>
                </div>
              ))
            )}

            <Link href="/setlist" className="block text-center text-sm font-bold mt-4 hover:underline">
              Gestionar Eventos &gt;
            </Link>
          </div>
        </section>

        {/* --- OTRAS SECCIONES (ESTADO DE CUENTA, ETC) --- */}
        <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            ESTADO DE CUENTA
          </h2>
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
             <div>
               <p className="font-medium">Activo</p>
               <p className="text-xs text-gray-500">Organización ID: Conectado</p>
             </div>
             <span className="text-xs font-bold bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded">PRO</span>
          </div>
        </section>

        <section className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            BIBLIOTECA
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar acordes y letras..." 
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
            />
          </div>
        </section>

      </main>
    </div>
  );
}