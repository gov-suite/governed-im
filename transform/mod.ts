import {
  artfPersist as ap,
  contextMgr as cm,
  specModule as sm,
} from "./deps.ts";
import * as core from "../core/mod.ts";

export interface InfoModelTransformer {
  readonly isInfoModelTransformer: true;
  transform(ctx: cm.Context): void;
}

export interface InfoModelTransformerOptions {
  readonly isInfoModelTransformerOptions: true;
  readonly spec: sm.Specification<core.InformationModel>;
  readonly model: core.InformationModel;
  readonly persist: ap.PersistenceHandler;
}

export interface RdbmsModelTransformerDialectOptions {
  readonly isRdbmsModelTransformerDialectOptions: true;
}

export interface InfoModelTransformerConstructor {
  new (options: InfoModelTransformerOptions): InfoModelTransformer;
}
