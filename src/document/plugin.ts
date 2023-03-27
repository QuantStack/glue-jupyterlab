import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { WidgetTracker } from '@jupyterlab/apputils';

import { IGlueCanvasTracker } from '../token';
import { IGlueCanvasWidget } from '../types';
import { GlueSessionModelFactory } from './modelFactory';
import { GlueCanvasWidgetFactory } from './widgetFactory';

const NAME_SPACE = 'gluelab';

export const sessionTrackerPlugin: JupyterFrontEndPlugin<IGlueCanvasTracker> = {
  id: 'glue-lab:tracker-plugin',
  autoStart: true,
  provides: IGlueCanvasTracker,
  activate: (app: JupyterFrontEnd) => {
    const tracker = new WidgetTracker<IGlueCanvasWidget>({
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
  requires: [IGlueCanvasTracker],
  activate: (app: JupyterFrontEnd, canvasTracker: WidgetTracker) => {
    const widgetFactory = new GlueCanvasWidgetFactory({
      name: 'Glue Lab',
      modelName: 'gluelab-session-model',
      fileTypes: ['glu'],
      defaultFor: ['glu'],
      commands: app.commands
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
  }
};
