import { analyzeProductLink } from "../src/handlers/productLinkHandler";

test("returns insufficient data when no product text", async () => {
  const res = await analyzeProductLink("https://www.amazon.in/example-product");
  expect(res.verdict).toMatch(/Insufficient data/);
  expect(res.stylingTips.length).toBeGreaterThan(0);
});

test("parses simple product text", async () => {
  const fakeText = "Men's cotton t-shirt priced at Rs. 799. Casual tee, breathable cotton.";
  const res = await analyzeProductLink("https://www.myntra.com/prod", fakeText);
  expect(res.category).toMatch(/t-shirt|tee|shirt/i);
  expect(res.valueForMoney).not.toBe("Insufficient data");
  expect(res.stylingTips.length).toBeGreaterThan(0);
});
