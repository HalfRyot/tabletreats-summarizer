import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    // Fetch recipe content from URL (mock for now)
    const recipeContent = `For this recipe, you'll need:
    2 cups flour
    1 cup sugar
    3 eggs
    1 tsp vanilla
    
    Instructions:
    1. Mix dry ingredients
    2. Add wet ingredients
    3. Bake at 350F`

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }
    
    const prompt = `
    Parse this recipe into a structured format. For each step, list the ingredients used in that step.
    Return the result as a JSON object with this exact structure:
    {
      "steps": ["step 1 instruction", "step 2 instruction"],
      "ingredients": [
        { "item": "ingredient name", "amount": "amount in g or ml", "stepIndex": 1 }
      ]
    }
    
    Convert all measurements to either grams (g) or milliliters (ml).
    Recipe content:
    ${recipeContent}
    `

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that parses recipes into structured data. Always convert measurements to grams (g) or milliliters (ml).'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
      }),
    })

    const data = await response.json()
    console.log('OpenAI API Response:', data) // Add logging for debugging

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI API response:', data)
      throw new Error('Invalid response from OpenAI API')
    }

    const parsedRecipe = JSON.parse(data.choices[0].message.content)

    return new Response(
      JSON.stringify(parsedRecipe),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})