let counter = 0;

/** Short, collision-safe id for stops, days and trips. */
export function newId(prefix: string): string {
  counter = (counter + 1) % 100000;
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}${counter.toString(36)}`;
}
