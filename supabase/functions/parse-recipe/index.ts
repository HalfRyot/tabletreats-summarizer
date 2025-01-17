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
    
    if (!url) {
      throw new Error('URL is required')
    }

    // Fetch the actual recipe content
    const recipeResponse = await fetch(url)
    if (!recipeResponse.ok) {
      throw new Error('Failed to fetch recipe content')
    }
    const recipeContent = await recipeResponse.text()

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

    console.log('Sending request to OpenAI...')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API Error:', errorData)
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    console.log('OpenAI API Response:', data)

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI API response:', data)
      throw new Error('Invalid response from OpenAI API')
    }

    try {
      const parsedRecipe = JSON.parse(data.choices[0].message.content)
      
      // Validate the parsed recipe structure
      if (!Array.isArray(parsedRecipe.steps) || !Array.isArray(parsedRecipe.ingredients)) {
        throw new Error('Invalid recipe format')
      }

      return new Response(
        JSON.stringify(parsedRecipe),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      throw new Error('Failed to parse recipe format')
    }
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