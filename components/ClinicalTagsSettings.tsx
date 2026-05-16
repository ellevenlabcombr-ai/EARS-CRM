"use client";
import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, AlertCircle, Clock, Zap } from 'lucide-react';
import { Button } from './ui/button';

export function ClinicalTagsSettings() {
  const [tags, setTags] = useState<{
    id: string, 
    tag: string, 
    category: 'clinical' | 'physical' | 'nutrition' | 'psychology',
    severity: 'low' | 'medium' | 'high',
    expiresInDays?: number | '',
    linkedAction: 'none' | 'suspend' | 'alert'
  }[]>([]);

  const [newTagText, setNewTagText] = useState("");
  const [newTagCategory, setNewTagCategory] = useState<'clinical' | 'physical' | 'nutrition' | 'psychology'>('clinical');
  const [newTagSeverity, setNewTagSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [newTagExpires, setNewTagExpires] = useState<number | ''>('');
  const [newTagAction, setNewTagAction] = useState<'none' | 'suspend' | 'alert'>('none');

  useEffect(() => {
    const saved = localStorage.getItem('system_clinical_tags');
    if (saved) {
      const parsed = JSON.parse(saved);
      const migrated = parsed.map((t: any) => ({
        id: t.id,
        tag: t.tag,
        category: t.category || (t.source === 'clinical' ? 'clinical' : 'physical'),
        severity: t.severity || 'low',
        expiresInDays: t.expiresInDays || '',
        linkedAction: t.linkedAction || 'none'
      }));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTags(migrated);
    }
  }, []);

  const saveTags = (newTags: typeof tags) => {
    setTags(newTags);
    localStorage.setItem('system_clinical_tags', JSON.stringify(newTags));
  };

  const handleAdd = () => {
    if (!newTagText.trim()) return;
    const newTag = {
      id: Math.random().toString(36).substr(2, 9),
      tag: newTagText.trim(),
      category: newTagCategory,
      severity: newTagSeverity,
      expiresInDays: newTagExpires,
      linkedAction: newTagAction
    };
    saveTags([...tags, newTag]);
    setNewTagText("");
    setNewTagExpires("");
  };

  const handleRemove = (id: string) => {
    saveTags(tags.filter(t => t.id !== id));
  };

  const categoryConfig = {
    clinical: { label: 'Clínico / Médico', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    physical: { label: 'Físico / Campo', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    nutrition: { label: 'Nutrição', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    psychology: { label: 'Psicologia', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
  };

  const severityConfig = {
    low: { label: 'Baixo', color: 'text-slate-400' },
    medium: { label: 'Atenção', color: 'text-amber-400' },
    high: { label: 'Crítico', color: 'text-rose-500 font-bold' }
  };

  const actionConfig = {
    none: 'Sem Automação',
    suspend: 'Afastar (Atividades Médicas)',
    alert: 'Emitir Alerta SMS/App'
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* HEADER AND MANUAL BANNER */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out" />
        <div className="relative z-10 flex-1">
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Tag className="text-purple-500" size={28} /> Dicionário de Tags (Smart)
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-2 font-medium leading-relaxed max-w-2xl">
            Crie marcadores visuais avançados para classificar grupos de risco. Adicione níveis de severidade, validade e regras automatizadas (Ex: afastamento).
          </p>
        </div>
        <div className="relative z-10 shrink-0">
           <button
             onClick={() => {
               const newWindow = window.open('', '_blank');
               if (newWindow) {
                 newWindow.document.write(`
                  <html>
                  <head>
                    <title>Manual do Dicionário de Tags</title>
                    <style>
                      body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 2rem; max-w: 900px; margin: 0 auto; }
                      h1 { color: #fff; font-size: 2rem; border-bottom: 2px solid #334155; padding-bottom: 1rem; margin-bottom: 2rem; }
                      h2 { color: #a855f7; margin-top: 2.5rem; border-bottom: 1px dashed #334155; padding-bottom: 0.5rem; }
                      h3 { color: #cbd5e1; margin-top: 1.5rem; }
                      p, li { color: #94a3b8; }
                      strong { color: #e2e8f0; }
                      .highlight { background: #1e293b; padding: 1rem; border-left: 4px solid #a855f7; border-radius: 4px; margin: 1rem 0; }
                    </style>
                  </head>
                  <body>
                    <h1>Manual do Dicionário de Tags (Classificadores Smart)</h1>
                    <p>As Tags são o sistema de inteligência visual da sua clínica. Elas funcionam como etiquetas virtuais coladas na ficha do paciente. Em um ambiente concorrido, qualquer profissional ao bater o olho na agenda sabe imediatamente como lidar com o paciente, seja ele um "Pós-Operatório", "Devedor", ou "Alto Risco". Este guia mostra como criar tags ativas.</p>

                    <h2>1. Nomeclatura e Categoria (A Etiqueta Base)</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Nomear a condição e definir qual departamento é dono daquela informação.
                    </div>
                    <p>Não misture informações médicas com financeiras na mesma cor.</p>
                    <ul>
                      <li><strong>Nome da Tag:</strong> Use termos curtos. Ex: "Pós-Op LCP", "Diabético", "VIP", "Inadimplente".</li>
                      <li><strong>Categoria:</strong> Escolha a cor/departamento. Médicos (Roxo), Físico/Preparação (Amarelo), Nutrição (Verde), Psicologia (Azul). Se a tag for "Restrição de Glúten", coloque na Nutrição.</li>
                    </ul>

                    <h2>2. Severidade (O Grau de Urgência)</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Mostrar para quem lê a tag se aquilo é apenas uma observação ou se é algo gravíssimo.
                    </div>
                    <ul>
                      <li><strong>Baixa (Cinza):</strong> Apenas informativo. <em>Ex: "Canhoto", "Convênio Unimed".</em></li>
                      <li><strong>Média/Atenção (Amarelo):</strong> Exige cuidado do profissional. <em>Ex: "Dor Crônica Lombar", "Ansioso".</em></li>
                      <li><strong>Alta/Crítico (Vermelho Pulsante):</strong> Para o que estiver fazendo e leia. A tag ficará piscando na tela da recepção e dos profissionais. <em>Ex: "Aviso: Risco de Morte Súbita", "Cirurgia Recente (15 dias)".</em></li>
                    </ul>

                    <h2>3. Expiração Automática (Tag com Data de Validade)</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Limpar a ficha do paciente sozinha, sem você precisar lembrar de tirar a tag.
                    </div>
                    <p>Ideal para condições temporárias.</p>
                    <ul>
                      <li><strong>Como usar:</strong> Digite o número de dias que a tag deve existir.</li>
                      <li><strong>Exemplo Prático:</strong> Você cria a tag "Virose" e coloca Expira em: 7 Dias. Quando você colar essa tag no Joãozinho hoje, daqui a 7 dias exatos a tag "Virose" vai sumir da ficha dele no sistema. Se for permanente (ex: "Asmático"), deixe o campo vazio.</li>
                    </ul>

                    <h2>4. Automação e Ações Vinculadas (Smart Locks)</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Fazer com que a tag tome decisões pelo sistema, travando funcionalidades.
                    </div>
                    <p>A tag passa a ter um comportamento de segurança, não sendo apenas um enfeite visual.</p>
                    <ul>
                      <li><strong>Impede Novos Agendamentos (Afastamento):</strong> Se selecionado, qualquer paciente de posse desta tag perderá o acesso de agendar horários, e a recepção também será impedida de alocá-lo até a tag ser removida. <em>Ex: Tag "Afastamento Médico (Lesão)".</em></li>
                      <li><strong>Disparar Alerta para Recepção:</strong> Ao inserir essa tag num paciente, o sistema acorda a recepção alertando sobre uma peculiaridade. <em>Ex: Tag "Vip/Indicação do Dono" ou "Devedor Crônico".</em></li>
                    </ul>

                    <hr style="margin-top: 3rem; border-color: #334155;" />
                    <p style="text-align: center; font-size: 0.8rem; margin-top: 2rem;">Pode fechar esta janela para retornar ao sistema.</p>
                  </body>
                  </html>
                 `);
               }
             }}
             className="px-6 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Tag size={18} />
            Ler Manual
          </button>
        </div>
      </div>

      {/* NEW TAG FORM */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-500" />
            Adicionar Nova Tag Smart
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Nome da Tag</label>
            <input 
              type="text" 
              placeholder="Ex: Gestante, Pós-Op LCP, VIP..." 
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              value={newTagText}
              onChange={(e) => setNewTagText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Categoria</label>
            <select 
              value={newTagCategory} 
              onChange={(e) => setNewTagCategory(e.target.value as any)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none"
            >
              <option value="clinical">Clínico</option>
              <option value="physical">Físico</option>
              <option value="nutrition">Nutrição</option>
              <option value="psychology">Psicologia</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Severidade</label>
            <select 
              value={newTagSeverity} 
              onChange={(e) => setNewTagSeverity(e.target.value as any)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média (Atenção)</option>
              <option value="high">Alta (Crítico)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1">
              <Clock size={12} /> Expira em (Dias)
            </label>
            <input 
              type="number" 
              placeholder="Vazio = Nunca"
              min="1"
              max="999"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              value={newTagExpires}
              onChange={(e) => setNewTagExpires(e.target.value ? parseInt(e.target.value) : '')}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1">
              <Zap size={12} /> Automação (Ação Vinculada)
            </label>
            <select 
              value={newTagAction} 
              onChange={(e) => setNewTagAction(e.target.value as any)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 focus:outline-none"
            >
              <option value="none">Nenhuma Ação</option>
              <option value="suspend">Impede Novos Agendamentos (Afastamento)</option>
              <option value="alert">Disparar Alerta para a Recepção</option>
            </select>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <Button onClick={handleAdd} className="w-full h-[42px] bg-purple-500 hover:bg-purple-400 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-purple-500/20">
              Adicionar Tag
            </Button>
          </div>
        </div>
      </div>

      {/* CLASSIFIED TAGS LIST */}
      <div>
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
           <Tag className="w-4 h-4 text-purple-500" />
           Tags Ativas 
           <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-[10px] ml-2">{tags.length}</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(categoryConfig).map(([catKey, catVal]) => {
            const catTags = tags.filter(t => t.category === catKey);
            if (catTags.length === 0) return null;
            return (
              <div key={catKey} className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">{catVal.label}</h4>
                <div className="flex flex-col gap-3">
                  {catTags.map(tag => (
                    <div key={tag.id} className={`flex items-center justify-between p-3 rounded-xl border ${catVal.color} bg-opacity-5`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full ${tag.severity === 'high' ? 'bg-rose-500 animate-pulse' : tag.severity === 'medium' ? 'bg-amber-400' : 'bg-slate-400'}`}></div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">{tag.tag}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] uppercase tracking-widest ${severityConfig[tag.severity].color}`}>
                              Risco: {severityConfig[tag.severity].label}
                            </span>
                            {tag.expiresInDays && (
                              <span className="text-[9px] uppercase tracking-widest text-slate-500 flex items-center gap-0.5">
                                <Clock size={10} /> Exp: {tag.expiresInDays}d
                              </span>
                            )}
                            {tag.linkedAction !== 'none' && (
                              <span className="text-[9px] uppercase tracking-widest text-indigo-400 flex items-center gap-0.5 ml-1">
                                <Zap size={10} /> {actionConfig[tag.linkedAction]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleRemove(tag.id)} className="hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition-colors focus:outline-none">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {tags.length === 0 && (
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-3xl">
              <AlertCircle className="w-8 h-8 mb-3 text-slate-600" />
              <p className="text-xs font-black uppercase tracking-widest">Nenhuma tag configurada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}