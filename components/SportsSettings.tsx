"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Trophy, Users, Edit2, X, Search, ChevronUp, ChevronDown, GripVertical, Zap, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
}

interface Sport {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  target_athletes?: number;
  custom_fields?: CustomField[];
  positions: string[];
  athleteCount?: number;
  order_index?: number;
  is_active?: boolean;
}

// Helper to generate gradient from hex
const getGradientState = (hex: string) => {
  if (!hex || !hex.startsWith('#')) return 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, #050B14 100%)';
  return `linear-gradient(135deg, ${hex}20 0%, #050B14 100%)`;
};

export const SportsSettings = () => {
  const { language } = useLanguage();
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSportId, setEditingSportId] = useState<string | null>(null);
  
  // New Sport State
  const [newSportName, setNewSportName] = useState("");
  const [newSportIcon, setNewSportIcon] = useState("🏆");
  const [newSportColor, setNewSportColor] = useState("#06b6d4");
  const [newSportTarget, setNewSportTarget] = useState<number>(20);
  const [newSportCustomFields, setNewSportCustomFields] = useState<CustomField[]>([]);
  const [newSportPositions, setNewSportPositions] = useState<string[]>([]);
  const [newSportIsActive, setNewSportIsActive] = useState<boolean>(true);
  
  // Auxiliary UI state
  const [newPosition, setNewPosition] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fetchSports = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch with order_index
      let { data, error } = await supabase
        .from("sports")
        .select("*")
        .order("order_index", { ascending: true })
        .order("name", { ascending: true });
      
      // Fallback if column doesn't exist
      if (error && (error.code === 'PGRST100' || error.code === '42703' || error.message?.includes('order_index'))) {
        console.warn("order_index column might be missing, falling back to name order");
        const fallback = await supabase
          .from("sports")
          .select("*")
          .order("name", { ascending: true });
        data = fallback.data;
        error = fallback.error;
      }
      
      if (error) throw error;
      
      const { data: athletesData, error: athletesError } = await supabase.from("athletes").select("modalidade");
      if (athletesError) console.error("Error fetching athlete counts:", athletesError);

      const countsMap: Record<string, number> = {};
      athletesData?.forEach(a => { 
        if (a.modalidade) {
          countsMap[a.modalidade] = (countsMap[a.modalidade] || 0) + 1; 
        }
      });

      setSports((data || []).map(s => ({ ...s, athleteCount: countsMap[s.name] || 0 })));
    } catch (error) {
      console.error("Error fetching sports:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSports(); }, [fetchSports]);

  const handleAddSport = async () => {
    if (!newSportName.trim()) return;
    
    setLoading(true);
    let payload: any = {
      name: newSportName,
      icon: newSportIcon,
      color: newSportColor,
      target_athletes: newSportTarget,
      custom_fields: newSportCustomFields,
      positions: newSportPositions.length > 0 ? newSportPositions : ["Atleta"],
      is_active: newSportIsActive,
      updated_at: new Date().toISOString(),
      order_index: editingSportId 
        ? sports.find(s => s.id === editingSportId)?.order_index || 0 
        : sports.length
    };

    try {
      let result;
      if (editingSportId) {
        result = await supabase.from("sports").update(payload).eq("id", editingSportId);
      } else {
        result = await supabase.from("sports").insert([payload]);
      }
      
      let error = result.error;

      // Fallback robusto se colunas novas estiverem faltando
      if (error && (error.code === '42703' || error.message?.includes('column'))) {
        console.warn("Detectadas colunas ausentes no banco. Tentando salvamento simplificado (Legacy Mode)...");
        const { order_index, is_active, color, target_athletes, custom_fields, positions, ...legacyPayload } = payload;
        if (editingSportId) {
          result = await supabase.from("sports").update(legacyPayload).eq("id", editingSportId);
        } else {
          result = await supabase.from("sports").insert([legacyPayload]);
        }
        error = result.error;
      }
      
      if (error) {
        console.error("DETAILED SPORT SAVE ERROR:", error);
        if (error.code === '23505') {
          alert(language === 'pt' ? 'Já existe um esporte com este nome.' : 'A sport with this name already exists.');
        } else {
          const detailMsg = error.message || JSON.stringify(error);
          alert(language === 'pt' 
            ? `Erro crítico ao salvar: ${detailMsg}. Tente usar o botão 'Otimizar Banco' em Configurações > Desenvolvimento.` 
            : `Critical save error: ${detailMsg}. Try using 'Optimize DB' in Settings > Development.`);
        }
        return;
      }
      
      setIsAdding(false);
      resetForm();
      await fetchSports();
      alert(language === 'pt' ? 'Esporte salvo com sucesso!' : 'Sport saved successfully!');
    } catch (error: any) {
      console.error("CATCH ERROR SAVING SPORT:", error);
      alert(language === 'pt' 
        ? `Inconsistência detectada: ${error.message || 'Erro desconhecido'}` 
        : `Inconsistency detected: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingSportId(null);
    setNewSportName("");
    setNewSportIcon("🏆");
    setNewSportColor("#06b6d4");
    setNewSportTarget(20);
    setNewSportCustomFields([]);
    setNewSportPositions([]);
    setNewSportIsActive(true);
  };

  const handleEditClick = (sport: Sport) => {
    setEditingSportId(sport.id);
    setNewSportName(sport.name);
    setNewSportIcon(sport.icon || "🏆");
    setNewSportColor(sport.color || "#06b6d4");
    setNewSportTarget(sport.target_athletes || 20);
    setNewSportCustomFields(sport.custom_fields || []);
    setNewSportPositions(sport.positions || []);
    setNewSportIsActive(sport.is_active ?? true);
    setIsAdding(true);
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      type: 'text'
    };
    setNewSportCustomFields([...newSportCustomFields, newField]);
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setNewSportCustomFields(newSportCustomFields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleDeleteSport = async (id: string) => {
    if (!confirm(language === "pt" ? "Tem certeza que deseja excluir este esporte?" : "Are you sure you want to delete this sport?")) return;
    
    try {
      // Safety Validation: Check if sport is in use before deleting
      const sportToRemove = sports.find(s => s.id === id);
      if (sportToRemove) {
        const { count, error: countError } = await supabase
          .from("athletes")
          .select("*", { count: "exact", head: true })
          .eq("modalidade", sportToRemove.name);
          
        if (countError && countError.code !== 'PGRST116') {
            console.error("Error checking athlete sport usage", countError);
        } else if (count && count > 0) {
            alert(language === "pt" ? `Exclusão bloqueada: Existem ${count} atletas usando '${sportToRemove.name}'.` : `Delete blocked: There are ${count} athletes using '${sportToRemove.name}'.`);
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

  const filteredSports = sports.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSeedSports = async () => {
    const defaults = [
      { name: "Futebol", icon: "⚽", color: "#10b981", positions: ["Goleiro", "Zagueiro", "Lateral", "Volante", "Meia", "Atacante", "Ponta"], target_athletes: 22, order_index: 0, is_active: true },
      { name: "Futsal", icon: "⚽", color: "#06b6d4", positions: ["Goleiro", "Fixo", "Ala", "Pivô"], target_athletes: 12, order_index: 1, is_active: true },
      { name: "Vôlei", icon: "🏐", color: "#6366f1", positions: ["Levantador", "Ponteiro", "Central", "Oposto", "Líbero"], target_athletes: 12, order_index: 2, is_active: true },
      { name: "Basquete", icon: "🏀", color: "#f59e0b", positions: ["Armador", "Ala", "Ala-Pivô", "Pivô"], target_athletes: 12, order_index: 3, is_active: true },
      { name: "Handebol", icon: "🤾", color: "#f43f5e", positions: ["Goleiro", "Armador Central", "Armador Lateral", "Ponta", "Pivô"], target_athletes: 14, order_index: 4, is_active: true },
      { name: "Natação", icon: "🏊", color: "#0ea5e9", positions: ["Velocista", "Fundo", "Medley", "Revezamento"], target_athletes: 20, order_index: 5, is_active: true },
      { name: "Judô", icon: "🥋", color: "#f8fafc", positions: ["Atleta"], target_athletes: 20, order_index: 6, is_active: true },
      { name: "Jiu-Jitsu", icon: "🥋", color: "#4f46e5", positions: ["Atleta"], target_athletes: 20, order_index: 7, is_active: true },
      { name: "Karatê", icon: "🥋", color: "#dc2626", positions: ["Atleta"], target_athletes: 20, order_index: 8, is_active: true },
      { name: "Boxe", icon: "🥊", color: "#ef4444", positions: ["Atleta"], target_athletes: 10, order_index: 9, is_active: true },
      { name: "Muay Thai", icon: "🥊", color: "#b91c1c", positions: ["Atleta"], target_athletes: 15, order_index: 10, is_active: true },
      { name: "Tênis", icon: "🎾", color: "#84cc16", positions: ["Simples", "Duplas"], target_athletes: 8, order_index: 11, is_active: true },
      { name: "Beach Tennis", icon: "🏖️", color: "#fcd34d", positions: ["Simples", "Duplas"], target_athletes: 8, order_index: 12, is_active: true },
      { name: "Surf", icon: "🏄", color: "#06b6d4", positions: ["Surfista"], target_athletes: 10, order_index: 13, is_active: true },
      { name: "Skate", icon: "🛹", color: "#64748b", positions: ["Street", "Park"], target_athletes: 10, order_index: 14, is_active: true },
      { name: "Atletismo", icon: "🏃", color: "#fb923c", positions: ["Velocista", "Fundo", "Salto", "Arremesso"], target_athletes: 15, order_index: 15, is_active: true },
      { name: "Crossfit", icon: "🏋️", color: "#f97316", positions: ["RX", "Scalad", "Amador"], target_athletes: 30, order_index: 16, is_active: true },
      { name: "Musculação", icon: "💪", color: "#475569", positions: ["Aluno"], target_athletes: 100, order_index: 17, is_active: true },
      { name: "Ciclismo", icon: "🚴", color: "#10b981", positions: ["Estrada", "MTB"], target_athletes: 10, order_index: 18, is_active: true },
      { name: "Futebol Americano", icon: "🏈", color: "#1e3a8a", positions: ["QB", "WR", "RB", "Linha", "Defesa"], target_athletes: 45, order_index: 19, is_active: true },
      { name: "Rugby", icon: "🏉", color: "#166534", positions: ["Avançado", "Linha"], target_athletes: 20, order_index: 20, is_active: true },
      { name: "Tênis de Mesa", icon: "🏓", color: "#dc2626", positions: ["Atleta"], target_athletes: 10, order_index: 21, is_active: true },
      { name: "Triathlon", icon: "🏊", color: "#0ea5e9", positions: ["Atleta"], target_athletes: 5, order_index: 22, is_active: true },
      { name: "Padel", icon: "🎾", color: "#10b981", positions: ["Simples", "Duplas"], target_athletes: 8, order_index: 23, is_active: true },
      { name: "Ginástica", icon: "🤸", color: "#d946ef", positions: ["Atleta"], target_athletes: 10, order_index: 24, is_active: true }
    ];

    if (!confirm(language === 'pt' ? 'Isso irá adicionar as modalidades padrão à sua lista. Deseja continuar?' : 'This will add default sports to your list. Continue?')) return;

    try {
      setLoading(true);
      let { error } = await supabase.from("sports").upsert(defaults, { onConflict: 'name' });
      
      if (error && (error.code === '42703' || error.message?.includes('column'))) {
        console.warn("Retrying seed without extended columns...");
        const cleanDefaults = defaults.map(({ order_index, is_active, color, target_athletes, custom_fields, positions, ...rest }: any) => rest);
        const retry = await supabase.from("sports").upsert(cleanDefaults, { onConflict: 'name' });
        error = retry.error;
      }

      if (error) throw error;
      await fetchSports();
      alert(language === 'pt' ? 'Lista restaurada com sucesso!' : 'List restored successfully!');
    } catch (err: any) {
      console.error("Error seeding sports:", err);
      alert(language === 'pt' ? `Erro: ${err.message || err}` : `Error: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSportStatus = async (sport: Sport) => {
    const newStatus = !sport.is_active;
    try {
      const { error } = await supabase
        .from("sports")
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq("id", sport.id);
      
      if (error) throw error;
      setSports(sports.map(s => s.id === sport.id ? { ...s, is_active: newStatus } : s));
    } catch (error) {
      console.error("Error toggling sport status:", error);
    }
  };

  const handleReorder = async (newOrder: Sport[]) => {
    // Update local state immediately for responsiveness
    setSports(newOrder);
    
    // Update order_index for all sports in the database
    const updates = newOrder.map((sport, index) => ({
      id: sport.id,
      name: sport.name,
      order_index: index,
      updated_at: new Date().toISOString()
    }));

    try {
      const { error } = await supabase.from("sports").upsert(updates, { onConflict: 'id' });
      
      // If column is missing, we can't save order, so we just log it
      if (error && (error.code === '42703' || error.message?.includes('order_index'))) {
        console.warn("Column order_index missing, cannot save sort order");
        return;
      }

      if (error) throw error;
    } catch (error) {
      console.error("Error saving new order:", error);
      fetchSports();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4">
        <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === "pt" ? "Buscar esporte..." : "Search sport..."}
            className="bg-slate-900 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors w-full sm:w-64"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            onClick={handleSeedSports}
            variant="outline"
            className="border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/50 font-black uppercase tracking-widest rounded-xl transition-all w-full sm:w-auto"
            disabled={loading}
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {language === "pt" ? "Restaurar Padrão" : "Restore Defaults"}
          </Button>
          <Button 
            onClick={() => {
              setEditingSportId(null);
              setNewSportName("");
              setNewSportIcon("🏆");
              setNewSportColor("#06b6d4");
              setNewSportPositions([]);
              setNewSportIsActive(true);
              setIsAdding(true);
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-[#050B14] font-black uppercase tracking-widest px-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            {language === "pt" ? "Novo Esporte" : "New Sport"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/50 border border-cyan-500/30 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                {editingSportId ? <Edit2 className="w-4 h-4 text-cyan-400" /> : <Plus className="w-4 h-4 text-cyan-400" />}
              </div>
              <h3 className="text-white font-bold tracking-wide">
                {editingSportId ? (language === 'pt' ? 'Editar Esporte' : 'Edit Sport') : (language === 'pt' ? 'Criar Novo Esporte' : 'Create New Sport')}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">
                      {language === "pt" ? "Status da Modalidade" : "Sport Status"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewSportIsActive(!newSportIsActive)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        newSportIsActive 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-black' 
                          : 'bg-rose-500/10 border-rose-500/50 text-rose-400 font-black'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-widest">
                        {newSportIsActive 
                          ? (language === 'pt' ? 'ATIVO NO SISTEMA' : 'ACTIVE IN SYSTEM') 
                          : (language === 'pt' ? 'INATIVO / OCULTO' : 'INACTIVE / HIDDEN')}
                      </span>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${newSportIsActive ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${newSportIsActive ? 'right-1' : 'left-1'}`} />
                      </div>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">
                      {language === "pt" ? "Nome da Modalidade" : "Sport Name"}
                    </label>
                  <input
                    type="text"
                    value={newSportName}
                    onChange={(e) => setNewSportName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder={language === "pt" ? "Ex: Basquete" : "Ex: Basketball"}
                  />
                </div>
 
                <div className="space-y-3">
                  <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">
                    {language === "pt" ? "Cor da Modalidade" : "Sport Color"}
                  </label>
                  <div className="relative">
                    <div 
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-slate-700 pointer-events-none"
                      style={{ backgroundColor: newSportColor }}
                    />
                    <input
                      type="text"
                      value={newSportColor}
                      onChange={(e) => setNewSportColor(e.target.value)}
                      placeholder="#000000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    />
                  </div>
                </div>
 
                <div className="space-y-2">
                  <label className="text-xxs font-black text-slate-500 uppercase tracking-widest flex justify-between">
                    {language === "pt" ? "Meta de Atletas" : "Athlete Target"}
                    <span className="text-cyan-400">{newSportTarget}</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={newSportTarget}
                    onChange={(e) => setNewSportTarget(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
 
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xxs font-black text-slate-400 uppercase tracking-widest pl-1">
                      {language === "pt" ? "Ícone do Esporte" : "Sport Icon"}
                    </label>
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors"
                    >
                      {showEmojiPicker 
                        ? (language === "pt" ? "Fechar Sugestões" : "Close Suggestions")
                        : (language === "pt" ? "Explorar Sugestões" : "Explore Suggestions")
                      }
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-4xl hover:scale-110 active:scale-95 transition-transform"
                    >
                      {newSportIcon}
                    </button>
                    <div className="flex-1 space-y-2">
                       <input 
                        type="text" 
                        value={newSportIcon}
                        onChange={(e) => setNewSportIcon(e.target.value)}
                        placeholder="Emoji"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm font-bold"
                      />
                      <p className="text-[9px] text-slate-500 font-medium leading-relaxed px-1">
                        {language === "pt" 
                          ? "DICA: Você pode colar qualquer emoji ou escolher um sugerido." 
                          : "TIP: You can paste any emoji or pick a suggested one."}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 grid grid-cols-5 gap-2">
                          {["⚽", "🏀", "🏐", "🎾", "🏊", "🏃", "🥋", "🤾", "🏋️", "🥊", "🏇", "🚣", "🏹", "🏌️", "⛸️", "🎯", "🚲", "🎿", "🏄", "🏈", "⚾", "🥎", "🏒", "🏏", "🏓"].map((icon, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setNewSportIcon(icon);
                                setShowEmojiPicker(false);
                              }}
                              className={`w-full h-10 flex items-center justify-center rounded-lg text-xl transition-all ${
                                newSportIcon === icon 
                                  ? "bg-cyan-500/20 border border-cyan-500/50 scale-110 shadow-[0_0_10px_rgba(6,182,212,0.2)]" 
                                  : "bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800"
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">
                      {language === "pt" ? "Posições" : "Positions"}
                    </label>
                    <span className="text-[10px] text-slate-500 font-bold">{newSportPositions.length}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addPosition()}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder={language === "pt" ? "Ex: Armador" : "Ex: Point Guard"}
                    />
                    <Button onClick={addPosition} size="sm" className="bg-slate-800 hover:bg-slate-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {newSportPositions.map((pos, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-800/50 rounded-lg group">
                        <span className="text-xs font-bold text-slate-300">{pos}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => movePosition(i, 'up')} className="p-1 hover:text-cyan-400"><ChevronUp size={14} /></button>
                          <button onClick={() => removePosition(pos)} className="p-1 hover:text-rose-400"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xxs font-black text-slate-400 uppercase tracking-widest">
                      {language === "pt" ? "Campos Personalizados" : "Custom Fields"}
                    </label>
                    <Button onClick={addCustomField} size="sm" variant="outline" className="h-7 border-dashed border-slate-700 text-[10px] uppercase font-black tracking-widest hover:border-cyan-500/50">
                      <Plus className="w-3 h-3 mr-1" /> {language === 'pt' ? 'Adicionar' : 'Add'}
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {newSportCustomFields.map((field) => (
                      <div key={field.id} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateCustomField(field.id, { name: e.target.value })}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                            placeholder={language === 'pt' ? 'Nome do campo' : 'Field name'}
                          />
                          <button onClick={() => setNewSportCustomFields(prev => prev.filter(f => f.id !== field.id))} className="text-slate-600 hover:text-rose-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <select
                          value={field.type}
                          onChange={(e) => updateCustomField(field.id, { type: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400"
                        >
                          <option value="text">Texto</option>
                          <option value="number">Número</option>
                          <option value="select">Seleção</option>
                          <option value="boolean">Sim/Não</option>
                        </select>
                        {field.type === 'select' && (
                          <input
                            type="text"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => updateCustomField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] text-slate-500 italic"
                            placeholder={language === 'pt' ? 'Opções separadas por vírgula' : 'Options separated by comma'}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsAdding(false);
                  setEditingSportId(null);
                  setNewSportName("");
                  setNewSportIcon("🏆");
                  setNewSportPositions([]);
                }}
                className="text-slate-400 hover:text-white"
              >
                {language === "pt" ? "Cancelar" : "Cancel"}
              </Button>
              <Button 
                onClick={handleAddSport}
                className="bg-cyan-500 hover:bg-cyan-400 text-[#050B14] font-black uppercase tracking-widest px-6 rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                {language === "pt" ? "Salvar Esporte" : "Save Sport"}
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
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-6">
            <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-600" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-slate-200 font-bold text-lg">{searchTerm ? (language === 'pt' ? 'Nenhuma modalidade encontrada' : 'No sports found') : (language === 'pt' ? 'Nenhuma modalidade cadastrada' : 'No sports registered')}</p>
              {!searchTerm && (
                <p className="text-slate-500 text-sm max-w-xs">{language === 'pt' ? 'Comece criando uma nova modalidade ou restaure as sugestões padrão do sistema.' : 'Start by creating a new sport or restore the system defaults.'}</p>
              )}
            </div>
            {!searchTerm && (
              <div className="flex gap-3">
                <Button 
                  onClick={handleSeedSports}
                  className="bg-cyan-500 hover:bg-cyan-400 text-[#050B14] font-black uppercase tracking-widest px-8"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  {language === "pt" ? "Carregar Sugestões" : "Load Suggestions"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          filteredSports.map((sport) => {
            const sportColor = sport.color || '#06b6d4';
            const progress = Math.min(((sport.athleteCount || 0) / (sport.target_athletes || 20)) * 100, 100);
            const gradientStyle = getGradientState(sportColor);

            return (
              <motion.div
                key={sport.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/40 border rounded-2xl p-5 hover:bg-slate-900/60 transition-all group relative overflow-hidden border-slate-800/50"
                style={{ 
                  background: gradientStyle,
                  borderColor: `${sportColor}40`
                }}
              >
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-white/10" style={{ backgroundColor: `${sportColor}20` }}>
                      <span className="text-4xl leading-none select-none drop-shadow-md">
                        {sport.icon || "🏆"}
                      </span>
                    </div>
                    <div>
                      <h3 
                        className="font-black text-white uppercase tracking-tight transition-colors flex items-center gap-2"
                        style={{ color: sport.is_active ? 'white' : '#64748b' }}
                      >
                        {sport.name}
                        {!sport.is_active && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded border border-slate-700">
                            {language === 'pt' ? 'INATIVO' : 'INACTIVE'}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {sport.athleteCount || 0} / {sport.target_athletes || 20} {language === 'pt' ? 'Atletas' : 'Athletes'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSportStatus(sport);
                      }}
                      className="p-2 transition-colors bg-slate-800/80 rounded-lg shadow-sm"
                      style={{ color: sport.is_active ? sportColor : '#64748b' }}
                      title={sport.is_active ? 'Desativar' : 'Ativar'}
                    >
                      <Zap className="w-3.5 h-3.5" fill={sport.is_active ? sportColor : 'transparent'} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(sport);
                      }}
                      className="p-2 text-slate-300 hover:text-cyan-400 transition-colors bg-slate-800/80 rounded-lg shadow-sm pointer-events-auto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSport(sport.id);
                      }}
                      className="p-2 text-slate-300 hover:text-rose-400 transition-colors bg-slate-800/80 rounded-lg shadow-sm pointer-events-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Target Progress Bar */}
                <div className="space-y-1.5 mb-4 relative z-10">
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
                    <span>{language === 'pt' ? 'Preenchimento' : 'Fill Rate'}</span>
                    <span style={{ color: sportColor }}>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: sportColor }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1.5 relative z-10">
                  {(sport.positions || []).slice(0, 3).map((pos, i) => (
                    <span key={i} className="text-[9px] font-black px-2 py-1 bg-slate-800/20 border border-slate-700/20 text-slate-500 rounded-md uppercase tracking-widest group-hover:text-slate-300 transition-colors">
                      {pos}
                    </span>
                  ))}
                  {sport.custom_fields && sport.custom_fields.length > 0 && (
                    <span 
                      className="text-[9px] font-black px-2 py-1 bg-slate-950/40 border rounded-md uppercase tracking-widest"
                      style={{ borderColor: `${sportColor}40`, color: sportColor }}
                    >
                      +{sport.custom_fields.length} {language === 'pt' ? 'CAMPOS' : 'FIELDS'}
                    </span>
                  )}
                </div>

                {/* Background Decoration */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                  <span className="text-[100px] leading-none select-none rotate-12">
                    {sport.icon || "🏆"}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
