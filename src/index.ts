import { gluePlugin, sessionTrackerPlugin } from './document/plugin';
import { controlPanel } from './controlPanel/plugin';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  JupyterYModel,
  IJupyterYModel,
  IJupyterYWidgetManager
} from 'yjs-widgets';
import * as Y from 'yjs';
import { Dict } from '@jupyter-widgets/base';
import { IGlueSessionTracker } from './token';

class yGlueSessionWidget {
  constructor(yModel: IJupyterYModel, node: HTMLElement, ydocFactory: any) {
    this.yModel = yModel;
    this.node = node;
    yModel.sharedModel.ydoc = ydocFactory(yModel.sharedModel.commMetadata.path);
  }

  yModel: IJupyterYModel;
  node: HTMLElement;
}

export const yGlueSessionWidgetPlugin: JupyterFrontEndPlugin<void> = {
  id: 'foo:bar',
  autoStart: true,
  requires: [IJupyterYWidgetManager, IGlueSessionTracker],
  activate: (
    app: JupyterFrontEnd,
    wm: IJupyterYWidgetManager,
    tracker: IGlueSessionTracker
  ): void => {
    class JupyterGlueModel extends JupyterYModel {
      ydocFactory(commMetadata: Dict<any>): Y.Doc {
        return tracker.currentSharedModel()!.ydoc;
      }
    }

    wm.registerWidget('GlueSession', JupyterGlueModel, yGlueSessionWidget);
  }
};

export default [
  sessionTrackerPlugin,
  gluePlugin,
  controlPanel,
  yGlueSessionWidgetPlugin
];
