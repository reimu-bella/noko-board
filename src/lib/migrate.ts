import type {
  NodeSource,
  ReplyNode,
  ReplyVariant,
  TopicPost,
  TopicVariant,
} from "../types/board";

interface LegacyReplyNode {
  id: string;
  username: string;
  content: string;
  source: NodeSource;
  createdAt: string;
  replies: LegacyReplyNode[];
  variants?: ReplyVariant[];
  activeVariant?: number;
}

interface LegacyTopicPost {
  id: string;
  username?: string;
  subject?: string;
  content?: string;
  source?: NodeSource;
  createdAt: string;
  replies: LegacyReplyNode[];
  variants?: TopicVariant[];
  activeVariant?: number;
}

function migrateReply(reply: LegacyReplyNode): ReplyNode {
  if (reply.variants && reply.variants.length > 0) {
    return {
      id: reply.id,
      variants: reply.variants,
      activeVariant: reply.activeVariant ?? 0,
      replies: reply.replies.map(migrateReply),
    };
  }

  return {
    id: reply.id,
    variants: [
      {
        username: reply.username,
        content: reply.content,
        source: reply.source,
        createdAt: reply.createdAt,
      },
    ],
    activeVariant: 0,
    replies: reply.replies.map(migrateReply),
  };
}

function migrateTopic(topic: LegacyTopicPost): TopicPost {
  if (topic.variants && topic.variants.length > 0) {
    return {
      id: topic.id,
      createdAt: topic.createdAt,
      variants: topic.variants,
      activeVariant: topic.activeVariant ?? 0,
      replies: topic.replies.map(migrateReply),
    };
  }

  return {
    id: topic.id,
    createdAt: topic.createdAt,
    activeVariant: 0,
    variants: [
      {
        username: topic.username ?? "unknown",
        subject: topic.subject ?? "Untitled",
        content: topic.content ?? "",
        source: topic.source ?? "llm",
        createdAt: topic.createdAt,
      },
    ],
    replies: topic.replies.map(migrateReply),
  };
}

export function migrateTopics(topics: LegacyTopicPost[]): TopicPost[] {
  return topics.map(migrateTopic);
}
