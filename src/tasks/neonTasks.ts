export type Task = {
  id: string;
  title: string;
  description: string;
  estimateHours?: number;
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "done";
};

export const NEON_TASKS: Task[] = [
  { id: "T-001", title: "Review & tighten master prompt copy and guardrails", description: "Edit the NEON_MASTER_PROMPT to improve safety, clarity, and remove any ambiguous instructions. Ensure guardrails are explicit and unambiguous.", estimateHours: 2, priority: "high", status: "todo" },
  { id: "T-002", title: "Convert prompt into deployable TypeScript module", description: "Ensure the prompt is exported as a constant with helper functions (e.g., renderFirstMessage()). Add types and tests for deterministic output.", estimateHours: 3, priority: "high", status: "done" },
  { id: "T-003", title: "Implement intent-detection scaffolding", description: "Create enums for modes and example matcher functions for quick intent checks.", estimateHours: 4, priority: "high", status: "done" },
  { id: "T-004", title: "Add example LLM client wrapper", description: "Add a small wrapper that injects NEON_MASTER_PROMPT into system prompt and demonstrates sending user messages. Keep it provider-agnostic (OpenAI/Anthropic).", estimateHours: 2, priority: "medium", status: "done" },
  { id: "T-005", title: "Create unit tests and lint rules for prompt style", description: "Write tests to ensure the first-message rule and product-mode output template are preserved. Add eslint rules/comments to discourage long paragraphs.", estimateHours: 3, priority: "medium", status: "done" },
  { id: "T-006", title: "Add example handlers for PRODUCT_LINK_MODE", description: "Create an example function that, given a product URL, returns a structured ProductAnalysis object that follows the strict output format (without hallucinating specs).", estimateHours: 4, priority: "high", status: "done" },
  { id: "T-007", title: "Convert tasks to GitHub issues", description: "Create issues in the repo for each task above, assigning labels (enhancement, bug, high priority) and milestones if appropriate.", estimateHours: 1, priority: "low", status: "todo" },
];
