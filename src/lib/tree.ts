import type { ReplyNode, ReplyVariant, TopicPost, TopicVariant } from "../types/board";

export function deleteReplyFromTree(
  replies: ReplyNode[],
  replyId: string,
): ReplyNode[] {
  return replies
    .filter((reply) => reply.id !== replyId)
    .map((reply) => ({
      ...reply,
      replies: deleteReplyFromTree(reply.replies, replyId),
    }));
}

export function findReply(
  replies: ReplyNode[],
  replyId: string,
): ReplyNode | null {
  for (const reply of replies) {
    if (reply.id === replyId) return reply;
    const nested = findReply(reply.replies, replyId);
    if (nested) return nested;
  }
  return null;
}

export function findReplyParentId(
  replies: ReplyNode[],
  replyId: string,
  parentId: string | null = null,
): string | null | undefined {
  for (const reply of replies) {
    if (reply.id === replyId) return parentId;
    const nested = findReplyParentId(reply.replies, replyId, reply.id);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

export function mapReplyTree(
  replies: ReplyNode[],
  replyId: string,
  updater: (reply: ReplyNode) => ReplyNode,
): ReplyNode[] {
  return replies.map((reply) => {
    if (reply.id === replyId) return updater(reply);
    return {
      ...reply,
      replies: mapReplyTree(reply.replies, replyId, updater),
    };
  });
}

export function addReplyVariant(
  replies: ReplyNode[],
  replyId: string,
  variant: ReplyVariant,
): ReplyNode[] {
  return mapReplyTree(replies, replyId, (reply) => ({
    ...reply,
    variants: [...reply.variants, variant],
    activeVariant: reply.variants.length,
  }));
}

export function setReplyVariantIndex(
  replies: ReplyNode[],
  replyId: string,
  index: number,
): ReplyNode[] {
  return mapReplyTree(replies, replyId, (reply) => ({
    ...reply,
    activeVariant: Math.max(0, Math.min(index, reply.variants.length - 1)),
  }));
}

export function addTopicVariant(
  topic: TopicPost,
  variant: TopicVariant,
): TopicPost {
  return {
    ...topic,
    variants: [...topic.variants, variant],
    activeVariant: topic.variants.length,
  };
}

export function setTopicVariantIndex(topic: TopicPost, index: number): TopicPost {
  return {
    ...topic,
    activeVariant: Math.max(0, Math.min(index, topic.variants.length - 1)),
  };
}

export function countReplyTree(replies: ReplyNode[]): number {
  return replies.reduce(
    (sum, reply) => sum + 1 + countReplyTree(reply.replies),
    0,
  );
}
