import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  JupyterYModel,
  IJupyterYModel,
  IJupyterYWidgetManager,
  IJupyterYWidget
} from 'yjs-widgets';
import * as Y from 'yjs';
import { IGlueSessionTracker } from './token';

export interface ICommMetadata {
  create_ydoc: boolean;
  path: string;
  ymodel_name: string;
}
class YGlueSessionWidget implements IJupyterYWidget {
  constructor(yModel: IJupyterYModel, node: HTMLElement, ydocFactory: any) {
    this.yModel = yModel;
    this.node = node;
    yModel.sharedModel.ydoc = ydocFactory(yModel.sharedModel.commMetadata.path);
  }

  yModel: IJupyterYModel;
  node: HTMLElement;
}

export const yGlueSessionWidgetPlugin: JupyterFrontEndPlugin<void> = {
  id: 'glue-jupyterlab:yjswidget-plugin',
  autoStart: true,
  requires: [IJupyterYWidgetManager, IGlueSessionTracker],
  activate: (
    app: JupyterFrontEnd,
    yWidgetManager: IJupyterYWidgetManager,
    tracker: IGlueSessionTracker
  ): void => {
    class YGlueSessionModel extends JupyterYModel {
      ydocFactory(commMetadata: ICommMetadata): Y.Doc {
        const path = commMetadata.path;
        const sessionWidget = tracker.find(obj => {
          const filePath = obj.context.path.split(':')[1];
          return filePath === path;
        });

        let requestedYDoc: Y.Doc;
        if (sessionWidget) {
          requestedYDoc = sessionWidget.context.model.sharedModel.ydoc;
        } else {
          requestedYDoc = new Y.Doc();
        }
        return requestedYDoc;
      }
    }

    yWidgetManager.registerWidget(
      'GlueSession',
      YGlueSessionModel,
      YGlueSessionWidget
    );
  }
};
