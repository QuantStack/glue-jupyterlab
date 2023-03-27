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

    this._options = this.ydoc.getMap<Y.Map<any>>('options');
    this._objects = this.ydoc.getArray<Y.Map<any>>('objects');
    this._metadata = this.ydoc.getMap<string>('metadata');
    this.undoManager.addToScope(this._objects);

    this._objects.observeDeep(this._objectsObserver);
    this._metadata.observe(this._metaObserver);
    this._options.observe(this._optionsObserver);
    console.log('this.ydoc', this.ydoc);
  }

  dispose(): void {
    // this._objects.unobserveDeep(this._objectsObserver);
    // this._metadata.unobserve(this._metaObserver);
    // this._options.unobserve(this._optionsObserver);
    super.dispose();
  }

  get objects(): Array<any> {
    return this._objects.map(obj => JSONExt.deepCopy(obj.toJSON()));
  }

  get options(): JSONObject {
    return JSONExt.deepCopy(this._options.toJSON());
  }

  get metadata(): JSONObject {
    return JSONExt.deepCopy(this._metadata.toJSON());
  }

  get objectsChanged(): ISignal<
    IGlueSessionSharedModel,
    IGlueSessionObjectChange
  > {
    return this._objectsChanged;
  }

  get optionsChanged(): ISignal<IGlueSessionSharedModel, MapChange> {
    return this._optionsChanged;
  }

  get metadataChanged(): ISignal<IGlueSessionSharedModel, MapChange> {
    return this._metadataChanged;
  }

  objectExists(name: string): boolean {
    return Boolean(this._getObjectAsYMapByName(name));
  }

  getObjectByName(name: string): any | undefined {
    const obj = this._getObjectAsYMapByName(name);
    if (obj) {
      return JSONExt.deepCopy(obj.toJSON());
    }
    return undefined;
  }

  removeObjectByName(name: string): void {
    let index = 0;
    for (const obj of this._objects) {
      if (obj.get('name') === name) {
        break;
      }
      index++;
    }

    if (this._objects.length > index) {
      this.transact(() => {
        this._objects.delete(index);
      });
    }
  }

  addObject(value: any): void {
    this.addObjects([value]);
  }

  addObjects(value: Array<any>): void {
    this.transact(() => {
      value.map(obj => {
        if (!this.objectExists(obj.name)) {
          this._objects.push([new Y.Map(Object.entries(obj))]);
        } else {
          console.error('There is already an object with the name:', obj.name);
        }
      });
    });
  }

  updateObjectByName(name: string, key: string, value: any): void {
    const obj = this._getObjectAsYMapByName(name);
    if (!obj) {
      return;
    }
    this.transact(() => obj.set(key, value));
  }

  getOption(key: any): IDict | undefined {
    const content = this._options.get(key);
    if (!content) {
      return;
    }
    return JSONExt.deepCopy(content) as IDict;
  }

  setOption(key: any, value: IDict): void {
    this._options.set(key, value);
  }

  setOptions(options: IDict): void {
    for (const [key, value] of Object.entries(options)) {
      this._options.set(key, value);
    }
  }

  getMetadata(key: string): string | undefined {
    return this._metadata.get(key);
  }

  setMetadata(key: string, value: string): void {
    this._metadata.set(key, value);
  }

  removeMetadata(key: string): void {
    if (this._metadata.has(key)) {
      this._metadata.delete(key);
    }
  }

  static create(): IGlueSessionSharedModel {
    return new GlueSessionSharedModel();
  }

  private _getObjectAsYMapByName(name: string): Y.Map<any> | undefined {
    for (const obj of this._objects) {
      if (obj.get('name') === name) {
        return obj;
      }
    }
    return undefined;
  }

  private _objectsObserver = (events: Y.YEvent<any>[]): void => {
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

  private _metaObserver = (event: Y.YMapEvent<string>): void => {
    this._metadataChanged.emit(event.keys);
  };

  private _optionsObserver = (event: Y.YMapEvent<Y.Map<string>>): void => {
    this._optionsChanged.emit(event.keys);
  };

  private _objects: Y.Array<Y.Map<any>>;
  private _options: Y.Map<any>;
  private _metadata: Y.Map<string>;
  private _metadataChanged = new Signal<IGlueSessionSharedModel, MapChange>(
    this
  );
  private _optionsChanged = new Signal<IGlueSessionSharedModel, MapChange>(
    this
  );
  private _objectsChanged = new Signal<
    IGlueSessionSharedModel,
    IGlueSessionObjectChange
  >(this);
}
