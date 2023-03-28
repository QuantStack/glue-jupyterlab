import { MapChange, YDocument } from '@jupyter/ydoc';
import { JSONExt, JSONObject } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';
import * as Y from 'yjs';

import {
  IDict,
  IGlueSessionObjectChange,
  IGlueSessionSharedModel,
  IGlueSessionSharedModelChange
} from '../types';

export class GlueSessionSharedModel
  extends YDocument<IGlueSessionSharedModelChange>
  implements IGlueSessionSharedModel
{
  constructor() {
    super();

    this._contents = this.ydoc.getMap<Y.Map<any>>('contents');
    this.undoManager.addToScope(this._contents);
    this._contents.observeDeep(this._contentsObserver);
  }

  dispose(): void {
    super.dispose();
  }

  get contents(): JSONObject {
    return JSONExt.deepCopy(this._contents.toJSON());
  }

  get contentsChanged(): ISignal<IGlueSessionSharedModel, MapChange> {
    return this._contentsChanged;
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
    const changes: Array<{
      name: string;
      key: string;
      newValue: any;
    }> = [];

    events.forEach(event => {
      const name = event.target.get('name');
      if (name) {
        event.keys.forEach((change, key) => {
          changes.push({
            name,
            key,
            newValue: JSONExt.deepCopy(event.target.toJSON())
          });
        });
      }
    });

    this._changed.emit({ objectChange: changes });
    this._objectsChanged.emit({ objectChange: changes });
  };

  private _contents: Y.Map<any>;

  private _contentsChanged = new Signal<IGlueSessionSharedModel, MapChange>(
    this
  );
  private _objectsChanged = new Signal<
    IGlueSessionSharedModel,
    IGlueSessionObjectChange
  >(this);
}
