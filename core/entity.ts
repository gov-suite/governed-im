import type * as attr from "./attribute.ts";
import {
  contextMgr as cm,
  inflect as infl,
  namespaceMgr as ns,
} from "./deps.ts";
import type { Revision } from "./revision.ts";
import type { Transient } from "./transient.ts";

export type EntityName = infl.PluralizableValue;
export type BackRefName = infl.PluralizableValue;

export const entityNameInflectorComponentsCreator =
  infl.snakeCaseInflectorComponentsCreator;

export function entityName(singular: string, plural?: string): EntityName {
  return plural
    ? infl.snakeCaseValueCustomPlural(singular, plural)
    : infl.snakeCaseValueAutoPlural(singular);
}

export function backRefName(singular: string, plural?: string): BackRefName {
  return plural
    ? infl.snakeCaseValueCustomPlural(singular, plural)
    : infl.snakeCaseValueAutoPlural(singular);
}

export interface InboundRelationship<T extends Entity> {
  from: Entity | EntityName;
  fromAttr: attr.Attribute;
  to: attr.Reference<T>;
}

export interface InboundRelationshipBackRef<T extends Entity> {
  name: BackRefName;
  rel: InboundRelationship<T>;
}

export type EntityRegistryKey = string;
export type EntityRegistryKeys = EntityRegistryKey[];

export interface Entity extends attr.AttributesCollection {
  readonly introduced: Revision;
  readonly refactored?: Revision;
  readonly isEntity: true;
  readonly name: EntityName;
  readonly namespace: ns.Namespace;
  registryKeys(ctx: cm.Context): EntityRegistryKeys;
}

export function isEntity(e: unknown): e is Entity {
  return e && typeof e === "object" && "isEntity" in e;
}

export interface InboundRelationshipsManager {
  readonly inboundRels: InboundRelationship<Entity>[];
  readonly backRefs?: InboundRelationshipBackRef<Entity>[];
}

export function isInboundRelationshipsManager(
  e: unknown,
): e is InboundRelationshipsManager {
  return e && typeof e === "object" && "inboundRels" in e;
}

export interface IdentityManager {
  readonly identity: attr.Identity;
  isIdentityAttr(attr: attr.Attribute): boolean;
}

export function isIdentityManager(e: unknown): e is IdentityManager {
  return e && typeof e === "object" && "identity" in e;
}

export interface EntityContentConsumer<T extends Entity> {
  (eav: EntityAttrValues<T>): void;
}

export interface EntityContentSupplier<T extends Entity> {
  supplySeedContent(fn: EntityContentConsumer<T>): void;
}

export function isEntityContentSupplier<T extends Entity>(
  e: unknown,
): e is EntityContentSupplier<T> {
  return e && typeof e === "object" && "supplySeedContent" in e;
}

export interface PersistentEntity
  extends Entity, IdentityManager, InboundRelationshipsManager {
  readonly isPersistentEntity: true;
}

export function isPersistentEntity(e: unknown): e is PersistentEntity {
  return e && typeof e === "object" && "isPersistentEntity" in e;
}

export interface TransientEntity extends Entity, Transient {
  readonly isTransientEntity: true;
}

export function isTransientEntity(e: unknown): e is TransientEntity {
  return e && typeof e === "object" && "isTransientEntity" in e;
}

export interface EntityAttrValues<T extends Entity> {
  readonly entity: T;
  readonly attrValues: attr.AttributeValue[];
}

export interface ExecEnvsEntityContent<T extends Entity> {
  readonly forExecEnvs?: cm.ExecutionEnvironments;
  supplyContent(fn: EntityContentConsumer<T>): void;
}
