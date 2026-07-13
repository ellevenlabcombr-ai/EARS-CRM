"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WellnessCheckInForm } from './WellnessCheckInForm';
import { AthleteEarsDashboard } from './AthleteEarsDashboard';
import { CoachEarsDashboard } from './CoachEarsDashboard';
import { AthleteProfile, WellnessCheckIn } from '../../types/ears';
import { Button } from '../ui/button';
import { LayoutDashboard, ClipboardCheck, Users, Info, Settings, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase, hasSupabaseConfig } from '../../lib/supabase';

// MOCK DATA GENERATOR (Used as a fallback or in development)
const generateMockHistory = (athleteId: string): WellnessCheckIn[] => {
  const history: WellnessCheckIn[] = [];
  const today = new Date();
  const phases: any[] = ['follicular', 'ovulatory', 'luteal', 'menstrual', 'none'];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const score = 60 + Math.floor(Math.random() * 35);
    history.push({
      id: `m-${i}`,
      athleteId,
      date: d.toISOString(),
      sleep_quality: 3 + Math.floor(Math.random() * 2),
      sleep_hours: 6 + Math.floor(Math.random() * 3),
      energy: 3 + Math.floor(Math.random() * 2),
      mood: 3 + Math.floor(Math.random() * 2),
      stress: 1 + Math.floor(Math.random() * 2),
      recovery: 3 + Math.floor(Math.random() * 2),
      confidence: 3 + Math.floor(Math.random() * 2),
      leg_heaviness: 1 + Math.floor(Math.random() * 2),
      overall_readiness: 4,
      menstrual_cycle: phases[i % 5],
      pain_map: i % 4 === 0 ? [{ region: 'knee_r_f', level: 5, type: 'muscle' }] : [],
      clinical_symptoms: i === 10 ? ['headache'] : [],
      readiness_score: score,
      base_score: score + 5,
      deductions: 5,
      level: score > 80 ? 'ready' : score > 60 ? 'attention' : 'risk'
    });
  }
  return history;
};

const MOCK_ATHLETE: AthleteProfile = {
  id: 'at-1',
  name: 'Maria Eduarda',
  nickname: 'Duda',
  gender: 'female',
  age: 22,
  sport: 'Vôlei',
  category: 'Elite',
  previous_readiness: 88,
  avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&auto=format&fit=crop'
};

const MOCK_TEAM: AthleteProfile[] = [
  MOCK_ATHLETE,
  { id: 'at-2', name: 'Ana Souza', nickname: 'Ana', gender: 'female', age: 25, sport: 'Vôlei', category: 'Elite', previous_readiness: 75 },
  { id: 'at-3', name: 'Juliana Lima', nickname: 'Ju', gender: 'female', age: 19, sport: 'Vôlei', category: 'Elite', previous_readiness: 92 },
  { id: 'at-4', name: 'Carla Silva', nickname: 'Carla', gender: 'female', age: 29, sport: 'Vôlei', category: 'Elite', previous_readiness: 60 },
];

