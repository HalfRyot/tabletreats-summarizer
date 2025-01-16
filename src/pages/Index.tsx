import { RecipeParser } from "@/components/RecipeParser";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-recipe-cream/30 py-12">
      <div className="container">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-recipe-dark mb-4">Recipe Parser</h1>
          <p className="text-lg text-gray-600">
            Paste a recipe URL to get a clean, formatted version with standardized measurements
          </p>
        </div>
        <RecipeParser />
      </div>
    </div>
  );
};

export default Index;