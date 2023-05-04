import { ISignal } from '@lumino/signaling';
import { IGlueSessionSharedModel } from '../types';

export { IAdvancedLink, IComponentLink } from '../_interface/glue.schema';

export const ComponentLinkType = 'glue.core.component_link.ComponentLink';

/**
 * The link editor model.
 */
export interface ILinkEditorModel {
  relatedLinks: Map<string, IComponentLinkInfo>;
  relatedLinksChanged: ISignal<this, void>;
  advancedLinks: Map<string, IAdvancedLinkInfo>;
  advancedLinksChanged: ISignal<this, void>;
  sharedModel: IGlueSessionSharedModel | undefined;
  readonly advLinkCategories: IAdvLinkCategories;
  readonly advLinksPromise: Promise<IAdvLinkCategories>;
}

/**
 * The existing identity link.
 */
export interface IComponentLinkInfo {
  src: ILinkInfo;
  dest: ILinkInfo;
  origin: string;
}

/**
 * The attribute info of identity link.
 */
export interface ILinkInfo {
  attribute: string;
  dataset: string;
  label?: string;
}

/**
 * The necessary information to create an advanced link.
 */
export interface IAdvLinkDescription {
  function: string;
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

export interface IAdvancedLinkInfo {
  name: string;
  cids1: string[];
  cids2: string[];
  data1: string;
  data2: string;
  origin: string;
}