const calculateAge = (birthDateStr: string | null) => {
  if (!birthDateStr) return 22;
  try {
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch {
    return 22;
  }
};

const mapCheckInToWellness = (dbCheckIn: any, dbPainReports: any[]): WellnessCheckIn => {
  const checkInPainReports = dbPainReports
    .filter(p => p.check_in_id === dbCheckIn.id)
    .map(p => ({
      region: p.body_part_id,
      level: Number(p.pain_level),
      type: p.pain_type as 'muscle' | 'joint' | 'other'
    }));

  return {
    id: dbCheckIn.id,
    athleteId: dbCheckIn.athlete_id,
    date: dbCheckIn.record_date || dbCheckIn.date || new Date().toISOString(),
    sleep_quality: Number(dbCheckIn.sleep_quality || 3),
    sleep_hours: Number(dbCheckIn.sleep_hours || 8),
    energy: Number(dbCheckIn.energy_level || 3),
    mood: Number(dbCheckIn.mood || 3),
    stress: Number(dbCheckIn.stress_level || 3),
    recovery: Number(dbCheckIn.training_recovery || 3),
    confidence: Number(dbCheckIn.confidence || 3),
    leg_heaviness: Number(dbCheckIn.leg_heaviness || dbCheckIn.muscle_soreness || 3),
    overall_readiness: Number(dbCheckIn.overall_wellbeing || dbCheckIn.readiness_score || 3),
    menstrual_cycle: dbCheckIn.menstrual_cycle || 'none',
    pain_map: checkInPainReports,
    clinical_symptoms: Array.isArray(dbCheckIn.menstrual_symptoms) ? dbCheckIn.menstrual_symptoms : [],
    readiness_score: Number(dbCheckIn.readiness_score || 100),
    base_score: Number(dbCheckIn.readiness_score || 100),
    deductions: 0,
    level: (dbCheckIn.readiness_score || 100) >= 80 ? 'ready' : (dbCheckIn.readiness_score || 100) >= 60 ? 'attention' : 'risk'
  };
};

export default function EarsSystem() {
  const [activeTab, setActiveTab] = useState<'athlete' | 'questionnaire' | 'coach'>('athlete');
  const [athletesList, setAthletesList] = useState<AthleteProfile[]>(MOCK_TEAM);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile>(MOCK_ATHLETE);
  const [history, setHistory] = useState<WellnessCheckIn[]>([]);
  const [teamData, setTeamData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [usingRealData, setUsingRealData] = useState<boolean>(false);

  const fetchAthletes = async () => {
    try {
      if (hasSupabaseConfig) {
        const { data, error } = await supabase
          .from('athletes')
          .select('id, name, nickname, gender, birth_date, category, avatar_url, readiness_score')
          .order('name');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const mapped: AthleteProfile[] = data.map((a: any) => ({
            id: a.id,
            name: a.name,
            nickname: a.nickname || a.name.split(' ')[0],
            gender: (a.gender === 'female' || a.gender === 'Feminino' || a.gender === 'F' || a.gender === 'female') ? 'female' : 'male',
            age: calculateAge(a.birth_date),
            sport: 'Vôlei',
            category: a.category || 'Elite',
            avatar_url: a.avatar_url || undefined,
            previous_readiness: a.readiness_score || 80
          }));
          setAthletesList(mapped);
          setUsingRealData(true);
          return mapped;
        }
      }
    } catch (e) {
      console.error("Error fetching athletes from Supabase:", e);
    }
    setAthletesList(MOCK_TEAM);
    setUsingRealData(false);
    return MOCK_TEAM;
  };

  const fetchHistoryForAthlete = async (athleteId: string) => {
    setLoading(true);
    try {
      if (hasSupabaseConfig) {
        const { data: checkins, error: errC } = await supabase
          .from('check_ins')
          .select('*')
          .eq('athlete_id', athleteId)
          .order('record_date', { ascending: false })
          .limit(14);
        
        const { data: painReports, error: errP } = await supabase
          .from('pain_reports')
          .select('*')
          .eq('athlete_id', athleteId);

        if (checkins && checkins.length > 0) {
          const mappedHistory = checkins.map((c: any) => mapCheckInToWellness(c, painReports || []));
          setHistory(mappedHistory);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error("Error fetching history from Supabase:", e);
    }
    setHistory(generateMockHistory(athleteId));
    setLoading(false);
  };

  const loadTeamData = async (currentAthletes: AthleteProfile[]) => {
    try {
      if (hasSupabaseConfig) {
        const { data: allCheckins, error: errC } = await supabase
          .from('check_ins')
          .select('*')
          .order('record_date', { ascending: false });
        
        const { data: allPain, error: errP } = await supabase
          .from('pain_reports')
          .select('*');

        if (allCheckins) {
          const mappedTeam = currentAthletes.map((a: any) => {
            const athleteCheckins = allCheckins.filter((c: any) => c.athlete_id === a.id);
            const latestDb = athleteCheckins[0];
            const latest = latestDb ? mapCheckInToWellness(latestDb, allPain || []) : generateMockHistory(a.id)[0];
            
            let trend = 0;
            if (athleteCheckins.length > 1) {
              const prevScores = athleteCheckins.slice(1, 5).map((c: any) => Number(c.readiness_score || 100));
              if (prevScores.length > 0) {
                const avgPrev = prevScores.reduce((sum: any, s: any) => sum + s, 0) / prevScores.length;
                trend = Math.round(Number(latest.readiness_score) - avgPrev);
               }
            }
            
            return {
              athlete: a,
              latestCheckin: latest,
              trend
            };
          });
          setTeamData(mappedTeam);
          return;
        }
      }
    } catch (e) {
      console.error("Error loading team data:", e);
    }
    
    setTeamData(currentAthletes.map(a => ({
      athlete: a,
      latestCheckin: generateMockHistory(a.id)[0],
      trend: -5 + Math.floor(Math.random() * 10)
    })));
  };

  useEffect(() => {
    const init = async () => {
      const list = await fetchAthletes();
      if (list && list.length > 0) {
        setSelectedAthlete(list[0]);
        await fetchHistoryForAthlete(list[0].id);
        await loadTeamData(list);
      } else {
        setSelectedAthlete(MOCK_ATHLETE);
        await fetchHistoryForAthlete(MOCK_ATHLETE.id);
        await loadTeamData(MOCK_TEAM);
      }
    };
    init();
  }, []);

  const handleAthleteChange = (athleteId: string) => {
    const found = athletesList.find(a => a.id === athleteId);
    if (found) {
      setSelectedAthlete(found);
      fetchHistoryForAthlete(found.id);
    }
  };

  const handleSubmitCheckin = async (data: WellnessCheckIn) => {
    setLoading(true);
    try {
      if (hasSupabaseConfig) {
        const checkInObj = {
          athlete_id: selectedAthlete.id,
          record_date: new Date().toISOString().split('T')[0],
          sleep_quality: data.sleep_quality,
          sleep_hours: data.sleep_hours,
          energy_level: data.energy,
          muscle_soreness: data.leg_heaviness,
          stress_level: data.stress,
          mood: data.mood,
          confidence: data.confidence,
          leg_heaviness: data.leg_heaviness,
          training_recovery: data.recovery,
          overall_wellbeing: data.overall_readiness,
          readiness_score: data.readiness_score,
          menstrual_cycle: data.menstrual_cycle,
          menstrual_symptoms: data.clinical_symptoms,
          notes: ""
        };

        const { data: inserted, error: insertError } = await supabase
          .from('check_ins')
          .insert([checkInObj])
          .select();

        if (insertError) throw insertError;

        if (inserted && inserted.length > 0) {
          const checkInId = inserted[0].id;
          
          if (data.pain_map && data.pain_map.length > 0) {
            const painInserts = data.pain_map.map(p => ({
              check_in_id: checkInId,
              athlete_id: selectedAthlete.id,
              body_part_id: p.region,
              pain_level: p.level,
              pain_type: p.type
            }));

            const { error: painError } = await supabase
              .from('pain_reports')
              .insert(painInserts);

            if (painError) console.error("Error inserting pain reports:", painError);
          }

          // Insert into wellness_records to sync with main Athlete Dashboard
          const compiledSorenessLocation = data.pain_map && data.pain_map.length > 0
            ? JSON.stringify(data.pain_map.map(p => ({
                region: p.region,
                level: p.level,
                type: p.type
              })))
            : null;

          const maxPain = data.pain_map && data.pain_map.length > 0
            ? Math.max(...data.pain_map.map(p => p.level))
            : 0;

          const wellnessRecordObj = {
            id: checkInId,
            athlete_id: selectedAthlete.id,
            record_date: new Date().toISOString().split('T')[0],
            sleep_hours: data.sleep_hours,
            sleep_quality: data.sleep_quality,
            fatigue_level: data.energy,
            muscle_soreness: maxPain > 0 ? maxPain : data.leg_heaviness,
            soreness_location: compiledSorenessLocation,
            stress_level: data.stress,
            readiness_score: data.readiness_score,
            comments: "",
            hydration_perception: 3,
            hydration_score: 3,
            urine_color: 3,
            nutrition: 3,
            mood: data.mood,
            pre_training_meal: 3,
            training_recovery: data.recovery,
            confidence: data.confidence,
            overall_wellbeing: data.overall_readiness,
            menstrual_cycle: data.menstrual_cycle || 'none'
          };

          const { error: wellnessError } = await supabase
            .from("wellness_records")
            .insert([wellnessRecordObj]);
          if (wellnessError) console.error("Could not sync to wellness_records:", wellnessError);
        }

        // Update athlete readiness score
        await supabase
          .from('athletes')
          .update({ readiness_score: data.readiness_score })
          .eq('id', selectedAthlete.id);

        await fetchHistoryForAthlete(selectedAthlete.id);
        const updatedAthletes = await fetchAthletes();
        await loadTeamData(updatedAthletes);
        setActiveTab('athlete');
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error("Error submitting check-in to Supabase:", e);
    }

    // Fallback if Supabase is offline/not configured
    const newRecord = {
      ...data,
      id: `new-${Date.now()}`,
      athleteId: selectedAthlete.id,
      date: new Date().toISOString()
    };
    setHistory([newRecord, ...history]);
    setActiveTab('athlete');
    setLoading(false);
  };

  return (
    <div className="h-full bg-[#050B14] text-slate-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Sidebar/Top */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20">
                <Zap className="w-6 h-6 text-white" />
             </div>
             <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">EARS Intelligence</h1>
                <p className="text-xxs text-slate-500 font-bold uppercase tracking-widest">Elite Athlete Readiness System</p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Supabase Status Indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
              usingRealData 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {usingRealData ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Supabase Sincronizado
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  Modo Off-line / Teste
                </>
              )}
            </div>

            <div className="flex items-center p-1.5 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl">
              {[
                { id: 'athlete', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'questionnaire', label: 'Check-in', icon: ClipboardCheck },
                { id: 'coach', label: 'Coach Info', icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                    ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Athlete Selection Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-900/30 backdrop-blur-md border border-white/5 rounded-2xl gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/10">
              <img 
                src={selectedAthlete.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&h=100&auto=format&fit=crop'} 
                alt={selectedAthlete.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="text-xxs text-indigo-400 font-bold uppercase tracking-wider">Atleta Monitorado</p>
              <h3 className="text-sm font-black text-white">{selectedAthlete.name} <span className="text-xxs font-medium text-slate-500">({selectedAthlete.category})</span></h3>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xxs font-black text-slate-500 uppercase tracking-widest">Selecionar Atleta:</span>
            <select 
              value={selectedAthlete.id}
              onChange={(e) => handleAthleteChange(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer min-w-[200px]"
            >
              {athletesList.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic View */}
        {loading && activeTab !== 'coach' ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Carregando Histórico Clínico EARS...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'athlete' && (
                <AthleteEarsDashboard 
                  athlete={selectedAthlete} 
                  history={history} 
                  performanceCorrelation={{ load: 78, stats: 92, rpe: 8 }}
                />
              )}
              {activeTab === 'questionnaire' && (
                <WellnessCheckInForm 
                  athlete={selectedAthlete} 
                  history={history}
                  onSubmit={handleSubmitCheckin} 
                />
              )}
              {activeTab === 'coach' && (
                <CoachEarsDashboard 
                  data={teamData} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* System Footer Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-12 border-t border-white/5 gap-4">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-xxs font-black text-slate-600 uppercase tracking-widest">
                <Info className="w-4 h-4" />
                Version 2.5.0 High-Performance
             </div>
             <div className="flex items-center gap-2 text-xxs font-black text-slate-600 uppercase tracking-widest">
                <Settings className="w-4 h-4" />
                Algoritmo EARS 2.0 Sincronizado
             </div>
          </div>
          <p className="text-xxs font-black text-slate-700 uppercase tracking-widest">© 2026 EARS Sports Science Platform</p>
        </div>
      </div>
    </div>
  );
}

const Zap = ({ className, ...props }: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
