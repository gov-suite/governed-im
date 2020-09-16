import * as core from "../core/mod.ts";
import type * as ta from "./attribute.ts";
import type {
  contextMgr as cm,
  namespaceMgr as ns,
} from "./deps.ts";
import type * as tpe from "./persistent-entity.ts";

export interface TypicalTransientEntityParams {
  readonly attrFactory: core.EagsAttrFactory;
  readonly namespace: ns.Namespace;
  readonly adviceGen: tpe.TypicalEntityAdviceGenerator;
}

export class TypicalTransientEntity implements core.TransientEntity {
  readonly introduced: core.Revision;
  readonly refactored?: core.Revision;
  readonly isTransient = true;
  readonly isEntity: true = true;
  readonly isTransientEntity = true;
  readonly isAttributesCollection = true;
  readonly namespace: ns.Namespace;
  readonly attrs: core.Attribute[];
  readonly attrsStartOfCustomPosn: number;
  protected attrsEndOfCustomPosn: number;

  constructor(
    readonly name: core.EntityName,
    readonly params: TypicalTransientEntityParams,
    attributes?: ta.TypicalAttributes,
  ) {
    this.introduced = params.attrFactory.defaultRevision();
    this.namespace = params.namespace;
    const advice = params.adviceGen(this);
    this.attrs = [
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

  registryKeys(ctx: cm.Context): core.EntityRegistryKeys {
    return [
      core.DEFAULT_REGISTRY_KEY_MODULE + ".entity.TypicalTransientEntity",
    ];
  }

  public text(
    name: string,
    required = true,
    maxLength = 255,
  ): core.Text {
    return this.params.attrFactory.text(this, name, { required, maxLength });
  }

  public encryptedText(
    name: string,
    required = true,
  ): core.EncryptedText {
    return this.params.attrFactory.encryptedText(this, name, { required });
  }

  public integer(name: string, required = true): core.Integer {
    return this.params.attrFactory.integer(this, name, { required });
  }

  public boolean(name: string, required = true): core.Boolean {
    return this.params.attrFactory.boolean(this, name, { required });
  }

  public dateTime(name: string, required = true): core.DateTime {
    return this.params.attrFactory.dateTime(this, name, { required });
  }

  public json(
    name: string,
    required = true,
  ): core.Json {
    return this.params.attrFactory.json(this, name, { required });
  }

  public jsonb(
    name: string,
    required = true,
  ): core.Jsonb {
    return this.params.attrFactory.jsonb(this, name, { required });
  }
}
