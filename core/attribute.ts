import { contextMgr as cm, inflect as infl, valueMgr as vm } from "./deps.ts";
import { BackRefName, Entity, isIdentityManager } from "./entity.ts";
import { DEFAULT_REGISTRY_KEY_MODULE } from "./registry.ts";
import type { Revision } from "./revision.ts";

type RelationalColumnName = infl.InflectableValue;
type ObjectFieldName = infl.InflectableValue;

export interface AttributeName {
  relationalColumnName: RelationalColumnName;
  objectFieldName: ObjectFieldName;
}

export const attributeIdentifierComponentsCreator =
  infl.snakeCaseInflectorComponentsCreator;

export function attributeIdentifier(
  relColumnName: RelationalColumnName,
  objFieldName: ObjectFieldName = relColumnName,
): AttributeName {
  return new (class implements AttributeName {
    relationalColumnName: RelationalColumnName = relColumnName;
    objectFieldName: ObjectFieldName = objFieldName;
  })();
}

export function attributeName(
  relColumnName: string,
  objFieldName: string = relColumnName,
): AttributeName {
  return attributeIdentifier(
    infl.snakeCaseValue(relColumnName),
    infl.snakeCaseValue(objFieldName),
  );
}

export function attributeNameReference(ref: Reference<Entity>): AttributeName {
  return new (class implements AttributeName {
    relationalColumnName: RelationalColumnName = {
      inflect(): string {
        return ref.entity.name.singular.inflect() + "_id";
      },
      inflectorComponentsCreator: attributeIdentifierComponentsCreator,
    };
    objectFieldName: ObjectFieldName = {
      inflect(): string {
        return ref.entity.name.singular.inflect();
      },
      inflectorComponentsCreator: attributeIdentifierComponentsCreator,
    };
  })();
}

export type AttributeRegistryKey = string;
export type AttributeRegistryKeys = AttributeRegistryKey[];

export interface DeriveAttributeOptions {
  readonly name?: string | AttributeName;
  readonly derivedFrom?: Attribute;
}

export interface Attribute {
  readonly introduced: Revision;
  readonly refactored?: Revision;
  readonly isAttribute: true;
  readonly isRelationship: boolean;
  readonly parent: Entity;
  readonly name: AttributeName;
  readonly isDerived: boolean;
  readonly derivedFrom?: Attribute;
  derive(newParent: Entity, options?: DeriveAttributeOptions): Attribute;
  registryKeys(ctx: cm.Context): AttributeRegistryKeys;
  isRequired(ctx: cm.Context): boolean;
  valueSupplier?(ctx: cm.Context): AttributeValueSupplier;

  // deno-lint-ignore no-explicit-any
  value(supplied: any): AttributeValue;
}

export function isAttribute(o: unknown): o is Attribute {
  return o && typeof o === "object" && "isAttribute" in o;
}

export interface AttributesCollection {
  readonly isAttributesCollection: true;
  readonly attrs: Attribute[];
}

export function isAttributesCollection(o: unknown): o is AttributesCollection {
  return o && typeof o === "object" && "isAttributesCollection" in o;
}

export type AttrsStaticallyDeclaredInObject<T> = {
  [K in keyof T]: T[K] extends Attribute ? K : never;
}[keyof T];

export type StaticallyDeclaredAttrsRecord<T extends AttributesCollection> = {
  [A in AttrsStaticallyDeclaredInObject<T>]?: T[A] extends Text ? vm.TextValue
    : (T[A] extends Identity ? { itype?: T[A]; iv: vm.NumericValue }
      : // deno-lint-ignore no-explicit-any
      ((T[A] extends Relationship<any> ? vm.NumericValue
        : // deno-lint-ignore ban-types
        (T[A] extends Number ? vm.NumericValue : vm.Value))));
};

export interface AttributeValue {
  readonly attr: Attribute;
  // deno-lint-ignore no-explicit-any
  readonly attrValue: any;
  readonly isValid: boolean;
  readonly error?: string;
}

export function isAttributeValue(
  o: unknown,
): o is AttributeValue {
  return o && typeof o === "object" && "isAttributeValue" in o;
}

export interface AttributeValueSupplier {
  (ctx: cm.Context, attr: Attribute): AttributeValue;
}

export interface Identity extends Attribute {
  readonly isIdentity: true;
}

export function isIdentity(a: Attribute): a is Identity {
  return "isIdentity" in a;
}

