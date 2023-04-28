import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';
import { IGlueSessionSharedModel } from '../types';

import {
  ComponentLinkType,
  IComponentLink,
  ILinkEditorModel,
  IComponentLinkInfo,
  IAdvancedLinkCategories
} from './types';

const AVAILABLE_ADVANCED_LINKS_URL = '/glue-lab/available-advanced-links';

export class LinkEditorModel implements ILinkEditorModel {
  constructor(options: LinkEditorModel.IOptions) {
    this._sharedModel = options.sharedModel;
    this._sharedModel.changed.connect(this.onSharedModelChanged, this);
    this._getAvailableAdvancedLinks();
  }

  get sharedModel(): IGlueSessionSharedModel {
    return this._sharedModel;
  }

  get relatedLinks(): Map<string, IComponentLinkInfo> {
    return this._relatedLinks;
  }

  get relatedLinksChanged(): ISignal<this, void> {
    return this._relatedLinksChanged;
  }

  get availableAdvancedLinks(): Promise<IAdvancedLinkCategories> {
    return this._availableAdvancedLinks.promise;
  }

  private async _getAvailableAdvancedLinks(): Promise<void> {
    // Make request to Jupyter API
    const settings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(
      settings.baseUrl,
      AVAILABLE_ADVANCED_LINKS_URL
    );

    let response: Response;
    try {
      response = await ServerConnection.makeRequest(requestUrl, {}, settings);
    } catch (error: any) {
      throw new ServerConnection.NetworkError(error);
    }

    const data = await response.json();

    if (!response.ok) {
      this._availableAdvancedLinks.reject(data.message);
      throw new ServerConnection.ResponseError(response, data.message);
    }

    const advancedLinksList: IAdvancedLinkCategories = {};
    Object.entries(data.data).forEach(([category, advancedLinks], idx) => {
      advancedLinksList[category] = advancedLinks as string[];
    });

    this._availableAdvancedLinks.resolve(advancedLinksList);
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
        this._relatedLinks.set(linkName, { origin: linkName });
        for (const dataName in dataset) {
          if (dataset[dataName].primary_owner.includes(link.frm[0])) {
            this._relatedLinks.set(linkName, {
              ...this._relatedLinks.get(linkName),
              src: {
                attribute: link.frm[0],
                dataset: dataName,
                label:
                  this._sharedModel.attributes[link.frm[0]].label || link.frm[0]
              }
            });
          } else if (dataset[dataName].primary_owner.includes(link.to[0])) {
            this._relatedLinks.set(linkName, {
              ...this._relatedLinks.get(linkName),
              dest: {
                attribute: link.to[0],
                dataset: dataName,
                label:
                  this._sharedModel.attributes[link.to[0]].label || link.to[0]
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
          this._relatedLinks.delete(linkName);
          console.error(`The ComponentLink ${linkName} is not valid`);
        }
      }
    );
    this._relatedLinksChanged.emit();
  }

  private _sharedModel: IGlueSessionSharedModel;
  private _availableAdvancedLinks =
    new PromiseDelegate<IAdvancedLinkCategories>();
  private _relatedLinks = new Map<string, IComponentLinkInfo>();
  private _relatedLinksChanged = new Signal<this, void>(this);
}

namespace LinkEditorModel {
  export interface IOptions {
    sharedModel: IGlueSessionSharedModel;
  }
}
