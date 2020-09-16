import * as core from "../core/mod.ts";
import {
  artfPersist as ap,
  contextMgr as cm,
  inflect as infl,
  namespaceMgr as ns,
} from "./deps.ts";
import type * as typIM from "./info-model.ts";

export abstract class TypicalInfoModelContent
  implements core.InformationModelContent {
  #content: Map<
    infl.InflectableValue,
    [cm.ExecutionEnvironments, core.EntityAttrValues<core.Entity>[]]
  > = new Map();

  constructor(readonly structure: typIM.TypicalInfoModelStructure) {
    for (const entity of structure.entities) {
      if (core.isEntityContentSupplier<core.Entity>(entity)) {
        entity.supplySeedContent(
          (eav: core.EntityAttrValues<core.Entity>): void => {
            this.addAttrValues(cm.ctxFactory.envAll, eav);
          },
        );
      }
    }
  }

  protected addAttrValues<T extends core.Entity>(
    ee: cm.ExecutionEnvironments,
    eav: core.EntityAttrValues<T>,
  ) {
    let eaEntry = this.#content.get(ee.environmentsName);
    if (!eaEntry) {
      eaEntry = [ee, []];
      this.#content.set(ee.environmentsName, eaEntry);
    }
    eaEntry[1].push(eav);
  }

  protected addContent<T extends core.Entity>(
    ee: cm.ExecutionEnvironments,
    entity: T,
    ...attrValues: core.AttributeValue[]
  ) {
    this.addAttrValues(ee, { entity: entity, attrValues: attrValues });
  }

  protected addContentMultiple<T extends core.Entity>(
    ee: cm.ExecutionEnvironments,
    entity: T,
    ...attrValuesList: core.AttributeValue[][]
  ) {
    for (const attrValues of attrValuesList) {
      this.addAttrValues(ee, { entity: entity, attrValues: attrValues });
    }
  }

  get namespace(): ns.Namespace {
    return this.structure.params.entityParams.namespace;
  }

  consumeContent(
    imccFN: core.InformationModelContentConsumer<core.Entity>,
  ): void {
    for (const eeAndEaAttrValues of this.#content.values()) {
      const eeec = new class
        implements
          core.ExecEnvsEntityContent<core.Entity>,
          ap.PersistenceDestinationSupplier {
        readonly forExecEnvs: cm.ExecutionEnvironments = eeAndEaAttrValues[0];
        readonly isPersistenceDestinationSupplier: true = true;
        readonly persistDestAs: ap.PersistenceDestAs = {
          persistAsName: "content-" +
            this.forExecEnvs.environmentsName.inflect(),
          persistOptions: {
            appendIfExists: true,
          },
        };
        supplyContent(
          eccFN: core.EntityContentConsumer<core.Entity>,
        ): void {
          for (const eav of eeAndEaAttrValues[1]) {
            eccFN(eav);
          }
        }
      }();
      imccFN(this, eeec);
    }
  }
}
