import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const countWords = (text: string): number => {
  return text.trim().split(/\s+/).length;
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

    const recipeResponse = await fetch(url)
    if (!recipeResponse.ok) {
      throw new Error('Failed to fetch recipe content')
    }
    const recipeContent = await recipeResponse.text()

    // Select model based on content length
    const wordCount = countWords(recipeContent);
    console.log(`Recipe word count: ${wordCount}`);
    const model = wordCount > 100000 ? 'gpt-4o' : 'gpt-4o-mini';
    console.log(`Selected model: ${model}`);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }
    
    const prompt = `
    Parse this recipe into a structured format. For each step, identify ONLY the ingredients and their amounts that are specifically used in that step.
    Return the result as a JSON object with this exact structure:
    {
      "steps": ["step 1 instruction", "step 2 instruction"],
      "ingredients": [
        { 
          "item": "ingredient name", 
          "amount": "amount in g or ml", 
          "stepIndex": number (1-based index of the step where this ingredient is used)
        }
      ]
    }
    
    Important rules for measurement conversion:
    1. ALL measurements MUST be converted to either grams (g) or milliliters (ml)
    2. Use these conversion rules:
       - 1 cup = 250 ml (for liquids) or varies by ingredient for solids
       - 1 tablespoon = 15 ml (for liquids)
       - 1 teaspoon = 5 ml (for liquids)
       - For common ingredients:
         - 1 cup flour = 120g
         - 1 cup sugar = 200g
         - 1 cup butter = 227g
         - 1 cup milk/water = 250ml
         - 1 cup rice = 185g
    3. Each ingredient should be associated with the specific step where it is actually used
    4. If an ingredient is used across multiple steps, create separate entries for each step
    5. Only include ingredients in steps where they are actively used/added
    
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
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that parses recipes into structured data. Always convert measurements to grams (g) or milliliters (ml) and associate ingredients with their specific steps.'
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

    // Extract JSON from the content, handling markdown code blocks
    const content = data.choices[0].message.content
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/) || [null, content]
    const jsonString = jsonMatch[1].trim()

    try {
      const parsedRecipe = JSON.parse(jsonString)
      
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
      console.error('Raw content:', content)
      console.error('Extracted JSON string:', jsonString)
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