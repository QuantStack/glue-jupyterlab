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

const NAME_SPACE = 'gluelab';

export const sessionTrackerPlugin: JupyterFrontEndPlugin<IGlueSessionTracker> =
  {
    id: 'glue-lab:tracker-plugin',
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
 * Initialization data for the glue-lab extension.
 */
export const gluePlugin: JupyterFrontEndPlugin<void> = {
  id: 'glue-lab:document-plugin',
  autoStart: true,
  requires: [
    IRenderMimeRegistry,
    IGlueSessionTracker,
    ICollaborativeDrive,
    INotebookTracker
  ],
  activate: (
    app: JupyterFrontEnd,
    rendermime: IRenderMimeRegistry,
    canvasTracker: WidgetTracker,
    drive: ICollaborativeDrive,
    notebookTracker: INotebookTracker
  ) => {
    const widgetFactory = new GlueCanvasWidgetFactory({
      name: 'Glue Lab',
      modelName: 'gluelab-session-model',
      fileTypes: ['glu'],
      defaultFor: ['glu'],
      commands: app.commands,
      rendermime,
      notebookTracker,
      preferKernel: true,
      canStartKernel: true
    });
    widgetFactory.widgetCreated.connect((_, widget) => {
      widget.context.pathChanged.connect(() => {
        canvasTracker.save(widget);
      });
      canvasTracker.add(widget);
      app.shell.activateById('glueLab::controlPanel');
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