export function isDerivedFromIdentity(a: Attribute): a is Identity {
  return a.isDerived && a.derivedFrom ? isIdentity(a.derivedFrom) : false;
}

export function isDerivedNameSameAsSource(a: Attribute): boolean {
  if (a.isDerived) {
    return a.name.relationalColumnName.inflect() ==
      a.derivedFrom!.name.relationalColumnName.inflect();
  }
  return false;
}

export interface NumericIdentity extends Identity {
  readonly isNumericIdentity: true;
}

export function isNumericIdentity(a: Attribute): a is NumericIdentity {
  return "isNumericIdentity" in a;
}

export interface AutoIdentity extends Identity {
  readonly isAutoIdentity: boolean;
}

export function isAutoIdentity(a: Attribute): a is AutoIdentity {
  return "isAutoIdentity" in a;
}

export interface AutoIdentityNative extends AutoIdentity {
  readonly isAutoIdentityNative: boolean;
}

export function isAutoIdentityNative(a: Attribute): a is AutoIdentityNative {
  return "isAutoIdentityNative" in a;
}

export interface TextIdentity extends Text, Identity {
  readonly isTextIdentity: true;
}

export function isTextIdentity(a: Attribute): a is TextIdentity {
  return "isTextIdentity" in a;
}

export interface Number extends Attribute {
  readonly isNumber: boolean;
}

export interface Integer extends Number {
  readonly isInteger: boolean;
}

export function isInteger(a: Attribute): a is Integer {
  return "isInteger" in a;
}

export interface Text extends Attribute {
  readonly isText: boolean;
  readonly minLength: number;
  readonly maxLength: number;
  readonly pattern?: RegExp;
  readonly format?: RegExp;
}
export function isText(a: Attribute): a is Text {
  return "isText" in a;
}

export interface EncryptedText extends Text {
  readonly isEncryptedText: boolean;
}

export function isEncryptedText(a: Attribute): a is EncryptedText {
  return "isEncryptedText" in a;
}

export interface Boolean extends Attribute {
  readonly isBoolean: boolean;
  readonly isDefaultBooleanValue?: boolean;
}

// deno-lint-ignore ban-types
export function isBoolean(a: Attribute): a is Boolean {
  return "isBoolean" in a;
}
export interface DelimitedTextList extends Text {
  readonly isTextDelimitedList: boolean;
}

export interface Date extends Attribute {
  readonly isTemporal: boolean;
  readonly isDate: boolean;
  readonly isDefaultToToday?: boolean;
}

export function isDate(a: Attribute): a is Date {
  return "isDate" in a;
}

export interface Time extends Attribute {
  readonly isTemporal: boolean;
  readonly isTime: boolean;
  readonly isDefaultToNow?: boolean;
}

export function isTime(a: Attribute): a is Time {
  return "isTime" in a;
}

export interface Json extends Attribute {
  readonly "isJson": boolean;
}

export function isJson(a: Attribute): a is Json {
  return "isJson" in a;
}

export interface Jsonb extends Attribute {
  readonly "isJsonb": boolean;
}

export function isJsonb(a: Attribute): a is Jsonb {
  return "isJsonb" in a;
}

export interface DateTime extends Date, Time {
  readonly isDateTime: boolean;
}

export function isDateTime(a: Attribute): a is DateTime {
  return "isDateTime" in a;
}

export function isDefaultToNow(a: Attribute): boolean {
  if (isDateTime(a)) {
    if (a.isDefaultToNow) return a.isDefaultToNow;
  }
  if (isDate(a)) {
    if (a.isDefaultToToday) return a.isDefaultToToday;
  }
  if (isTime(a)) {
    if (a.isDefaultToNow) return a.isDefaultToNow;
  }
  return false;
}

export function isDefaultBooleanValue(a: Attribute): boolean {
  if (isBoolean(a)) {
    if (a.isDefaultBooleanValue) return a.isDefaultBooleanValue;
  }
  return false;
}

export interface SelfReference<T extends Entity> extends Attribute {
  readonly isSelfReference: boolean;
}

export function isSelfReference<T extends Entity>(
  a: Attribute,
): a is SelfReference<T> {
  return "isSelfReference" in a;
}

export interface Reference<T extends Entity> {
  readonly entity: T;
  readonly attr: Attribute;
}

export function reference<T extends Entity>(
  entity: T,
  attr: Attribute,
): Reference<T> {
  return new class implements Reference<T> {
    readonly entity: T = entity;
    readonly attr = attr;
  }();
}

