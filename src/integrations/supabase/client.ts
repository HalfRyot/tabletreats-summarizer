// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://lnvowczknpcjlcjrvwcj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxudm93Y3prbnBjamxjanJ2d2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMzAzMzMsImV4cCI6MjA1MjYwNjMzM30.L_eJZRTfQSoUn6nuHb1MOVJb2DLRXeFnjfpzIj7f07c";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);