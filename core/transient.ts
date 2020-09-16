// when this interface is applied to an entity or attribute, then the thing is not stored
export interface Transient {
  readonly isTransient: true;
}

export function isTransient(c: unknown): c is Transient {
  return c && typeof c === "object" && "isTransient" in c;
}