export interface Relationship<T extends Entity> extends Attribute {
  readonly isRelationship: boolean;
  readonly reference: Reference<T>;
}

export interface BelongsTo<T extends Entity> extends Relationship<T> {
  readonly isBelongsToRelationship: boolean;
  readonly isBackReferenced: boolean;
  readonly backRefName?: BackRefName;
}

export function isBelongsToRelationship<T extends Entity>(
  a: Attribute,
): a is BelongsTo<T> {
  return "isBelongsToRelationship" in a;
}

export interface OneToMany<T extends Entity> extends Relationship<T> {
  readonly isOneToManyToRelationship: boolean;
}

export interface ManyToOne<T extends Entity> extends Relationship<T> {
  readonly isManyToOneToRelationship: boolean;
}

export interface OneToOne<T extends Entity> extends Relationship<T> {
  readonly isOneToOneToRelationship: boolean;
}
export interface Extends<T extends Entity> extends Identity, OneToOne<T> {
  readonly isExtendsRelationship: boolean;
}

export function isExtendsRelationship<T extends Entity>(
  a: Attribute,
): a is Extends<T> {
  return "isExtendsRelationship" in a;
}

export interface EagsAttrFactorySupplier {
  readonly attrFactory: EagsAttrFactory;
}

export function isEagsAttrFactorySupplier(
  o: unknown,
): o is EagsAttrFactorySupplier {
  return o && typeof o === "object" && "attrFactory" in o;
}

export class EagsAttrFactory {
  public defaultRevision(): Revision {
    return { version: "1.0.0" };
  }

