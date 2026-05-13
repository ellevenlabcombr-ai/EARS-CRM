-- Execute este SQL no Dashboard do Supabase (SQL Editor)
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
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        INSERT INTO branding_settings (company_name) VALUES ('ELLEVEN');
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
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Garantir que existe pelo menos um registro de configuração
    IF NOT EXISTS (SELECT 1 FROM agenda_settings) THEN
        INSERT INTO agenda_settings (start_time, end_time, default_duration_minutes, break_interval_minutes, appointment_types) 
        VALUES ('08:00', '18:00', 30, 0, ARRAY['Avaliação', 'Tratamento', 'Revisão', 'Recuperação']);
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
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinical_settings' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON clinical_settings FOR ALL USING (true) WITH CHECK (true); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profile_settings' AND policyname = 'Permitir tudo') THEN CREATE POLICY "Permitir tudo" ON user_profile_settings FOR ALL USING (true) WITH CHECK (true); END IF;
END $$;

-- 8. Adicionar colunas faltantes se as tabelas já existirem
DO $$ 
BEGIN
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

    -- 2. Habilitar RLS se necessário
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    -- 3. Políticas de Acesso Público (Leitura)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Branding') THEN
        CREATE POLICY "Public Access Branding" ON storage.objects FOR SELECT USING (bucket_id = 'branding' OR bucket_id = 'avatars');
    END IF;

    -- 4. Políticas de Upload (Inserção)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Upload Branding') THEN
        CREATE POLICY "Public Upload Branding" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'branding' OR bucket_id = 'avatars');
    END IF;

    -- 5. Políticas de Atualização
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Update Branding') THEN
        CREATE POLICY "Public Update Branding" ON storage.objects FOR UPDATE USING (bucket_id = 'branding' OR bucket_id = 'avatars');
    END IF;

    -- 6. Políticas de Exclusão
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Delete Branding') THEN
        CREATE POLICY "Public Delete Branding" ON storage.objects FOR DELETE USING (bucket_id = 'branding' OR bucket_id = 'avatars');
    END IF;
END $storage$;