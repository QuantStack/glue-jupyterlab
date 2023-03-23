import { MapChange, StateChange, YDocument } from '@jupyter/ydoc';
import { DocumentRegistry, IDocumentWidget } from '@jupyterlab/docregistry';
import { JSONObject } from '@lumino/coreutils';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

export interface IDict<T = any> {
  [key: string]: T;
}

export type ValueOf<T> = T[keyof T];

export interface IGlueSessionObjectChange {
  objectChange?: Array<any>;
}

export interface IGlueSessionSharedModelChange {
  contextChange?: MapChange;
  contentChange?: MapChange;
  objectChange?: Array<{
    name: string;
    key: string;
    newValue: any;
  }>;
  optionChange?: MapChange;
  stateChange?: StateChange<any>[];
}

export interface IGlueSessionSharedModel
  extends YDocument<IGlueSessionSharedModelChange> {
  objects: Array<any>;
  options: JSONObject;
  metadata: JSONObject;
}

export interface IGlueSessionModel extends DocumentRegistry.IModel {
  isDisposed: boolean;
  sharedModel: IGlueSessionSharedModel;
  disposed: ISignal<any, void>;
}

export type IGlueCanvasWidget = IDocumentWidget<Widget, IGlueSessionModel>;

export interface IControlPanelModel {
  sharedModel: IGlueSessionSharedModel | undefined;
}
