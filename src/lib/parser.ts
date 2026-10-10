import type { NodeSource, ReplyNode, TopicPost } from "../types/board";
import { getReplyVariant, getTopicVariant } from "../types/board";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

export function parseJsonResponse<T>(raw: string): T {
  const cleaned = stripCodeFences(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new ParseError("LLM response was not valid JSON.");
  }
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ParseError(`Missing or invalid field: ${field}`);
  }
  return value.trim();
}

function newId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function createReplyNode(
  username: string,
  content: string,
  source: NodeSource = "llm",
): ReplyNode {
  return {
    id: newId(),
    activeVariant: 0,
    variants: [
      {
        username,
        content,
        source,
        createdAt: now(),
      },
    ],
    replies: [],
  };
}

export interface RawInitPost {
  username: string;
  subject: string;
  content: string;
}

export interface InitResponse {
  posts: RawInitPost[];
}

export function parseInitResponse(raw: string, expectedCount: number): TopicPost[] {
  const data = parseJsonResponse<InitResponse>(raw);
  if (!Array.isArray(data.posts) || data.posts.length === 0) {
    throw new ParseError("Initialize response must include a non-empty posts array.");
  }

  const createdAt = now();
  return data.posts.slice(0, expectedCount).map((post) => ({
    id: newId(),
    createdAt,
    activeVariant: 0,
    hiddenFromContext: false,
    variants: [
      {
        username: requireString(post.username, "username"),
        subject: requireString(post.subject, "subject"),
        content: requireString(post.content, "content"),
        source: "llm" as const,
        createdAt,
      },
    ],
    replies: [],
  }));
}

export interface RawGenerateTopic {
  username: string;
  subject: string;
  content: string;
}

export interface RawGenerateReply {
  targetTopicId: string;
  parentReplyId?: string | null;
  username: string;
  content: string;
}

export interface GenerateResponse {
  newTopics?: RawGenerateTopic[];
  replies?: RawGenerateReply[];
}

export interface GenerateBatch {
  newTopics: TopicPost[];
  replies: Array<{
    targetTopicId: string;
    parentReplyId: string | null;
    reply: ReplyNode;
  }>;
}

export function parseGenerateResponse(
  raw: string,
  existingTopicIds: Set<string>,
  existingReplyIds: Set<string>,
): GenerateBatch {
  const data = parseJsonResponse<GenerateResponse>(raw);
  const newTopics: TopicPost[] = [];

  if (Array.isArray(data.newTopics)) {
    const createdAt = now();
    for (const topic of data.newTopics) {
      newTopics.push({
        id: newId(),
        createdAt,
        activeVariant: 0,
        hiddenFromContext: false,
        variants: [
          {
            username: requireString(topic.username, "username"),
            subject: requireString(topic.subject, "subject"),
            content: requireString(topic.content, "content"),
            source: "llm",
            createdAt,
          },
        ],
        replies: [],
      });
    }
  }

  const replies: GenerateBatch["replies"] = [];
  if (Array.isArray(data.replies)) {
    for (const item of data.replies) {
      const targetTopicId = requireString(item.targetTopicId, "targetTopicId");
      if (!existingTopicIds.has(targetTopicId)) {
        continue;
      }
      const parentReplyId =
        item.parentReplyId === null || item.parentReplyId === undefined
          ? null
          : String(item.parentReplyId);
      if (parentReplyId && !existingReplyIds.has(parentReplyId)) {
        continue;
      }
      replies.push({
        targetTopicId,
        parentReplyId,
        reply: createReplyNode(
          requireString(item.username, "username"),
          requireString(item.content, "content"),
        ),
      });
    }
  }

  if (newTopics.length === 0 && replies.length === 0) {
    throw new ParseError("Generate response contained no usable topics or replies.");
  }

  return { newTopics, replies };
}

export interface TargetedReplyResponse {
  username: string;
  content: string;
}

export function parseTargetedReplyResponse(raw: string): ReplyNode {
  const data = parseJsonResponse<TargetedReplyResponse>(raw);
  return createReplyNode(
    requireString(data.username, "username"),
    requireString(data.content, "content"),
  );
}

export interface RegenerateTopicResponse {
  username: string;
  subject: string;
  content: string;
}

export function parseRegenerateTopicResponse(
  raw: string,
): RegenerateTopicResponse {
  const data = parseJsonResponse<RegenerateTopicResponse>(raw);
  return {
    username: requireString(data.username, "username"),
    subject: requireString(data.subject, "subject"),
    content: requireString(data.content, "content"),
  };
}

export function parseRegenerateReplyResponse(
  raw: string,
): TargetedReplyResponse {
  const data = parseJsonResponse<TargetedReplyResponse>(raw);
  return {
    username: requireString(data.username, "username"),
    content: requireString(data.content, "content"),
  };
}

export function collectReplyIds(topics: TopicPost[]): Set<string> {
  const ids = new Set<string>();

  function walk(replies: ReplyNode[]) {
    for (const reply of replies) {
      ids.add(reply.id);
      walk(reply.replies);
    }
  }

  for (const topic of topics) {
    walk(topic.replies);
  }
  return ids;
}

export function collectUsernames(topics: TopicPost[]): string[] {
  const names = new Set<string>();

  function walk(replies: ReplyNode[]) {
    for (const reply of replies) {
      names.add(getReplyVariant(reply).username);
      walk(reply.replies);
    }
  }

  for (const topic of topics) {
    names.add(getTopicVariant(topic).username);
    walk(topic.replies);
  }
  return [...names];
}