  public createdAt(
    parent: Entity,
    options?: { name?: string | AttributeName; derivedFrom?: Attribute },
  ): DateTime {
    // deno-lint-ignore no-this-alias
    const factory = this;
    const attrName = options?.name || attributeName("created_at");
    return new (class implements DateTime {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isTemporal: boolean = true;
      readonly isDate: boolean = true;
      readonly isTime: boolean = true;
      readonly isDateTime: boolean = true;
      readonly isDefaultToNow: boolean = true;
      readonly parent = parent;
      readonly name: AttributeName = typeof attrName === "string"
        ? attributeName(attrName)
        : attrName;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        return factory.createdAt(
          newParent,
          {
            name: daOptions?.name || this.name,
            derivedFrom: daOptions?.derivedFrom || this,
          },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return true;
      }
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [DEFAULT_REGISTRY_KEY_MODULE + ".attr.DateTime"];
      }
      // deno-lint-ignore no-explicit-any
      value(supplied: any): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
  }

  public updatedOn(
    parent: Entity,
    options?: { name?: string | AttributeName; derivedFrom?: Attribute },
  ): DateTime {
    // deno-lint-ignore no-this-alias
    const factory = this;
    const attrName = options?.name || attributeName("updated_on");
    return new (class implements DateTime {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isTemporal: boolean = true;
      readonly isDate: boolean = true;
      readonly isTime: boolean = true;
      readonly isDateTime: boolean = true;
      readonly name: AttributeName = typeof attrName === "string"
        ? attributeName(attrName)
        : attrName;
      readonly parent = parent;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        return factory.updatedOn(
          newParent,
          {
            name: daOptions?.name || this.name,
            derivedFrom: daOptions?.derivedFrom || this,
          },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return false;
      }
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [DEFAULT_REGISTRY_KEY_MODULE + ".attr.DateTime"];
      }

      // deno-lint-ignore no-explicit-any
      value(supplied: any): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
  }

  public numericIdentity(
    entity: Entity,
    options?: { derivedFrom?: Attribute },
  ): NumericIdentity {
    // deno-lint-ignore no-this-alias
    const factory = this;
    return new (class implements NumericIdentity {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isIdentity: true = true;
      readonly isNumericIdentity: true = true;
      readonly name: AttributeName = attributeNameReference({
        entity: entity,
        attr: this,
      });
      readonly parent = entity;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        return factory.integer(
          newParent,
          daOptions?.name || this.name,
          { derivedFrom: daOptions?.derivedFrom || this },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return true;
      }
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [DEFAULT_REGISTRY_KEY_MODULE + ".attr.NumericIdentity"];
      }
      value(supplied: number): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
  }

  public autoIdentityNative(
    entity: Entity,
    options?: { derivedFrom?: Attribute },
  ): AutoIdentityNative {
    // deno-lint-ignore no-this-alias
    const factory = this;
    return new (class implements AutoIdentityNative {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isIdentity: true = true;
      readonly isAutoIdentity: boolean = true;
      readonly isAutoIdentityNative: boolean = true;
      readonly name: AttributeName = attributeNameReference({
        entity: entity,
        attr: this,
      });
      readonly parent = entity;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        return factory.integer(
          newParent,
          daOptions?.name || this.name,
          { derivedFrom: daOptions?.derivedFrom || this },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return true;
      }
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [DEFAULT_REGISTRY_KEY_MODULE + ".attr.AutoIdentityNative"];
      }
      value(supplied: number): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
        // TODO consider returning the following:
        // return {
        //   attr: this,
        //   attrValue: null,
        //   isValid: false,
        //   error:
        //     `${this.name.relationalColumnName.inflect()} is an autoIdentity so value is not assignable`,
        // };
      }
    })();
  }

  public textIdentity(
    parent: Entity,
    name: string | AttributeName,
    options?: { derivedFrom?: Attribute },
  ): TextIdentity {
    // deno-lint-ignore no-this-alias
    const factory = this;
    return new (class implements Text, Identity {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isIdentity: true = true;
      readonly isTextIdentity: true = true;
      readonly isText: boolean = true;
      readonly name: AttributeName = typeof name === "string"
        ? attributeName(name)
        : name;
      readonly parent = parent;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        return factory.text(
          newParent,
          daOptions?.name || this.name,
          { derivedFrom: daOptions?.derivedFrom || this },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return true;
      }
      readonly minLength = 0;
      readonly maxLength = 16;
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [DEFAULT_REGISTRY_KEY_MODULE + ".attr.TextIdentity"];
      }
      value(supplied: string): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
  }

  public text(
    parent: Entity,
    name: string | AttributeName,
    options?: {
      required?: boolean;
      maxLength?: number;
      derivedFrom?: Attribute;
    },
  ): Text {
    // deno-lint-ignore no-this-alias
    const factory = this;
    return new (class implements Text {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isText: boolean = true;
      readonly name: AttributeName = typeof name === "string"
        ? attributeName(name)
        : name;
      readonly parent = parent;
      readonly minLength = 0;
      readonly maxLength = options?.maxLength || 255;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        return factory.text(
          newParent,
          daOptions?.name || this.name,
          { derivedFrom: daOptions?.derivedFrom || this },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return options ? (options.required ? true : false) : true;
      }
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [DEFAULT_REGISTRY_KEY_MODULE + ".attr.Text"];
      }
      value(supplied: string): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
  }

  public encryptedText(
    parent: Entity,
    name: string | AttributeName,
    options?: {
      required?: boolean;
      maxLength?: number;
      derivedFrom?: Attribute;
    },
  ): EncryptedText {
    // deno-lint-ignore no-this-alias
    const factory = this;
    return new (class implements EncryptedText {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isText: boolean = true;
      readonly isEncryptedText: boolean = true;
      readonly name: AttributeName = typeof name === "string"
        ? attributeName(name)
        : name;
      readonly parent = parent;
      readonly minLength = 0;
      readonly maxLength = options?.maxLength || 255;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        return factory.encryptedText(
          newParent,
          daOptions?.name || this.name,
          { derivedFrom: daOptions?.derivedFrom || this },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return options ? (options.required ? true : false) : true;
      }
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [DEFAULT_REGISTRY_KEY_MODULE + ".attr.EncryptedText"];
      }
      value(supplied: string): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
  }

  public integer(
    entity: Entity,
    name: string | AttributeName,
    options?: { required?: boolean; derivedFrom?: Attribute },
  ): Integer {
    // deno-lint-ignore no-this-alias
    const factory = this;
    return new (class implements Integer {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isIdentity: boolean = false;
      readonly isNumber: true = true;
      readonly isInteger: true = true;
      readonly isNumericIdentity: boolean = false;
      readonly name: AttributeName = typeof name === "string"
        ? attributeName(name)
        : name;
      readonly parent = entity;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        return factory.integer(
          newParent,
          daOptions?.name || this.name,
          { derivedFrom: daOptions?.derivedFrom || this },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return options ? (options.required ? true : false) : true;
      }
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [DEFAULT_REGISTRY_KEY_MODULE + ".attr.Integer"];
      }
      value(supplied: number): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
  }
  public boolean(
    entity: Entity,
    name: string | AttributeName,
    options?: { required?: boolean; derivedFrom?: Attribute },
    // deno-lint-ignore no-ban-types
  ): Boolean {
    // deno-lint-ignore no-this-alias
    const factory = this;
    return new (class implements Boolean {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isBoolean: boolean = true;
      readonly isDefaultBooleanValue: boolean = true;
      readonly name: AttributeName = typeof name === "string"
        ? attributeName(name)
        : name;
      readonly parent = entity;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        return factory.boolean(
          newParent,
          daOptions?.name || this.name,
          { derivedFrom: daOptions?.derivedFrom || this },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return options ? (options.required ? true : false) : true;
      }
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [DEFAULT_REGISTRY_KEY_MODULE + ".attr.Boolean"];
      }

      // deno-lint-ignore no-explicit-any
      value(supplied: any): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
  }

  public dateTime(
    parent: Entity,
    name: string | AttributeName,
    options?: { required?: boolean; derivedFrom?: Attribute },
  ): DateTime {
    // deno-lint-ignore no-this-alias
    const factory = this;
    return new (class implements DateTime {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isTemporal: boolean = true;
      readonly isDate: boolean = true;
      readonly isTime: boolean = true;
      readonly isDateTime: boolean = true;
      readonly isDefaultToNow: boolean = false;
      readonly parent = parent;
      readonly name: AttributeName = typeof name === "string"
        ? attributeName(name)
        : name;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        return factory.dateTime(
          newParent,
          daOptions?.name || this.name,
          { derivedFrom: daOptions?.derivedFrom || this },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return options ? (options.required ? true : false) : true;
      }
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [DEFAULT_REGISTRY_KEY_MODULE + ".attr.DateTime"];
      }
      // deno-lint-ignore no-explicit-any
      value(supplied: any): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
  }

  public json(
    parent: Entity,
    name: string | AttributeName,
    options?: { required?: boolean; derivedFrom?: Attribute },
  ): Json {
    // deno-lint-ignore no-this-alias
    const factory = this;
    return new (class implements Json {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isJson: boolean = true;
      readonly name: AttributeName = typeof name === "string"
        ? attributeName(name)
        : name;
      readonly parent = parent;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        return factory.json(
          newParent,
          daOptions?.name || this.name,
          { derivedFrom: daOptions?.derivedFrom || this },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return options ? (options.required ? true : false) : true;
      }
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [DEFAULT_REGISTRY_KEY_MODULE + ".attr.Json"];
      }
      value(supplied: string): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
  }

  public jsonb(
    parent: Entity,
    name: string | AttributeName,
    options?: { required?: boolean; derivedFrom?: Attribute },
  ): Jsonb {
    // deno-lint-ignore no-this-alias
    const factory = this;
    return new (class implements Jsonb {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isJsonb: boolean = true;
      readonly name: AttributeName = typeof name === "string"
        ? attributeName(name)
        : name;
      readonly parent = parent;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        return factory.jsonb(
          newParent,
          daOptions?.name || this.name,
          { derivedFrom: daOptions?.derivedFrom || this },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return options ? (options.required ? true : false) : true;
      }
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [DEFAULT_REGISTRY_KEY_MODULE + ".attr.Jsonb"];
      }
      value(supplied: string): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
  }

  selfRefDefaultAttrName(): AttributeName {
    return {
      objectFieldName: infl.snakeCaseValue("parent"),
      relationalColumnName: infl.snakeCaseValue("parent_id"),
    };
  }

  selfRef<T extends Entity>(
    parent: Entity,
    name: AttributeName = this.selfRefDefaultAttrName(),
    options?: { derivedFrom?: Attribute },
  ): SelfReference<T> {
    // deno-lint-ignore no-this-alias
    const factory = this;
    return new (class implements SelfReference<T> {
      readonly introduced: Revision = factory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship: boolean = false;
      readonly isDerived: boolean = options?.derivedFrom ? true : false;
      readonly derivedFrom?: Attribute = options?.derivedFrom;
      readonly isSelfReference: boolean = true;
      readonly name: AttributeName = name;
      readonly parent = parent;
      derive(newParent: Entity, daOptions?: DeriveAttributeOptions): Attribute {
        if (isIdentityManager(parent)) {
          return parent.identity.derive(newParent, daOptions);
        }
        return factory.integer(
          newParent,
          daOptions?.name || this.name,
          { derivedFrom: daOptions?.derivedFrom || this },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return false;
      }
      registryKeys(ctx: cm.Context): AttributeRegistryKeys {
        return [
          DEFAULT_REGISTRY_KEY_MODULE + ".attr.SelfReference",
        ];
      }

      // deno-lint-ignore no-explicit-any
      value(supplied: any): AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
  }
}
