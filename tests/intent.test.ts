import { detectIntent, detectAudience, IntentMode, Audience } from "../src/intent";

test("detects product link intent from URL", () => {
  expect(detectIntent("Check this https://www.myntra.com/product/123")).toBe(IntentMode.PRODUCT_LINK_MODE);
});

test("detects fashion suggestion intent", () => {
  expect(detectIntent("What should I wear for a summer wedding?")).toBe(IntentMode.FASHION_SUGGESTION_MODE);
});

test("detects education/affiliate intent", () => {
  expect(detectIntent("How do I grow on Pinterest and earn from affiliate marketing?"));.toBe(IntentMode.EDUCATION_MODE);
});

test("detects friendly greeting", () => {
  expect(detectIntent("Hey Neon, how are you?")).toBe(IntentMode.FRIENDLY_CHAT_MODE);
});

test("audience detection", () => {
  expect(detectAudience("outfits for girls")).toBe(Audience.Women);
  expect(detectAudience("men's shoes")).toBe(Audience.Men);
  expect(detectAudience("kids wear")).toBe(Audience.Kids);
});
