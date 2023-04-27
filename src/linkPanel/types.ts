import { ISignal } from '@lumino/signaling';
import { IGlueSessionSharedModel } from '../types';

export { IAdvancedLink, IComponentLink } from '../_interface/glue.schema';

export const ComponentLinkType = 'glue.core.component_link.ComponentLink';

export interface ILinkEditorModel {
  relatedLinks: Map<string, IComponentLinkInfo>;
  relatedLinksChanged: ISignal<this, void>;
  sharedModel: IGlueSessionSharedModel | undefined;
}

export interface IComponentLinkInfo {
  src?: ILinkInfo;
  dest?: ILinkInfo;
  origin?: string;
}

export interface ILinkInfo {
  attribute: string;
  dataset: string;
  label?: string;
}
