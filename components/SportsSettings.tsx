"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Trophy, Users, Edit2, X, Search, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "motion/react";
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
}

// Helper to generate gradient from hex
const getGradientState = (hex: string) => {
  // Simple check for hex format
  if (!hex || !hex.startsWith('#')) return 'from-slate-900/40 to-slate-950/60';
  
  // Convert hex to semi-transparent variations
  return `linear-gradient(135deg, ${hex}15 0%, #050B14 100%)`;
};

const SPORT_COLORS = [
  { name: 'Emerald', hex: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { name: 'Cyan', hex: '#06b6d4', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  { name: 'Indigo', hex: '#6366f1', bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  { name: 'Violet', hex: '#8b5cf6', bg: 'bg-violet-500', text: 'text-violet-400', border: 'border-violet-500/30' },
  { name: 'Rose', hex: '#f43f5e', bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30' },
  { name: 'Amber', hex: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' },
  { name: 'Orange', hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/30' },
  { name: 'Slate', hex: '#64748b', bg: 'bg-slate-500', text: 'text-slate-400', border: 'border-slate-500/30' },
];

export const SportsSettings = () => {
  const { language } = useLanguage();
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSportId, setEditingSportId] = useState<string | null>(null);
  
  // New Sport State
  const [newSportName, setNewSportName] = useState("");
  const [newSportIcon, setNewSportIcon] = useState("🏆");
  const [newSportColor, setNewSportColor] = useState(SPORT_COLORS[1].hex);
  const [newSportTarget, setNewSportTarget] = useState<number>(20);
  const [newSportCustomFields, setNewSportCustomFields] = useState<CustomField[]>([]);
  const [newSportPositions, setNewSportPositions] = useState<string[]>([]);
  
  // Auxiliary UI state
  const [newPosition, setNewPosition] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fetchSports = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sports")
        .select("*")
        .order("order_index", { ascending: true })
        .order("name", { ascending: true });
      
      if (error) throw error;
      
      const { data: athletesData } = await supabase.from("athletes").select("modalidade");
      const countsMap: Record<string, number> = {};
      athletesData?.forEach(a => { if (a.modalidade) countsMap[a.modalidade] = (countsMap[a.modalidade] || 0) + 1; });

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
    const payload = {
      name: newSportName,
      icon: newSportIcon,
      color: newSportColor,
      target_athletes: newSportTarget,
      custom_fields: newSportCustomFields,
      positions: newSportPositions.length > 0 ? newSportPositions : ["Atleta"],
      updated_at: new Date().toISOString(),
      order_index: editingSportId 
        ? sports.find(s => s.id === editingSportId)?.order_index || 0 
        : sports.length
    };

    try {
      let error;
      if (editingSportId) {
        ({ error } = await supabase.from("sports").update(payload).eq("id", editingSportId));
      } else {
        ({ error } = await supabase.from("sports").insert([payload]));
      }
      
      if (error) {
        if (error.code === '23505') {
          alert(language === 'pt' ? 'Já existe um esporte com este nome.' : 'A sport with this name already exists.');
        } else {
          throw error;
        }
        return;
      }
      
      setIsAdding(false);
      resetForm();
      await fetchSports();
      alert(language === 'pt' ? 'Esporte salvo com sucesso!' : 'Sport saved successfully!');
    } catch (error) {
      console.error("Error saving sport:", error);
      alert(language === 'pt' ? 'Erro ao salvar esporte. Verifique os dados e tente novamente.' : 'Error saving sport. Check the data and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingSportId(null);
    setNewSportName("");
    setNewSportIcon("🏆");
    setNewSportColor(SPORT_COLORS[1].hex);
    setNewSportTarget(20);
    setNewSportCustomFields([]);
    setNewSportPositions([]);
  };

  const handleEditClick = (sport: Sport) => {
    setEditingSportId(sport.id);
    setNewSportName(sport.name);
    setNewSportIcon(sport.icon || "🏆");
    setNewSportColor(sport.color || SPORT_COLORS[1].hex);
    setNewSportTarget(sport.target_athletes || 20);
    setNewSportCustomFields(sport.custom_fields || []);
    setNewSportPositions(sport.positions || []);
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
      { name: "Futebol", icon: "⚽", color: SPORT_COLORS[0].hex, positions: ["Goleiro", "Zagueiro", "Lateral", "Meia", "Atacante"], target_athletes: 22, order_index: 0 },
      { name: "Basquete", icon: "🏀", color: SPORT_COLORS[5].hex, positions: ["Armador", "Ala", "Ala-Pivô", "Pivô"], target_athletes: 12, order_index: 1 },
      { name: "Vôlei", icon: "🏐", color: SPORT_COLORS[1].hex, positions: ["Levantador", "Ponteiro", "Central", "Oposto", "Líbero"], target_athletes: 14, order_index: 2 }
    ];

    try {
      const { error } = await supabase.from("sports").insert(defaults);
      if (error) throw error;
      fetchSports();
    } catch (err) {
      console.error("Error seeding sports:", err);
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
      if (error) throw error;
    } catch (error) {
      console.error("Error saving new order:", error);
      fetchSports();
    }
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
              {language === "pt" ? "Gestão de Esportes" : "Sports Management"}
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              {language === "pt" ? "Configure as modalidades e posições" : "Configure sports and positions"}
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
              placeholder={language === "pt" ? "Buscar esporte..." : "Search sport..."}
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
            {language === "pt" ? "Popular Padrão" : "Seed Defaults"}
          </Button>
          <Button 
            onClick={() => {
              setEditingSportId(null);
              setNewSportName("");
              setNewSportIcon("🏆");
              setNewSportPositions([]);
              setIsAdding(true);
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-[#050B14] font-black uppercase tracking-widest px-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)]"
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
                  <div className="grid grid-cols-4 gap-2">
                    {SPORT_COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setNewSportColor(c.hex)}
                        className={`h-10 rounded-lg border-2 transition-all ${newSportColor.toLowerCase() === c.hex.toLowerCase() ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'} ${c.bg}`}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <div className="pt-2">
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

      <Reorder.Group 
        axis="y" 
        values={filteredSports} 
        onReorder={(newOrder) => {
          if (!searchTerm) {
            handleReorder(newOrder);
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
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
          filteredSports.map((sport) => {
            const colorCfg = SPORT_COLORS.find(c => c.hex.toLowerCase() === sport.color?.toLowerCase()) || SPORT_COLORS[7];
            const progress = Math.min(((sport.athleteCount || 0) / (sport.target_athletes || 20)) * 100, 100);
            const gradientStyle = getGradientState(sport.color || colorCfg.hex);

            return (
              <Reorder.Item
                key={sport.id}
                value={sport}
                dragListener={!searchTerm}
                className={`bg-slate-900/40 border ${colorCfg.border} rounded-2xl p-5 hover:bg-slate-900/60 transition-all group relative overflow-hidden ${!searchTerm ? 'cursor-grab active:cursor-grabbing' : ''}`}
                style={{ background: gradientStyle }}
              >
                {!searchTerm && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity">
                    <GripVertical className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl leading-none select-none group-hover:scale-110 transition-transform duration-300">
                      {sport.icon || "🏆"}
                    </span>
                    <div>
                      <h3 className={`font-black text-white uppercase tracking-tight group-hover:${colorCfg.text} transition-colors`}>
                        {sport.name}
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
                        handleEditClick(sport);
                      }}
                      className="p-2 text-slate-600 hover:text-cyan-400 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 bg-slate-800/50 rounded-lg pointer-events-auto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSport(sport.id);
                      }}
                      className="p-2 text-slate-600 hover:text-rose-400 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 bg-slate-800/50 rounded-lg pointer-events-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Target Progress Bar */}
                <div className="space-y-1.5 mb-4 relative z-10">
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
                    <span>{language === 'pt' ? 'Preenchimento' : 'Fill Rate'}</span>
                    <span className={colorCfg.text}>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={`h-full ${colorCfg.bg} rounded-full`}
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
                    <span className={`text-[9px] font-black px-2 py-1 bg-slate-950/40 border ${colorCfg.border} ${colorCfg.text} rounded-md uppercase tracking-widest`}>
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
              </Reorder.Item>
            );
          })
        )}
      </Reorder.Group>
    </div>
  );
};
