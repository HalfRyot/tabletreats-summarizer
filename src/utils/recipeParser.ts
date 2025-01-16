interface ParsedRecipe {
  ingredients: Array<{
    item: string;
    amount: string;
  }>;
  steps: string[];
}

export const parseRecipe = async (url: string): Promise<ParsedRecipe> => {
  try {
    // In a real implementation, we would make an API call to a backend service
    // that would scrape and parse the recipe website. For now, we'll return mock data
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

    return {
      ingredients: [
        { item: "All-purpose flour", amount: "120g" },
        { item: "Granulated sugar", amount: "200g" },
        { item: "Butter", amount: "113g" },
        { item: "Eggs", amount: "100g" },
        { item: "Vanilla extract", amount: "5ml" },
        { item: "Milk", amount: "240ml" },
      ],
      steps: [
        "Preheat the oven to 180°C (350°F)",
        "Cream together butter and sugar until light and fluffy",
        "Beat in eggs one at a time",
        "Add vanilla extract",
        "Gradually mix in flour",
        "Pour in milk and mix until just combined",
        "Bake for 25-30 minutes until golden brown",
      ],
    };
  } catch (error) {
    console.error("Error parsing recipe:", error);
    throw new Error("Failed to parse recipe");
  }
};