"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, X, CheckCircle, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion } from 'motion/react';

export function BrandingSettings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('ELLEVEN');
  const [cnpj, setCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [brandColor, setBrandColor] = useState('#06b6d4');
  const [secondaryBrandColor, setSecondaryBrandColor] = useState('#10b981');
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.85);
  const [cornerRadius, setCornerRadius] = useState('1rem');
  const [backgroundPattern, setBackgroundPattern] = useState('none');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .single();
      
      if (data) {
        setLogoUrl(data.logo_url);
        setFaviconUrl(data.favicon_url);
        setSignatureUrl(data.signature_url);
        setBackgroundUrl(data.background_url);
        setCompanyName(data.company_name || 'ELLEVEN');
        setCnpj(data.cnpj || '');
        setAddress(data.address || '');
        setInstagram(data.instagram || '');
        setLinkedin(data.linkedin || '');
        setWebsite(data.website || '');
        setPhone(data.phone || '');
        setBrandColor(data.brand_color || '#06b6d4');
        setSecondaryBrandColor(data.secondary_brand_color || '#10b981');
        setBackgroundOpacity(data.background_opacity ?? 0.85);
        setCornerRadius(data.corner_radius || '1rem');
        setBackgroundPattern(data.background_pattern || 'none');
        setWelcomeMessage(data.welcome_message || '');
      }
    } catch (err) {
      console.error('Error fetching branding:', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'signature' | 'background') => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    if (!file.type.startsWith('image/')) {
      setStatus('error');
      setMessage('Por favor, selecione uma imagem válida.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatus('error');
      setMessage('A imagem deve ter no máximo 2MB.');
      return;
    }

    if (type === 'logo') {
      setIsUploading(true);
    } else if (type === 'favicon') {
      setIsUploadingFavicon(true);
    } else if (type === 'signature') {
      setIsUploadingSignature(true);
    } else {
      setIsUploadingBackground(true);
    }
    setStatus('idle');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `elleven/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        if (uploadError.message === 'Bucket not found') {
          throw new Error('O bucket "branding" não foi encontrado. Por favor, vá em Configurações > Desenvolvimento e clique em "Otimizar Banco (Auto-Fix)".');
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      if (type === 'logo') {
        setLogoUrl(publicUrl);
      } else if (type === 'favicon') {
        setFaviconUrl(publicUrl);
      } else if (type === 'signature') {
        setSignatureUrl(publicUrl);
      } else {
        setBackgroundUrl(publicUrl);
      }
      setStatus('success');
      setMessage('Imagem carregada com sucesso! Não esqueça de salvar.');
    } catch (err: any) {
      console.error(`Error uploading ${type}:`, err);
      setStatus('error');
      setMessage(err.message || 'Erro ao carregar imagem.');
    } finally {
      if (type === 'logo') setIsUploading(false);
      else if (type === 'favicon') setIsUploadingFavicon(false);
      else if (type === 'signature') setIsUploadingSignature(false);
      else setIsUploadingBackground(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) return;
    setIsSaving(true);
    setStatus('idle');

    try {
      const { data: existing } = await supabase
        .from('branding_settings')
        .select('id')
        .single();

      const payload = {
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        signature_url: signatureUrl,
        background_url: backgroundUrl,
        company_name: companyName,
        cnpj,
        address,
        instagram,
        linkedin,
        website,
        phone,
        brand_color: brandColor,
        secondary_brand_color: secondaryBrandColor,
        background_opacity: backgroundOpacity,
        corner_radius: cornerRadius,
        background_pattern: backgroundPattern,
        welcome_message: welcomeMessage,
        updated_at: new Date().toISOString()
      };

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('branding_settings')
          .update(payload)
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('branding_settings')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      setStatus('success');
      setMessage('Configurações de branding salvas com sucesso!');
      
      // Force reload to reflect changes in header/sidebar if needed
      // window.location.reload(); 
      // Better to use a global state or event
      window.dispatchEvent(new CustomEvent('branding-updated'));
    } catch (err: any) {
      console.error('Error saving branding:', err);
      setStatus('error');
      setMessage(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setStatus('idle');
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Logo Preview */}
          <div className="flex-shrink-0 flex flex-col items-center md:items-start">
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight mb-4 flex items-center md:justify-start gap-2 justify-center">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <span>Logo do Sistema</span>
            </h3>
            <div className="relative w-48 h-48 md:w-56 md:h-56 bg-slate-950 rounded-2xl md:rounded-3xl border border-slate-800 flex items-center justify-center overflow-hidden group shadow-inner">
              {logoUrl ? (
                <>
                  <Image 
                    src={logoUrl} 
                    alt="Logo Preview" 
                    fill 
                    className="object-contain p-6 md:p-8 transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all hover:scale-110 active:scale-95"
                      title="Trocar Logo"
                    >
                      <Upload size={20} />
                    </button>
                    <button 
                      onClick={handleRemoveLogo}
                      className="p-3 bg-rose-500/20 hover:bg-rose-500/40 rounded-xl text-rose-400 transition-all hover:scale-110 active:scale-95 border border-rose-500/20 hover:border-rose-500/50"
                      title="Remover Logo"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 text-slate-600 cursor-pointer hover:text-cyan-400 transition-colors bg-slate-900/50 hover:bg-cyan-500/5 w-full h-full justify-center group-hover:border-cyan-500/30"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-cyan-500/10 flex items-center justify-center transition-colors">
                    <Upload size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center px-4">Fazer upload<br/>do logo</span>
                </div>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3 backdrop-blur-md">
                  <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">Enviando...</span>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e, 'logo')}
              className="hidden"
              accept="image/*"
            />
            
            <div className="mt-4 text-center md:text-left bg-slate-900 border border-slate-800 p-3 rounded-xl max-w-[14rem]">
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                <strong className="text-slate-400">Recomendado:</strong> PNG transparente ou SVG.<br/>Tamanho máximo: <strong>2MB</strong>.
              </p>
            </div>
            
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight mb-4 mt-8 flex items-center md:justify-start gap-2 justify-center">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <span>Favicon (Ícone da Aba)</span>
            </h3>
            <div className="relative w-32 h-32 md:w-40 md:h-40 bg-slate-950 rounded-2xl md:rounded-3xl border border-slate-800 flex items-center justify-center overflow-hidden group shadow-inner">
              {faviconUrl ? (
                <>
                  <Image 
                    src={faviconUrl} 
                    alt="Favicon Preview" 
                    fill 
                    className="object-contain p-6 md:p-8 transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                    <button 
                      onClick={() => faviconInputRef.current?.click()}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all hover:scale-110 active:scale-95"
                      title="Trocar Favicon"
                    >
                      <Upload size={20} />
                    </button>
                    <button 
                      onClick={() => { setFaviconUrl(null); setStatus('idle'); }}
                      className="p-3 bg-rose-500/20 hover:bg-rose-500/40 rounded-xl text-rose-400 transition-all hover:scale-110 active:scale-95 border border-rose-500/20 hover:border-rose-500/50"
                      title="Remover Favicon"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div 
                  onClick={() => faviconInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 text-slate-600 cursor-pointer hover:text-cyan-400 transition-colors bg-slate-900/50 hover:bg-cyan-500/5 w-full h-full justify-center group-hover:border-cyan-500/30"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-cyan-500/10 flex items-center justify-center transition-colors">
                    <Upload size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center px-4">Upload do<br/>Favicon</span>
                </div>
              )}
              
              {isUploadingFavicon && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3 backdrop-blur-md">
                  <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">Enviando...</span>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={faviconInputRef}
              onChange={(e) => handleFileChange(e, 'favicon')}
              className="hidden"
              accept="image/*"
            />
            
            <div className="mt-4 text-center md:text-left bg-slate-900 border border-slate-800 p-3 rounded-xl max-w-[14rem]">
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                <strong className="text-slate-400">Recomendado:</strong> Tamanho quadrado (ex: 512x512). PNG ou ICO.
              </p>
            </div>
            
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight mb-4 mt-8 flex items-center md:justify-start gap-2 justify-center">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <span>Assinatura Digital</span>
            </h3>
            <div className="relative w-48 h-32 md:w-56 md:h-40 bg-slate-950 rounded-2xl md:rounded-3xl border border-slate-800 flex items-center justify-center overflow-hidden group shadow-inner">
              {signatureUrl ? (
                <>
                  <Image 
                    src={signatureUrl} 
                    alt="Signature Preview" 
                    fill 
                    className="object-contain p-6 md:p-8 transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                    <button 
                      onClick={() => signatureInputRef.current?.click()}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all hover:scale-110 active:scale-95"
                      title="Trocar Assinatura"
                    >
                      <Upload size={20} />
                    </button>
                    <button 
                      onClick={() => { setSignatureUrl(null); setStatus('idle'); }}
                      className="p-3 bg-rose-500/20 hover:bg-rose-500/40 rounded-xl text-rose-400 transition-all hover:scale-110 active:scale-95 border border-rose-500/20 hover:border-rose-500/50"
                      title="Remover Assinatura"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div 
                  onClick={() => signatureInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 text-slate-600 cursor-pointer hover:text-cyan-400 transition-colors bg-slate-900/50 hover:bg-cyan-500/5 w-full h-full justify-center group-hover:border-cyan-500/30"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-cyan-500/10 flex items-center justify-center transition-colors">
                    <Upload size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center px-4">Upload da<br/>Assinatura</span>
                </div>
              )}
              
              {isUploadingSignature && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3 backdrop-blur-md">
                  <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">Enviando...</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={signatureInputRef}
              onChange={(e) => handleFileChange(e, 'signature')}
              className="hidden"
              accept="image/*"
            />
            
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight mb-4 mt-8 flex items-center md:justify-start gap-2 justify-center">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <span>Marca D'Água (Fundo)</span>
            </h3>
            <div className="relative w-48 h-32 md:w-56 md:h-40 bg-slate-950 rounded-2xl md:rounded-3xl border border-slate-800 flex items-center justify-center overflow-hidden group shadow-inner">
              {backgroundUrl ? (
                <>
                  <Image 
                    src={backgroundUrl} 
                    alt="Background Preview" 
                    fill 
                    className="object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                    <button 
                      onClick={() => backgroundInputRef.current?.click()}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all hover:scale-110 active:scale-95"
                      title="Trocar Fundo"
                    >
                      <Upload size={20} />
                    </button>
                    <button 
                      onClick={() => { setBackgroundUrl(null); setStatus('idle'); }}
                      className="p-3 bg-rose-500/20 hover:bg-rose-500/40 rounded-xl text-rose-400 transition-all hover:scale-110 active:scale-95 border border-rose-500/20 hover:border-rose-500/50"
                      title="Remover Fundo"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div 
                  onClick={() => backgroundInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 text-slate-600 cursor-pointer hover:text-cyan-400 transition-colors bg-slate-900/50 hover:bg-cyan-500/5 w-full h-full justify-center group-hover:border-cyan-500/30"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-cyan-500/10 flex items-center justify-center transition-colors">
                    <Upload size={24} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-center px-4">Upload de<br/>Textura</span>
                </div>
              )}
              
              {isUploadingBackground && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3 backdrop-blur-md">
                  <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">Enviando...</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={backgroundInputRef}
              onChange={(e) => handleFileChange(e, 'background')}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* Form */}
          <div className="flex-1 flex flex-col pt-2">
            <div className="space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Nome da Empresa / App</label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium placeholder:text-slate-600"
                    placeholder="Ex: ELLEVEN"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">CNPJ</label>
                  <input 
                    type="text" 
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium placeholder:text-slate-600"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Endereço (Rodapé dos Laudos)</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium placeholder:text-slate-600"
                    placeholder="Rua Exemplo, 123 - Centro"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Instagram (@)</label>
                  <input 
                    type="text" 
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium placeholder:text-slate-600"
                    placeholder="@elleven.saude"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">LinkedIn</label>
                  <input 
                    type="text" 
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium placeholder:text-slate-600"
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Site Oficial</label>
                  <input 
                    type="text" 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium placeholder:text-slate-600"
                    placeholder="https://suaclinica.com.br"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium placeholder:text-slate-600"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Cor Principal (Brand Color)</label>
                  <div className="flex items-center gap-3 w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus-within:border-cyan-500/50 focus-within:ring-2 focus-within:ring-cyan-500/10 transition-all">
                    <input 
                      type="color" 
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-8 h-8 rounded border-none bg-transparent cursor-pointer p-0"
                    />
                    <input 
                      type="text" 
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="bg-transparent border-none text-white outline-none flex-1 text-sm md:text-base font-medium placeholder:text-slate-600 uppercase"
                      placeholder="#06b6d4"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Cor Secundária (Ícones/Destaques)</label>
                  <div className="flex items-center gap-3 w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                    <input 
                      type="color" 
                      value={secondaryBrandColor}
                      onChange={(e) => setSecondaryBrandColor(e.target.value)}
                      className="w-8 h-8 rounded border-none bg-transparent cursor-pointer p-0"
                    />
                    <input 
                      type="text" 
                      value={secondaryBrandColor}
                      onChange={(e) => setSecondaryBrandColor(e.target.value)}
                      className="bg-transparent border-none text-white outline-none flex-1 text-sm md:text-base font-medium placeholder:text-slate-600 uppercase"
                      placeholder="#10b981"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Visibilidade da Textura ({Math.round((1 - backgroundOpacity) * 100)}%)</label>
                  <div className="flex items-center gap-4 w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 h-[58px]">
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.0" 
                      step="0.05"
                      value={backgroundOpacity}
                      onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                      className="flex-1 accent-cyan-500 h-1.5 rounded-lg appearance-none bg-slate-800 cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 pl-1">Arraste para ajustar a transparência da imagem de fundo</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Estilo das Bordas (Radius)</label>
                  <select 
                    value={cornerRadius}
                    onChange={(e) => setCornerRadius(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium appearance-none"
                  >
                    <option value="0px">Quadrado (0px)</option>
                    <option value="0.5rem">Suave (8px)</option>
                    <option value="1rem">Padrão (16px)</option>
                    <option value="1.5rem">Arredondado (24px)</option>
                    <option value="2rem">Muito Arredondado (32px)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Textura de Fundo (Pattern)</label>
                  <select 
                    value={backgroundPattern}
                    onChange={(e) => setBackgroundPattern(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium appearance-none"
                  >
                    <option value="none">Nenhum</option>
                    <option value="dots">Pontilhado (Dots)</option>
                    <option value="grid">Grade (Grid)</option>
                    <option value="noise">Ruído Analógico (Noise)</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Texto de Boas-vindas</label>
                  <textarea 
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium placeholder:text-slate-600 min-h-[100px] resize-y"
                    placeholder="Bem-vindo ao sistema da clínica..."
                  />
                </div>
              </div>

              {status !== 'idle' && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                  status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {status === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">{message}</span>
                </div>
              )}
            </div>

            <div className="pt-8 mt-auto border-t border-slate-800/50 flex justify-end">
              <Button 
                onClick={handleSave}
                disabled={isSaving || isUploading || isUploadingFavicon || isUploadingSignature || isUploadingBackground}
                className={`w-full md:w-auto ${status === 'success' ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20 text-[#050B14]' : 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/20 text-[#050B14]'} font-black uppercase tracking-widest px-8 md:px-10 py-5 md:py-6 rounded-xl md:rounded-2xl shadow-lg transition-all active:scale-95 text-xs md:text-sm`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : status === 'success' ? (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-0" />
                    Salvo!
                  </motion.div>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Salvar Identidade
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
