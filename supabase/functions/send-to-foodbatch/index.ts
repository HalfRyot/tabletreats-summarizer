
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
    
    // First, create the recipe with timestamp
    const createRecipeResponse = await fetch('https://api.foodbatch.com/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Imported Recipe',
        desc_short: 'Imported from URL',
        yield_amount: 1,
        yield_unit: 'serving',
        difficulty: 'medium',
        time_active: '0',
        time_passive: '0',
        storage_fridge: '3',
        storage_frozen: '30',
        ts: new Date().toISOString() // Add timestamp
      })
    })

    if (!createRecipeResponse.ok) {
      throw new Error(`Failed to create recipe: ${await createRecipeResponse.text()}`)
    }

    const recipeData = await createRecipeResponse.json()
    const recipeId = recipeData.id

    console.log('Created recipe:', recipeData)

    // Create steps
    for (let i = 0; i < recipe.steps.length; i++) {
      // Create step
      const createStepResponse = await fetch('https://api.foodbatch.com/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: i,
          recipe_id: recipeId
        })
      })

      if (!createStepResponse.ok) {
        throw new Error(`Failed to create step ${i}: ${await createStepResponse.text()}`)
      }

      // Create sub-step with actual instruction
      const createSubStepResponse = await fetch('https://api.foodbatch.com/sub_steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desc_short: recipe.steps[i],
          id: 0,
          recipe_id: recipeId,
          step_id: i
        })
      })

      if (!createSubStepResponse.ok) {
        throw new Error(`Failed to create sub-step ${i}: ${await createSubStepResponse.text()}`)
      }

      // Add ingredients for this step
      const stepIngredients = recipe.ingredients.filter(ing => ing.stepIndex === i + 1)
      
      for (const ingredient of stepIngredients) {
        // First query if ingredient exists
        const searchResponse = await fetch(
          `https://api.foodbatch.com/ingredients?select=id,name&name=eq.${encodeURIComponent(ingredient.item)}`,
          { headers: { 'Content-Type': 'application/json' } }
        )

        if (!searchResponse.ok) {
          throw new Error(`Failed to search for ingredient: ${await searchResponse.text()}`)
        }

        let ingredientId
        const existingIngredients = await searchResponse.json()
        
        if (existingIngredients.length === 0) {
          // Create new ingredient if it doesn't exist
          const createIngResponse = await fetch('https://api.foodbatch.com/ingredients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: ingredient.item,
              url_name: ingredient.item.toLowerCase().replace(/\s+/g, '-')
            })
          })

          if (!createIngResponse.ok) {
            throw new Error(`Failed to create ingredient: ${await createIngResponse.text()}`)
          }

          const newIng = await createIngResponse.json()
          ingredientId = newIng.id
        } else {
          ingredientId = existingIngredients[0].id
        }

        // Add amount for this ingredient
        const amount = parseInt(ingredient.amount) || 0
        const createAmountResponse = await fetch('https://api.foodbatch.com/amounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            step_id: i,
            recipe_id: recipeId,
            ingredient_id: ingredientId
          })
        })

        if (!createAmountResponse.ok) {
          throw new Error(`Failed to create amount: ${await createAmountResponse.text()}`)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, recipeId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
