export const env = {
  evolutionUrl: process.env.EVOLUTION_API_URL || '',
  evolutionKey: process.env.EVOLUTION_API_KEY || '',

  redisUrl: process.env.REDIS_URL || '',

  appUrl: process.env.NEXT_PUBLIC_APP_URL || '',

  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
}
