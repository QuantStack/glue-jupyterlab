import { YDocument } from '@jupyter/ydoc';
import { JSONExt, JSONObject } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';
import * as Y from 'yjs';

import {
  IDict,
  IGlueSessionSharedModel,
  IGlueSessionSharedModelChange
} from '../types';
import { IGlueSessionTabs } from '../_interface/glue.schema';

export class GlueSessionSharedModel
  extends YDocument<IGlueSessionSharedModelChange>
  implements IGlueSessionSharedModel
{
  constructor() {
    super();

    this._contents = this.ydoc.getMap<Y.Map<any>>('contents');
    this._tabs = this.ydoc.getMap<Y.Map<Array<IDict>>>('tabs');
    this.undoManager.addToScope(this._contents);
    this._contents.observeDeep(this._contentsObserver);
    this._tabs.observeDeep(this._tabsObserver);
  }

  dispose(): void {
    super.dispose();
  }

  get contents(): JSONObject {
    return JSONExt.deepCopy(this._contents.toJSON());
  }

  get tabs(): IGlueSessionTabs {
    return JSONExt.deepCopy(this._tabs.toJSON());
  }

  get contentsChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._contentsChanged;
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

  static create(): IGlueSessionSharedModel {
    return new GlueSessionSharedModel();
  }

  private _contentsObserver = (events: Y.YEvent<any>[]): void => {
    if (events.length > 0) {
      const contents = this.contents;
      this._changed.emit(contents);
      this._contentsChanged.emit(contents);
    }
  };

  private _tabsObserver = (events: Y.YEvent<any>[]): void => {
    if (events.length > 0) {
      this._tabsChanged.emit({});
    }
  };

  private _contents: Y.Map<any>;
  private _tabs: Y.Map<Y.Map<Array<IDict>>>;

  private _contentsChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
  private _tabsChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
}
