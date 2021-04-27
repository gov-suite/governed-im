import * as attr from "./attribute.ts";
import {
  contextMgr as cm,
  inflect as infl,
  namespaceMgr as ns,
  safety,
} from "./deps.ts";
import * as ent from "./entity.ts";
import { DEFAULT_REGISTRY_KEY_MODULE } from "./registry.ts";
import type { Revision } from "./revision.ts";

export type EnumerationKey = infl.InflectableValue;
export type EnumAttrFactory = attr.EagsAttrFactory;
export const enumName = ent.entityName;

export const enumKeyIdentifierComponentsCreator =
  infl.snakeCaseInflectorComponentsCreator;

export function enumKey(code: string): EnumerationKey {
  return infl.snakeCaseValue(code);
}

export interface EnumerationValues<T extends Enumeration> {
  readonly isEnumerationValues?: T;
}

export type EnumerationValuesKeys<
  T extends EnumerationValues<Enumeration>,
> = {
  [K in keyof T]: T[K] extends EnumerationValue ? K : never;
}[keyof T];

export function isEnumerationValues<T extends Enumeration>(
  o: unknown,
): o is EnumerationValues<T> {
  const isEnumerationValues = safety.typeGuard<EnumerationValues<T>>(
    "isEnumerationValues",
  );
  return isEnumerationValues(o);
}

export interface EnumerationValue {
  readonly id: number | string;
  readonly code?: string; // this is usually mapped from Typescript's constant name
  readonly value: string;
}

export function isEnumerationValue(o: unknown): o is EnumerationValue {
  if (o && typeof o === "object") {
    if ("id" in o && "value" in o) {
      const ev = o as EnumerationValue;
      return (ev.id !== undefined && ev.value !== undefined);
    }
  }
  return false;
}

export interface EnumAttribute<T extends Enumeration>
  extends attr.Relationship<T> {
  readonly isEnumRelationship: boolean;
}

export interface Enumeration extends ent.PersistentEntity {
  readonly isEnumeration: true;
  createRelationship<T extends Enumeration>(from: ent.Entity): EnumAttribute<T>;
  createDefaultableRelationship<T extends Enumeration>(
    from: ent.Entity,
    defaultValue: EnumerationValue,
  ): EnumAttribute<T>;
}

export function isEnumeration(e: ent.Entity): e is Enumeration {
  return "isEnumeration" in e;
}

export interface ScopedEnumeration extends Enumeration {
  readonly isScopedEnumeration: boolean;
  readonly isMutable: boolean;
  readonly namespace: EnumerationNamespace;
}

export interface EnumerationNamespace extends ns.Namespace {
  readonly isEnumerationNamespace: true;
  readonly scopeAttrs: attr.Attribute[];
}

export type EnumerationNamespaceGenerator = (
  entity: ent.Entity,
) => EnumerationNamespace;

export interface EnumerationAdvice {
  // "advice" comes from Aspect Oriented Programming terminology
  injectAttrsAfterIdentity: attr.Attribute[];
  appendAttrs: attr.Attribute[];
}
export type EnumerationAdviceGenerator = (
  entity: ent.Entity,
) => EnumerationAdvice;

export interface EnumerationParams {
  readonly attrFactory: attr.EagsAttrFactory;
  readonly mutable: boolean;
  readonly namespaceGen: EnumerationNamespaceGenerator;
  readonly adviceGen?: EnumerationAdviceGenerator;
}

export interface EnumerationConstructor {
  new (params: EnumerationParams): Enumeration;
}

