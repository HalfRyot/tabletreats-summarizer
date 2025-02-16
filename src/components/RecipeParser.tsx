
import { useState } from "react";
import { parseRecipe } from "@/utils/recipeParser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Copy, Send, Pencil, Check } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const RecipeParser = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recipe, setRecipe] = useState<Awaited<ReturnType<typeof parseRecipe>> | null>(null);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<{stepIndex: number, ingredientIndex: number} | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    try {
      const parsed = await parseRecipe(url);
      setRecipe(parsed);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse recipe. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!recipe) return;

    const text = recipe.steps.map((step, i) => {
      const stepIngredients = recipe.ingredients
        .filter(ing => ing.stepIndex === i + 1)
        .map(ing => `${ing.item} - ${ing.amount}`)
        .join("\n");

      return `Step ${i + 1}:${stepIngredients ? `\nIngredients:\n${stepIngredients}` : ""}\n${step}`;
    }).join("\n\n");

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Recipe copied to clipboard",
    });
  };

  const sendToFoodbatch = async () => {
    if (!recipe) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-to-foodbatch', {
        body: { recipe }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Recipe has been sent to Foodbatch",
      });
    } catch (error) {
      console.error('Error sending to Foodbatch:', error);
      toast({
        title: "Error",
        description: "Failed to send recipe to Foodbatch. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleStepEdit = (index: number, newValue: string) => {
    if (!recipe) return;
    const newSteps = [...recipe.steps];
    newSteps[index] = newValue;
    setRecipe({ ...recipe, steps: newSteps });
  };

  const handleIngredientEdit = (stepIndex: number, ingredientIndex: number, field: 'item' | 'amount', value: string) => {
    if (!recipe) return;
    const newIngredients = [...recipe.ingredients];
    const ingredientToEdit = recipe.ingredients.findIndex(
      (ing, idx) => ing.stepIndex === stepIndex && idx === ingredientIndex
    );
    if (ingredientToEdit === -1) return;
    
    newIngredients[ingredientToEdit] = {
      ...newIngredients[ingredientToEdit],
      [field]: value
    };
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="flex gap-4">
          <Input
            type="url"
            placeholder="Paste recipe URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            required
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-recipe-terracotta hover:bg-recipe-terracotta/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Parse Recipe"
            )}
          </Button>
        </div>
      </form>

      {recipe && (
        <div className="bg-recipe-cream rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-recipe-dark">Parsed Recipe</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                variant="outline"
                onClick={sendToFoodbatch}
                disabled={isSending}
                className="flex items-center gap-2"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send to Foodbatch
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Ingredients</TableHead>
                <TableHead className="w-[100px]">Amount</TableHead>
                <TableHead>Instructions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipe.steps.map((step, stepIndex) => {
                const stepIngredients = recipe.ingredients.filter(
                  ing => ing.stepIndex === stepIndex + 1
                );
                
                return (
                  <TableRow key={stepIndex}>
                    <TableCell className="align-top">
                      <table className="w-full">
                        <tbody>
                          {stepIngredients.length > 0 ? (
                            stepIngredients.map((ing, i) => (
                              <tr key={i}>
                                <td className="font-medium py-2 pr-2 border-0">
                                  {editingIngredient?.stepIndex === stepIndex + 1 && 
                                   editingIngredient?.ingredientIndex === i ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        value={ing.item}
                                        onChange={(e) => handleIngredientEdit(stepIndex + 1, i, 'item', e.target.value)}
                                        className="min-w-[120px]"
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingIngredient(null)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      {ing.item}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingIngredient({ stepIndex: stepIndex + 1, ingredientIndex: i })}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="text-gray-500 italic py-2 border-0">
                                No ingredients for this step
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </TableCell>
                    <TableCell className="align-top">
                      <table className="w-full">
                        <tbody>
                          {stepIngredients.length > 0 && (
                            stepIngredients.map((ing, i) => (
                              <tr key={i}>
                                <td className="text-recipe-terracotta py-2 border-0">
                                  {editingIngredient?.stepIndex === stepIndex + 1 && 
                                   editingIngredient?.ingredientIndex === i ? (
                                    <Input
                                      value={ing.amount}
                                      onChange={(e) => handleIngredientEdit(stepIndex + 1, i, 'amount', e.target.value)}
                                      className="w-24"
                                    />
                                  ) : (
                                    ing.amount || "-"
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </TableCell>
                    <TableCell>
                      {editingStep === stepIndex ? (
                        <div className="flex items-start gap-2">
                          <textarea
                            value={step}
                            onChange={(e) => handleStepEdit(stepIndex, e.target.value)}
                            className="flex-1 p-2 border rounded-md"
                            rows={3}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingStep(null)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          {step}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingStep(stepIndex)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
