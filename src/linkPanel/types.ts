import { ISignal } from '@lumino/signaling';
import { IGlueSessionSharedModel } from '../types';

export { IAdvancedLink, IComponentLink } from '../_interface/glue.schema';

export const ComponentLinkType = 'glue.core.component_link.ComponentLink';

export interface ILinkEditorModel {
  relatedLinks: Map<string, IRelatedLink>;
  relatedLinksChanged: ISignal<this, void>;
  sharedModel: IGlueSessionSharedModel | undefined;
}

export interface IRelatedLink {
  src?: ILinkOrigin;
  dest?: ILinkOrigin;
}

export interface ILinkOrigin {
  attribute: string;
  dataset: string;
}