export class DefaultEnumeration<T extends Enumeration>
  implements Enumeration, ScopedEnumeration, ent.EntityContentSupplier<T> {
  readonly introduced: Revision;
  readonly refactored?: Revision;
  readonly isEntity: true = true;
  readonly isPersistentEntity = true;
  readonly isEnumeration: true = true;
  readonly isAttributesCollection = true;
  readonly isScopedEnumeration: boolean;
  readonly isMutable: boolean;
  readonly identity: attr.Identity;
  readonly name: ent.EntityName;
  readonly attrs: attr.Attribute[];
  readonly inboundRels: ent.InboundRelationship<ent.Entity>[] = [];
  readonly eaValues: ent.EntityAttrValues<T>[];
  readonly namespace: EnumerationNamespace;
  readonly codeAttr: attr.Text;
  readonly valueAttr: attr.Text;

  constructor(
    name: ent.EntityName | string,
    readonly values: EnumerationValues<T>,
    readonly params: EnumerationParams,
  ) {
    this.name = typeof name === "string" ? ent.entityName(name) : name;
    this.introduced = params.attrFactory.defaultRevision();

    // if the values can be changed at runtime, we want to auto-generate IDs otherwise
    // we have traditional immutable (static) enums so we want to be able set IDs like
    // we can in Typescript and other languages
    this.isMutable = params.mutable;
    this.identity = params.mutable
      ? params.attrFactory.autoIdentityNative(this)
      : params.attrFactory.numericIdentity(this);

    this.isScopedEnumeration = true;
    this.namespace = params.namespaceGen(this);
    const namespaceAttrs = this.namespace.scopeAttrs;

    const advice = params.adviceGen ? params.adviceGen(this) : undefined;
    const injectAttrsAfterIdentity = advice
      ? advice.injectAttrsAfterIdentity
      : [];
    const appendAttrs = advice ? advice.appendAttrs : [];
    this.codeAttr = params.attrFactory.text(this, "code");
    this.valueAttr = params.attrFactory.text(this, "value");
    this.attrs = [
      this.identity,
      ...namespaceAttrs,
      ...injectAttrsAfterIdentity,
      this.codeAttr,
      this.valueAttr,
      ...appendAttrs,
    ];

    this.eaValues = [];
    for (const entry of Object.entries(values)) {
      // usually every property of an EnumerationValues instance should be
      // an instance of EnumerationValue
      const [enumCode, enumValue] = entry;
      if (isEnumerationValue(enumValue)) {
        const row = { ...enumValue };
        if (!row.code) row.code = enumCode;
        this.eaValues.push(
          {
            // deno-lint-ignore no-explicit-any
            entity: (this as any),
            attrValues: [
              this.identity.value(enumValue.id),
              this.valueAttr.value(enumValue.value),
              this.codeAttr.value(enumValue.code ? enumValue.code : enumCode),
            ],
          },
        );
      }
    }
  }

  isValidEnumerationValue(o: unknown): boolean {
    if (o && isEnumerationValue(o)) return this.isValidValue(o);
    return false;
  }

  isValidValue(ev: EnumerationValue): boolean {
    for (const entry of Object.values(this.values)) {
      if (ev === entry) return true;
    }
    return false;
  }

  supplySeedContent(fn: ent.EntityContentConsumer<T>): void {
    for (const eav of this.eaValues) {
      fn(eav);
    }
  }

  isIdentityAttr(attr: attr.Attribute): boolean {
    return attr === this.identity;
  }

  registryKeys(ctx: cm.Context): ent.EntityRegistryKeys {
    return [DEFAULT_REGISTRY_KEY_MODULE + ".entity.Enumeration"];
  }

  createRelationship<T extends Enumeration>(
    from: ent.Entity,
  ): EnumAttribute<T> {
    // deno-lint-ignore no-this-alias
    const self = this;
    // deno-lint-ignore no-explicit-any
    const selfRef = attr.reference<T>(this as any, this.identity);
    const attrFactory = this.params.attrFactory;
    const enumRel = new (class implements EnumAttribute<T> {
      readonly introduced: Revision = attrFactory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = true;
      readonly isEnumRelationship: boolean = true;
      readonly isDerived: boolean = false;
      readonly name: attr.AttributeName = attr.attributeNameReference(selfRef);
      readonly reference: attr.Reference<T> = selfRef;
      readonly parent = from;
      derive(
        newParent: ent.Entity,
        daOptions?: attr.DeriveAttributeOptions,
      ): attr.Attribute {
        return selfRef.attr.derive(
          newParent,
          { derivedFrom: this, ...daOptions },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return true;
      }
      registryKeys(ctx: cm.Context): attr.AttributeRegistryKeys {
        return [
          DEFAULT_REGISTRY_KEY_MODULE + ".attr.EnumAttribute",
          DEFAULT_REGISTRY_KEY_MODULE + ".attr.Relationship",
        ];
      }
      value(supplied: EnumerationValue): attr.AttributeValue {
        if (self.isValidEnumerationValue(supplied)) {
          return {
            attr: this,
            attrValue: supplied.id,
            isValid: true,
          };
        } else {
          return {
            attr: this,
            attrValue: supplied,
            isValid: false,
            error:
              `EnumerationValue "${supplied.value}" is not one of ${self.name.inflect()}`,
          };
        }
      }
    })();
    this.inboundRels.push({ from: from, fromAttr: enumRel, to: selfRef });
    return enumRel;
  }

  createDefaultableRelationship<T extends Enumeration>(
    from: ent.Entity,
    defaultValue: EnumerationValue,
  ): EnumAttribute<T> {
    // deno-lint-ignore no-this-alias
    const self = this;
    // deno-lint-ignore no-explicit-any
    const selfRef = attr.reference<T>(this as any, this.identity);
    const attrFactory = this.params.attrFactory;
    const enumRel = new (class implements EnumAttribute<T> {
      readonly introduced: Revision = attrFactory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = true;
      readonly isEnumRelationship: boolean = true;
      readonly isDerived: boolean = false;
      readonly name: attr.AttributeName = attr.attributeNameReference(selfRef);
      readonly reference: attr.Reference<T> = selfRef;
      readonly parent = from;
      derive(
        newParent: ent.Entity,
        daOptions?: attr.DeriveAttributeOptions,
      ): attr.Attribute {
        return selfRef.attr.derive(
          newParent,
          { derivedFrom: this, ...daOptions },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return true;
      }
      valueSupplier(ctx: cm.Context): attr.AttributeValueSupplier {
        return (
          ctx: cm.Context,
          attr: attr.Attribute,
        ): attr.AttributeValue => {
          return {
            attr: this,
            attrValue: defaultValue,
            isValid: true,
          };
        };
      }
      registryKeys(ctx: cm.Context): attr.AttributeRegistryKeys {
        return [
          DEFAULT_REGISTRY_KEY_MODULE + ".attr.EnumAttribute",
          DEFAULT_REGISTRY_KEY_MODULE + ".attr.Relationship",
        ];
      }
      value(
        supplied: EnumerationValue | undefined | null,
      ): attr.AttributeValue {
        if (!supplied) {
          return {
            attr: this,
            attrValue: defaultValue.id,
            isValid: true,
          };
        } else if (self.isValidEnumerationValue(supplied)) {
          return {
            attr: this,
            attrValue: supplied.id,
            isValid: true,
          };
        } else {
          return {
            attr: this,
            attrValue: supplied,
            isValid: false,
            error:
              `EnumerationValue "${supplied.value}" is not one of ${self.name.inflect()}`,
          };
        }
      }
    })();
    this.inboundRels.push({ from: from, fromAttr: enumRel, to: selfRef });
    return enumRel;
  }
}
