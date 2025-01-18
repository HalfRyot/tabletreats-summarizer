import { useState } from "react";
import { parseRecipe } from "@/utils/recipeParser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Copy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const RecipeParser = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<Awaited<ReturnType<typeof parseRecipe>> | null>(null);
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
        .join(", ");

      return `Step ${i + 1}:\nIngredients: ${stepIngredients}\nInstructions: ${step}\n`;
    }).join("\n");

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Recipe copied to clipboard",
    });
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
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
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
              {recipe.steps.map((step, index) => {
                const stepIngredients = recipe.ingredients.filter(
                  ing => ing.stepIndex === index + 1
                );
                
                return (
                  <TableRow key={index}>
                    <TableCell className="align-top">
                      {stepIngredients.length > 0 ? (
                        <div className="space-y-2">
                          {stepIngredients.map((ing, i) => (
                            <div key={i} className="font-medium">
                              {ing.item}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">
                          No ingredients for this step
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      {stepIngredients.length > 0 && (
                        <div className="space-y-2">
                          {stepIngredients.map((ing, i) => (
                            <div key={i} className="text-recipe-terracotta">
                              {ing.amount || "-"}
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{step}</TableCell>
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