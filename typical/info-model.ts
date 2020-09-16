import * as core from "../core/mod.ts";
import type * as tic from "./content.ts";
import type { namespaceMgr as ns } from "./deps.ts";
import type * as tpe from "./persistent-entity.ts";
import type * as tte from "./transient-entity.ts";

export interface TypicalInfoModelStructParams {
  readonly entityParams: tpe.TypicalPersistentEntityParams;
  readonly viewParams: tte.TypicalTransientEntityParams;
  readonly storedProcParams: tte.TypicalTransientEntityParams;
  readonly storedFuncParams: tte.TypicalTransientEntityParams;
  readonly typeDefnParams: tte.TypicalTransientEntityParams;
  readonly enumParams: core.EnumerationParams;
  readonly prependEntities: core.Entity[];
  readonly appendEntities: core.Entity[];
}

export abstract class TypicalInfoModelStructure
  implements core.InformationModelStructure {
  readonly isInformationModelStructure = true;
  protected isFinalized = false;
  abstract readonly namespace: ns.Namespace;
  abstract readonly entities: core.Entity[];
  readonly edges: core.InformationModelEdge[] = [];
  readonly entityByIdentifier = new Map<core.EntityName, core.Entity>();

  constructor(readonly params: TypicalInfoModelStructParams) {
    // be sure to call finalize() after constructing subclasses
  }

  protected finalize() {
    if (this.isFinalized) return;

    for (const entity of this.entities) {
      this.entityByIdentifier.set(entity.name, entity);
    }

    for (const entity of this.entities) {
      if (!core.isInboundRelationshipsManager(entity)) continue;
      for (const rel of entity.inboundRels) {
        let relEntity: core.Entity;
        if (core.isEntity(rel.from)) {
          relEntity = rel.from;
        } else {
          const identifier = rel.from as core.EntityName;
          const value = this.entityByIdentifier.get(identifier);
          if (value) {
            relEntity = value;
          } else {
            console.error(
              `Unable to find ${entity.name.inflect()} in relationship ${rel.from.singular.inflect()}.${rel.fromAttr.name.relationalColumnName.inflect()}`,
            );
            continue;
          }
        }
        // for some reason, Deno Lint believes this code is unreachable.
        // deno-lint-ignore no-unreachable
        this.edges.push({
          source: { entity: relEntity, attr: rel.fromAttr },
          ref: rel.to,
        });
      }
    }

    this.isFinalized = true;
  }

  entity(name: core.EntityName): core.Entity | undefined {
    return this.entityByIdentifier.get(name);
  }
}

export abstract class TypicalInformationModel implements core.InformationModel {
  readonly isInformationModel = true;
  abstract readonly structure: TypicalInfoModelStructure;
  readonly #content: tic.TypicalInfoModelContent[] = [];
  readonly #code: core.InformationModelSourceCode[] = [];

  constructor() {
  }

  protected addContent(timc: tic.TypicalInfoModelContent): void {
    this.#content.push(timc);
  }

  consumeContent(fn: core.InformationModelContentConsumer<core.Entity>): void {
    for (const c of this.#content) {
      c.consumeContent(fn);
    }
  }

  protected addCode(imcs: core.InformationModelSourceCode): void {
    // this.#code.push(imcs);
  }

  consumeSourceCode(fn: core.InfoModelSourceCodeConsumer): void {
    for (const codeConstructor of this.#code) {
      fn(codeConstructor);
    }
  }
}
