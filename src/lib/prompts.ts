import type { BoardSettings, ReplyNode, TopicPost } from "../types/board";
import { getReplyVariant, getTopicVariant } from "../types/board";
import { serializeBoard } from "./serialize";

function buildFramework(settings: BoardSettings): string {
  const parts = [settings.preContextInstructions.trim()];

  if (settings.globalContext.trim()) {
    parts.push("", "GLOBAL CONTEXT:", settings.globalContext.trim());
  }

  parts.push("", settings.postContextInstructions.trim());
  return parts.join("\n");
}

export function buildInitPrompt(settings: BoardSettings, topicCount: number): string {
  const framework = buildFramework(settings);
  return `${framework}

TASK: Create exactly ${topicCount} top-level message board topics inspired by the global context.
Each topic must have a distinct username, a short subject line, and post body content.
Vary tone and perspective across topics.

Return JSON in this exact shape:
{
  "posts": [
    { "username": "string", "subject": "string", "content": "string" }
  ]
}`;
}

export function buildGeneratePrompt(
  settings: BoardSettings,
  topics: TopicPost[],
  newTopicCount: number,
  newReplyCount: number,
): string {
  const framework = buildFramework(settings);
  const boardText = serializeBoard(topics);
  const usernames =
    settings.knownUsernames.length > 0
      ? settings.knownUsernames.join(", ")
      : "(none yet)";

  return `${framework}

EXISTING BOARD:
${boardText}

KNOWN USERNAMES (prefer reusing these for returning members): ${usernames}

TASK: Add ${newTopicCount} new top-level topics and ${newReplyCount} replies to existing topics or replies.
Replies must reference valid targetTopicId and optional parentReplyId from the board above.
Mix new usernames with returning members from the known usernames list.

Return JSON in this exact shape:
{
  "newTopics": [
    { "username": "string", "subject": "string", "content": "string" }
  ],
  "replies": [
    {
      "targetTopicId": "string",
      "parentReplyId": "string or null",
      "username": "string",
      "content": "string"
    }
  ]
}`;
}

export function buildTargetedReplyPrompt(
  settings: BoardSettings,
  topic: TopicPost,
  parentReply: ReplyNode | null,
): string {
  const framework = buildFramework(settings);
  const topicVariant = getTopicVariant(topic);
  const target = parentReply
    ? `Reply to this message:\n@${getReplyVariant(parentReply).username}: ${getReplyVariant(parentReply).content}`
    : `Reply to this topic:\n@${topicVariant.username} — "${topicVariant.subject}"\n${topicVariant.content}`;

  return `${framework}

${target}

TASK: Write a single reply to the message above. Invent or reuse a realistic username.

Return JSON in this exact shape:
{ "username": "string", "content": "string" }`;
}

export function buildRegenerateTopicPrompt(
  settings: BoardSettings,
  topic: TopicPost,
): string {
  const framework = buildFramework(settings);
  const variant = getTopicVariant(topic);

  return `${framework}

CURRENT TOPIC POST:
@${variant.username} — "${variant.subject}"
${variant.content}

TASK: Regenerate this topic post with a fresh alternative take. You may change the username, subject, and content. Keep it a top-level discussion topic aligned with the global context.

Return JSON in this exact shape:
{ "username": "string", "subject": "string", "content": "string" }`;
}

export function buildRegenerateReplyPrompt(
  settings: BoardSettings,
  topic: TopicPost,
  reply: ReplyNode,
  parentReplyId: string | null,
): string {
  const framework = buildFramework(settings);
  const topicVariant = getTopicVariant(topic);
  const replyVariant = getReplyVariant(reply);

  let context = `Topic:\n@${topicVariant.username} — "${topicVariant.subject}"\n${topicVariant.content}`;

  if (parentReplyId) {
    const parent = findReplyInTopic(topic, parentReplyId);
    if (parent) {
      const parentVariant = getReplyVariant(parent);
      context = `Replying to:\n@${parentVariant.username}: ${parentVariant.content}`;
    }
  }

  return `${framework}

CONTEXT:
${context}

CURRENT REPLY TO REGENERATE:
@${replyVariant.username}: ${replyVariant.content}

TASK: Regenerate this reply with a fresh alternative take. You may change the username and content. Stay consistent with the context.

Return JSON in this exact shape:
{ "username": "string", "content": "string" }`;
}

function findReplyInTopic(topic: TopicPost, replyId: string): ReplyNode | null {
  function walk(replies: ReplyNode[]): ReplyNode | null {
    for (const reply of replies) {
      if (reply.id === replyId) return reply;
      const nested = walk(reply.replies);
      if (nested) return nested;
    }
    return null;
  }
  return walk(topic.replies);
}
