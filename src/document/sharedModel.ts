import { YDocument, createMutex } from '@jupyter/ydoc';
import { JSONExt, JSONObject } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';

import * as Y from 'yjs';

import {
  IDict,
  IGlueSessionSharedModel,
  IGlueSessionSharedModelChange,
  IGlueSessionViewerTypes
} from '../types';
import {
  IGlueSessionAttributes,
  IGlueSessionDataset,
  IGlueSessionLinks,
  IGlueSessionTabs,
  ILink
} from '../_interface/glue.schema';

export const globalMutex = createMutex();

export class GlueSessionSharedModel
  extends YDocument<IGlueSessionSharedModelChange>
  implements IGlueSessionSharedModel
{
  constructor() {
    super();

    this._contents = this.ydoc.getMap<IDict>('contents');
    this._attributes = this.ydoc.getMap<IDict>('attributes');
    this._dataset = this.ydoc.getMap<IDict>('dataset');
    this._links = this.ydoc.getMap<IDict>('links');
    this._tabs = this.ydoc.getMap<Y.Map<IDict>>('tabs');

    this.undoManager.addToScope(this._contents);

    this._contents.observe(this._contentsObserver);
    this._attributes.observe(this._attributesObserver);
    this._dataset.observe(this._datasetObserver);
    this._links.observe(this._linksObserver);
    this._tabs.observeDeep(this._tabsObserver);
  }

  static create(): IGlueSessionSharedModel {
    return new GlueSessionSharedModel();
  }

  dispose(): void {
    super.dispose();
  }

  /**
   * Document version
   */
  readonly version: string = '1.0.0';

  get contents(): JSONObject {
    return JSONExt.deepCopy(this._contents.toJSON());
  }

  get attributes(): IGlueSessionAttributes {
    return JSONExt.deepCopy(this._attributes.toJSON());
  }

  get dataset(): IGlueSessionDataset {
    return JSONExt.deepCopy(this._dataset.toJSON());
  }

  get links(): IGlueSessionLinks {
    return JSONExt.deepCopy(this._links.toJSON());
  }

  get tabs(): IGlueSessionTabs {
    return JSONExt.deepCopy(this._tabs.toJSON());
  }

  get contentsChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._contentsChanged;
  }

  get attributesChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._attributesChanged;
  }

  get datasetChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._datasetChanged;
  }

  get linksChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._linksChanged;
  }

  get tabChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._tabChanged;
  }

  get tabsChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._tabsChanged;
  }

  get localStateChanged(): ISignal<
    IGlueSessionSharedModel,
    { keys: string[] }
  > {
    return this._localStateChanged;
  }

  getValue(key: string): IDict | undefined {
    const content = this._contents.get(key);
    if (!content) {
      return;
    }
    return JSONExt.deepCopy(content) as IDict;
  }

  setValue(key: any, value: IDict): void {
    this._contents.set(key, value);
  }

  addTab(): void {
    let idx = 1;
    let tabName = 'Tab 1';
    while (this._tabs.has(tabName)) {
      idx += 1;
      tabName = `Tab ${idx}`;
    }
    const newTab = new Y.Map<IDict>();
    this.transact(() => {
      this._tabs.set(tabName, newTab);
    }, false);
  }

  removeTab(name: string): void {
    if (this._tabs.has(name)) {
      this.transact(() => {
        this._tabs.delete(name);
      }, false);
    }
  }

  getTabNames(): string[] {
    return [...this._tabs.keys()];
  }

  getTabData(tabName: string): IDict<IGlueSessionViewerTypes> | undefined {
    const tab = this._tabs.get(tabName);
    if (tab) {
      return JSONExt.deepCopy(tab.toJSON());
    }
  }

  getTabItem(tabName: string, itemID: string): IGlueSessionViewerTypes {
    const tab = this._tabs.get(tabName);
    const view = tab?.get(itemID);
    return JSONExt.deepCopy(view ?? {});
  }

  setTabItem(
    tabName: string,
    itemID: string,
    data: IGlueSessionViewerTypes
  ): void {
    const tab = this._tabs.get(tabName);
    tab?.set(itemID, JSONExt.deepCopy(data));
  }

  updateTabItem(
    tabName: string,
    itemID: string,
    data: IGlueSessionViewerTypes
  ): void {
    const tab = this._tabs.get(tabName);

    if (tab) {
      const view = tab.get(itemID);

      if (view) {
        const content = { ...view, ...JSONExt.deepCopy(data) };
        tab.set(itemID, content);
      }
    }
  }

  removeTabItem(tabName: string, itemID: string): void {
    const tab = this._tabs.get(tabName);
    tab?.delete(itemID);
  }

  moveTabItem(itemID: string, fromTab: string, toTab: string): void {
    const tab1 = this._tabs.get(fromTab);
    const tab2 = this._tabs.get(toTab);

    if (tab1 && tab2) {
      const view = tab1.get(itemID);

      if (view) {
        const content = JSONExt.deepCopy(view);
        this.transact(() => {
          tab1.delete(itemID);
          tab2.set(itemID, content);
        }, false);
      }
    }
  }

  setSelectedTab(tab: number, emitter?: string): void {
    this.awareness.setLocalStateField('selectedTab', {
      value: tab,
      emitter: emitter
    });
    this._localStateChanged.emit({ keys: ['selectedTab'] });
  }

  getSelectedTab(): number | null {
    const state = this.awareness.getLocalState();

    if (!state || !state['selectedTab']) {
      return null;
    }

    return state['selectedTab'].value;
  }

  /**
   * Adds a link to the glue shared model.
   *
   * @param linkName - The link name.
   * @param link - The component or advanced link.
   */
  setLink(linkName: string, link: ILink): void {
    this._links.set(linkName, link as IDict);
  }

  /**
   * remove a link from the glue session model.
   *
   * @param linkName - the link name.
   */
  removeLink(linkName: string): void {
    this._links.delete(linkName);
  }

  private _contentsObserver = (event: Y.YMapEvent<IDict>): void => {
    const contents = this.contents;
    this._changed.emit(contents);
    this._contentsChanged.emit(contents);
  };
  private _attributesObserver = (event: Y.YMapEvent<IDict>): void => {
    this._attributesChanged.emit({});
  };

  private _datasetObserver = (event: Y.YMapEvent<IDict>): void => {
    this._datasetChanged.emit({});
  };

  private _linksObserver = (event: Y.YMapEvent<IDict>): void => {
    this._linksChanged.emit({});
  };

  private _tabsObserver = (events: Y.YEvent<any>[]): void => {
    events.forEach(event => {
      this._tabs.forEach((tab, name) => {
        if (event.target === tab) {
          this._tabChanged.emit({ tab: name, changes: event.changes });
          return;
        }
      });
    });

    const tabsEvent = events.find(event => event.target === this._tabs) as
      | Y.YMapEvent<any>
      | undefined;
    if (!tabsEvent) {
      return;
    }
    this._tabsChanged.emit({});
  };

  private _contents: Y.Map<IDict>;
  private _attributes: Y.Map<IDict>;
  private _dataset: Y.Map<IDict>;
  private _links: Y.Map<IDict>;
  private _tabs: Y.Map<Y.Map<IDict>>;

  private _contentsChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
  private _attributesChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
  private _datasetChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
  private _linksChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
  private _tabChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
  private _tabsChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
  private _localStateChanged = new Signal<
    IGlueSessionSharedModel,
    { keys: string[] }
  >(this);
}
