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
  IAdvancedLink,
  IDatasets
} from './types';

const ADVANCED_LINKS_URL = '/glue-lab/advanced-links';

/**
 * The link editor model.
 */
export class LinkEditorModel implements ILinkEditorModel {
  constructor(options: LinkEditorModel.IOptions) {
    this._sharedModel = options.sharedModel;
    this._sharedModel.linksChanged.connect(this.onLinksChanged, this);
    this._sharedModel.datasetChanged.connect(this.onDatasetsChanged, this);
    this._getAdvancedLinksCategories();

    this._currentDatasets = {
      first: '',
      second: ''
    };
  }

  get sharedModel(): IGlueSessionSharedModel {
    return this._sharedModel;
  }

  /**
   * Getter and setter for datasets.
   */
  get currentDatasets(): IDatasets {
    return this._currentDatasets;
  }
  set currentDatasets(datasets: IDatasets) {
    this._currentDatasets = datasets;
    this._datasetsChanged.emit(this._currentDatasets);
  }

  /**
   * Replace one current dataset.
   */
  setCurrentDataset(position: keyof IDatasets, value: string): void {
    this._currentDatasets[position] = value;
    this._datasetsChanged.emit(this._currentDatasets);
  }

  /**
   * A signal emits when current datasets changes
   */
  get currentDatasetsChanged(): ISignal<this, IDatasets> {
    return this._datasetsChanged;
  }

  get relatedLinks(): Map<string, IComponentLinkInfo> {
    return this._relatedLinks;
  }

  get advLinkCategories(): IAdvLinkCategories {
    return this._advLinkCategories;
  }

  get advancedLinks(): Map<string, IAdvancedLinkInfo> {
    return this._advancedLinks;
  }

  get linksChanged(): ISignal<this, void> {
    return this._linksChanged;
  }

  get advLinksPromise(): Promise<IAdvLinkCategories> {
    return this._advLinksPromise.promise;
  }

  private async _getAdvancedLinksCategories(): Promise<void> {
    // Make request to Jupyter API.
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

    Object.entries(data.data).forEach(([category, links]) => {
      this._advLinkCategories[category] = links as IAdvLinkDescription[];
    });

    this._advLinksPromise.resolve(this._advLinkCategories);
  }

  /**
   * Called when the datasets have changed in the glue session model.
   */
  onDatasetsChanged(): void {
    // Reset the current dataset, with empty values if there is less than 2 datasets.
    if (this._sharedModel.dataset) {
      const datasetsList = Object.keys(this._sharedModel.dataset);
      this._currentDatasets = {
        first: datasetsList.length > 1 ? datasetsList[0] : '',
        second: datasetsList.length > 1 ? datasetsList[1] : ''
      };
      this._datasetsChanged.emit(this._currentDatasets);
    }
  }

  /**
   * Called when the links have changed in the glue session model.
   */
  onLinksChanged(): void {
    this._relatedLinks = new Map<string, IComponentLinkInfo>();
    this._advancedLinks = new Map<string, IAdvancedLinkInfo>();

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
    this._linksChanged.emit();
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
    return {
      origin: linkName,
      name: link._type,
      cids1: link.cids1,
      cids2: link.cids2,
      data1: link.data1,
      data2: link.data2
    };
  }

  private _sharedModel: IGlueSessionSharedModel;
  private _currentDatasets: IDatasets;
  private _datasetsChanged = new Signal<this, IDatasets>(this);
  private _advLinksPromise = new PromiseDelegate<IAdvLinkCategories>();
  private _advLinkCategories: IAdvLinkCategories = {};
  private _relatedLinks = new Map<string, IComponentLinkInfo>();
  private _advancedLinks = new Map<string, IAdvancedLinkInfo>();
  private _linksChanged = new Signal<this, void>(this);
}

/**
 * A namespace for the link editor model.
 */
export namespace LinkEditorModel {
  /**
   * Options to build a link editor object.
   */
  export interface IOptions {
    sharedModel: IGlueSessionSharedModel;
  }
}
