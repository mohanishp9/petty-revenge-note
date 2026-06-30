export const DEFAULT_REACTIONS = ["😂", "😡", "😳", "😭"] as const;

export const getReactionTotal = (reactionsCount: Record<string, number>) =>
  Object.values(reactionsCount).reduce((sum, count) => sum + count, 0);

export const formatReactionSummary = (reactionsCount: Record<string, number>) => {
  const entries = Object.entries(reactionsCount)
    .filter(([, count]) => count > 0)
    .sort(([, countA], [, countB]) => countB - countA);

  if (!entries.length) {
    return "No reactions yet";
  }

  return entries
    .slice(0, 3)
    .map(([emoji, count]) => `${emoji} ${count}`)
    .join("  ");
};
