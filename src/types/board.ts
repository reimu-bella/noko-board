export type NodeSource = "human" | "llm";

export interface ReplyVariant {
  username: string;
  content: string;
  source: NodeSource;
  createdAt: string;
}

export interface TopicVariant {
  username: string;
  subject: string;
  content: string;
  source: NodeSource;
  createdAt: string;
}

export interface ReplyNode {
  id: string;
  variants: ReplyVariant[];
  activeVariant: number;
  replies: ReplyNode[];
}

export interface TopicPost {
  id: string;
  variants: TopicVariant[];
  activeVariant: number;
  createdAt: string;
  /** When true, this thread is omitted from the board context used to generate replies. */
  hiddenFromContext: boolean;
  replies: ReplyNode[];
}

export interface BoardSettings {
  globalContext: string;
  preContextInstructions: string;
  postContextInstructions: string;
  apiKey: string;
  model: string;
  knownUsernames: string[];
}

export interface BoardState {
  topics: TopicPost[];
  settings: BoardSettings;
}

export type BoardPhase = "initial" | "active";

export function getBoardPhase(state: BoardState): BoardPhase {
  return state.topics.length === 0 ? "initial" : "active";
}

export function getTopicVariant(topic: TopicPost): TopicVariant {
  return topic.variants[topic.activeVariant] ?? topic.variants[0];
}

export function getReplyVariant(reply: ReplyNode): ReplyVariant {
  return reply.variants[reply.activeVariant] ?? reply.variants[0];
}

export const DEFAULT_PRE_CONTEXT =
  "You are simulating a message board community. Write in casual forum style. Invent realistic usernames. Stay in-character and react naturally to the subject matter.";

export const DEFAULT_POST_CONTEXT =
  "Return ONLY valid JSON matching the schema below. No markdown fences, no commentary outside the JSON.";

export const DEFAULT_MODEL = "google/gemma-4-31b-it";

/**
 * Official Pollinations text models that support `/v1/chat/completions`
 * and `response_format`. Sourced from GET https://gen.pollinations.ai/v1/models.
 */
export const AVAILABLE_MODELS: readonly string[] = [
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-opus-4.6",
  "anthropic/claude-sonnet-4.6",
  "cohere/command-a-plus",
  "deepseek/deepseek-v4-flash",
  "deepseek/deepseek-v4-flash-vision-exp",
  "deepseek/deepseek-v4-pro",
  "deepseek/deepseek-v4.1-flash",
  "deepseek/deepseek-v4.1-flash-1017",
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-flash-lite:search",
  "google/gemini-3-flash-preview",
  "google/gemini-3.1-pro-preview",
  "google/gemini-3.5-flash-lite",
  "google/gemini-3.7-flash",
  "google/gemini-3.8-flash",
  "google/gemini-4-argon",
  "google/gemma-4-26b-a4b-it",
  "google/gemma-4-31b-it",
  "inception/mercury-2",
  "inception/mercury-2.5-preview",
  "inclusionai/ling-3.0-flash-vl",
  "inferenceport-ai/lightning-text-v2",
  "inferenceport-ai/lightning-text-v2.1",
  "meta/muse-glimmer-30b",
  "meta/muse-wonder-1.0",
  "minimax/minimax-m2.7",
  "minimax/minimax-m3",
  "mistralai/mistral-large-4",
  "mistralai/mistral-small-3.2",
  "mistralai/mistral-small-4",
  "moonshotai/kimi-k2.6",
  "moonshotai/kimi-k2.7-code",
  "moonshotai/kimi-k3",
  "nvidia/nemotron-3-ultra",
  "nvidia/nemotron-3.5-lightning",
  "openai/gpt-4o-mini",
  "openai/gpt-5-nano",
  "openai/gpt-5.3-codex",
  "openai/gpt-5.4",
  "openai/gpt-5.4-mini",
  "openai/gpt-5.4-nano",
  "openai/gpt-5.5",
  "openai/gpt-5.6-luna",
  "openai/gpt-5.6-sol",
  "openai/gpt-5.6-terra",
  "openai/gpt-6-astra",
  "openai/gpt-6-luna",
  "openai/gpt-6-sol",
  "openai/gpt-6.1-sol",
  "openai/gpt-oss-20b",
  "perplexity/sonar",
  "qwen/qwen3-coder-30b-a3b-instruct",
  "qwen/qwen3-coder-next",
  "qwen/qwen3-vl-30b-a3b-instruct",
  "qwen/qwen3.7-flash",
  "qwen/qwen3.7-max",
  "qwen/qwen3.7-plus",
  "qwen/qwen3.8-2.4t-a95b",
  "qwen/qwen3.8-27b",
  "qwen/qwen3.8-flash",
  "qwen/qwen3.8-max",
  "qwen/qwen3.8-max-0902",
  "stepfun/step-3.7-flash",
  "stepfun/step-5-preview",
  "tencent/hy4-preview",
  "thinkingmachines/inkling",
  "x-ai/grok-4.20",
  "x-ai/grok-4.3",
  "x-ai/grok-4.6",
  "x-ai/grok-4.7",
  "xiaomi/mimo-v2.5",
  "xiaomi/mimo-v2.5-pro",
  "xiaomi/mimo-v2.6-flash",
  "xiaomi/mimo-v2.6-pro",
  "z-ai/glm-5.2",
  "z-ai/glm-5.3",
  "z-ai/glm-5.3-flash",
  "z-ai/glm-5.3-flashx",
];

export function createDefaultSettings(): BoardSettings {
  return {
    globalContext: "",
    preContextInstructions: DEFAULT_PRE_CONTEXT,
    postContextInstructions: DEFAULT_POST_CONTEXT,
    apiKey: import.meta.env.VITE_POLLINATIONS_API_KEY ?? "",
    model: DEFAULT_MODEL,
    knownUsernames: [],
  };
}

export function createInitialState(): BoardState {
  return {
    topics: [],
    settings: createDefaultSettings(),
  };
}

export interface ReplyTarget {
  topicId: string;
  parentReplyId: string | null;
}

export type NodeRef =
  | { kind: "topic"; topicId: string }
  | { kind: "reply"; topicId: string; replyId: string };
