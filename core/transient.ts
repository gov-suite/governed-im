// when this interface is applied to an entity or attribute, then the thing is not stored
export interface Transient {
  readonly isTransient: true;
}

export function isTransient(c: any): c is Transient {
  return "isTransient" in c;
}
