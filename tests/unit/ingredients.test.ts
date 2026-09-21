import {
  ingredientKey,
  mergeIngredients,
  parseIngredient,
  planGroceryChanges,
  type ExistingItem,
} from "@/lib/ingredients";

describe("parseIngredient", () => {
  it("parses quantity, unit and name", () => {
    expect(parseIngredient("2 cups flour")).toMatchObject({
      name: "flour",
      quantity: 2,
      unit: "cup",
    });
    expect(parseIngredient("500g minced beef")).toMatchObject({
      name: "minced beef",
      quantity: 500,
      unit: "g",
    });
    expect(parseIngredient("400 g pasta")).toMatchObject({
      name: "pasta",
      quantity: 400,
      unit: "g",
    });
  });

  it("parses fractions, mixed numbers and unicode fractions", () => {
    expect(parseIngredient("1/2 tsp salt")?.quantity).toBe(0.5);
    expect(parseIngredient("1 1/2 cups milk")?.quantity).toBe(1.5);
    expect(parseIngredient("½ cup sugar")?.quantity).toBe(0.5);
  });

  it("uses the higher end of a range", () => {
    expect(parseIngredient("2-3 tomatoes")).toMatchObject({ key: "tomato", quantity: 3 });
  });

  it("handles counts without a unit", () => {
    expect(parseIngredient("1 onion")).toMatchObject({
      name: "onion",
      quantity: 1,
      unit: null,
    });
    expect(parseIngredient("3 large eggs")).toMatchObject({
      name: "eggs",
      quantity: 3,
      unit: null,
    });
  });

  it("recognises count-style units", () => {
    expect(parseIngredient("2 cloves garlic")).toMatchObject({
      name: "garlic",
      quantity: 2,
      unit: "clove",
    });
    expect(parseIngredient("1 (400g) can chopped tomatoes")).toMatchObject({
      name: "chopped tomatoes",
      quantity: 1,
      unit: "can",
    });
    expect(parseIngredient("a pinch of salt")).toMatchObject({
      name: "salt",
      quantity: 1,
      unit: "pinch",
    });
  });

  it("drops preparation notes and filler words", () => {
    expect(parseIngredient("1 onion, finely chopped")?.name).toBe("onion");
    expect(parseIngredient("Fresh basil")?.name).toBe("basil");
    expect(parseIngredient("salt to taste")).toMatchObject({
      name: "salt",
      quantity: null,
    });
  });

  it("returns null when there is no usable name", () => {
    expect(parseIngredient("")).toBeNull();
    expect(parseIngredient("   ")).toBeNull();
  });
});

describe("ingredientKey", () => {
  it("treats singular and plural as the same ingredient", () => {
    expect(ingredientKey("Eggs")).toBe(ingredientKey("egg"));
    expect(ingredientKey("tomatoes")).toBe(ingredientKey("Tomato"));
    expect(ingredientKey("Sweet potatoes")).toBe("sweet potato");
    expect(ingredientKey("berries")).toBe("berry");
  });

  it("leaves words that only look plural alone", () => {
    expect(ingredientKey("hummus")).toBe("hummus");
    expect(ingredientKey("asparagus")).toBe("asparagus");
  });

  it("ignores case and descriptors", () => {
    expect(ingredientKey("Fresh Basil")).toBe("basil");
  });
});

describe("mergeIngredients", () => {
  const merge = (lines: string[]) =>
    mergeIngredients(lines).map((m) => `${m.name}|${m.quantity}`);

  it("sums plain counts across singular and plural names", () => {
    expect(merge(["2 eggs", "1 egg", "3 large eggs"])).toEqual(["Eggs|6"]);
    expect(merge(["1 onion", "2 onions, diced", "onion"])).toEqual(["Onion|3"]);
  });

  it("sums amounts in the same unit and converts within a family", () => {
    expect(merge(["200g flour", "0.3 kg flour"])).toEqual(["Flour|500 g"]);
    expect(merge(["600g mince", "600g mince"])).toEqual(["Mince|1.2 kg"]);
    expect(merge(["1 lb beef", "8 oz beef"])).toEqual(["Beef|1 1/2 lb"]);
    expect(merge(["1 tsp salt", "2 tsp salt", "1 tbsp salt"])).toEqual(["Salt|2 tbsp"]);
    expect(merge(["1 cup milk", "1 cup milk", "1/2 cup milk"])).toEqual([
      "Milk|2 1/2 cups",
    ]);
  });

  it("lists amounts side by side when they can't be added", () => {
    expect(merge(["200g flour", "1 cup flour"])).toEqual(["Flour|200 g + 1 cup"]);
    expect(merge(["2 cloves garlic", "1 garlic"])).toEqual(["Garlic|2 cloves + 1"]);
  });

  it("pluralises count units", () => {
    expect(merge(["1 tin tomatoes", "2 tins tomatoes"])).toEqual(["Tomatoes|3 tins"]);
    expect(merge(["2 cloves garlic", "3 cloves garlic"])).toEqual(["Garlic|5 cloves"]);
  });

  it("keeps ingredients without a quantity, using amounts from other lines", () => {
    expect(merge(["salt to taste"])).toEqual(["Salt|null"]);
    expect(merge(["salt to taste", "1 tsp salt"])).toEqual(["Salt|1 tsp"]);
  });

  it("keeps different ingredients separate", () => {
    expect(merge(["2 tomatoes", "500g mince"])).toEqual(["Tomatoes|2", "Mince|500 g"]);
  });

  it("doubles everything for a recipe that appears twice", () => {
    const bolognese = ["500g minced beef", "1 onion", "2 cloves garlic"];
    expect(merge([...bolognese, ...bolognese])).toEqual([
      "Minced beef|1 kg",
      "Onion|2",
      "Garlic|4 cloves",
    ]);
  });

  it("skips blank lines", () => {
    expect(merge(["", "  ", "1 egg"])).toEqual(["Egg|1"]);
  });
});

