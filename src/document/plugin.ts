import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { WidgetTracker } from '@jupyterlab/apputils';

import {
  ICollaborativeDrive,
  SharedDocumentFactory
} from '@jupyter/docprovider';

import { IGlueSessionTracker } from '../token';
import { GlueSessionModelFactory } from './modelFactory';
import { GlueSessionTracker } from './tracker';
import { GlueCanvasWidgetFactory } from './widgetFactory';
import { GlueSessionSharedModel } from './sharedModel';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IJupyterYWidgetManager } from 'yjs-widgets';

const NAME_SPACE = 'gluepyter';

export const sessionTrackerPlugin: JupyterFrontEndPlugin<IGlueSessionTracker> =
  {
    id: 'gluepyter:tracker-plugin',
    autoStart: true,
    provides: IGlueSessionTracker,
    activate: (app: JupyterFrontEnd) => {
      const tracker = new GlueSessionTracker({
        namespace: NAME_SPACE
      });
      return tracker;
    }
  };

/**
 * Initialization data for the gluepyter extension.
 */
export const gluePlugin: JupyterFrontEndPlugin<void> = {
  id: 'gluepyter:document-plugin',
  autoStart: true,
  requires: [
    IRenderMimeRegistry,
    IGlueSessionTracker,
    ICollaborativeDrive,
    INotebookTracker,
    IJupyterYWidgetManager
  ],
  activate: (
    app: JupyterFrontEnd,
    rendermime: IRenderMimeRegistry,
    canvasTracker: WidgetTracker,
    drive: ICollaborativeDrive,
    notebookTracker: INotebookTracker,
    yWidgetManager: IJupyterYWidgetManager
  ) => {
    const widgetFactory = new GlueCanvasWidgetFactory({
      name: 'Glue Lab',
      modelName: 'gluelab-session-model',
      fileTypes: ['glu'],
      defaultFor: ['glu'],
      rendermime,
      notebookTracker,
      yWidgetManager: yWidgetManager,
      preferKernel: true,
      canStartKernel: true,
      autoStartDefault: true,
      commands: app.commands
    });
    widgetFactory.widgetCreated.connect((_, widget) => {
      widget.context.pathChanged.connect(() => {
        canvasTracker.save(widget);
      });
      canvasTracker.add(widget);
      app.shell.activateById('gluepyter::controlPanel');
    });
    app.docRegistry.addWidgetFactory(widgetFactory);

    const modelFactory = new GlueSessionModelFactory();
    app.docRegistry.addModelFactory(modelFactory);
    // register the filetype
    app.docRegistry.addFileType({
      name: 'glu',
      displayName: 'GLU',
      mimeTypes: ['text/json'],
      extensions: ['.glu', '.GLU'],
      fileFormat: 'text',
      contentType: 'glu'
    });

    const glueSharedModelFactory: SharedDocumentFactory = () => {
      return new GlueSessionSharedModel();
    };
    drive.sharedModelFactory.registerDocumentFactory(
      'glu',
      glueSharedModelFactory
    );
  }
};
