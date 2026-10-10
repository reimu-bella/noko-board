import {
  getReplyVariant,
  getTopicVariant,
  type ReplyNode,
  type TopicPost,
} from "../types/board";

function serializeReply(reply: ReplyNode, depth: number): string {
  const variant = getReplyVariant(reply);
  const indent = "  ".repeat(depth);
  let text = `${indent}[reply id=${reply.id}] @${variant.username}: ${variant.content}\n`;
  for (const child of reply.replies) {
    text += serializeReply(child, depth + 1);
  }
  return text;
}

export function topicsInBoardContext(topics: TopicPost[]): TopicPost[] {
  return topics.filter((topic) => !topic.hiddenFromContext);
}

export function serializeBoard(topics: TopicPost[]): string {
  const visible = topicsInBoardContext(topics);
  if (visible.length === 0) return "(empty board)";

  return visible
    .map((topic) => {
      const variant = getTopicVariant(topic);
      let text = `[topic id=${topic.id}] @${variant.username} — "${variant.subject}"\n`;
      text += `  ${variant.content}\n`;
      for (const reply of topic.replies) {
        text += serializeReply(reply, 1);
      }
      return text;
    })
    .join("\n");
}
