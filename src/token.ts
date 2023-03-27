import { IWidgetTracker } from '@jupyterlab/apputils';
import { Token } from '@lumino/coreutils';

import { IGlueSessionWidget, IGlueSessionSharedModel } from './types';

export interface IGlueSessionTracker
  extends IWidgetTracker<IGlueSessionWidget> {
  currentSharedModel(): IGlueSessionSharedModel | undefined;
}

export const IGlueSessionTracker = new Token<IGlueSessionTracker>(
  'glueCanvasTracker'
);
