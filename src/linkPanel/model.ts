import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';
import { IGlueSessionSharedModel } from '../types';

import {
  ILinkEditorModel,
  IAdvLinkCategories,
  IAdvLinkDescription,
  ComponentLinkType,
  IdentityLinkFunction
} from './types';
import { ILink } from '../_interface/glue.schema';

const ADVANCED_LINKS_URL = '/glue-jupyterlab/advanced-links';

/**
 * The link editor model.
 */
export class LinkEditorModel implements ILinkEditorModel {
  constructor(options: LinkEditorModel.IOptions) {
    this._sharedModel = options.sharedModel;
    this._sharedModel.linksChanged.connect(this.onLinksChanged, this);
    this._sharedModel.datasetChanged.connect(this.onDatasetsChanged, this);
    this._getAdvancedLinksCategories();
  }

  get sharedModel(): IGlueSessionSharedModel {
    return this._sharedModel;
  }

  /**
   * Getter and setter for datasets.
   */
  get currentDatasets(): [string, string] {
    return this._currentDatasets;
  }
  set currentDatasets(datasets: [string, string]) {
    this._currentDatasets = datasets;
    this._datasetsChanged.emit(this._currentDatasets);
  }

  /**
   * Replace one current dataset.
   */
  setCurrentDataset(index: number, value: string): void {
    this._currentDatasets[index] = value;
    this._datasetsChanged.emit(this._currentDatasets);
  }

  /**
   * A signal emits when current datasets changes
   */
  get currentDatasetsChanged(): ISignal<this, [string, string]> {
    return this._datasetsChanged;
  }

  /**
   * The identity links.
   */
  get identityLinks(): Map<string, ILink> {
    return this._identityLinks;
  }

  /**
   * The advanced links definitions.
   */
  get advLinkCategories(): IAdvLinkCategories {
    return this._advLinkCategories;
  }

  /**
   * The advanced links.
   */
  get advancedLinks(): Map<string, ILink> {
    return this._advancedLinks;
  }

  /**
   * A signal emitted when the links changed.
   */
  get linksChanged(): ISignal<this, void> {
    return this._linksChanged;
  }

  /**
   * A promise that resolve when the advanced links definitions are fetched.
   */
  get advLinksPromise(): Promise<IAdvLinkCategories> {
    return this._advLinksPromise.promise;
  }

  /**
   * Populate the advanced links definitions.
   */
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
      this._currentDatasets = [
        datasetsList.length > 1 ? datasetsList[0] : '',
        datasetsList.length > 1 ? datasetsList[1] : ''
      ];
      this._datasetsChanged.emit(this._currentDatasets);
    }
  }

  /**
   * Populates the identity and advanced links when the links have changed in the glue session model.
   */
  onLinksChanged(): void {
    this._identityLinks = new Map<string, ILink>();
    this._advancedLinks = new Map<string, ILink>();

    Object.entries(this._sharedModel?.links).forEach(
      ([linkName, link], idx) => {
        if (
          link._type === ComponentLinkType &&
          link.using?.function === IdentityLinkFunction
        ) {
          this._identityLinks.set(linkName, link);
        } else {
          this._advancedLinks.set(linkName, link);
        }
      }
    );
    this._linksChanged.emit();
  }

  private _sharedModel: IGlueSessionSharedModel;
  private _currentDatasets: [string, string] = ['', ''];
  private _datasetsChanged = new Signal<this, [string, string]>(this);
  private _advLinksPromise = new PromiseDelegate<IAdvLinkCategories>();
  private _advLinkCategories: IAdvLinkCategories = {};
  private _identityLinks = new Map<string, ILink>();
  private _advancedLinks = new Map<string, ILink>();
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
