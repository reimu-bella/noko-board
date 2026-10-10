import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  collectReplyIds,
  collectUsernames,
  parseGenerateResponse,
  parseInitResponse,
  parseRegenerateReplyResponse,
  parseRegenerateTopicResponse,
  parseTargetedReplyResponse,
  type GenerateBatch,
} from "../lib/parser";
import { chatCompletion, PollinationsError } from "../lib/pollinations";
import {
  buildGeneratePrompt,
  buildInitPrompt,
  buildRegenerateReplyPrompt,
  buildRegenerateTopicPrompt,
  buildTargetedReplyPrompt,
} from "../lib/prompts";
import { loadState, saveState } from "../lib/storage";
import { topicsInBoardContext } from "../lib/serialize";
import {
  addReplyVariant,
  addTopicVariant,
  deleteReplyFromTree,
  findReply,
  findReplyParentId,
  setReplyVariantIndex,
  setTopicVariantIndex,
} from "../lib/tree";
import {
  getBoardPhase,
  type BoardSettings,
  type BoardState,
  type NodeRef,
  type ReplyNode,
  type ReplyTarget,
  type ReplyVariant,
  type TopicPost,
  type TopicVariant,
} from "../types/board";

type BoardAction =
  | { type: "SET_SETTINGS"; settings: Partial<BoardSettings> }
  | { type: "LOAD_STATE"; state: BoardState }
  | { type: "ADD_TOPIC"; topic: TopicPost }
  | { type: "ADD_REPLY"; target: ReplyTarget; reply: ReplyNode }
  | { type: "MERGE_GENERATE_BATCH"; batch: GenerateBatch }
  | { type: "MERGE_INIT_TOPICS"; topics: TopicPost[] }
  | { type: "CLEAR_BOARD" }
  | { type: "DELETE_TOPIC"; topicId: string }
  | { type: "DELETE_REPLY"; topicId: string; replyId: string }
  | { type: "ADD_TOPIC_VARIANT"; topicId: string; variant: TopicVariant }
  | { type: "ADD_REPLY_VARIANT"; topicId: string; replyId: string; variant: ReplyVariant }
  | { type: "SET_TOPIC_VARIANT"; topicId: string; index: number }
  | { type: "SET_REPLY_VARIANT"; topicId: string; replyId: string; index: number }
  | { type: "TOGGLE_HIDDEN_FROM_CONTEXT"; topicId: string };

function addReplyToTree(
  replies: ReplyNode[],
  parentReplyId: string | null,
  reply: ReplyNode,
): ReplyNode[] {
  if (!parentReplyId) {
    return [...replies, reply];
  }

  return replies.map((node) => {
    if (node.id === parentReplyId) {
      return { ...node, replies: [...node.replies, reply] };
    }
    if (node.replies.length > 0) {
      return {
        ...node,
        replies: addReplyToTree(node.replies, parentReplyId, reply),
      };
    }
    return node;
  });
}

