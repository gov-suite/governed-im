import * as core from "../core/mod.ts";
import type * as ta from "./attribute.ts";
import type { contextMgr as cm, namespaceMgr as ns } from "./deps.ts";

export interface TypicalEntityAdvice {
  // "advice" comes from Aspect Oriented Programming terminology
  injectAttrsAfterIdentity: core.Attribute[];
  injectAttrsBeforeAuditSection: core.Attribute[];
  appendAttrs: core.Attribute[];
}
export type TypicalEntityAdviceGenerator = (
  entity: core.Entity,
) => TypicalEntityAdvice;

export interface TypicalPersistentEntityParams {
  readonly attrFactory: core.EagsAttrFactory;
  readonly namespace: ns.Namespace;
  readonly adviceGen: TypicalEntityAdviceGenerator;
}

export class TypicalPersistentEntity
  implements core.PersistentEntity, core.EntityContentSupplier<core.Entity> {
  readonly introduced: core.Revision;
  readonly refactored?: core.Revision;
  readonly isEntity: true = true;
  readonly isPersistentEntity = true;
  readonly isAttributesCollection = true;
  readonly namespace: ns.Namespace;
  readonly identity: core.Identity;
  readonly attrs: core.Attribute[];
  readonly attrsStartOfCustomPosn: number;
  protected attrsEndOfCustomPosn: number;
  readonly inboundRels: core.InboundRelationship<core.Entity>[] = [];
  readonly backRefs: core.InboundRelationshipBackRef<core.Entity>[] = [];
  readonly seedContent: core.EntityAttrValues<core.Entity>[] = [];

  constructor(
    readonly name: core.EntityName,
    readonly params: TypicalPersistentEntityParams,
    attributes?: ta.TypicalAttributes,
    identity?: (e: core.Entity) => core.Identity,
  ) {
    this.introduced = params.attrFactory.defaultRevision();
    this.identity = identity
      ? identity(this)
      : params.attrFactory.autoIdentityNative(this);
    this.namespace = params.namespace;
    const advice = params.adviceGen(this);
    this.attrs = [
      this.identity,
      ...advice.injectAttrsAfterIdentity,
    ];
    this.attrsStartOfCustomPosn = this.attrs.length;
    this.attrsEndOfCustomPosn = this.attrsStartOfCustomPosn;
    if (attributes) {
      if (typeof attributes === "function") {
        this.attrs.push(...attributes(this));
      } else {
        this.attrs.push(...attributes);
      }
    }
    this.attrs.push(...advice.injectAttrsBeforeAuditSection);
    this.attrs.push(...advice.appendAttrs);
  }

  protected insertAttrs(...newAttrs: core.Attribute[]) {
    this.attrs.splice(this.attrsEndOfCustomPosn, 0, ...newAttrs);
    this.attrsEndOfCustomPosn += newAttrs.length;
  }

  isIdentityAttr(attr: core.Attribute): boolean {
    return attr === this.identity;
  }

  registryKeys(ctx: cm.Context): core.EntityRegistryKeys {
    return [core.DEFAULT_REGISTRY_KEY_MODULE + ".entity.TypicalEntity"];
  }

  supplySeedContent(fn: core.EntityContentConsumer<core.Entity>): void {
    for (const eaValues of this.seedContent) {
      fn(eaValues);
    }
  }

  addSeedValues<T extends core.Entity>(
    ...attrValues: core.AttributeValue[]
  ) {
    // deno-lint-ignore no-explicit-any
    this.seedContent.push({ entity: this as any, attrValues: attrValues });
  }

  createBelongsToRel<T extends core.Entity>(
    child: core.Entity,
    childAttrName: core.AttributeName | "auto" = "auto",
    backRefName?: core.BackRefName,
  ): core.BelongsTo<T> {
    // deno-lint-ignore no-explicit-any
    const selfRef = core.reference<T>(this as any, this.identity);
    const attrFactory = this.params.attrFactory;
    const belongsToRel = new (class implements core.BelongsTo<T> {
      readonly introduced = attrFactory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isRelationship = true;
      readonly isBelongsToRelationship = true;
      readonly isDerived = false;
      readonly name: core.AttributeName = childAttrName === "auto"
        ? core.attributeNameReference(selfRef)
        : childAttrName;
      readonly isBackReferenced = backRefName ? true : false;
      readonly backRefName: core.BackRefName = backRefName
        ? backRefName
        : selfRef.entity.name;
      readonly reference: core.Reference<T> = selfRef;
      readonly parent = child;
      derive(
        newParent: core.Entity,
        daOptions?: core.DeriveAttributeOptions,
      ): core.Attribute {
        return selfRef.attr.derive(
          newParent,
          { derivedFrom: this, ...daOptions },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return true;
      }
      registryKeys(ctx: cm.Context): core.AttributeRegistryKeys {
        // the primary registry key comes first, followed by inherited ones
        return [
          core.DEFAULT_REGISTRY_KEY_MODULE + ".attr.BelongsToRelationship",
          core.DEFAULT_REGISTRY_KEY_MODULE + ".attr.Relationship",
        ];
      }
      // deno-lint-ignore no-explicit-any
      value(supplied: any): core.AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
    const ir = { from: child, fromAttr: belongsToRel, to: selfRef };
    this.inboundRels.push(ir);
    if (backRefName) {
      this.backRefs.push({ name: backRefName, rel: ir });
    }
    return belongsToRel;
  }

  createExtendsRel<T extends core.Entity>(
    child: core.Entity,
    childAttrName: core.AttributeName | "auto" = "auto",
  ): core.Extends<T> {
    // deno-lint-ignore no-explicit-any
    const selfRef = core.reference<T>(this as any, this.identity);
    const attrFactory = this.params.attrFactory;
    const isExtends = new (class implements core.Extends<T> {
      readonly introduced = attrFactory.defaultRevision();
      readonly isAttribute: true = true;
      readonly isIdentity: true = true;
      readonly isRelationship = true;
      readonly isOneToOneToRelationship = true;
      readonly isExtendsRelationship = true;
      readonly isDerived = false;
      readonly name: core.AttributeName = childAttrName === "auto"
        ? core.attributeNameReference(selfRef)
        : childAttrName;
      readonly reference: core.Reference<T> = selfRef;
      readonly parent = child;
      derive(
        newParent: core.Entity,
        daOptions?: core.DeriveAttributeOptions,
      ): core.Attribute {
        return selfRef.attr.derive(
          newParent,
          { derivedFrom: this, ...daOptions },
        );
      }
      isRequired(ctx: cm.Context): boolean {
        return true;
      }
      registryKeys(ctx: cm.Context): core.AttributeRegistryKeys {
        return [
          core.DEFAULT_REGISTRY_KEY_MODULE + ".attr.Extends",
          core.DEFAULT_REGISTRY_KEY_MODULE + ".attr.Relationship",
        ];
      }
      // deno-lint-ignore no-explicit-any
      value(supplied: any): core.AttributeValue {
        return {
          attr: this,
          attrValue: supplied,
          isValid: true,
        };
      }
    })();
    const ir = { from: child, fromAttr: isExtends, to: selfRef };
    this.inboundRels.push(ir);
    return isExtends;
  }

  public createInheritedEntity(
    namespace: ns.Namespace,
    name: core.EntityName,
    isARelName: core.AttributeName | "auto",
    attrsSupplier: ta.AttributesSupplier,
    advice?: TypicalEntityAdviceGenerator,
  ): TypicalPersistentEntity {
    return new TypicalPersistentEntity(
      name,
      {
        ...this.params,
        namespace: namespace,
        adviceGen: advice ? advice : this.params.adviceGen,
      },
      attrsSupplier,
      (e: core.Entity): core.Identity => {
        return this.createExtendsRel(e, isARelName);
      },
    );
  }

  public createSelfRef<T extends core.Entity>(
    name?: core.AttributeName,
  ): core.SelfReference<T> {
    return this.params.attrFactory.selfRef(this, name);
  }

  // convenience wrappers for attributes
  public numericIdentity(): core.NumericIdentity {
    return this.params.attrFactory.numericIdentity(this);
  }

  public autoIdentityNative(): core.AutoIdentityNative {
    return this.params.attrFactory.autoIdentityNative(this);
  }

  public textIdentity(name: string): core.Identity {
    return this.params.attrFactory.textIdentity(this, name);
  }

  public text(
    name: string,
    required = true,
    maxLength = 255,
  ): core.Text {
    return this.params.attrFactory.text(
      this,
      name,
      { required, maxLength },
    );
  }

  public encryptedText(
    name: string,
    required = true,
  ): core.EncryptedText {
    return this.params.attrFactory.encryptedText(this, name, { required });
  }

  public uuidText(
    name: string,
    required = true,
  ): core.UuidText {
    return this.params.attrFactory.uuidText(this, name, { required });
  }

  public integer(name: string, required = true): core.Integer {
    return this.params.attrFactory.integer(this, name, { required });
  }

  public dateTime(name: string, required = true): core.DateTime {
    return this.params.attrFactory.dateTime(this, name, { required });
  }

  public boolean(name: string, required = true): core.Boolean {
    return this.params.attrFactory.boolean(this, name, { required });
  }

  public Json(
    name: string,
    required = true,
  ): core.Json {
    return this.params.attrFactory.json(this, name, { required });
  }

  public Jsonb(
    name: string,
    required = true,
  ): core.Jsonb {
    return this.params.attrFactory.jsonb(this, name, { required });
  }
}
