import { supabase } from "@/integrations/supabase/client";

interface ParsedRecipe {
  ingredients: Array<{
    item: string;
    amount: string;
    stepIndex: number;
  }>;
  steps: string[];
}

export const parseRecipe = async (url: string): Promise<ParsedRecipe> => {
  try {
    const { data, error } = await supabase.functions.invoke('parse-recipe', {
      body: { url }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error parsing recipe:", error);
    throw new Error("Failed to parse recipe");
  }
};