import { ISignal, Signal } from '@lumino/signaling';
import { IGlueSessionSharedModel } from '../types';

import {
  ComponentLinkType,
  IComponentLink,
  ILinkEditorModel,
  IRelatedLink
} from './types';

export class LinkEditorModel implements ILinkEditorModel {
  constructor(options: LinkEditorModel.IOptions) {
    this._sharedModel = options.sharedModel;
    this._sharedModel.changed.connect(this.onSharedModelChanged, this);
  }

  get sharedModel(): IGlueSessionSharedModel {
    return this._sharedModel;
  }

  get relatedLinks(): Map<string, IRelatedLink> {
    return this._relatedLinks;
  }

  get relatedLinksChanged(): ISignal<this, void> {
    return this._relatedLinksChanged;
  }

  onSharedModelChanged(): void {
    const dataset = this._sharedModel.dataset;

    // Find origin of attributes in links.
    Object.entries(this._sharedModel?.links).forEach(
      ([linkName, link], idx) => {
        if (link._type !== ComponentLinkType) {
          return;
        }
        link = link as IComponentLink;
        for (const dataName in dataset) {
          if (dataset[dataName].primary_owner.includes(link.frm[0])) {
            this._relatedLinks.set(linkName, {
              ...this._relatedLinks.get(linkName),
              src: {
                attribute: link.frm[0],
                dataset: dataName
              }
            });
          } else if (dataset[dataName].primary_owner.includes(link.to[0])) {
            this._relatedLinks.set(linkName, {
              ...this._relatedLinks.get(linkName),
              dest: {
                attribute: link.to[0],
                dataset: dataName
              }
            });
          }
        }

        // Error if the related link is not valid.
        if (
          !(
            this._relatedLinks.get(linkName)?.src &&
            this._relatedLinks.get(linkName)?.dest
          )
        ) {
          console.error(`The ComponentLink ${linkName} is not valid`);
        }
      }
    );
    this._relatedLinksChanged.emit();
  }

  private _sharedModel: IGlueSessionSharedModel;
  private _relatedLinks = new Map<string, IRelatedLink>();
  private _relatedLinksChanged = new Signal<this, void>(this);
}

namespace LinkEditorModel {
  export interface IOptions {
    sharedModel: IGlueSessionSharedModel;
  }
}
