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
  IAdvLinkCategories,
  IAdvLinkDescription,
  IAdvancedLinkInfo,
  ILinkInfo,
  IAdvancedLink
} from './types';

const ADVANCED_LINKS_URL = '/glue-lab/advanced-links';

export class LinkEditorModel implements ILinkEditorModel {
  constructor(options: LinkEditorModel.IOptions) {
    this._sharedModel = options.sharedModel;
    this._sharedModel.changed.connect(this.onSharedModelChanged, this);
    this._getAdvancedLinks();
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

  get advLinkCategories(): IAdvLinkCategories {
    return this._advLinkCategories;
  }

  get advancedLinks(): Map<string, IAdvancedLinkInfo> {
    return this._advancedLinks;
  }

  get advancedLinksChanged(): ISignal<this, void> {
    return this._advancedLinksChanged;
  }

  get advLinksPromise(): Promise<IAdvLinkCategories> {
    return this._advLinksPromise.promise;
  }

  private async _getAdvancedLinks(): Promise<void> {
    // Make request to Jupyter API
    const settings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(settings.baseUrl, ADVANCED_LINKS_URL);

    let response: Response;
    try {
      response = await ServerConnection.makeRequest(requestUrl, {}, settings);
    } catch (error: any) {
      throw new ServerConnection.NetworkError(error);
    }

    const data = await response.json();

    if (!response.ok) {
      this._advLinksPromise.reject(data.message);
      throw new ServerConnection.ResponseError(response, data.message);
    }

    Object.entries(data.data).forEach(([category, link], idx) => {
      this._advLinkCategories[category] = link as IAdvLinkDescription[];
    });

    this._advLinksPromise.resolve(this._advLinkCategories);
  }

  onSharedModelChanged(): void {
    // const dataset = this._sharedModel.dataset;

    // Find origin of attributes in links.
    Object.entries(this._sharedModel?.links).forEach(
      ([linkName, link], idx) => {
        if (link._type === ComponentLinkType) {
          const identityLink = this._getIdentityLink(
            linkName,
            link as IComponentLink
          );
          if (identityLink) {
            this._relatedLinks.set(linkName, identityLink);
          }
        } else {
          const advancedLink = this._getAdvancedLink(
            linkName,
            link as IAdvancedLink
          );
          if (advancedLink) {
            this._advancedLinks.set(linkName, advancedLink);
          }
        }
      }
    );
    this._relatedLinksChanged.emit();
  }

  _getIdentityLink(
    linkName: string,
    link: IComponentLink
  ): IComponentLinkInfo | undefined {
    const dataset = this._sharedModel.dataset;
    let src: ILinkInfo | undefined;
    let dest: ILinkInfo | undefined;
    for (const dataName in dataset) {
      if (dataset[dataName].primary_owner.includes(link.frm[0])) {
        src = {
          attribute: link.frm[0],
          dataset: dataName,
          label: this._sharedModel.attributes[link.frm[0]].label || link.frm[0]
        };
      } else if (dataset[dataName].primary_owner.includes(link.to[0])) {
        dest = {
          attribute: link.to[0],
          dataset: dataName,
          label: this._sharedModel.attributes[link.to[0]].label || link.to[0]
        };
      }
    }

    if (!(src && dest)) {
      return undefined;
    } else {
      return {
        origin: linkName,
        src: src,
        dest: dest
      };
    }
  }

  _getAdvancedLink(
    linkName: string,
    link: IAdvancedLink
  ): IAdvancedLinkInfo | undefined {
    const cids1 = this._sharedModel.lists[link.cids1];
    const cids2 = this._sharedModel.lists[link.cids2];
    if (!(cids1 && cids2)) {
      return undefined;
    } else {
      return {
        origin: linkName,
        name: link._type,
        cids1: cids1.contents,
        cids2: cids2.contents,
        data1: link.data1,
        data2: link.data2
      };
    }
  }

  private _sharedModel: IGlueSessionSharedModel;
  private _advLinksPromise = new PromiseDelegate<IAdvLinkCategories>();
  private _advLinkCategories: IAdvLinkCategories = {};
  private _relatedLinks = new Map<string, IComponentLinkInfo>();
  private _relatedLinksChanged = new Signal<this, void>(this);
  private _advancedLinks = new Map<string, IAdvancedLinkInfo>();
  private _advancedLinksChanged = new Signal<this, void>(this);
}

namespace LinkEditorModel {
  export interface IOptions {
    sharedModel: IGlueSessionSharedModel;
  }
}
