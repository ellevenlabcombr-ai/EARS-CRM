"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Trophy, Users, Edit2, X, Search, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface Sport {
  id: string;
  name: string;
  positions: string[];
}

export const SportsSettings = () => {
  const { lang } = useLanguage();
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSportId, setEditingSportId] = useState<string | null>(null);
  const [newSportName, setNewSportName] = useState("");
  const [newSportPositions, setNewSportPositions] = useState<string[]>([]);
  const [newPosition, setNewPosition] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSports = sports.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sports")
        .select("id, name, positions")
        .order("name");
      
      if (error) {
        console.error("Error fetching sports:", error.message, error.details, error.hint);
        throw error;
      }
      setSports(data || []);
    } catch (error: any) {
      console.error("Caught error fetching sports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedSports = async () => {
    const defaultSports = [
      { name: 'Atletismo', positions: ['Velocidade', 'Fundo', 'Saltos', 'Arremessos', 'Marcha'] },
      { name: 'Basquete', positions: ['Armador', 'Ala-Armador', 'Ala', 'Ala-Pivô', 'Pivô'] },
      { name: 'Futsal', positions: ['Goleiro', 'Fixo', 'Ala Direito', 'Ala Esquerdo', 'Pivô'] },
      { name: 'Futebol de Campo', positions: ['Goleiro', 'Lateral Direito', 'Lateral Esquerdo', 'Zagueiro', 'Volante', 'Meia', 'Atacante', 'Centroavante'] },
      { name: 'Handebol', positions: ['Goleiro', 'Ponta Esquerda', 'Ponta Direita', 'Armador Esquerdo', 'Armador Central', 'Armador Direito', 'Pivô'] },
      { name: 'Judô', positions: ['Ligeiro', 'Meio-Leve', 'Leve', 'Meio-Médio', 'Médio', 'Meio-Pesado', 'Pesado'] },
      { name: 'Natação', positions: ['Crawl', 'Costas', 'Peito', 'Borboleta', 'Medley'] },
      { name: 'Tênis', positions: ['Simples', 'Duplas'] },
      { name: 'Volleyball', positions: ['Levantador', 'Oposto', 'Ponteiro', 'Central', 'Líbero'] },
      { name: 'Vôlei de Praia', positions: ['Defesa', 'Bloqueio'] }
    ];

    setLoading(true);
    try {
      const { error } = await supabase
        .from("sports")
        .upsert(defaultSports, { onConflict: 'name' });
      
      if (error) throw error;
      fetchSports();
    } catch (error: any) {
      console.error("Error seeding sports:", error.message);
      alert("Erro ao popular esportes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (sport: Sport) => {
    setEditingSportId(sport.id);
    setNewSportName(sport.name);
    setNewSportPositions(sport.positions || []);
    setIsAdding(true);
  };

  const handleAddSport = async () => {
    if (!newSportName.trim()) return;
    
    try {
      if (editingSportId) {
        const { error } = await supabase
          .from("sports")
          .update({ 
            name: newSportName, 
            positions: newSportPositions.length > 0 ? newSportPositions : ["Atleta"] 
          })
          .eq("id", editingSportId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sports")
          .insert([{ 
            name: newSportName, 
            positions: newSportPositions.length > 0 ? newSportPositions : ["Atleta"] 
          }]);
        
        if (error) throw error;
      }
      
      setNewSportName("");
      setNewSportPositions([]);
      setIsAdding(false);
      setEditingSportId(null);
      fetchSports();
    } catch (error) {
      console.error("Error adding/updating sport:", error);
      alert(lang === "pt" ? "Erro ao salvar esporte. Verifique se já existe." : "Error saving sport. Check if it already exists.");
    }
  };

  const handleDeleteSport = async (id: string) => {
    if (!confirm(lang === "pt" ? "Tem certeza que deseja excluir este esporte?" : "Are you sure you want to delete this sport?")) return;
    
    try {
      // Safety Validation: Check if sport is in use before deleting
      const sportToRemove = sports.find(s => s.id === id);
      if (sportToRemove) {
        const { count, error: countError } = await supabase
          .from("athletes")
          .select("*", { count: "exact", head: true })
          .eq("sport", sportToRemove.name);
          
        if (countError && countError.code !== 'PGRST116') {
            console.error("Error checking athlete sport usage", countError);
        } else if (count && count > 0) {
            alert(lang === "pt" ? `Exclusão bloqueada: Existem ${count} atletas usando '${sportToRemove.name}'.` : `Delete blocked: There are ${count} athletes using '${sportToRemove.name}'.`);
            return;
        }
      }

      const { error } = await supabase
        .from("sports")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      fetchSports();
    } catch (error) {
      console.error("Error deleting sport:", error);
    }
  };

  const addPosition = () => {
    if (newPosition.trim() && !newSportPositions.includes(newPosition.trim())) {
      setNewSportPositions([...newSportPositions, newPosition.trim()]);
      setNewPosition("");
    }
  };

  const removePosition = (pos: string) => {
    setNewSportPositions(newSportPositions.filter(p => p !== pos));
  };

  const movePosition = (index: number, direction: 'up' | 'down') => {
    const newPositions = [...newSportPositions];
    if (direction === 'up' && index > 0) {
      [newPositions[index - 1], newPositions[index]] = [newPositions[index], newPositions[index - 1]];
    } else if (direction === 'down' && index < newPositions.length - 1) {
      [newPositions[index + 1], newPositions[index]] = [newPositions[index], newPositions[index + 1]];
    }
    setNewSportPositions(newPositions);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
            <Trophy className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              {lang === "pt" ? "Gestão de Esportes" : "Sports Management"}
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              {lang === "pt" ? "Configure as modalidades e posições" : "Configure sports and positions"}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === "pt" ? "Buscar esporte..." : "Search sport..."}
              className="bg-slate-900 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors w-full sm:w-48"
            />
          </div>
          <Button 
            onClick={handleSeedSports}
            variant="outline"
            className="border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/50 font-black uppercase tracking-widest rounded-xl"
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {lang === "pt" ? "Popular Padrão" : "Seed Defaults"}
          </Button>
          <Button 
            onClick={() => {
              setEditingSportId(null);
              setNewSportName("");
              setNewSportPositions([]);
              setIsAdding(true);
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-[#050B14] font-black uppercase tracking-widest px-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            {lang === "pt" ? "Novo Esporte" : "New Sport"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/50 border border-cyan-500/30 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                {editingSportId ? <Edit2 className="w-4 h-4 text-cyan-400" /> : <Plus className="w-4 h-4 text-cyan-400" />}
              </div>
              <h3 className="text-white font-bold tracking-wide">
                {editingSportId ? (lang === 'pt' ? 'Editar Esporte' : 'Edit Sport') : (lang === 'pt' ? 'Criar Novo Esporte' : 'Create New Sport')}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">
                  {lang === "pt" ? "Nome da Modalidade" : "Sport Name"}
                </label>
                <input
                  type="text"
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder={lang === "pt" ? "Ex: Basquete" : "Ex: Basketball"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">
                  {lang === "pt" ? "Adicionar Posição" : "Add Position"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPosition()}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder={lang === "pt" ? "Ex: Armador" : "Ex: Point Guard"}
                  />
                  <Button onClick={addPosition} variant="outline" className="border-slate-700 text-slate-400 hover:text-white">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {newSportPositions.length > 0 && (
              <div className="flex flex-col gap-2 pt-2">
                <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">
                  {lang === "pt" ? "Ordem das Posições" : "Positions Order"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {newSportPositions.map((pos, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-2"
                    >
                      {pos}
                      <div className="flex items-center gap-1 border-l border-slate-700 pl-2 ml-1">
                        <button 
                          onClick={() => movePosition(i, 'up')} 
                          disabled={i === 0}
                          className="text-slate-500 disabled:opacity-30 hover:text-white transition-colors"
                          title="Subir na lista"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => movePosition(i, 'down')} 
                          disabled={i === newSportPositions.length - 1}
                          className="text-slate-500 disabled:opacity-30 hover:text-white transition-colors"
                          title="Descer na lista"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => removePosition(pos)} 
                          className="text-slate-500 hover:text-rose-400 ml-1 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsAdding(false);
                  setEditingSportId(null);
                  setNewSportName("");
                  setNewSportPositions([]);
                }}
                className="text-slate-400 hover:text-white"
              >
                {lang === "pt" ? "Cancelar" : "Cancel"}
              </Button>
              <Button 
                onClick={handleAddSport}
                className="bg-cyan-500 hover:bg-cyan-400 text-[#050B14] font-black uppercase tracking-widest px-6 rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                {lang === "pt" ? "Salvar Esporte" : "Save Sport"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-900/30 rounded-2xl animate-pulse border border-slate-800/50" />
          ))
        ) : filteredSports.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-slate-900/20 border border-slate-800/50 rounded-2xl">
            <Search className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">Nenhum esporte encontrado.</p>
          </div>
        ) : (
          filteredSports.map((sport) => (
            <motion.div
              key={sport.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 hover:border-cyan-500/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 group-hover:border-cyan-500/30 transition-colors">
                    <Users className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
                  </div>
                  <h3 className="font-black text-white uppercase tracking-tight">{sport.name}</h3>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={() => handleEditClick(sport)}
                    className="p-2 text-slate-600 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100"
                    title={lang === 'pt' ? 'Editar' : 'Edit'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteSport(sport.id)}
                    className="p-2 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                    title={lang === 'pt' ? 'Excluir' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sport.positions.slice(0, 4).map((pos, i) => (
                  <span key={i} className="text-xxs font-black px-2 py-0.5 bg-slate-800/50 border border-slate-700/50 text-slate-500 rounded-md uppercase tracking-widest">
                    {pos}
                  </span>
                ))}
                {sport.positions.length > 4 && (
                  <span className="text-xxs font-black px-2 py-0.5 bg-slate-800/50 border border-slate-700/50 text-slate-500 rounded-md uppercase tracking-widest">
                    +{sport.positions.length - 4}
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