describe("planGroceryChanges", () => {
  const bolognese = ["500g minced beef", "1 onion, finely chopped", "2 cloves garlic"];
  let nextId = 0;

  /** Applies a plan to a list the way the server does, so runs can be chained. */
  function apply(lines: string[], list: ExistingItem[]) {
    const plan = planGroceryChanges(lines, list);
    const updated = list.map((item) => {
      const change = plan.toUpdate.find((u) => u.id === item.id);
      return change ? { ...item, quantity: change.quantity } : item;
    });
    for (const add of plan.toAdd) {
      updated.push({ id: `new-${nextId++}`, name: add.name, quantity: add.quantity });
    }
    return { plan, list: updated };
  }

  it("adds everything to an empty list", () => {
    const plan = planGroceryChanges(bolognese, []);
    expect(plan.toAdd.map((m) => `${m.name}|${m.quantity}`)).toEqual([
      "Minced beef|500 g",
      "Onion|1",
      "Garlic|2 cloves",
    ]);
    expect(plan.toUpdate).toEqual([]);
    expect(plan.skipped).toEqual([]);
  });

  it("does nothing when the list already covers the need (idempotent)", () => {
    const first = apply(bolognese, []);
    const second = apply(bolognese, first.list);
    expect(second.plan.toAdd).toEqual([]);
    expect(second.plan.toUpdate).toEqual([]);
    expect(second.plan.skipped).toHaveLength(3);
    expect(second.list).toHaveLength(3);
  });

  it("raises the existing row instead of adding a duplicate", () => {
    const first = apply(bolognese, []);
    const second = apply([...bolognese, ...bolognese], first.list);
    expect(second.plan.toAdd).toEqual([]);
    expect(second.list).toHaveLength(3);
    expect(second.list.map((i) => `${i.name}|${i.quantity}`)).toEqual([
      "Minced beef|1 kg",
      "Onion|2",
      "Garlic|4 cloves",
    ]);

    const third = apply([...bolognese, ...bolognese, ...bolognese], second.list);
    expect(third.list).toHaveLength(3);
    expect(third.list.map((i) => i.quantity)).toEqual(["1 1/2 kg", "3", "6 cloves"]);
  });

  it("only adds new ingredients as new rows", () => {
    const list: ExistingItem[] = [{ id: "a", name: "Onion", quantity: "1" }];
    const { toAdd, toUpdate, skipped } = planGroceryChanges(
      ["1 onion", "2 tomatoes"],
      list,
    );
    expect(toAdd.map((m) => m.name)).toEqual(["Tomatoes"]);
    expect(toUpdate).toEqual([]);
    expect(skipped).toEqual(["Onion"]);
  });

  it("leaves hand-typed items with no readable amount alone", () => {
    const list: ExistingItem[] = [
      { id: "a", name: "Onion", quantity: null },
      { id: "b", name: "Eggs", quantity: "a dozen" },
    ];
    const { toAdd, toUpdate, skipped } = planGroceryChanges(["3 onions", "3 eggs"], list);
    expect(toAdd).toEqual([]);
    expect(toUpdate).toEqual([]);
    expect(skipped.sort()).toEqual(["Eggs", "Onions"]);
  });

  it("matches names regardless of case and plurals", () => {
    const list: ExistingItem[] = [{ id: "a", name: "tomatoes", quantity: "2" }];
    const { toAdd, toUpdate } = planGroceryChanges(["2 Tomato"], list);
    expect(toAdd).toEqual([]);
    expect(toUpdate).toEqual([]);
  });

  it("tops up a row that was reduced by hand", () => {
    const list: ExistingItem[] = [{ id: "a", name: "Minced beef", quantity: "250 g" }];
    const { toUpdate } = planGroceryChanges(["500g minced beef"], list);
    expect(toUpdate).toEqual([{ id: "a", name: "Minced beef", quantity: "500 g" }]);
  });

  it("counts several rows for the same ingredient and grows the oldest", () => {
    const list: ExistingItem[] = [
      { id: "a", name: "Minced beef", quantity: "250 g" },
      { id: "b", name: "Minced beef", quantity: "250 g" },
    ];
    const { toUpdate } = planGroceryChanges(["900g minced beef"], list);
    expect(toUpdate).toEqual([{ id: "a", name: "Minced beef", quantity: "650 g" }]);
  });

  it("appends a different unit to the same row", () => {
    const list: ExistingItem[] = [{ id: "a", name: "Flour", quantity: "1 kg" }];
    const { toAdd, toUpdate } = planGroceryChanges(["2 cups flour"], list);
    expect(toAdd).toEqual([]);
    expect(toUpdate).toEqual([{ id: "a", name: "Flour", quantity: "1 kg + 2 cups" }]);
  });
});
