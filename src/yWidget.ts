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
  id: 'glue-lab:yjswidget-plugin',
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
        console.log('commMetadata', commMetadata);

        const sessionWidget = tracker.find(obj => {
          const filePath = obj.context.path.split(':')[1];
          console.log('found path', path);
          return filePath === path;
        });

        let requestedYDoc: Y.Doc;
        if (sessionWidget) {
          requestedYDoc = sessionWidget.context.model.sharedModel.ydoc;
          console.log('found ydoc');
        } else {
          requestedYDoc = new Y.Doc();
          console.log('im in this  case');
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
