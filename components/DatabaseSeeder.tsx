"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/utils';
import { Database, Loader2, CheckCircle, AlertCircle, Zap, Settings2, Lock, X } from 'lucide-react';

export function DatabaseSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showSql, setShowSql] = useState(false);

  const sqlToRun = `-- Execute este SQL no Dashboard do Supabase (SQL Editor)
-- Para criar as tabelas e colunas necessárias

-- 1. Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para executar SQL via RPC (necessário para o Auto-Fix do Dashboard)
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- 2. Criar tabela de atletas se não existir
CREATE TABLE IF NOT EXISTS athletes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nickname TEXT,
    category TEXT NOT NULL,
    athlete_code TEXT UNIQUE,
    password TEXT,
    birth_date DATE,
    gender TEXT,
    weight NUMERIC,
    height NUMERIC,
    custom_fields_data JSONB DEFAULT '{}'::jsonb,
    avatar_url TEXT,
    xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    risk_level TEXT DEFAULT 'Baixo',
    readiness_score INTEGER DEFAULT 0,
    
    -- Campos de Endereço
    address_zip TEXT,
    address_street TEXT,
    address_number TEXT,
    address_complement TEXT,
    address_neighborhood TEXT,
    address_city TEXT,
    address_state TEXT,
    
    -- Campos de Contato/Responsável
    phone TEXT,
    email TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    
    -- Campos Médicos
    alergia BOOLEAN DEFAULT FALSE,
    alergia_desc TEXT,
    medicacao BOOLEAN DEFAULT FALSE,
    medicacao_desc TEXT,
    cirurgia BOOLEAN DEFAULT FALSE,
    cirurgia_desc TEXT,
    
    -- Campos Esportivos
    lado_dominante TEXT,
    posicao TEXT,
    clube_anterior TEXT,
    group_name TEXT,
    status TEXT DEFAULT 'Apto',
    modalidade TEXT,
    convenio TEXT,
    carteirinha TEXT,
    hospital TEXT,
    
    -- Campos de Saúde Feminina
    last_period_date DATE,
    cycle_length INTEGER DEFAULT 28,
    is_menstruating BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.1. Adicionar colunas faltantes se a tabela já existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athletes' AND column_name='group_name') THEN
        ALTER TABLE athletes ADD COLUMN group_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athletes' AND column_name='status') THEN
        ALTER TABLE athletes ADD COLUMN status TEXT DEFAULT 'Apto';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athletes' AND column_name='modalidade') THEN
        ALTER TABLE athletes ADD COLUMN modalidade TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athletes' AND column_name='convenio') THEN
        ALTER TABLE athletes ADD COLUMN convenio TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athletes' AND column_name='carteirinha') THEN
        ALTER TABLE athletes ADD COLUMN carteirinha TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athletes' AND column_name='hospital') THEN
        ALTER TABLE athletes ADD COLUMN hospital TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athletes' AND column_name='xp') THEN
        ALTER TABLE athletes ADD COLUMN xp INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athletes' AND column_name='coins') THEN
        ALTER TABLE athletes ADD COLUMN coins INTEGER DEFAULT 0;
    END IF;
    
    -- Colunas para check_ins
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='check_ins' AND column_name='menstrual_cycle') THEN
        ALTER TABLE check_ins ADD COLUMN menstrual_cycle TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='check_ins' AND column_name='menstrual_symptoms') THEN
        ALTER TABLE check_ins ADD COLUMN menstrual_symptoms TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='check_ins' AND column_name='notes') THEN
        ALTER TABLE check_ins ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='check_ins' AND column_name='record_date') THEN
        ALTER TABLE check_ins ADD COLUMN record_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;

    -- Colunas para wellness_records
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wellness_records' AND column_name='menstrual_cycle') THEN
        ALTER TABLE wellness_records ADD COLUMN menstrual_cycle TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wellness_records' AND column_name='menstrual_symptoms') THEN
        ALTER TABLE wellness_records ADD COLUMN menstrual_symptoms TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wellness_records' AND column_name='hydration_perception') THEN
        ALTER TABLE wellness_records ADD COLUMN hydration_perception NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wellness_records' AND column_name='hydration_score') THEN
        ALTER TABLE wellness_records ADD COLUMN hydration_score NUMERIC;
    END IF;

    -- Colunas para pain_reports
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pain_reports' AND column_name='pain_type') THEN
        ALTER TABLE pain_reports ADD COLUMN pain_type TEXT DEFAULT 'acute';
    END IF;

    -- Tabela de Branding/Configurações do App
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='branding_settings') THEN
        CREATE TABLE branding_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_name TEXT DEFAULT 'ELLEVEN',
            logo_url TEXT,
            favicon_url TEXT,
            brand_color TEXT DEFAULT '#06b6d4',
            secondary_brand_color TEXT DEFAULT '#10b981',
            background_opacity NUMERIC DEFAULT 0.85,
            corner_radius TEXT DEFAULT '1rem',
            background_pattern TEXT DEFAULT 'none',
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        INSERT INTO branding_settings (company_name) VALUES ('ELLEVEN');
    END IF;

    -- Garantir colunas novas na branding_settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_settings' AND column_name='secondary_brand_color') THEN
        ALTER TABLE branding_settings ADD COLUMN secondary_brand_color TEXT DEFAULT '#10b981';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_settings' AND column_name='background_opacity') THEN
        ALTER TABLE branding_settings ADD COLUMN background_opacity NUMERIC DEFAULT 0.85;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_settings' AND column_name='corner_radius') THEN
        ALTER TABLE branding_settings ADD COLUMN corner_radius TEXT DEFAULT '1rem';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_settings' AND column_name='background_pattern') THEN
        ALTER TABLE branding_settings ADD COLUMN background_pattern TEXT DEFAULT 'none';
    END IF;

    -- Tabela de Logs do Sistema
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='system_logs') THEN
        CREATE TABLE system_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            action TEXT NOT NULL,
            module TEXT NOT NULL,
            user_id TEXT,
            details TEXT,
            ip_address TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        -- Inserir alguns logs iniciais
        INSERT INTO system_logs (action, module, details) VALUES 
        ('Sistema Inicializado', 'Core', 'Versão v3.4.2 carregada com sucesso.'),
        ('Configuração de Branding', 'Settings', 'Logotipo atualizado pelo administrador.'),
        ('Base de Dados Otimizada', 'Database', 'Índices reconstruídos para performance.');
    END IF;

    -- Tabela de Esportes/Modalidades
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='sports') THEN
        CREATE TABLE sports (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT UNIQUE NOT NULL,
            icon TEXT DEFAULT '🏆',
            color TEXT DEFAULT '#06b6d4',
            target_athletes INTEGER DEFAULT 20,
            custom_fields JSONB DEFAULT '[]'::jsonb,
            positions TEXT[] DEFAULT ARRAY[]::TEXT[],
            order_index INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Tabela de Configurações da Agenda
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='agenda_settings') THEN
        CREATE TABLE agenda_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            start_time TEXT DEFAULT '08:00',
            end_time TEXT DEFAULT '18:00',
            default_duration_minutes INTEGER DEFAULT 30,
            break_interval_minutes INTEGER DEFAULT 0,
            appointment_types TEXT[] DEFAULT ARRAY['Avaliação', 'Tratamento', 'Revisão', 'Recuperação'],
            appointment_colors JSONB DEFAULT '{}'::jsonb,
            blocked_dates TEXT[] DEFAULT ARRAY[]::TEXT[],
            day_schedules JSONB DEFAULT '{}'::jsonb,
            working_days TEXT[] DEFAULT ARRAY['1', '2', '3', '4', '5'],
            reminder_enabled BOOLEAN DEFAULT true,
            reminder_template TEXT DEFAULT 'Olá {nome}! Seu atendimento está marcado para {data} às {hora}.',
            lunch_start TEXT DEFAULT '12:00',
            lunch_end TEXT DEFAULT '13:00',
            lunch_enabled BOOLEAN DEFAULT true,
            delay_tolerance_minutes INTEGER DEFAULT 15,
            cancellation_notice_hours INTEGER DEFAULT 24,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Garantir que existe pelo menos um registro de configuração
    IF NOT EXISTS (SELECT 1 FROM agenda_settings) THEN
        INSERT INTO agenda_settings (start_time, end_time, default_duration_minutes, break_interval_minutes, appointment_types) 
        VALUES ('08:00', '18:00', 30, 0, ARRAY['Avaliação', 'Tratamento', 'Revisão', 'Recuperação']);
    END IF;

    -- Habilitar RLS
    ALTER TABLE IF EXISTS public.sports ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Permitir tudo" ON public.sports;
    CREATE POLICY "Permitir tudo" ON public.sports FOR ALL USING (true) WITH CHECK (true);

    ALTER TABLE IF EXISTS public.agenda_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Permitir tudo" ON public.agenda_settings;
    CREATE POLICY "Permitir tudo" ON public.agenda_settings FOR ALL USING (true) WITH CHECK (true);

    -- Tabela de Configurações de Automação
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='automation_settings') THEN
        CREATE TABLE automation_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            whatsapp_enabled BOOLEAN DEFAULT true,
            whatsapp_provider TEXT DEFAULT 'evolution',
            evolution_api_url TEXT,
            evolution_api_key TEXT,
            evolution_instance_id TEXT,
            whatsapp_reminder_template TEXT DEFAULT 'Olá {nome}! Seu atendimento está marcado para {data} às {hora}.',
            whatsapp_followup_template TEXT DEFAULT 'Olá {nome}! Como você está se sentindo após o nosso atendimento?',
            whatsapp_reminder_timing TEXT[] DEFAULT ARRAY['24h']::TEXT[],
            whatsapp_followup_timing TEXT[] DEFAULT ARRAY['24h']::TEXT[],
            whatsapp_birthday_enabled BOOLEAN DEFAULT false,
            whatsapp_birthday_template TEXT DEFAULT 'Parabéns {nome}! Toda a nossa equipe deseja um feliz aniversário!',
            whatsapp_absence_enabled BOOLEAN DEFAULT false,
            whatsapp_absence_template TEXT DEFAULT 'Olá {nome}, sentimos sua falta! Faz tempo desde sua última sessão, que tal agendar um retorno?',
            finance_reminder_enabled BOOLEAN DEFAULT false,
            finance_reminder_template TEXT DEFAULT 'Olá {nome}! Lembramos que seu pacote/mensalidade vence no dia {data}.',
            finance_receipt_enabled BOOLEAN DEFAULT false,
            finance_receipt_template TEXT DEFAULT 'Olá {nome}! Confirmamos o recebimento do seu pagamento no valor de R$ {valor}. Obrigado!',
            prof_morning_resume_enabled BOOLEAN DEFAULT false,
            prof_morning_resume_time TEXT DEFAULT '07:00',
            prof_new_appointment_enabled BOOLEAN DEFAULT false,
            prep_instructions_enabled BOOLEAN DEFAULT false,
            prep_instructions_template TEXT DEFAULT 'Olá {nome}! Aqui estão algumas orientações importantes antes da sua primeira avaliação com a gente.',
            email_enabled BOOLEAN DEFAULT false,
            resend_api_key TEXT,
            email_reminder_template TEXT DEFAULT 'Seu atendimento está marcado para {data} às {hora}.',
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Garantir que existe um registro de configuração de automação
    IF NOT EXISTS (SELECT 1 FROM automation_settings) THEN
        INSERT INTO automation_settings (whatsapp_enabled) VALUES (true);
    END IF;

    -- Tabela de Configurações Clínicas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='clinical_settings') THEN
        CREATE TABLE clinical_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            critical_readiness_threshold INTEGER DEFAULT 50,
            critical_pain_threshold INTEGER DEFAULT 7,
            attention_readiness_min INTEGER DEFAULT 50,
            attention_readiness_max INTEGER DEFAULT 75,
            attention_pain_min INTEGER DEFAULT 4,
            attention_pain_max INTEGER DEFAULT 6,
            risk_message TEXT DEFAULT 'Atleta em risco crítico. Avaliação médica e fisioterapêutica imediata necessária.',
            attention_message TEXT DEFAULT 'Atleta em estado de atenção. Monitorar carga de treino e recuperação.',
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM clinical_settings) THEN
        INSERT INTO clinical_settings (
            critical_readiness_threshold, critical_pain_threshold,
            attention_readiness_min, attention_readiness_max,
            attention_pain_min, attention_pain_max,
            risk_message, attention_message
        ) VALUES (
            50, 7, 50, 75, 4, 6,
            'Atleta em risco crítico. Avaliação médica e fisioterapêutica imediata necessária.',
            'Atleta em estado de atenção. Monitorar carga de treino e recuperação.'
        );
    END IF;

    -- Tabela de Perfil do Usuário
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_profile_settings') THEN
        CREATE TABLE user_profile_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT DEFAULT 'Usuário',
            email TEXT,
            avatar_url TEXT,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM user_profile_settings) THEN
        INSERT INTO user_profile_settings (name) VALUES ('Usuário');
    END IF;

    -- Tabela de Tarefas do Dia
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='daily_tasks') THEN
        CREATE TABLE daily_tasks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            is_completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Habilitar RLS
        ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

        -- Criar políticas de acesso (Público para simplificar o dashboard operacional)
        DROP POLICY IF EXISTS "Permitir tudo para todos" ON daily_tasks;
        CREATE POLICY "Permitir tudo para todos" ON daily_tasks FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Tabela EARS Smart Agenda
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='agenda_events') THEN
        CREATE TABLE agenda_events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            category TEXT NOT NULL, -- clinical | professional | personal | competition | travel
            subcategory TEXT,
            location TEXT,
            is_all_day BOOLEAN DEFAULT FALSE,
            athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
            risk_score NUMERIC,
            priority NUMERIC NOT NULL,
            origin TEXT DEFAULT 'manual',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Habilitar RLS
        ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

        -- Criar políticas de acesso (Público para simplificar)
        DROP POLICY IF EXISTS "Permitir tudo para todos" ON agenda_events;
        CREATE POLICY "Permitir tudo para todos" ON agenda_events FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Add columns to agenda_events if it already exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='location') THEN
        ALTER TABLE agenda_events ADD COLUMN location TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='address') THEN
        ALTER TABLE agenda_events ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='is_all_day') THEN
        ALTER TABLE agenda_events ADD COLUMN is_all_day BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='reminder_minutes') THEN
        ALTER TABLE agenda_events ADD COLUMN reminder_minutes INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='recurrence_rule') THEN
        ALTER TABLE agenda_events ADD COLUMN recurrence_rule TEXT DEFAULT 'none';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='recurrence_group_id') THEN
        ALTER TABLE agenda_events ADD COLUMN recurrence_group_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='recurrence_days') THEN
        ALTER TABLE agenda_events ADD COLUMN recurrence_days INTEGER[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='result') THEN
        ALTER TABLE agenda_events ADD COLUMN result TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='feedback') THEN
        ALTER TABLE agenda_events ADD COLUMN feedback TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='status') THEN
        ALTER TABLE agenda_events ADD COLUMN status TEXT DEFAULT 'scheduled';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='meet_link') THEN
        ALTER TABLE agenda_events ADD COLUMN meet_link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='payment_status') THEN
        ALTER TABLE agenda_events ADD COLUMN payment_status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda_events' AND column_name='event_value') THEN
        ALTER TABLE agenda_events ADD COLUMN event_value NUMERIC(10,2);
    END IF;
END $$;

-- 2.2. Criar tabela de check_ins se não existir
CREATE TABLE IF NOT EXISTS check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    sleep_quality INTEGER NOT NULL,
    stress_level INTEGER NOT NULL,
    muscle_soreness INTEGER NOT NULL,
    energy_level INTEGER NOT NULL,
    hydration INTEGER DEFAULT 3,
    nutrition INTEGER DEFAULT 3,
    mood INTEGER DEFAULT 3,
    sleep_hours NUMERIC DEFAULT 8,
    pre_training_meal INTEGER DEFAULT 3,
    training_recovery INTEGER DEFAULT 3,
    confidence INTEGER DEFAULT 3,
    leg_heaviness INTEGER DEFAULT 3,
    overall_wellbeing INTEGER DEFAULT 3,
    readiness_score INTEGER NOT NULL,
    menstrual_cycle TEXT,
    menstrual_symptoms TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 2.3. Criar tabela de pain_reports se não existir
CREATE TABLE IF NOT EXISTS pain_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
    body_part_id TEXT NOT NULL,
    pain_level INTEGER NOT NULL,
    pain_type TEXT DEFAULT 'acute',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Criar tabela de wellness_records se não existir
CREATE TABLE IF NOT EXISTS wellness_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours DECIMAL(4,2),
  sleep_quality INTEGER,
  fatigue_level INTEGER,
  muscle_soreness INTEGER,
  soreness_location TEXT,
  stress_level INTEGER,
  readiness_score INTEGER,
  menstrual_cycle TEXT,
  menstrual_symptoms TEXT[],
  hydration_perception NUMERIC,
  hydration_score NUMERIC,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de clinical_notes se não existir
CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  note_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pain_level INTEGER,
  feeling TEXT,
  regions TEXT[],
  treatments TEXT[],
  observations TEXT,
  generated_text TEXT,
  is_signed BOOLEAN DEFAULT FALSE,
  professional_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar note_date se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clinical_notes' AND column_name='note_date') THEN
        ALTER TABLE clinical_notes ADD COLUMN note_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 5. Criar tabela de clinical_assessments se não existir
CREATE TABLE IF NOT EXISTS clinical_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  score NUMERIC,
  risk_level TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar tabelas modulares de avaliações se não existirem
CREATE TABLE IF NOT EXISTS sleep_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orthopedic_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biomechanical_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS physical_load_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS performance_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS neurological_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS psychological_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutritional_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Criar tabela de tarefas do dia (Daily Tasks)
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reds_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anthropometric_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maturation_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menstrual_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hydration_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS functional_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dynamometry_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS postural_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score NUMERIC,
  classification TEXT,
  classification_color TEXT,
  alerts JSONB DEFAULT '[]',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.1. Criar tabelas financeiras se não existirem
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('revenue', 'expense')),
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('paid', 'pending', 'cancelled')),
    athlete_id UUID REFERENCES public.athletes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.billings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Habilitar RLS e criar políticas básicas (Permissivo para desenvolvimento)
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orthopedic_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomechanical_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_load_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE neurological_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychological_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutritional_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reds_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE anthropometric_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maturation_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE menstrual_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE functional_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamometry_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE postural_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Políticas para athletes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'athletes' AND policyname = 'Permitir tudo') THEN
        CREATE POLICY "Permitir tudo" ON athletes FOR ALL USING (true) WITH CHECK (true);
    END IF;
    -- Políticas para wellness_records
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wellness_records' AND policyname = 'Permitir tudo') THEN
        CREATE POLICY "Permitir tudo" ON wellness_records FOR ALL USING (true) WITH CHECK (true);
    END IF;
    -- Políticas para clinical_notes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinical_notes' AND policyname = 'Permitir tudo') THEN
        CREATE POLICY "Permitir tudo" ON clinical_notes FOR ALL USING (true) WITH CHECK (true);
    END IF;
    -- Políticas para clinical_assessments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinical_assessments' AND policyname = 'Permitir tudo') THEN
        CREATE POLICY "Permitir tudo" ON clinical_assessments FOR ALL USING (true) WITH CHECK (true);
    END IF;
    -- Políticas para tabelas modulares
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sleep_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON sleep_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orthopedic_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON orthopedic_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'biomechanical_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON biomechanical_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'physical_load_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON physical_load_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'performance_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON performance_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'neurological_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON neurological_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'psychological_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON psychological_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nutritional_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON nutritional_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reds_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON reds_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'anthropometric_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON anthropometric_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'maturation_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON maturation_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'menstrual_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON menstrual_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hydration_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON hydration_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'functional_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON functional_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dynamometry_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON dynamometry_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'postural_assessments' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON postural_assessments FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON transactions FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billings' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON billings FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'branding_settings' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON branding_settings FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agenda_settings' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON agenda_settings FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON automation_settings FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinical_settings' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON clinical_settings FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profile_settings' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON user_profile_settings FOR ALL USING (true) WITH CHECK (true); END IF;
END $$;

-- 8. Adicionar colunas faltantes se as tabelas já existirem
DO $$ 
BEGIN
    -- Colunas na tabela agenda_settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'working_days') THEN
        ALTER TABLE public.agenda_settings ADD COLUMN working_days TEXT[] DEFAULT ARRAY['1', '2', '3', '4', '5'];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'lunch_start') THEN
        ALTER TABLE public.agenda_settings ADD COLUMN lunch_start TEXT DEFAULT '12:00';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'lunch_end') THEN
        ALTER TABLE public.agenda_settings ADD COLUMN lunch_end TEXT DEFAULT '13:00';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'lunch_enabled') THEN
        ALTER TABLE public.agenda_settings ADD COLUMN lunch_enabled BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'day_schedules') THEN
        ALTER TABLE public.agenda_settings ADD COLUMN day_schedules JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'blocked_dates') THEN
        ALTER TABLE public.agenda_settings ADD COLUMN blocked_dates TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'reminder_enabled') THEN
        ALTER TABLE public.agenda_settings ADD COLUMN reminder_enabled BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'reminder_template') THEN
        ALTER TABLE public.agenda_settings ADD COLUMN reminder_template TEXT DEFAULT 'Olá {nome}! Seu atendimento está marcado para {data} às {hora}.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'delay_tolerance_minutes') THEN
        ALTER TABLE public.agenda_settings ADD COLUMN delay_tolerance_minutes INTEGER DEFAULT 15;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'cancellation_notice_hours') THEN
        ALTER TABLE public.agenda_settings ADD COLUMN cancellation_notice_hours INTEGER DEFAULT 24;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'appointment_colors') THEN
        ALTER TABLE public.agenda_settings ADD COLUMN appointment_colors JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Colunas na tabela automation_settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_enabled') THEN
        ALTER TABLE public.automation_settings ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_reminder_template') THEN
        ALTER TABLE public.automation_settings ADD COLUMN whatsapp_reminder_template TEXT DEFAULT 'Olá {nome}! Seu atendimento está marcado para {data} às {hora}.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_followup_template') THEN
        ALTER TABLE public.automation_settings ADD COLUMN whatsapp_followup_template TEXT DEFAULT 'Olá {nome}! Como você está se sentindo após o nosso atendimento?';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_provider') THEN
        ALTER TABLE public.automation_settings ADD COLUMN whatsapp_provider TEXT DEFAULT 'evolution';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'evolution_api_url') THEN
        ALTER TABLE public.automation_settings ADD COLUMN evolution_api_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'evolution_api_key') THEN
        ALTER TABLE public.automation_settings ADD COLUMN evolution_api_key TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'evolution_instance_id') THEN
        ALTER TABLE public.automation_settings ADD COLUMN evolution_instance_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'resend_api_key') THEN
        ALTER TABLE public.automation_settings ADD COLUMN resend_api_key TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_reminder_timing') THEN
        ALTER TABLE public.automation_settings ADD COLUMN whatsapp_reminder_timing TEXT[] DEFAULT ARRAY['24h']::TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_followup_timing') THEN
        ALTER TABLE public.automation_settings ADD COLUMN whatsapp_followup_timing TEXT[] DEFAULT ARRAY['24h']::TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_birthday_enabled') THEN
        ALTER TABLE public.automation_settings ADD COLUMN whatsapp_birthday_enabled BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_birthday_template') THEN
        ALTER TABLE public.automation_settings ADD COLUMN whatsapp_birthday_template TEXT DEFAULT 'Parabéns {nome}! Toda a nossa equipe deseja um feliz aniversário!';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_absence_enabled') THEN
        ALTER TABLE public.automation_settings ADD COLUMN whatsapp_absence_enabled BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_absence_template') THEN
        ALTER TABLE public.automation_settings ADD COLUMN whatsapp_absence_template TEXT DEFAULT 'Olá {nome}, sentimos sua falta! Faz tempo desde sua última sessão, que tal agendar um retorno?';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'finance_reminder_enabled') THEN
        ALTER TABLE public.automation_settings ADD COLUMN finance_reminder_enabled BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'finance_reminder_template') THEN
        ALTER TABLE public.automation_settings ADD COLUMN finance_reminder_template TEXT DEFAULT 'Olá {nome}! Lembramos que seu pacote/mensalidade vence no dia {data}.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'finance_receipt_enabled') THEN
        ALTER TABLE public.automation_settings ADD COLUMN finance_receipt_enabled BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'finance_receipt_template') THEN
        ALTER TABLE public.automation_settings ADD COLUMN finance_receipt_template TEXT DEFAULT 'Olá {nome}! Confirmamos o recebimento do seu pagamento no valor de R$ {valor}. Obrigado!';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'prof_morning_resume_enabled') THEN
        ALTER TABLE public.automation_settings ADD COLUMN prof_morning_resume_enabled BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'prof_morning_resume_time') THEN
        ALTER TABLE public.automation_settings ADD COLUMN prof_morning_resume_time TEXT DEFAULT '07:00';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'prof_new_appointment_enabled') THEN
        ALTER TABLE public.automation_settings ADD COLUMN prof_new_appointment_enabled BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'prep_instructions_enabled') THEN
        ALTER TABLE public.automation_settings ADD COLUMN prep_instructions_enabled BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'prep_instructions_template') THEN
        ALTER TABLE public.automation_settings ADD COLUMN prep_instructions_template TEXT DEFAULT 'Olá {nome}! Aqui estão algumas orientações importantes antes da sua primeira avaliação com a gente.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'email_enabled') THEN
        ALTER TABLE public.automation_settings ADD COLUMN email_enabled BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'email_reminder_template') THEN
        ALTER TABLE public.automation_settings ADD COLUMN email_reminder_template TEXT DEFAULT 'Seu atendimento está marcado para {data} às {hora}.';
    END IF;

    -- Colunas na tabela athletes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'password') THEN
        ALTER TABLE public.athletes ADD COLUMN password TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'athlete_code') THEN
        ALTER TABLE public.athletes ADD COLUMN athlete_code TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'address_zip') THEN
        ALTER TABLE public.athletes ADD COLUMN address_zip TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'address_street') THEN
        ALTER TABLE public.athletes ADD COLUMN address_street TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'address_number') THEN
        ALTER TABLE public.athletes ADD COLUMN address_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'address_complement') THEN
        ALTER TABLE public.athletes ADD COLUMN address_complement TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'address_neighborhood') THEN
        ALTER TABLE public.athletes ADD COLUMN address_neighborhood TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'address_city') THEN
        ALTER TABLE public.athletes ADD COLUMN address_city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'address_state') THEN
        ALTER TABLE public.athletes ADD COLUMN address_state TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'phone') THEN
        ALTER TABLE public.athletes ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'email') THEN
        ALTER TABLE public.athletes ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'guardian_name') THEN
        ALTER TABLE public.athletes ADD COLUMN guardian_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'guardian_phone') THEN
        ALTER TABLE public.athletes ADD COLUMN guardian_phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'alergia') THEN
        ALTER TABLE public.athletes ADD COLUMN alergia BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'alergia_desc') THEN
        ALTER TABLE public.athletes ADD COLUMN alergia_desc TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'medicacao') THEN
        ALTER TABLE public.athletes ADD COLUMN medicacao BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'medicacao_desc') THEN
        ALTER TABLE public.athletes ADD COLUMN medicacao_desc TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'cirurgia') THEN
        ALTER TABLE public.athletes ADD COLUMN cirurgia BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'cirurgia_desc') THEN
        ALTER TABLE public.athletes ADD COLUMN cirurgia_desc TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'lado_dominante') THEN
        ALTER TABLE public.athletes ADD COLUMN lado_dominante TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'posicao') THEN
        ALTER TABLE public.athletes ADD COLUMN posicao TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'clube_anterior') THEN
        ALTER TABLE public.athletes ADD COLUMN clube_anterior TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'last_period_date') THEN
        ALTER TABLE public.athletes ADD COLUMN last_period_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'cycle_length') THEN
        ALTER TABLE public.athletes ADD COLUMN cycle_length INTEGER DEFAULT 28;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'is_menstruating') THEN
        ALTER TABLE public.athletes ADD COLUMN is_menstruating BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'custom_fields_data') THEN
        ALTER TABLE public.athletes ADD COLUMN custom_fields_data JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Colunas na tabela wellness_records
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wellness_records' AND column_name = 'menstrual_cycle') THEN
        ALTER TABLE public.wellness_records ADD COLUMN menstrual_cycle TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'check_ins' AND column_name = 'record_date') THEN
        ALTER TABLE public.check_ins ADD COLUMN record_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wellness_records' AND column_name = 'menstrual_symptoms') THEN
        ALTER TABLE public.wellness_records ADD COLUMN menstrual_symptoms TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wellness_records' AND column_name = 'hydration_perception') THEN
        ALTER TABLE public.wellness_records ADD COLUMN hydration_perception NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wellness_records' AND column_name = 'hydration_score') THEN
        ALTER TABLE public.wellness_records ADD COLUMN hydration_score NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wellness_records' AND column_name = 'comments') THEN
        ALTER TABLE public.wellness_records ADD COLUMN comments TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wellness_records' AND column_name = 'readiness_score') THEN
        ALTER TABLE public.wellness_records ADD COLUMN readiness_score INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wellness_records' AND column_name = 'sleep_hours') THEN
        ALTER TABLE public.wellness_records ADD COLUMN sleep_hours DECIMAL(4,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wellness_records' AND column_name = 'sleep_quality') THEN
        ALTER TABLE public.wellness_records ADD COLUMN sleep_quality INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wellness_records' AND column_name = 'fatigue_level') THEN
        ALTER TABLE public.wellness_records ADD COLUMN fatigue_level INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wellness_records' AND column_name = 'muscle_soreness') THEN
        ALTER TABLE public.wellness_records ADD COLUMN muscle_soreness INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wellness_records' AND column_name = 'stress_level') THEN
        ALTER TABLE public.wellness_records ADD COLUMN stress_level INTEGER;
    END IF;

    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_wellness_records_athlete_date ON public.wellness_records (athlete_id, record_date DESC);
    CREATE INDEX IF NOT EXISTS idx_wellness_records_date ON public.wellness_records (record_date DESC);
    CREATE INDEX IF NOT EXISTS idx_pain_reports_athlete_created ON public.pain_reports (athlete_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_pain_reports_created ON public.pain_reports (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_athletes_name ON public.athletes (name);
    CREATE INDEX IF NOT EXISTS idx_check_ins_athlete_date ON public.check_ins (athlete_id, created_at DESC);
    
    -- Índices para tabelas de avaliações (para otimizar a view all_assessments)
    CREATE INDEX IF NOT EXISTS idx_clinical_assessments_athlete ON public.clinical_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_sleep_assessments_athlete ON public.sleep_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_orthopedic_assessments_athlete ON public.orthopedic_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_biomechanical_assessments_athlete ON public.biomechanical_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_physical_load_assessments_athlete ON public.physical_load_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_performance_assessments_athlete ON public.performance_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_neurological_assessments_athlete ON public.neurological_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_psychological_assessments_athlete ON public.psychological_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_nutritional_assessments_athlete ON public.nutritional_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_reds_assessments_athlete ON public.reds_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_anthropometric_assessments_athlete ON public.anthropometric_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_maturation_assessments_athlete ON public.maturation_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_menstrual_assessments_athlete ON public.menstrual_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_hydration_assessments_athlete ON public.hydration_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_functional_assessments_athlete ON public.functional_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_dynamometry_assessments_athlete ON public.dynamometry_assessments (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_postural_assessments_athlete ON public.postural_assessments (athlete_id);
    
    -- Índices para performance de wellness e check-ins
    CREATE INDEX IF NOT EXISTS idx_wellness_records_athlete_id ON public.wellness_records (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_wellness_records_record_date ON public.wellness_records (record_date);
    CREATE INDEX IF NOT EXISTS idx_wellness_records_date_athlete ON public.wellness_records (record_date, athlete_id);
    CREATE INDEX IF NOT EXISTS idx_check_ins_athlete_id ON public.check_ins (athlete_id);
    CREATE INDEX IF NOT EXISTS idx_check_ins_created_at ON public.check_ins (created_at);
    CREATE INDEX IF NOT EXISTS idx_check_ins_record_date ON public.check_ins (record_date);
    CREATE INDEX IF NOT EXISTS idx_check_ins_date_athlete ON public.check_ins (record_date, athlete_id);
    CREATE INDEX IF NOT EXISTS idx_pain_reports_check_in_id ON public.pain_reports (check_in_id);
    
    -- Otimizar estatísticas do banco
    ANALYZE public.athletes;
    ANALYZE public.wellness_records;
    ANALYZE public.check_ins;
    
    -- Índices para appointments
    DO $inner$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'date') THEN
            CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments (date DESC);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'appointment_date') THEN
            CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON public.appointments (appointment_date DESC);
        END IF;
    END $inner$;

    -- Colunas na tabela clinical_assessments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_assessments' AND column_name = 'type') THEN
        ALTER TABLE public.clinical_assessments ADD COLUMN type TEXT NOT NULL DEFAULT 'functional';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_assessments' AND column_name = 'data') THEN
        ALTER TABLE public.clinical_assessments ADD COLUMN data JSONB NOT NULL DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_assessments' AND column_name = 'assessment_date') THEN
        ALTER TABLE public.clinical_assessments ADD COLUMN assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Correção para coluna legada assessment_type se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_assessments' AND column_name = 'assessment_type') THEN
        ALTER TABLE public.clinical_assessments ALTER COLUMN assessment_type DROP NOT NULL;
        ALTER TABLE public.clinical_assessments ALTER COLUMN assessment_type SET DEFAULT 'functional';
    END IF;
END $$;

-- 9. Recriar view all_assessments para garantir que as colunas novas sejam incluídas de TODAS as tabelas
DROP VIEW IF EXISTS all_assessments;
CREATE OR REPLACE VIEW all_assessments AS
SELECT id, athlete_id, type as assessment_type, score, risk_level as classification, NULL as classification_color, '[]'::jsonb as alerts, data, created_at, assessment_date, 'clinical_assessments' as source_table FROM clinical_assessments
UNION ALL
SELECT id, athlete_id, 'sleep' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'sleep_assessments' as source_table FROM sleep_assessments
UNION ALL
SELECT id, athlete_id, 'orthopedic' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'orthopedic_assessments' as source_table FROM orthopedic_assessments
UNION ALL
SELECT id, athlete_id, 'biomechanical' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'biomechanical_assessments' as source_table FROM biomechanical_assessments
UNION ALL
SELECT id, athlete_id, 'physical' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'physical_load_assessments' as source_table FROM physical_load_assessments
UNION ALL
SELECT id, athlete_id, 'performance' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'performance_assessments' as source_table FROM performance_assessments
UNION ALL
SELECT id, athlete_id, 'neurological' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'neurological_assessments' as source_table FROM neurological_assessments
UNION ALL
SELECT id, athlete_id, 'psychological' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'psychological_assessments' as source_table FROM psychological_assessments
UNION ALL
SELECT id, athlete_id, 'nutritional' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'nutritional_assessments' as source_table FROM nutritional_assessments
UNION ALL
SELECT id, athlete_id, 'reds' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'reds_assessments' as source_table FROM reds_assessments
UNION ALL
SELECT id, athlete_id, 'anthropometric' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'anthropometric_assessments' as source_table FROM anthropometric_assessments
UNION ALL
SELECT id, athlete_id, 'maturation' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'maturation_assessments' as source_table FROM maturation_assessments
UNION ALL
SELECT id, athlete_id, 'menstrual' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'menstrual_assessments' as source_table FROM menstrual_assessments
UNION ALL
SELECT id, athlete_id, 'hydration' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'hydration_assessments' as source_table FROM hydration_assessments
UNION ALL
SELECT id, athlete_id, 'functional' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'functional_assessments' as source_table FROM functional_assessments
UNION ALL
SELECT id, athlete_id, 'dynamometry' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'dynamometry_assessments' as source_table FROM dynamometry_assessments
UNION ALL
SELECT id, athlete_id, 'postural' as assessment_type, score, classification, classification_color, alerts, raw_data as data, created_at, assessment_date, 'postural_assessments' as source_table FROM postural_assessments;

-- Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- Tentar criar bucket de branding e avatares
DO $storage$
BEGIN
    -- 1. Criar Bucket Branding
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('branding', 'branding', true)
    ON CONFLICT (id) DO NOTHING;

    -- 1.1 Criar Bucket Avatars
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;
END $storage$;`;

  const [isFixing, setIsFixing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const runMigrations = async () => {
    if (!supabase) return;
    setIsMigrating(true);
    setStatus('loading');
    setMessage('Criando tabelas e atualizando banco de dados...');
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: sqlToRun });
      if (error) {
        throw new Error(error.message + " (Você precisa executar o SQL manualmente no painel do Supabase se a função exec_sql não existir)");
      }
      setStatus('success');
      setMessage('Estrutura do banco de dados atualizada com sucesso!');
      setIsMigrating(false);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Erro ao executar migrações.');
      setIsMigrating(false);
      setShowSql(true);
    }
  };

  const clearDatabase = async () => {
    if (!window.confirm('ATENÇÃO: Você tem certeza absoluta que deseja apagar TODOS os dados do sistema? (Atletas, registros clínicos, eventos, avaliações, etc.) Isso não pode ser desfeito.')) {
      return;
    }
    setShowPasswordPrompt(true);
  };

  const confirmClearDatabase = async () => {
    try {
      if (!deletePassword) {
        alert('Por favor, digite sua senha.');
        return;
      }

      setIsClearing(true);
      setStatus('loading');
      setMessage('Verificando credenciais...');
      console.log('Iniciando processo de limpeza do banco de dados...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error('Usuário não autenticado.');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });

      if (signInError) throw new Error('Senha incorreta. Ação cancelada.');

      setShowPasswordPrompt(false);
      setDeletePassword('');
      
      setMessage('Limpando Banco de Dados... Excluindo eventos e tarefas.');

      await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('daily_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      setMessage('Limpando Atletas e registros associados (cascade)...');
      await supabase.from('athletes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      setStatus('success');
      setMessage('Banco de dados limpo com sucesso! Nenhuma informação de teste (Atletas/Agenda/Wellness) restou no sistema.');
    } catch (error: any) {
      console.error('Erro ao limpar banco:', error);
      setStatus('error');
      setMessage(`Erro ao limpar banco: ${error?.message || String(error)}`);
      setShowPasswordPrompt(false);
      setDeletePassword('');
    } finally {
      setIsClearing(false);
    }
  };

  const fixPerformance = async () => {
    try {
      setIsFixing(true);
      setStatus('loading');
      setMessage('Otimizando índices e reparando permissões...');
      
      const sql = `
        -- Aumentar timeout para esta transação se possível
        SET statement_timeout = '60s';

        -- Criar índices se não existirem
        CREATE INDEX IF NOT EXISTS idx_athletes_name ON public.athletes (name);
        CREATE INDEX IF NOT EXISTS idx_athletes_status ON public.athletes (status);
        CREATE INDEX IF NOT EXISTS idx_athletes_group ON public.athletes (group_name);
        
        CREATE INDEX IF NOT EXISTS idx_wellness_records_athlete_date ON public.wellness_records (athlete_id, record_date DESC);
        CREATE INDEX IF NOT EXISTS idx_wellness_records_date ON public.wellness_records (record_date DESC);
        
        CREATE INDEX IF NOT EXISTS idx_pain_reports_athlete_created ON public.pain_reports (athlete_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_pain_reports_created ON public.pain_reports (created_at DESC);
        
        CREATE INDEX IF NOT EXISTS idx_check_ins_athlete_date ON public.check_ins (athlete_id, date DESC);
        CREATE INDEX IF NOT EXISTS idx_check_ins_date ON public.check_ins (date DESC);
        
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (date DESC);
        CREATE INDEX IF NOT EXISTS idx_billings_due_date ON public.billings (due_date DESC);
        CREATE INDEX IF NOT EXISTS idx_billings_status ON public.billings (status);

        -- Habilitar RLS e criar políticas para tabelas financeiras
        ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.billings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.transactions;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.billings;
        CREATE POLICY "Permitir tudo" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.billings FOR ALL USING (true) WITH CHECK (true);

        -- Tabela de Configurações Clínicas
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='clinical_settings') THEN
                CREATE TABLE clinical_settings (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    critical_readiness_threshold INTEGER DEFAULT 50,
                    critical_pain_threshold INTEGER DEFAULT 7,
                    attention_readiness_min INTEGER DEFAULT 50,
                    attention_readiness_max INTEGER DEFAULT 75,
                    attention_pain_min INTEGER DEFAULT 4,
                    attention_pain_max INTEGER DEFAULT 6,
                    risk_message TEXT DEFAULT 'Atleta em risco crítico. Avaliação médica e fisioterapêutica imediata necessária.',
                    attention_message TEXT DEFAULT 'Atleta em estado de atenção. Monitorar carga de treino e recuperação.',
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM clinical_settings) THEN
                INSERT INTO clinical_settings (
                    critical_readiness_threshold, critical_pain_threshold,
                    attention_readiness_min, attention_readiness_max,
                    attention_pain_min, attention_pain_max,
                    risk_message, attention_message
                ) VALUES (
                    50, 7, 50, 75, 4, 6,
                    'Atleta em risco crítico. Avaliação médica e fisioterapêutica imediata necessária.',
                    'Atleta em estado de atenção. Monitorar carga de treino e recuperação.'
                );
            END IF;
        END $$;

        ALTER TABLE IF EXISTS public.clinical_settings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.clinical_settings;
        CREATE POLICY "Permitir tudo" ON public.clinical_settings FOR ALL USING (true) WITH CHECK (true);

        -- Tabela de Esportes
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='sports') THEN
                CREATE TABLE sports (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT UNIQUE NOT NULL,
                    icon TEXT DEFAULT '🏆',
                    color TEXT DEFAULT '#06b6d4',
                    target_athletes INTEGER DEFAULT 20,
                    custom_fields JSONB DEFAULT '[]'::jsonb,
                    positions TEXT[] DEFAULT ARRAY[]::TEXT[],
                    order_index INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;
        END $$;

        ALTER TABLE IF EXISTS public.sports ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.sports;
        CREATE POLICY "Permitir tudo" ON public.sports FOR ALL USING (true) WITH CHECK (true);

        -- Tabela de Perfil do Usuário
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_profile_settings') THEN
                CREATE TABLE user_profile_settings (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT DEFAULT 'Usuário',
                    email TEXT,
                    avatar_url TEXT,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM user_profile_settings) THEN
                INSERT INTO user_profile_settings (name) VALUES ('Usuário');
            END IF;
        END $$;

        ALTER TABLE IF EXISTS public.user_profile_settings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.user_profile_settings;
        CREATE POLICY "Permitir tudo" ON public.user_profile_settings FOR ALL USING (true) WITH CHECK (true);

        -- Garantir Tabelas de Agenda, Automação e Financeiro
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='agenda_settings') THEN
                CREATE TABLE agenda_settings (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    start_time TEXT DEFAULT '08:00',
                    end_time TEXT DEFAULT '18:00',
                    default_duration_minutes INTEGER DEFAULT 30,
                    break_interval_minutes INTEGER DEFAULT 0,
                    appointment_types TEXT[] DEFAULT ARRAY['Avaliação', 'Tratamento', 'Revisão', 'Recuperação'],
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='automation_settings') THEN
                CREATE TABLE automation_settings (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    whatsapp_provider TEXT DEFAULT 'evolution',
                    whatsapp_reminder_enabled BOOLEAN DEFAULT true,
                    email_reminder_enabled BOOLEAN DEFAULT true,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            -- Tabelas Financeiras
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_categories') THEN
                CREATE TABLE financial_categories (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT NOT NULL,
                    type TEXT NOT NULL, -- 'income' ou 'expense'
                    is_default BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_goals') THEN
                CREATE TABLE financial_goals (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT NOT NULL,
                    target_amount NUMERIC NOT NULL,
                    current_amount NUMERIC DEFAULT 0,
                    type TEXT DEFAULT 'saving', -- 'income_goal', 'expense_limit', 'saving'
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_closures') THEN
                CREATE TABLE financial_closures (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    month TEXT UNIQUE NOT NULL, -- formato YYYY-MM
                    final_balance NUMERIC NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_products') THEN
                CREATE TABLE financial_products (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT NOT NULL,
                    default_price NUMERIC NOT NULL,
                    type TEXT DEFAULT 'service',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_billing_rules') THEN
                CREATE TABLE financial_billing_rules (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    default_due_day INTEGER DEFAULT 5,
                    reminder_days_before INTEGER DEFAULT 3,
                    warn_after_days_late INTEGER DEFAULT 1,
                    penalty_rate NUMERIC DEFAULT 2.0, -- Multa (%)
                    interest_rate_monthly NUMERIC DEFAULT 1.0, -- Juros ao mês (%)
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_payment_methods') THEN
                CREATE TABLE financial_payment_methods (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT NOT NULL,
                    type TEXT NOT NULL, -- 'pix', 'credit', 'debit', 'boleto', 'cash'
                    fee_percentage NUMERIC DEFAULT 0,
                    fee_fixed NUMERIC DEFAULT 0,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_taxes') THEN
                CREATE TABLE financial_taxes (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT NOT NULL,
                    rate NUMERIC NOT NULL,
                    type TEXT DEFAULT 'retention', -- 'retention', 'addition'
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_splits') THEN
                CREATE TABLE financial_splits (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT NOT NULL,
                    recipient_name TEXT NOT NULL,
                    percentage NUMERIC NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_cost_centers') THEN
                CREATE TABLE financial_cost_centers (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT NOT NULL,
                    description TEXT,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_invoice_settings') THEN
                CREATE TABLE financial_invoice_settings (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    auto_emit BOOLEAN DEFAULT false,
                    emit_when TEXT DEFAULT 'on_payment',
                    municipal_registration TEXT,
                    company_name TEXT,
                    cnpj TEXT,
                    tax_regime TEXT,
                    provider TEXT DEFAULT 'manual', -- enotas, focus
                    api_key TEXT,
                    cnae TEXT,
                    service_code TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_notification_settings') THEN
                CREATE TABLE financial_notification_settings (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    notify_client_on_issue BOOLEAN DEFAULT true,
                    notify_client_before_due INTEGER DEFAULT 3,
                    notify_client_on_overdue BOOLEAN DEFAULT true,
                    notify_admin_on_payment BOOLEAN DEFAULT true,
                    template_reminder TEXT,
                    template_overdue TEXT,
                    template_receipt TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_wallets') THEN
                CREATE TABLE financial_wallets (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT NOT NULL,
                    type TEXT DEFAULT 'bank', -- bank, cash, digital
                    initial_balance NUMERIC DEFAULT 0,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_api_gateways') THEN
                CREATE TABLE financial_api_gateways (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    provider_name TEXT NOT NULL, -- asaas, stripe, mercadopago
                    api_key TEXT,
                    api_token TEXT,
                    webhook_secret TEXT,
                    is_active BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_vendors') THEN
                CREATE TABLE financial_vendors (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT NOT NULL,
                    document TEXT, -- cpf/cnpj
                    phone TEXT,
                    email TEXT,
                    category_id UUID REFERENCES financial_categories(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_health_insurances') THEN
                CREATE TABLE financial_health_insurances (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT NOT NULL,
                    registration_code TEXT,
                    has_coparticipation BOOLEAN DEFAULT false,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_splits' AND column_name='fee_discount_rule') THEN
                ALTER TABLE public.financial_splits ADD COLUMN fee_discount_rule TEXT DEFAULT 'none';
                ALTER TABLE public.financial_splits ADD COLUMN fixed_value NUMERIC DEFAULT 0;
                ALTER TABLE public.financial_splits ADD COLUMN tax_retention_rule TEXT DEFAULT 'none';
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_billing_rules' AND column_name='block_scheduling_on_overdue') THEN
                ALTER TABLE public.financial_billing_rules ADD COLUMN block_scheduling_on_overdue BOOLEAN DEFAULT false;
                ALTER TABLE public.financial_billing_rules ADD COLUMN block_after_days INTEGER DEFAULT 0;
                ALTER TABLE public.financial_billing_rules ADD COLUMN default_interest_pt NUMERIC DEFAULT 0;
                ALTER TABLE public.financial_billing_rules ADD COLUMN default_penalty_pt NUMERIC DEFAULT 0;
                ALTER TABLE public.financial_billing_rules ADD COLUMN require_daily_cash BOOLEAN DEFAULT false;
                ALTER TABLE public.financial_billing_rules ADD COLUMN auto_match_ofx BOOLEAN DEFAULT false;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_transactions') THEN
                CREATE TABLE financial_transactions (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    category_id UUID REFERENCES financial_categories(id),
                    amount NUMERIC NOT NULL,
                    type TEXT NOT NULL,
                    status TEXT DEFAULT 'paid',
                    description TEXT,
                    date DATE,
                    account TEXT,
                    is_recurring BOOLEAN DEFAULT false,
                    athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
                    receipt_filename TEXT,
                    category TEXT,
                    asaas_payment_id TEXT,
                    asaas_invoice_url TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            ELSE
                ALTER TABLE IF EXISTS public.financial_transactions ADD COLUMN IF NOT EXISTS description TEXT;
                ALTER TABLE IF EXISTS public.financial_transactions ADD COLUMN IF NOT EXISTS date DATE;
                ALTER TABLE IF EXISTS public.financial_transactions ADD COLUMN IF NOT EXISTS account TEXT;
                ALTER TABLE IF EXISTS public.financial_transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
                ALTER TABLE IF EXISTS public.financial_transactions ADD COLUMN IF NOT EXISTS athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE;
                ALTER TABLE IF EXISTS public.financial_transactions ADD COLUMN IF NOT EXISTS receipt_filename TEXT;
                ALTER TABLE IF EXISTS public.financial_transactions ADD COLUMN IF NOT EXISTS category TEXT;
                ALTER TABLE IF EXISTS public.financial_transactions ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;
                ALTER TABLE IF EXISTS public.financial_transactions ADD COLUMN IF NOT EXISTS asaas_invoice_url TEXT;
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='financial_subscriptions') THEN
                CREATE TABLE financial_subscriptions (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
                    product_id UUID REFERENCES financial_products(id) ON DELETE SET NULL,
                    status TEXT DEFAULT 'active',
                    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
                    end_date DATE,
                    billing_cycle TEXT DEFAULT 'monthly',
                    amount NUMERIC NOT NULL,
                    gateway_provider TEXT,
                    gateway_subscription_id TEXT,
                    next_billing_date DATE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    asaas_subscription_id TEXT,
                    asaas_customer_id TEXT
                );
            ELSE
                ALTER TABLE IF EXISTS public.financial_subscriptions ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;
                ALTER TABLE IF EXISTS public.financial_subscriptions ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='athletes' AND column_name='asaas_customer_id') THEN
                ALTER TABLE public.athletes ADD COLUMN asaas_customer_id TEXT;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='financial_goals' AND column_name='type') THEN
                ALTER TABLE financial_goals ADD COLUMN type TEXT DEFAULT 'saving';
            END IF;

        END $$;

        -- Adicionar colunas faltantes se as tabelas já existirem
        DO $$ 
        BEGIN
            -- Colunas na tabela clinical_settings
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinical_settings' AND column_name = 'block_scheduling_on_critical') THEN
                ALTER TABLE public.clinical_settings ADD COLUMN block_scheduling_on_critical BOOLEAN DEFAULT false;
                ALTER TABLE public.clinical_settings ADD COLUMN require_clearance_medical BOOLEAN DEFAULT false;
                ALTER TABLE public.clinical_settings ADD COLUMN require_waiver_on_pain_level INTEGER DEFAULT 0;
                ALTER TABLE public.clinical_settings ADD COLUMN notify_physio_on_critical BOOLEAN DEFAULT false;
                ALTER TABLE public.clinical_settings ADD COLUMN alert_abandon_days INTEGER DEFAULT 0;
                ALTER TABLE public.clinical_settings ADD COLUMN inactive_after_days INTEGER DEFAULT 0;
                ALTER TABLE public.clinical_settings ADD COLUMN require_evolution_hours INTEGER DEFAULT 0;
                ALTER TABLE public.clinical_settings ADD COLUMN block_finance_without_evolution BOOLEAN DEFAULT false;
            END IF;

            -- Colunas na tabela sports
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sports' AND column_name = 'color') THEN
                ALTER TABLE public.sports ADD COLUMN color TEXT DEFAULT '#06b6d4';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sports' AND column_name = 'target_athletes') THEN
                ALTER TABLE public.sports ADD COLUMN target_athletes INTEGER DEFAULT 20;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sports' AND column_name = 'custom_fields') THEN
                ALTER TABLE public.sports ADD COLUMN custom_fields JSONB DEFAULT '[]'::jsonb;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sports' AND column_name = 'positions') THEN
                ALTER TABLE public.sports ADD COLUMN positions TEXT[] DEFAULT ARRAY[]::TEXT[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sports' AND column_name = 'order_index') THEN
                ALTER TABLE public.sports ADD COLUMN order_index INTEGER DEFAULT 0;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sports' AND column_name = 'is_active') THEN
                ALTER TABLE public.sports ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sports' AND column_name = 'icon') THEN
                ALTER TABLE public.sports ADD COLUMN icon TEXT DEFAULT '🏆';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sports' AND column_name = 'created_at') THEN
                ALTER TABLE public.sports ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sports' AND column_name = 'updated_at') THEN
                ALTER TABLE public.sports ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            END IF;

            -- Inserir modalidades básicas se a tabela estiver vazia (Requisito 5)
            INSERT INTO public.sports (name, icon, color, positions, target_athletes, order_index, is_active)
            VALUES 
                ('Futebol', '⚽', '#10b981', ARRAY['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante', 'Ponta'], 22, 0, true),
                ('Futsal', '⚽', '#06b6d4', ARRAY['Goleiro', 'Fixo', 'Ala', 'Pivô'], 12, 1, true),
                ('Vôlei', '🏐', '#6366f1', ARRAY['Levantador', 'Ponteiro', 'Central', 'Oposto', 'Líbero'], 12, 2, true),
                ('Basquete', '🏀', '#f59e0b', ARRAY['Armador', 'Ala', 'Ala-Pivô', 'Pivô'], 12, 3, true),
                ('Handebol', '🤾', '#f43f5e', ARRAY['Goleiro', 'Armador Central', 'Armador Lateral', 'Ponta', 'Pivô'], 14, 4, true),
                ('Natação', '🏊', '#0ea5e9', ARRAY['Velocista', 'Fundo', 'Medley', 'Revezamento'], 20, 5, true),
                ('Judô', '🥋', '#f8fafc', ARRAY['Atleta'], 20, 6, true),
                ('Jiu-Jitsu', '🥋', '#4f46e5', ARRAY['Atleta'], 20, 7, true),
                ('Karatê', '🥋', '#dc2626', ARRAY['Atleta'], 20, 8, true),
                ('Boxe', '🥊', '#ef4444', ARRAY['Atleta'], 10, 9, true),
                ('Muay Thai', '🥊', '#b91c1c', ARRAY['Atleta'], 15, 10, true),
                ('Tênis', '🎾', '#84cc16', ARRAY['Simples', 'Duplas'], 8, 11, true),
                ('Beach Tennis', '🏖️', '#fcd34d', ARRAY['Simples', 'Duplas'], 8, 12, true),
                ('Surf', '🏄', '#06b6d4', ARRAY['Surfista'], 10, 13, true),
                ('Skate', '🛹', '#64748b', ARRAY['Street', 'Park'], 10, 14, true),
                ('Atletismo', '🏃', '#fb923c', ARRAY['Velocista', 'Fundo', 'Salto', 'Arremesso'], 15, 15, true),
                ('Crossfit', '🏋️', '#f97316', ARRAY['RX', 'Scalad', 'Amador'], 30, 16, true),
                ('Musculação', '💪', '#475569', ARRAY['Aluno'], 103, 17, true),
                ('Ciclismo', '🚴', '#10b981', ARRAY['Estrada', 'MTB'], 10, 18, true),
                ('Futebol Americano', '🏈', '#1e3a8a', ARRAY['QB', 'WR', 'RB', 'Linha', 'Defesa'], 45, 19, true),
                ('Rugby', '🏉', '#166534', ARRAY['Avançado', 'Linha'], 20, 20, true),
                ('Tênis de Mesa', '🏓', '#dc2626', ARRAY['Atleta'], 10, 21, true),
                ('Triathlon', '🏊', '#0ea5e9', ARRAY['Atleta'], 5, 22, true)
            ON CONFLICT (name) DO NOTHING;

            -- Colunas na tabela agenda_settings
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'working_days') THEN
                ALTER TABLE public.agenda_settings ADD COLUMN working_days TEXT[] DEFAULT ARRAY['1', '2', '3', '4', '5'];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'day_schedules') THEN
                ALTER TABLE public.agenda_settings ADD COLUMN day_schedules JSONB DEFAULT '{}'::jsonb;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'blocked_dates') THEN
                ALTER TABLE public.agenda_settings ADD COLUMN blocked_dates TEXT[] DEFAULT ARRAY[]::TEXT[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'appointment_colors') THEN
                ALTER TABLE public.agenda_settings ADD COLUMN appointment_colors JSONB DEFAULT '{}'::jsonb;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'reminder_template') THEN
                ALTER TABLE public.agenda_settings ADD COLUMN reminder_template TEXT DEFAULT 'Olá {nome}! Seu atendimento está marcado para {data} às {hora}.';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'lunch_enabled') THEN
                ALTER TABLE public.agenda_settings ADD COLUMN lunch_enabled BOOLEAN DEFAULT false;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'lunch_start') THEN
                ALTER TABLE public.agenda_settings ADD COLUMN lunch_start TEXT DEFAULT '12:00';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'lunch_end') THEN
                ALTER TABLE public.agenda_settings ADD COLUMN lunch_end TEXT DEFAULT '13:00';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'delay_tolerance_minutes') THEN
                ALTER TABLE public.agenda_settings ADD COLUMN delay_tolerance_minutes INTEGER DEFAULT 15;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'cancellation_notice_hours') THEN
                ALTER TABLE public.agenda_settings ADD COLUMN cancellation_notice_hours INTEGER DEFAULT 24;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda_settings' AND column_name = 'reminder_enabled') THEN
                ALTER TABLE public.agenda_settings ADD COLUMN reminder_enabled BOOLEAN DEFAULT true;
            END IF;
            
            -- Garantir um registro na agenda_settings
            INSERT INTO public.agenda_settings (id) 
            SELECT uuid_generate_v4() 
            WHERE NOT EXISTS (SELECT 1 FROM public.agenda_settings)
            ON CONFLICT DO NOTHING;
            
            -- Colunas na tabela automation_settings
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_enabled') THEN
                ALTER TABLE public.automation_settings ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT true;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_reminder_template') THEN
                ALTER TABLE public.automation_settings ADD COLUMN whatsapp_reminder_template TEXT DEFAULT 'Olá {nome}! Seu atendimento está marcado para {data} às {hora}.';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_followup_template') THEN
                ALTER TABLE public.automation_settings ADD COLUMN whatsapp_followup_template TEXT DEFAULT 'Olá {nome}! Como você está se sentindo após o nosso atendimento?';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_provider') THEN
                ALTER TABLE public.automation_settings ADD COLUMN whatsapp_provider TEXT DEFAULT 'evolution';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'evolution_api_url') THEN
                ALTER TABLE public.automation_settings ADD COLUMN evolution_api_url TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'evolution_api_key') THEN
                ALTER TABLE public.automation_settings ADD COLUMN evolution_api_key TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'evolution_instance_id') THEN
                ALTER TABLE public.automation_settings ADD COLUMN evolution_instance_id TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'resend_api_key') THEN
                ALTER TABLE public.automation_settings ADD COLUMN resend_api_key TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_reminder_timing') THEN
                ALTER TABLE public.automation_settings ADD COLUMN whatsapp_reminder_timing TEXT[] DEFAULT ARRAY['24h']::TEXT[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_followup_timing') THEN
                ALTER TABLE public.automation_settings ADD COLUMN whatsapp_followup_timing TEXT[] DEFAULT ARRAY['24h']::TEXT[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_birthday_enabled') THEN
                ALTER TABLE public.automation_settings ADD COLUMN whatsapp_birthday_enabled BOOLEAN DEFAULT false;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_birthday_template') THEN
                ALTER TABLE public.automation_settings ADD COLUMN whatsapp_birthday_template TEXT DEFAULT 'Parabéns {nome}! Toda a nossa equipe deseja um feliz aniversário!';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_absence_enabled') THEN
                ALTER TABLE public.automation_settings ADD COLUMN whatsapp_absence_enabled BOOLEAN DEFAULT false;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_absence_template') THEN
                ALTER TABLE public.automation_settings ADD COLUMN whatsapp_absence_template TEXT DEFAULT 'Olá {nome}, sentimos sua falta! Faz tempo desde sua última sessão, que tal agendar um retorno?';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'finance_reminder_enabled') THEN
                ALTER TABLE public.automation_settings ADD COLUMN finance_reminder_enabled BOOLEAN DEFAULT false;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'finance_reminder_template') THEN
                ALTER TABLE public.automation_settings ADD COLUMN finance_reminder_template TEXT DEFAULT 'Olá {nome}! Lembramos que seu pacote/mensalidade vence no dia {data}.';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'finance_receipt_enabled') THEN
                ALTER TABLE public.automation_settings ADD COLUMN finance_receipt_enabled BOOLEAN DEFAULT false;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'finance_receipt_template') THEN
                ALTER TABLE public.automation_settings ADD COLUMN finance_receipt_template TEXT DEFAULT 'Olá {nome}! Confirmamos o recebimento do seu pagamento no valor de R$ {valor}. Obrigado!';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'prof_morning_resume_enabled') THEN
                ALTER TABLE public.automation_settings ADD COLUMN prof_morning_resume_enabled BOOLEAN DEFAULT false;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'prof_morning_resume_time') THEN
                ALTER TABLE public.automation_settings ADD COLUMN prof_morning_resume_time TEXT DEFAULT '07:00';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'prof_new_appointment_enabled') THEN
                ALTER TABLE public.automation_settings ADD COLUMN prof_new_appointment_enabled BOOLEAN DEFAULT false;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'prep_instructions_enabled') THEN
                ALTER TABLE public.automation_settings ADD COLUMN prep_instructions_enabled BOOLEAN DEFAULT false;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'prep_instructions_template') THEN
                ALTER TABLE public.automation_settings ADD COLUMN prep_instructions_template TEXT DEFAULT 'Olá {nome}! Aqui estão algumas orientações importantes antes da sua primeira avaliação com a gente.';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'email_enabled') THEN
                ALTER TABLE public.automation_settings ADD COLUMN email_enabled BOOLEAN DEFAULT false;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'email_reminder_template') THEN
                ALTER TABLE public.automation_settings ADD COLUMN email_reminder_template TEXT DEFAULT 'Seu atendimento está marcado para {data} às {hora}.';
            END IF;
        END $$;

        -- RLS para Agenda e Automação
        ALTER TABLE IF EXISTS public.agenda_settings ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.automation_settings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.agenda_settings;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.automation_settings;
        CREATE POLICY "Permitir tudo" ON public.agenda_settings FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.automation_settings FOR ALL USING (true) WITH CHECK (true);

        -- RLS para Financeiro
        ALTER TABLE IF EXISTS public.financial_categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_goals ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_closures ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_products ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_subscriptions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_billing_rules ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_payment_methods ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_taxes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_splits ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_cost_centers ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_invoice_settings ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_notification_settings ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_wallets ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_api_gateways ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_vendors ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.financial_health_insurances ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_categories;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_goals;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_closures;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_transactions;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_products;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_subscriptions;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_billing_rules;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_payment_methods;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_taxes;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_splits;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_cost_centers;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_invoice_settings;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_notification_settings;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_wallets;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_api_gateways;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_vendors;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.financial_health_insurances;

        CREATE POLICY "Permitir tudo" ON public.financial_categories FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_goals FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_closures FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_transactions FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_products FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_subscriptions FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_billing_rules FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_payment_methods FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_taxes FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_splits FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_cost_centers FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_invoice_settings FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_notification_settings FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_wallets FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_api_gateways FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_vendors FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.financial_health_insurances FOR ALL USING (true) WITH CHECK (true);

        -- Políticas para Clinical Notes e Assessments
        ALTER TABLE IF EXISTS public.clinical_notes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.clinical_assessments ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.clinical_notes;
        DROP POLICY IF EXISTS "Permitir tudo" ON public.clinical_assessments;
        CREATE POLICY "Permitir tudo" ON public.clinical_notes FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Permitir tudo" ON public.clinical_assessments FOR ALL USING (true) WITH CHECK (true);

        -- Atualizar estatísticas para o planejador de consultas
        ANALYZE public.athletes;
        ANALYZE public.wellness_records;
        ANALYZE public.check_ins;
        ANALYZE public.pain_reports;
        ANALYZE public.transactions;
        ANALYZE public.billings;
        
        -- Recarregar cache do PostgREST
        NOTIFY pgrst, 'reload schema';
        
        -- Tentar criar bucket de branding
        DO $storage$
        BEGIN
            -- 1. Criar Bucket Branding
            INSERT INTO storage.buckets (id, name, public) 
            VALUES ('branding', 'branding', true)
            ON CONFLICT (id) DO NOTHING;

            -- 1.1 Criar Bucket Avatars
            INSERT INTO storage.buckets (id, name, public) 
            VALUES ('avatars', 'avatars', true)
            ON CONFLICT (id) DO NOTHING;
        END $storage$;
      `;
      
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) throw error;
      
      setStatus('success');
      setMessage('Banco de dados otimizado e permissões reparadas com sucesso!');
    } catch (error: any) {
      console.error('Error fixing performance:', error);
      setStatus('error');
      const msg = error.message || '';
      if (msg.includes('function rpc() does not exist') || msg.includes('exec_sql')) {
        setMessage('A função de reparo automático não está instalada. Por favor, copie o "SQL de Reparo" abaixo e execute-o manualmente no SQL Editor do seu Dashboard do Supabase.');
      } else {
        setMessage(`Erro ao otimizar banco: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setIsFixing(false);
    }
  };

  const seedDatabase = async () => {
    if (!supabase) {
      setStatus('error');
      setMessage('Supabase client não configurado.');
      return;
    }

    setIsSeeding(true);
    setStatus('loading');
    setMessage('Iniciando população do banco de dados...');

    try {
      // 1. Inserir/Atualizar Atletas (Upsert baseado no athlete_code)
      setMessage('Inserindo/Atualizando atletas...');
      const { data: athletes, error: athletesError } = await supabase
        .from('athletes')
        .upsert([
          {
            name: 'João Silva',
            category: 'Sub-20',
            birth_date: '2004-05-15',
            weight: 75.5,
            height: 1.82,
            avatar_url: 'https://i.pravatar.cc/150?u=joao',
            readiness_score: 85,
            risk_level: 'Baixo',
            athlete_code: '11001',
            password: '123456',
            status: 'active',
            group_name: 'Projeto Águias'
          },
          {
            name: 'Pedro Santos',
            category: 'Profissional',
            birth_date: '1999-08-22',
            weight: 82.0,
            height: 1.88,
            avatar_url: 'https://i.pravatar.cc/150?u=pedro',
            readiness_score: 42,
            risk_level: 'Alto',
            athlete_code: '11002',
            password: '123456',
            status: 'active',
            group_name: 'Projeto Águias'
          },
          {
            name: 'Lucas Oliveira',
            category: 'Sub-17',
            birth_date: '2007-11-10',
            weight: 68.0,
            height: 1.75,
            avatar_url: 'https://i.pravatar.cc/150?u=lucas',
            readiness_score: 65,
            risk_level: 'Médio',
            athlete_code: '11003',
            password: '123456',
            status: 'active',
            group_name: 'Projeto Águias'
          }
        ], { onConflict: 'athlete_code' })
        .select();

      if (athletesError) {
        console.error('Erro ao inserir atletas:', athletesError);
        let errorMsg = athletesError.message;
        let details = athletesError.details || athletesError.hint || JSON.stringify(athletesError);
        
        if (errorMsg === 'TypeError: Load failed' || errorMsg === 'Failed to fetch') {
          errorMsg = 'Falha na conexão com o Supabase';
          details = 'O navegador não conseguiu carregar a URL do Supabase. Verifique se a URL está correta em lib/supabase.ts e se o projeto não está pausado.';
        }
        
        throw new Error(`Erro ao inserir atletas: ${errorMsg}. Detalhes: ${details}`);
      }

      if (athletes && athletes.length > 0) {
        // Encontrar os IDs dos atletas inseridos/atualizados
        const joao = athletes.find(a => a.athlete_code === '11001');
        const pedro = athletes.find(a => a.athlete_code === '11002');

        if (!joao || !pedro) {
          throw new Error('Não foi possível encontrar os IDs dos atletas após o upsert.');
        }

        const joaoId = joao.id;
        const pedroId = pedro.id;

        // 2. Inserir Registros de Wellness e Check-ins
        setMessage('Inserindo registros de wellness...');
        const { error: wellnessError } = await supabase
          .from('wellness_records')
          .insert([
            {
              athlete_id: joaoId,
              record_date: getLocalDateString(),
              sleep_hours: 8,
              sleep_quality: 4,
              fatigue_level: 2,
              muscle_soreness: 2,
              stress_level: 2,
              readiness_score: 85
            },
            {
              athlete_id: pedroId,
              record_date: getLocalDateString(),
              sleep_hours: 5,
              sleep_quality: 2,
              fatigue_level: 4,
              muscle_soreness: 5,
              stress_level: 4,
              readiness_score: 42
            }
          ]);

        if (wellnessError) {
          console.error('Erro ao inserir wellness:', wellnessError);
          const details = wellnessError.details || wellnessError.hint || JSON.stringify(wellnessError);
          throw new Error(`Erro ao inserir wellness: ${wellnessError.message}. Detalhes: ${details}`);
        }

        const { error: checkInError } = await supabase
          .from('check_ins')
          .insert([
            {
              athlete_id: joaoId,
              record_date: getLocalDateString(),
              sleep_hours: 8,
              sleep_quality: 4,
              energy_level: 4,
              muscle_soreness: 2,
              stress_level: 2,
              readiness_score: 85
            },
            {
              athlete_id: pedroId,
              record_date: getLocalDateString(),
              sleep_hours: 5,
              sleep_quality: 2,
              energy_level: 2,
              muscle_soreness: 5,
              stress_level: 4,
              readiness_score: 42
            }
          ]);

        if (checkInError) {
          console.error('Erro ao inserir check_ins:', checkInError);
          const details = checkInError.details || checkInError.hint || JSON.stringify(checkInError);
          throw new Error(`Erro ao inserir check_ins: ${checkInError.message}. Detalhes: ${details}`);
        }

        // 3. Inserir Evoluções Clínicas
        setMessage('Inserindo evoluções clínicas...');
        const { error: notesError } = await supabase
          .from('clinical_notes')
          .insert([
            {
              athlete_id: pedroId,
              pain_level: 6,
              feeling: 'Pior',
              regions: ['Joelho D', 'Posterior de Coxa D'],
              treatments: ['Terapia Manual', 'Crioterapia (GameReady)'],
              observations: 'Atleta queixa-se de dor aguda no joelho direito após o treino de ontem.',
              generated_text: 'Paciente compareceu relatando piora, com dor nível 6/10. Tratamento focado no Joelho D e Posterior de Coxa D com Terapia Manual e Crioterapia.',
              is_signed: true,
              professional_name: 'Dra. Cristina Jorge - CREFITO 3/252531-F'
            }
          ]);

        if (notesError) {
          console.error('Erro ao inserir evoluções:', notesError);
          const details = notesError.details || notesError.hint || JSON.stringify(notesError);
          throw new Error(`Erro ao inserir evoluções: ${notesError.message}. Detalhes: ${details}`);
        }

        // 4. Inserir Avaliações Clínicas (Funcional e Postural)
        setMessage('Inserindo avaliações clínicas...');
        const assessmentsToInsert = [
          {
            athlete_id: joaoId,
            type: 'functional',
            score: 18,
            risk_level: 'Baixo',
            data: {
              movements: {
                deep_squat: { score: 3, compensations: [] },
                hurdle_step: { left: 3, right: 2, final: 2, compensations: ['Perda de equilíbrio'] },
                inline_lunge: { left: 3, right: 3, final: 3, compensations: [] },
                shoulder_mobility: { left: 3, right: 3, final: 3, compensations: [] },
                active_straight_leg_raise: { left: 3, right: 3, final: 3, compensations: [] },
                trunk_stability_pushup: { score: 2, compensations: ['Extensão lombar'] },
                rotary_stability: { left: 2, right: 2, final: 2, compensations: [] }
              },
              clearing_tests: {
                shoulder: { pain: false },
                spine_extension: { pain: false },
                spine_flexion: { pain: false }
              },
              score_total: 18,
              risk_level: 'Baixo',
              focus: 'Motor Control / Core'
            }
          },
          {
            athlete_id: pedroId,
            type: 'postural',
            data: {
              head: 'Projeção Anterior',
              shoulders: 'Elevado D',
              pelvis: 'Anteversão',
              knees: 'Valgo',
              feet: 'Pronado',
              notes: 'Atleta apresenta padrão postural compensatório devido à dor no joelho.'
            }
          }
        ];

        let { error: assessmentsError } = await supabase
          .from('clinical_assessments')
          .insert(assessmentsToInsert);

        // Se falhar por causa da coluna assessment_type (legada), tentar inserir com ela
        if (assessmentsError && (assessmentsError.message.includes('assessment_type') || (assessmentsError.details && assessmentsError.details.includes('assessment_type')))) {
          console.log('Detectada coluna legada assessment_type, tentando fallback...');
          const assessmentsWithLegacyField = assessmentsToInsert.map(a => ({
            ...a,
            assessment_type: a.type
          }));
          const { error: retryError } = await supabase
            .from('clinical_assessments')
            .insert(assessmentsWithLegacyField);
          assessmentsError = retryError;
        }

        if (assessmentsError) {
          console.error('Erro ao inserir avaliações:', assessmentsError);
          const details = assessmentsError.details || assessmentsError.hint || JSON.stringify(assessmentsError);
          
          // Se o erro for de NOT NULL na assessment_type, dar uma instrução clara
          if (details.includes('assessment_type') && details.includes('not-null')) {
            throw new Error(`Erro de Banco de Dados: A coluna legada 'assessment_type' ainda possui restrição NOT NULL. 
            
            POR FAVOR, SIGA ESTES PASSOS:
            1. Clique no botão 'Ver SQL de Reparo' abaixo.
            2. Copie o código SQL.
            3. Vá ao Dashboard do Supabase -> SQL Editor.
            4. Cole o código e clique em 'Run'.
            5. Tente popular o banco novamente.`);
          }
          
          throw new Error(`Erro ao inserir avaliações: ${assessmentsError.message}. Detalhes: ${details}`);
        }

        // 6. Inserir Avaliações Modulares
        setMessage('Inserindo avaliações modulares...');
        await supabase.from('sleep_assessments').insert([{
          athlete_id: joaoId,
          score: 85,
          classification: 'Bom',
          classification_color: 'emerald',
          raw_data: { sleep_hours: 8, quality: 4 }
        }]);

        await supabase.from('nutritional_assessments').insert([{
          athlete_id: joaoId,
          score: 78,
          classification: 'Adequado',
          classification_color: 'emerald',
          raw_data: { hydration: 4, meals: 5 }
        }]);

        // 7. Inserir Agendamentos para Hoje
        setMessage('Inserindo agendamentos para hoje...');
        const today = getLocalDateString();
        
        // Tentar inserir com 'date' e 'start_time' (formato esperado pelo dashboard)
        const appointments = [
          {
            athlete_id: joaoId,
            date: today,
            start_time: '09:00',
            end_time: '10:00',
            status: 'pending',
            type: 'evaluation',
            title: 'Avaliação Funcional Periódica'
          },
          {
            athlete_id: pedroId,
            date: today,
            start_time: '11:30',
            end_time: '12:30',
            status: 'pending',
            type: 'medical',
            title: 'Reavaliação de Lesão - Joelho'
          },
          {
            date: today,
            start_time: '14:00',
            end_time: '16:00',
            status: 'pending',
            type: 'course',
            title: 'Curso de Atualização: Recovery no Esporte'
          },
          {
            date: today,
            start_time: '17:00',
            end_time: '19:00',
            status: 'pending',
            type: 'competition',
            title: 'Campeonato Regional - Final'
          },
          {
            date: today,
            start_time: '20:00',
            end_time: '21:00',
            status: 'pending',
            type: 'personal',
            title: 'Jantar de Confraternização'
          }
        ];

        const { error: apptError } = await supabase.from('appointments').insert(appointments);
        
        // Fallback se as colunas forem diferentes (ex: appointment_date)
        if (apptError && apptError.message.includes('date')) {
          const fallbackAppts = appointments.map(a => {
            const { date, ...rest } = a;
            return { ...rest, appointment_date: date };
          });
          await supabase.from('appointments').insert(fallbackAppts);
        }

        // 8. Inserir Tarefas do Dia
        setMessage('Inserindo tarefas do dia...');
        const tasks = [
          { title: 'Comprar gelo', is_completed: false },
          { title: 'Revisar atleta João', is_completed: false },
          { title: 'Organizar kits', is_completed: false },
          { title: 'Confirmar agenda do dia', is_completed: true },
          { title: 'Revisar materiais e kits', is_completed: false },
          { title: 'Executar atendimentos pendentes', is_completed: false }
        ];
        await supabase.from('daily_tasks').insert(tasks);
      }

      setStatus('success');
      setMessage('Banco de dados populado com sucesso! Você já pode navegar pelo sistema.');
    } catch (error: any) {
      console.error('Erro ao popular banco:', error);
      setStatus('error');
      
      let errorMsg = 'Erro desconhecido';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Tentar extrair o máximo de informação possível de objetos de erro do Supabase/PostgREST
        errorMsg = error.message || error.details || error.hint || error.code || JSON.stringify(error);
      } else {
        errorMsg = String(error);
      }

      // Se ainda for {}, forçar uma representação melhor
      if (errorMsg === '{}') {
        errorMsg = `Erro (objeto vazio): ${String(error)}. Verifique o console do navegador para mais detalhes.`;
      }

      // Adicionar dica para erro de schema cache
      if (errorMsg.toLowerCase().includes('schema cache') || errorMsg.toLowerCase().includes('column')) {
        errorMsg += '\n\nDICA: O Supabase ainda não percebeu as mudanças no banco. Aguarde 30 segundos e tente novamente. Se o erro persistir, rode o SQL de reparo novamente no SQL Editor do Supabase e certifique-se de que ele rodou sem erros.';
      }

      setMessage(errorMsg);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* HEADER AND MANUAL BANNER */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out" />
        <div className="relative z-10 flex-1">
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Database className="text-amber-500" size={28} /> Desenvolvedor
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-2 font-medium leading-relaxed max-w-2xl">
            Gerenciamento de dados teste, otimização e limpeza do sistema.
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
                    <title>Manual do Módulo Desenvolvedor</title>
                    <style>
                      body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 2rem; max-w: 900px; margin: 0 auto; }
                      h1 { color: #fff; font-size: 2rem; border-bottom: 2px solid #334155; padding-bottom: 1rem; margin-bottom: 2rem; }
                      h2 { color: #f59e0b; margin-top: 2.5rem; border-bottom: 1px dashed #334155; padding-bottom: 0.5rem; }
                      h3 { color: #cbd5e1; margin-top: 1.5rem; }
                      p, li { color: #94a3b8; }
                      strong { color: #e2e8f0; }
                      .highlight { background: #1e293b; padding: 1rem; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 1rem 0; }
                    </style>
                  </head>
                  <body>
                    <h1>Manual de Uso do Banco de Dados (Dev)</h1>
                    <p>Esta seção é destinada <strong>exclusivamente a desenvolvedores ou administradores de sistema</strong> com conhecimento técnico. Aqui você tem controle de infraestrutura e da integridade do banco de dados (Supabase).</p>

                    <h2>1. Inserir Dados de Teste</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Popular o sistema com informações "dummy" (fictícias).
                    </div>
                    <ul>
                      <li>Preenche a plataforma com dezenas de perfis, check-ins, registros médicos e agendamentos nas próximas semanas.</li>
                      <li>Útil para testar relatórios com gráficos reais e treinar funcionários num ambiente Sandbox.</li>
                    </ul>

                    <h2>2. Otimizar Performance (Fix Timeout & Migrações)</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Reestruturação assíncrona do Schema.
                    </div>
                    <ul>
                      <li>Se algo parou de funcionar e o log reclamou de "Coluna não existe", este botão executa todo o script de alteração na arquitetura para a versão mais recente.</li>
                      <li>Ele injeta os índices B-Tree faltantes nas queries mais pesadas das listas.</li>
                    </ul>

                    <h2>3. Apagar Todos os Dados</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Drop Tables (Hard Reset).
                    </div>
                    <ul>
                      <li>Uma vez que seus testes de "sandbox" com dados falsos terminarem, limpe o terreno aqui.</li>
                      <li>Vai sumir tudo: pacientes, contas bancárias, evoluções, agendamentos. Somente as contas Admin se mantêm logadas.</li>
                    </ul>

                    <hr style="margin-top: 3rem; border-color: #334155;" />
                    <p style="text-align: center; font-size: 0.8rem; margin-top: 2rem;">Pode fechar esta janela para retornar ao sistema.</p>
                  </body>
                  </html>
                 `);
               }
             }}
             className="px-6 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Settings2 size={18} />
            Ler Manual
          </button>
        </div>
      </div>

      {status === 'idle' && (
        <div className="space-y-3">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mb-4">
            <h4 className="text-emerald-500 font-bold mb-2 text-sm uppercase tracking-widest">1. Atualizar Estrutura</h4>
            <p className="text-xs text-emerald-400/80 mb-3 leading-relaxed">Cria as tabelas ausentes e adiciona colunas novas essenciais, muito importante antes de usar funcionalidades recém adicionadas.</p>
            <button
              onClick={runMigrations}
              disabled={isSeeding || isFixing || isClearing || isMigrating}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-[#050B14] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Database className="w-5 h-5" />
              Executar Migrações
            </button>
          </div>

          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 mb-4">
            <h4 className="text-cyan-500 font-bold mb-2 text-sm uppercase tracking-widest">2. População (Opcional)</h4>
            <button
              onClick={seedDatabase}
              disabled={isSeeding || isFixing || isClearing || isMigrating}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-[#050B14] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Database className="w-5 h-5" />
              Inserir Dados de Teste
            </button>
          </div>
          
          <button
            onClick={fixPerformance}
            disabled={isSeeding || isFixing || isClearing || isMigrating}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-cyan-500 font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 border border-cyan-500/20"
          >
            <Zap className="w-5 h-5" />
            Otimizar Performance (Fix Timeout)
          </button>

          <button
            onClick={clearDatabase}
            disabled={isSeeding || isFixing || isClearing || isMigrating}
            className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 border border-rose-500/20"
          >
            <AlertCircle className="w-5 h-5" />
            Apagar Todos os Dados
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <p className="text-sm font-bold text-cyan-400 animate-pulse">{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center justify-center py-6 space-y-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
          <p className="text-sm font-bold text-emerald-400 text-center px-4">{message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#050B14] font-black uppercase tracking-widest rounded-lg transition-colors"
          >
            Recarregar Sistema
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center py-6 space-y-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
          <AlertCircle className="w-12 h-12 text-rose-500" />
          <p className="text-sm font-bold text-rose-400 text-center px-4">{message}</p>
          
          <div className="w-full px-4">
            <button
              onClick={() => setShowSql(!showSql)}
              className="w-full py-2 text-xxs font-black uppercase tracking-widest text-cyan-500 hover:text-cyan-400 border border-cyan-500/30 rounded-lg transition-colors"
            >
              {showSql ? 'Ocultar SQL de Reparo' : 'Ver SQL de Reparo'}
            </button>
            
            {showSql && (
              <div className="mt-4 p-4 bg-black/50 rounded-lg border border-slate-800 overflow-x-auto">
                <pre className="text-xxs text-slate-300 font-mono leading-relaxed">
                  {sqlToRun}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sqlToRun);
                    alert('SQL copiado!');
                  }}
                  className="mt-2 text-xxs font-bold text-cyan-500 hover:underline"
                >
                  Copiar SQL
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setStatus('idle')}
            className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-widest rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {showPasswordPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050B14]/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button
              onClick={() => {
                setShowPasswordPrompt(false);
                setDeletePassword('');
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 text-rose-500 mb-2">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-black uppercase tracking-wider">Ação Irreversível</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Para confirmar a exclusão de <strong>TODOS</strong> os dados, informe sua senha de login.
            </p>
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all placeholder:text-slate-600 font-medium"
                  placeholder="Sua senha"
                  onKeyDown={(e) => e.key === 'Enter' && confirmClearDatabase()}
                  autoFocus
                />
              </div>
              <button
                onClick={confirmClearDatabase}
                disabled={isClearing || !deletePassword}
                className="w-full py-3 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-[#050B14] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isClearing ? 'Apagando...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
