import { YDocument } from '@jupyter/ydoc';
import { JSONExt, JSONObject } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';
import * as Y from 'yjs';

import {
  IDict,
  IGlueSessionSharedModel,
  IGlueSessionSharedModelChange
} from '../types';
import {
  IGlueSessionDataset,
  IGlueSessionLinks,
  IGlueSessionTabs
} from '../_interface/glue.schema';

export class GlueSessionSharedModel
  extends YDocument<IGlueSessionSharedModelChange>
  implements IGlueSessionSharedModel
{
  constructor() {
    super();

    this._contents = this.ydoc.getMap<IDict>('contents');
    this._dataset = this.ydoc.getMap<IDict>('dataset');
    this._links = this.ydoc.getMap<IDict>('links');
    this._tabs = this.ydoc.getMap<Y.Array<IDict>>('tabs');

    this.undoManager.addToScope(this._contents);

    this._contents.observe(this._contentsObserver);
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

  get contents(): JSONObject {
    return JSONExt.deepCopy(this._contents.toJSON());
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

  get datasetChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._datasetChanged;
  }

  get linksChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._linksChanged;
  }

  get tabsChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._tabsChanged;
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

  moveItem(name: string, fromTab: string, toTab: string): void {
    console.debug("Move item:", name, fromTab, toTab);
  }

  private _contentsObserver = (event: Y.YMapEvent<IDict>): void => {
    const contents = this.contents;
    this._changed.emit(contents);
    this._contentsChanged.emit(contents);
  };

  private _datasetObserver = (event: Y.YMapEvent<IDict>): void => {
    this._datasetChanged.emit({});
  };

  private _linksObserver = (event: Y.YMapEvent<IDict>): void => {
    this._linksChanged.emit({});
  };

  private _tabsObserver = (events: Y.YEvent<any>[]): void => {
    const tabsEvent = events.find(event => event.target === this._tabs) as Y.YMapEvent<any> | undefined;

    if (!tabsEvent) {
      return;
    }

    this._tabsChanged.emit({});
  };

  private _contents: Y.Map<IDict>;
  private _dataset: Y.Map<IDict>;
  private _links: Y.Map<IDict>;
  private _tabs: Y.Map<Y.Array<IDict>>;

  private _contentsChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
  private _datasetChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
  private _linksChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
  private _tabsChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
}