function mergeKnownUsernames(topics: TopicPost[], existing: string[]): string[] {
  return [...new Set([...existing, ...collectUsernames(topics)])];
}

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case "SET_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
      };
    case "LOAD_STATE":
      return action.state;
    case "ADD_TOPIC": {
      const topics = [...state.topics, action.topic];
      return {
        ...state,
        topics,
        settings: {
          ...state.settings,
          knownUsernames: mergeKnownUsernames(topics, state.settings.knownUsernames),
        },
      };
    }
    case "ADD_REPLY": {
      const topics = state.topics.map((topic) => {
        if (topic.id !== action.target.topicId) return topic;
        return {
          ...topic,
          replies: addReplyToTree(
            topic.replies,
            action.target.parentReplyId,
            action.reply,
          ),
        };
      });
      return {
        ...state,
        topics,
        settings: {
          ...state.settings,
          knownUsernames: mergeKnownUsernames(topics, state.settings.knownUsernames),
        },
      };
    }
    case "MERGE_INIT_TOPICS": {
      const topics = [...state.topics, ...action.topics];
      return {
        ...state,
        topics,
        settings: {
          ...state.settings,
          knownUsernames: mergeKnownUsernames(topics, state.settings.knownUsernames),
        },
      };
    }
    case "MERGE_GENERATE_BATCH": {
      let topics = [...state.topics, ...action.batch.newTopics];
      for (const item of action.batch.replies) {
        topics = topics.map((topic) => {
          if (topic.id !== item.targetTopicId) return topic;
          return {
            ...topic,
            replies: addReplyToTree(topic.replies, item.parentReplyId, item.reply),
          };
        });
      }
      return {
        ...state,
        topics,
        settings: {
          ...state.settings,
          knownUsernames: mergeKnownUsernames(topics, state.settings.knownUsernames),
        },
      };
    }
    case "DELETE_TOPIC": {
      const topics = state.topics.filter((topic) => topic.id !== action.topicId);
      return {
        ...state,
        topics,
        settings: {
          ...state.settings,
          knownUsernames: mergeKnownUsernames(topics, state.settings.knownUsernames),
        },
      };
    }
    case "DELETE_REPLY": {
      const topics = state.topics.map((topic) => {
        if (topic.id !== action.topicId) return topic;
        return {
          ...topic,
          replies: deleteReplyFromTree(topic.replies, action.replyId),
        };
      });
      return {
        ...state,
        topics,
        settings: {
          ...state.settings,
          knownUsernames: mergeKnownUsernames(topics, state.settings.knownUsernames),
        },
      };
    }
    case "ADD_TOPIC_VARIANT": {
      const topics = state.topics.map((topic) =>
        topic.id === action.topicId
          ? addTopicVariant(topic, action.variant)
          : topic,
      );
      return {
        ...state,
        topics,
        settings: {
          ...state.settings,
          knownUsernames: mergeKnownUsernames(topics, state.settings.knownUsernames),
        },
      };
    }
    case "ADD_REPLY_VARIANT": {
      const topics = state.topics.map((topic) => {
        if (topic.id !== action.topicId) return topic;
        return {
          ...topic,
          replies: addReplyVariant(topic.replies, action.replyId, action.variant),
        };
      });
      return {
        ...state,
        topics,
        settings: {
          ...state.settings,
          knownUsernames: mergeKnownUsernames(topics, state.settings.knownUsernames),
        },
      };
    }
    case "SET_TOPIC_VARIANT": {
      const topics = state.topics.map((topic) =>
        topic.id === action.topicId
          ? setTopicVariantIndex(topic, action.index)
          : topic,
      );
      return { ...state, topics };
    }
    case "SET_REPLY_VARIANT": {
      const topics = state.topics.map((topic) => {
        if (topic.id !== action.topicId) return topic;
        return {
          ...topic,
          replies: setReplyVariantIndex(topic.replies, action.replyId, action.index),
        };
      });
      return { ...state, topics };
    }
    case "TOGGLE_HIDDEN_FROM_CONTEXT": {
      const topics = state.topics.map((topic) =>
        topic.id === action.topicId
          ? { ...topic, hiddenFromContext: !topic.hiddenFromContext }
          : topic,
      );
      return { ...state, topics };
    }
    case "CLEAR_BOARD":
      return { ...state, topics: [] };
    default:
      return state;
  }
}

