import { IWidgetTracker } from '@jupyterlab/apputils';
import { Token } from '@lumino/coreutils';

import { IGlueSessionWidget, IGlueSessionSharedModel } from './types';

export namespace CommandIDs {
  /**
   * The command ID to open the link editor widget.
   */
  export const openLinkEditor = 'glue:open-link-editor';
}

export interface IGlueSessionTracker
  extends IWidgetTracker<IGlueSessionWidget> {
  currentSharedModel(): IGlueSessionSharedModel | undefined;
}

export const IGlueSessionTracker = new Token<IGlueSessionTracker>(
  'glueCanvasTracker'
);
