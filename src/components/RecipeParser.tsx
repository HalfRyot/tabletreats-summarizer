import { useState } from "react";
import { parseRecipe } from "@/utils/recipeParser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Copy } from "lucide-react";

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

    const text = `
Ingredients:
${recipe.ingredients.map(i => `${i.item} - ${i.amount}`).join("\n")}

Steps:
${recipe.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Recipe copied to clipboard",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
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

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-recipe-dark border-b-2 border-recipe-sage pb-2">
                Ingredients
              </h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{ing.item}</span>
                    <span className="text-recipe-terracotta font-medium">{ing.amount}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-lg text-recipe-dark border-b-2 border-recipe-sage pb-2 mb-4">
                Steps
              </h3>
              <ol className="space-y-4">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-medium text-recipe-terracotta">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};