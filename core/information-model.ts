import type * as attr from "./attribute.ts";
import type { namespaceMgr as ns } from "./deps.ts";
import { safety } from "./deps.ts";
import type * as ent from "./entity.ts";

export interface InformationModelEdge {
  source: attr.Reference<ent.Entity>;
  ref: attr.Reference<ent.Entity>;
}

export interface InformationModelStructure {
  readonly isInformationModelStructure: true;
  readonly namespace: ns.Namespace;
  readonly entities: ent.Entity[];
  readonly edges: InformationModelEdge[];
  entity(name: ent.EntityName): ent.Entity | undefined;
}

export const isInformationModelStructure = safety.typeGuard<
  InformationModelStructure
>("isInformationModelStructure");

export interface InformationModelContentConsumer<T extends ent.Entity> {
  (imc: InformationModelContent, eeec: ent.ExecEnvsEntityContent<T>): void;
}

export interface InformationModelContent {
  readonly namespace: ns.Namespace;
  consumeContent(fn: InformationModelContentConsumer<ent.Entity>): void;
}

export interface InfoModelSourceCodeConsumer {
  (imsc: InformationModelSourceCode): void;
}

export interface InformationModelSourceCode {
  readonly namespace: ns.Namespace;
  consumeSourceCode(fn: InfoModelSourceCodeConsumer): void;
}

export interface InformationModel {
  readonly isInformationModel: true;
  readonly structure: InformationModelStructure;
  consumeContent(fn: InformationModelContentConsumer<ent.Entity>): void;
  consumeSourceCode(fn: InfoModelSourceCodeConsumer): void;
}

export const isInformationModel = safety.typeGuard<InformationModel>(
  "isInformationModel",
);
