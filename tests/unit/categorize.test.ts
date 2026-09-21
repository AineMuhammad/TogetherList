import { categorize } from "@/lib/categorize";

describe("categorize", () => {
  it.each([
    ["milk", "DAIRY"],
    ["Cheddar Cheese", "DAIRY"],
    ["greek yogurt", "DAIRY"],
    ["eggs", "DAIRY"],
    ["butter", "DAIRY"],
    ["cream cheese", "DAIRY"],
    ["chicken breast", "MEAT"],
    ["beef", "MEAT"],
    ["salmon fillets", "MEAT"],
    ["bacon", "MEAT"],
    ["tuna", "MEAT"],
    ["bananas", "PRODUCE"],
    ["tomatoes", "PRODUCE"],
    ["strawberries", "PRODUCE"],
    ["sweet potatoes", "PRODUCE"],
    ["spinach", "PRODUCE"],
    ["bell pepper", "PRODUCE"],
    ["rice", "PANTRY"],
    ["spaghetti", "PANTRY"],
    ["bread", "PANTRY"],
    ["olive oil", "PANTRY"],
    ["coffee", "PANTRY"],
    ["ice cream", "FROZEN"],
    ["frozen peas", "FROZEN"],
    ["pizza", "FROZEN"],
    ["toilet paper", "HOUSEHOLD"],
    ["dish soap", "HOUSEHOLD"],
    ["paper towels", "HOUSEHOLD"],
    ["shampoo", "HOUSEHOLD"],
  ])("puts %s in %s", (name, expected) => {
    expect(categorize(name)).toBe(expected);
  });

  describe("specific phrases beat the general words inside them", () => {
    it.each([
      ["ice cream", "FROZEN"], // not DAIRY (cream)
      ["peanut butter", "PANTRY"], // not DAIRY (butter)
      ["coconut milk", "PANTRY"], // not DAIRY (milk)
      ["chicken stock", "PANTRY"], // not MEAT (chicken)
      ["black pepper", "PANTRY"], // not PRODUCE (pepper)
      ["tomato sauce", "PANTRY"], // not PRODUCE (tomato)
    ])("%s -> %s", (name, expected) => {
      expect(categorize(name)).toBe(expected);
    });
  });

  it("is case-insensitive and ignores punctuation and extra whitespace", () => {
    expect(categorize("  MILK!!  ")).toBe("DAIRY");
    expect(categorize("Chicken,   breast")).toBe("MEAT");
  });

  it("ignores accents", () => {
    expect(categorize("jalapeño")).toBe("PRODUCE");
  });

  it("matches whole words only", () => {
    // "pea" is produce, but "peanut" should not be swallowed by it.
    expect(categorize("pea")).toBe("PRODUCE");
    expect(categorize("peach")).toBe("PRODUCE");
    expect(categorize("applesauce")).toBe("OTHER");
  });

  it("falls back to OTHER for unknown or empty input", () => {
    expect(categorize("birthday card")).toBe("OTHER");
    expect(categorize("zzz widget")).toBe("OTHER");
    expect(categorize("")).toBe("OTHER");
    expect(categorize("   ")).toBe("OTHER");
  });
});
