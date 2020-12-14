import { safety } from "./deps.ts";

// when this interface is applied to an entity or attribute, then the thing is not stored
export interface Transient {
  readonly isTransient: true;
}

export const isTransient = safety.typeGuard<Transient>("isTransient");
