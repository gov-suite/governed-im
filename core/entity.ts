import * as attr from "./attribute.ts";
import {
  contextMgr as cm,
  inflect as infl,
  namespaceMgr as ns,
} from "./deps.ts";
import { Revision } from "./revision.ts";
import { Transient } from "./transient.ts";

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

export function isEntity(e: object): e is Entity {
  return "isEntity" in e;
}

export interface InboundRelationshipsManager {
  readonly inboundRels: InboundRelationship<Entity>[];
  readonly backRefs?: InboundRelationshipBackRef<Entity>[];
}

export function isInboundRelationshipsManager(
  e: object,
): e is InboundRelationshipsManager {
  return "inboundRels" in e;
}

export interface IdentityManager {
  readonly identity: attr.Identity;
  isIdentityAttr(attr: attr.Attribute): boolean;
}

export function isIdentityManager(e: object): e is IdentityManager {
  return "identity" in e;
}

export interface EntityContentConsumer<T extends Entity> {
  (eav: EntityAttrValues<T>): void;
}

export interface EntityContentSupplier<T extends Entity> {
  supplySeedContent(fn: EntityContentConsumer<T>): void;
}

export function isEntityContentSupplier<T extends Entity>(
  e: object,
): e is EntityContentSupplier<T> {
  return "supplySeedContent" in e;
}

export interface PersistentEntity
  extends Entity, IdentityManager, InboundRelationshipsManager {
  readonly isPersistentEntity: true;
}

export function isPersistentEntity(e: object): e is PersistentEntity {
  return "isPersistentEntity" in e;
}

export interface TransientEntity extends Entity, Transient {
  readonly isTransientEntity: true;
}

export function isTransientEntity(e: object): e is TransientEntity {
  return "isTransientEntity" in e;
}

export interface EntityAttrValues<T extends Entity> {
  readonly entity: T;
  readonly attrValues: attr.AttributeValue[];
}

export interface ExecEnvsEntityContent<T extends Entity> {
  readonly forExecEnvs?: cm.ExecutionEnvironments;
  supplyContent(fn: EntityContentConsumer<T>): void;
}
