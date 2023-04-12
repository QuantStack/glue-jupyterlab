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
  IGlueSessionLoagLog,
  IGlueSessionTabs
} from '../_interface/glue.schema';

export class GlueSessionSharedModel
  extends YDocument<IGlueSessionSharedModelChange>
  implements IGlueSessionSharedModel
{
  constructor() {
    super();

    this._contents = this.ydoc.getMap<Y.Map<any>>('contents');
    this._tabs = this.ydoc.getMap<Y.Map<Array<IDict>>>('tabs');
    this._loadLog = this.ydoc.getMap<Y.Map<Array<IDict>>>('loadLog');
    this.undoManager.addToScope(this._contents);
    this._contents.observeDeep(this._contentsObserver);
    this._tabs.observeDeep(this._tabsObserver);
    this._loadLog.observeDeep(this._loadLogObserver);
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

  get loadLog(): IGlueSessionLoagLog {
    return JSONExt.deepCopy(this._loadLog.toJSON());
  }

  get contentsChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._contentsChanged;
  }

  get tabsChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._tabsChanged;
  }

  get loadLogChanged(): ISignal<IGlueSessionSharedModel, IDict> {
    return this._loadLogChanged;
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

  private _loadLogObserver = (events: Y.YEvent<any>[]): void => {
    if (events.length > 0) {
      this._loadLogChanged.emit({});
    }
  };

  private _contents: Y.Map<any>;
  private _tabs: Y.Map<Y.Map<Array<IDict>>>;
  private _loadLog: Y.Map<any>;

  private _contentsChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
  private _tabsChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
  private _loadLogChanged = new Signal<IGlueSessionSharedModel, IDict>(this);
}
