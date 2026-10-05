/** Drizzle envuelve el error de pg: el código puede venir en err o en err.cause. */
export const isUniqueViolation = (err: unknown): boolean => {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
};