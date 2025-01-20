import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Ingredient {
  item: string;
  amount: string;
  stepIndex: number;
}

interface Recipe {
  steps: string[];
  ingredients: Ingredient[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { recipe } = await req.json() as { recipe: Recipe }
    
    console.log('Creating recipe on Foodbatch...')
    console.log('Recipe data:', JSON.stringify(recipe, null, 2))
    
    // Create recipe
    const createRecipeResponse = await fetch('https://api.foodbatch.com/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Imported Recipe',
        instructions: recipe.steps.join('\n\n'),
      }),
    })

    const createRecipeData = await createRecipeResponse.json()
    console.log('Create recipe response:', createRecipeData)

    if (!createRecipeResponse.ok) {
      throw new Error(`Failed to create recipe on Foodbatch: ${JSON.stringify(createRecipeData)}`)
    }

    const { id: recipeId } = createRecipeData

    // Add ingredients
    console.log('Adding ingredients...')
    const ingredientsPayload = {
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.item,
        amount: ing.amount,
        step: ing.stepIndex,
      }))
    }
    console.log('Ingredients payload:', JSON.stringify(ingredientsPayload, null, 2))

    const addIngredientsResponse = await fetch(`https://api.foodbatch.com/recipes/${recipeId}/ingredients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ingredientsPayload),
    })

    const addIngredientsData = await addIngredientsResponse.json()
    console.log('Add ingredients response:', addIngredientsData)

    if (!addIngredientsResponse.ok) {
      throw new Error(`Failed to add ingredients to recipe: ${JSON.stringify(addIngredientsData)}`)
    }

    return new Response(
      JSON.stringify({ success: true, recipeId }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})