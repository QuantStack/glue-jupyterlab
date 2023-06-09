import { ISignal } from '@lumino/signaling';
import { IGlueSessionSharedModel } from '../types';
import { ILink } from '../_interface/glue.schema';

export { ILink } from '../_interface/glue.schema';

export const ComponentLinkType = 'glue.core.component_link.ComponentLink';
export const IdentityLinkFunction = 'glue.core.link_helpers.identity';

export const IdentityLinkUsing = {
  _type: 'types.FunctionType',
  function: IdentityLinkFunction
};

export const IDatasetsKeys = ['first', 'second'] as (keyof IDatasets)[];
/**
 * The link editor model.
 */
export interface ILinkEditorModel {
  currentDatasets: IDatasets;
  setCurrentDataset(position: keyof IDatasets, value: string): void;
  readonly currentDatasetsChanged: ISignal<this, IDatasets>;
  readonly identityLinks: Map<string, ILink>;
  readonly advancedLinks: Map<string, ILink>;
  readonly linksChanged: ISignal<this, void>;
  readonly sharedModel: IGlueSessionSharedModel | undefined;
  readonly advLinkCategories: IAdvLinkCategories;
  readonly advLinksPromise: Promise<IAdvLinkCategories>;
}

/**
 * The necessary information to create an advanced link.
 */
export interface IAdvLinkDescription {
  function: string;
  _type: string;
  display: string;
  description: string;
  labels1: string[];
  labels2: string[];
}

/**
 * The available advanced links by category.
 */
export interface IAdvLinkCategories {
  [category: string]: IAdvLinkDescription[];
}

/**
 * Definition of the selected datasets.
 */
export interface IDatasets {
  first: string;
  second: string;
}