interface BoardContextValue {
  state: BoardState;
  phase: ReturnType<typeof getBoardPhase>;
  loading: boolean;
  regeneratingNodeId: string | null;
  error: string | null;
  clearError: () => void;
  setSettings: (settings: Partial<BoardSettings>) => void;
  loadState: (state: BoardState) => void;
  clearBoard: () => void;
  addHumanTopic: (username: string, subject: string, content: string) => void;
  addHumanReply: (
    target: ReplyTarget,
    username: string,
    content: string,
  ) => void;
  deleteTopic: (topicId: string) => void;
  deleteReply: (topicId: string, replyId: string) => void;
  swipeTopic: (topicId: string, direction: -1 | 1) => void;
  swipeReply: (topicId: string, replyId: string, direction: -1 | 1) => void;
  regenerateNode: (ref: NodeRef) => Promise<void>;
  initializeBoard: (topicCount: number) => Promise<void>;
  generateBoard: (newTopicCount: number, newReplyCount: number) => Promise<void>;
  simulateReply: (topicId: string, parentReplyId: string | null) => Promise<void>;
  toggleHiddenFromContext: (topicId: string) => void;
}

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, undefined, loadState);
  const [loading, setLoading] = useState(false);
  const [regeneratingNodeId, setRegeneratingNodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phase = useMemo(() => getBoardPhase(state), [state]);

  useEffect(() => {
    const timer = window.setTimeout(() => saveState(state), 300);
    return () => window.clearTimeout(timer);
  }, [state]);

  const clearError = useCallback(() => setError(null), []);

  const runLlm = useCallback(
    async (runner: () => Promise<void>) => {
      setLoading(true);
      setError(null);
      try {
        await runner();
      } catch (err) {
        if (err instanceof PollinationsError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const runNodeRegeneration = useCallback(
    async (nodeId: string, runner: () => Promise<void>) => {
      setRegeneratingNodeId(nodeId);
      setError(null);
      try {
        await runner();
      } catch (err) {
        if (err instanceof PollinationsError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setRegeneratingNodeId(null);
      }
    },
    [],
  );

  const setSettings = useCallback((settings: Partial<BoardSettings>) => {
    dispatch({ type: "SET_SETTINGS", settings });
  }, []);

  const loadBoardState = useCallback((next: BoardState) => {
    dispatch({ type: "LOAD_STATE", state: next });
  }, []);

  const clearBoard = useCallback(() => {
    dispatch({ type: "CLEAR_BOARD" });
  }, []);

  const addHumanTopic = useCallback(
    (username: string, subject: string, content: string) => {
      const createdAt = new Date().toISOString();
      dispatch({
        type: "ADD_TOPIC",
        topic: {
          id: crypto.randomUUID(),
          createdAt,
          activeVariant: 0,
          hiddenFromContext: false,
          variants: [
            {
              username: username.trim(),
              subject: subject.trim(),
              content: content.trim(),
              source: "human",
              createdAt,
            },
          ],
          replies: [],
        },
      });
    },
    [],
  );

  const addHumanReply = useCallback(
    (target: ReplyTarget, username: string, content: string) => {
      const createdAt = new Date().toISOString();
      dispatch({
        type: "ADD_REPLY",
        target,
        reply: {
          id: crypto.randomUUID(),
          activeVariant: 0,
          variants: [
            {
              username: username.trim(),
              content: content.trim(),
              source: "human",
              createdAt,
            },
          ],
          replies: [],
        },
      });
    },
    [],
  );

  const deleteTopic = useCallback((topicId: string) => {
    dispatch({ type: "DELETE_TOPIC", topicId });
  }, []);

  const deleteReply = useCallback((topicId: string, replyId: string) => {
    dispatch({ type: "DELETE_REPLY", topicId, replyId });
  }, []);

  const swipeTopic = useCallback(
    (topicId: string, direction: -1 | 1) => {
      const topic = state.topics.find((t) => t.id === topicId);
      if (!topic) return;
      dispatch({
        type: "SET_TOPIC_VARIANT",
        topicId,
        index: topic.activeVariant + direction,
      });
    },
    [state.topics],
  );

  const swipeReply = useCallback(
    (topicId: string, replyId: string, direction: -1 | 1) => {
      const topic = state.topics.find((t) => t.id === topicId);
      const reply = topic ? findReply(topic.replies, replyId) : null;
      if (!reply) return;
      dispatch({
        type: "SET_REPLY_VARIANT",
        topicId,
        replyId,
        index: reply.activeVariant + direction,
      });
    },
    [state.topics],
  );

  const regenerateNode = useCallback(
    async (ref: NodeRef) => {
      const nodeId = ref.kind === "topic" ? ref.topicId : ref.replyId;
      await runNodeRegeneration(nodeId, async () => {
        if (ref.kind === "topic") {
          const topic = state.topics.find((t) => t.id === ref.topicId);
          if (!topic) throw new Error("Topic not found.");

          const prompt = buildRegenerateTopicPrompt(state.settings, topic);
          const raw = await chatCompletion(
            [{ role: "user", content: prompt }],
            { apiKey: state.settings.apiKey, model: state.settings.model },
          );
          const parsed = parseRegenerateTopicResponse(raw);
          dispatch({
            type: "ADD_TOPIC_VARIANT",
            topicId: ref.topicId,
            variant: {
              username: parsed.username,
              subject: parsed.subject,
              content: parsed.content,
              source: "llm",
              createdAt: new Date().toISOString(),
            },
          });
          return;
        }

        const topic = state.topics.find((t) => t.id === ref.topicId);
        if (!topic) throw new Error("Topic not found.");
        const reply = findReply(topic.replies, ref.replyId);
        if (!reply) throw new Error("Reply not found.");

        const parentReplyId = findReplyParentId(topic.replies, ref.replyId) ?? null;
        const prompt = buildRegenerateReplyPrompt(
          state.settings,
          topic,
          reply,
          parentReplyId,
        );
        const raw = await chatCompletion(
          [{ role: "user", content: prompt }],
          { apiKey: state.settings.apiKey, model: state.settings.model },
        );
        const parsed = parseRegenerateReplyResponse(raw);
        dispatch({
          type: "ADD_REPLY_VARIANT",
          topicId: ref.topicId,
          replyId: ref.replyId,
          variant: {
            username: parsed.username,
            content: parsed.content,
            source: "llm",
            createdAt: new Date().toISOString(),
          },
        });
      });
    },
    [runNodeRegeneration, state.settings, state.topics],
  );

  const initializeBoard = useCallback(
    async (topicCount: number) => {
      await runLlm(async () => {
        const prompt = buildInitPrompt(state.settings, topicCount);
        const raw = await chatCompletion(
          [{ role: "user", content: prompt }],
          { apiKey: state.settings.apiKey, model: state.settings.model },
        );
        const topics = parseInitResponse(raw, topicCount);
        dispatch({ type: "MERGE_INIT_TOPICS", topics });
      });
    },
    [runLlm, state.settings],
  );

  const generateBoard = useCallback(
    async (newTopicCount: number, newReplyCount: number) => {
      await runLlm(async () => {
        const contextTopics = topicsInBoardContext(state.topics);
        const prompt = buildGeneratePrompt(
          state.settings,
          contextTopics,
          newTopicCount,
          newReplyCount,
        );
        const raw = await chatCompletion(
          [{ role: "user", content: prompt }],
          { apiKey: state.settings.apiKey, model: state.settings.model },
        );
        const topicIds = new Set(contextTopics.map((t) => t.id));
        const replyIds = collectReplyIds(contextTopics);
        const batch = parseGenerateResponse(raw, topicIds, replyIds);
        dispatch({ type: "MERGE_GENERATE_BATCH", batch });
      });
    },
    [runLlm, state.settings, state.topics],
  );

  const toggleHiddenFromContext = useCallback((topicId: string) => {
    dispatch({ type: "TOGGLE_HIDDEN_FROM_CONTEXT", topicId });
  }, []);

  const simulateReply = useCallback(
    async (topicId: string, parentReplyId: string | null) => {
      await runLlm(async () => {
        const topic = state.topics.find((t) => t.id === topicId);
        if (!topic) throw new Error("Topic not found.");

        let parentReply: ReplyNode | null = null;
        if (parentReplyId) {
          parentReply = findReply(topic.replies, parentReplyId);
          if (!parentReply) throw new Error("Reply not found.");
        }

        const prompt = buildTargetedReplyPrompt(state.settings, topic, parentReply);
        const raw = await chatCompletion(
          [{ role: "user", content: prompt }],
          { apiKey: state.settings.apiKey, model: state.settings.model },
        );
        const reply = parseTargetedReplyResponse(raw);
        dispatch({
          type: "ADD_REPLY",
          target: { topicId, parentReplyId },
          reply,
        });
      });
    },
    [runLlm, state.settings, state.topics],
  );

  const value = useMemo(
    () => ({
      state,
      phase,
      loading,
      regeneratingNodeId,
      error,
      clearError,
      setSettings,
      loadState: loadBoardState,
      clearBoard,
      addHumanTopic,
      addHumanReply,
      deleteTopic,
      deleteReply,
      swipeTopic,
      swipeReply,
      regenerateNode,
      initializeBoard,
      generateBoard,
      simulateReply,
      toggleHiddenFromContext,
    }),
    [
      state,
      phase,
      loading,
      regeneratingNodeId,
      error,
      clearError,
      setSettings,
      loadBoardState,
      clearBoard,
      addHumanTopic,
      addHumanReply,
      deleteTopic,
      deleteReply,
      swipeTopic,
      swipeReply,
      regenerateNode,
      initializeBoard,
      generateBoard,
      simulateReply,
      toggleHiddenFromContext,
    ],
  );

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoardStore(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (!ctx) {
    throw new Error("useBoardStore must be used within BoardProvider");
  }
  return ctx;
}
