import { VALID_EMOJIS } from "./constants";
import { Skull, Flame, Angry, Frown, Popcorn, LucideIcon } from "lucide-react";

export const DEFAULT_REACTIONS = VALID_EMOJIS;

export const REACTION_ICON_MAP: Record<string, LucideIcon> = {
  "😠": Angry,
  "🙄": Frown,
  "💀": Skull,
  "🍿": Popcorn,
  "🔥": Flame
};

export const getReactionTotal = (reactionsCount: Record<string, number>) =>
  Object.values(reactionsCount).reduce((sum, count) => sum + count, 0);

export const getReactionSummaryList = (reactionsCount: Record<string, number>) => {
  return Object.entries(reactionsCount)
    .filter(([, count]) => count > 0)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 3);
};

export const formatReactionSummary = (reactionsCount: Record<string, number>) => {
  const entries = getReactionSummaryList(reactionsCount);

  if (!entries.length) {
    return "No reactions yet";
  }

  return entries
    .map(([emoji, count]) => emoji + " " + count)
    .join("  ");
};
