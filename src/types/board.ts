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

export const DEFAULT_MODEL = "openai-fast";

export const AVAILABLE_MODELS = [
  "openai-fast",
  "openai",
  "mistral",
  "gemini-fast",
  "claude-fast",
  "deepseek",
] as const;

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
