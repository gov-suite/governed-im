import type * as core from "../core/mod.ts";

export type TypicalAttrFactory = core.EagsAttrFactory;

export interface AttributesSupplier {
  (entity: core.Entity): core.Attribute[];
}

export type TypicalAttributes = AttributesSupplier | core.Attribute[];
