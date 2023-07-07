import { MapChange, StateChange, YDocument } from '@jupyter/ydoc';
import { DocumentRegistry, IDocumentWidget } from '@jupyterlab/docregistry';
import { JSONObject } from '@lumino/coreutils';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';
import {
  IGlueSessionAttributes,
  IGlueSessionDataset,
  IGlueSessionLinks,
  IGlueSessionTabs,
  ILink
} from './_interface/glue.schema';
import { ISessionContext } from '@jupyterlab/apputils';
import { SessionWidget } from './viewPanel/sessionWidget';
import { GridStackItem } from './viewPanel/gridStackItem';
import { IKernelConnection } from '@jupyterlab/services/lib/kernel/kernel';

export const DATASET_MIME = 'application/x-gluejupyter-dataset';

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
  contents: JSONObject;
  attributes: IGlueSessionAttributes;
  dataset: IGlueSessionDataset;
  links: IGlueSessionLinks;
  tabs: IGlueSessionTabs;
  contentsChanged: ISignal<IGlueSessionSharedModel, IDict>;
  datasetChanged: ISignal<IGlueSessionSharedModel, IDict>;
  linksChanged: ISignal<IGlueSessionSharedModel, IDict>;
  tabChanged: ISignal<IGlueSessionSharedModel, IDict>;
  tabsChanged: ISignal<IGlueSessionSharedModel, IDict>;
  localStateChanged: ISignal<IGlueSessionSharedModel, { keys: string[] }>;
  addTab(): void;
  removeTab(tabName: string): void;
  getTabNames(): string[];
  getTabData(tabName: string): IDict<IGlueSessionViewerTypes> | undefined;

  getTabItem(
    tabName: string,
    itemID: string
  ): IGlueSessionViewerTypes | undefined;
  setTabItem(
    tabName: string,
    itemID: string,
    data: IGlueSessionViewerTypes
  ): void;
  updateTabItem(
    tabName: string,
    itemID: string,
    data: IGlueSessionViewerTypes
  ): void;
  removeTabItem(tabName: string, itemID: string): void;
  moveTabItem(name: string, fromTab: string, toTab: string): void;

  setSelectedTab(tab: number, emitter?: string): void;
  getSelectedTab(): number | null;

  setLink(linkName: string, link: ILink): void;
  removeLink(linkName: string): void;
}

export interface IGlueSessionModel extends DocumentRegistry.IModel {
  isDisposed: boolean;
  sharedModel: IGlueSessionSharedModel;
  disposed: ISignal<any, void>;
}

export interface IGlueSessionWidget
  extends IDocumentWidget<Widget, IGlueSessionModel> {
  sessionWidget: SessionWidget;
}

export interface IRequestConfigDisplay {
  tabId: string;
  cellId?: string;
  gridItem?: GridStackItem;
}

export interface IControlPanelModel {
  sharedModel: IGlueSessionSharedModel | undefined;
  glueSessionChanged: ISignal<IControlPanelModel, IGlueSessionWidget | null>;
  currentSessionPath: string | undefined;
  selectedDataset: string | null;
  selectedDatasetChanged: ISignal<IControlPanelModel, void>;
  tabsChanged: ISignal<IControlPanelModel, void>;
  currentSessionWidget: IGlueSessionWidget | null;
  displayConfigRequested: ISignal<IControlPanelModel, IRequestConfigDisplay>;
  clearConfigRequested: ISignal<IControlPanelModel, void>;
  getTabs(): IGlueSessionTabs;
  displayConfig(args: IRequestConfigDisplay): void;
  clearConfig(): void;
  currentSessionContext(): ISessionContext | undefined;
  currentSessionKernel(): IKernelConnection | undefined;
}

export type IGlueSessionViewerTypes = ValueOf<IGlueSessionTabs>[0];

export type DashboardCellView = {
  /**
   * If cell output+widget are visible in the layout.
   */
  hidden?: boolean;
  /**
   * Logical row position.
   */
  row?: number;
  /**
   * Logical column position.
   */
  col?: number;
  /**
   * Logical width.
   */
  width?: number;
  /**
   * Logical height.
   */
  height?: number;
  /**
   * Lock item.
   */
  locked?: boolean;
};

export interface ILoadLog {
  path: string;
}
