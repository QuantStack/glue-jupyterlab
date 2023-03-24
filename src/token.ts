import { IWidgetTracker } from '@jupyterlab/apputils';
import { Token } from '@lumino/coreutils';

import { IGlueCanvasWidget } from './types';

export type IGlueCanvasTracker = IWidgetTracker<IGlueCanvasWidget>;

export const IGlueCanvasTracker = new Token<IGlueCanvasTracker>(
  'glueCanvasTracker'
);
