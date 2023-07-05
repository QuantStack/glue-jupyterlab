import {
  ICollaborativeDrive,
  SharedDocumentFactory
} from '@jupyter/docprovider';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ILauncher } from '@jupyterlab/launcher';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IJupyterYWidgetManager } from 'yjs-widgets';

import { CommandIDs } from '../commands';
import { IGlueSessionTracker } from '../token';
import { glueIcon } from '../tools';
import defaultContent from './default.json';
import { GlueSessionModelFactory } from './modelFactory';
import { GlueSessionSharedModel } from './sharedModel';
import { GlueSessionTracker } from './tracker';
import { GlueCanvasWidgetFactory } from './widgetFactory';

const NAME_SPACE = 'glue-jupyterlab';

export const sessionTrackerPlugin: JupyterFrontEndPlugin<IGlueSessionTracker> =
  {
    id: 'glue-jupyterlab:tracker-plugin',
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
 * Initialization data for the glue-jupyterlab extension.
 */
export const gluePlugin: JupyterFrontEndPlugin<void> = {
  id: 'glue-jupyterlab:document-plugin',
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
      app.shell.activateById('glue-jupyterlab::controlPanel');
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

/**
 * Add launcher button to create a new glue session.
 */
export const newFilePlugin: JupyterFrontEndPlugin<void> = {
  id: 'glue-jupyterlab:create-new-plugin',
  autoStart: true,
  requires: [IFileBrowserFactory],
  optional: [ILauncher, ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    browserFactory: IFileBrowserFactory,
    launcher?: ILauncher,
    commandPalette?: ICommandPalette
  ) => {
    const { commands } = app;
    commands.addCommand(CommandIDs.createNew, {
      label: args => 'New Glue Session',
      caption: 'Create a new Glue Session',
      icon: args => (args['isPalette'] ? undefined : glueIcon),
      execute: async args => {
        const cwd = (args['cwd'] ||
          browserFactory.tracker.currentWidget?.model.path) as string;

        let model = await app.serviceManager.contents.newUntitled({
          path: cwd,
          type: 'file',
          ext: '.glu'
        });
        model = await app.serviceManager.contents.save(model.path, {
          ...model,
          format: 'text',
          size: undefined,
          content: JSON.stringify(defaultContent)
        });

        // Open the newly created file with the 'Editor'
        return app.commands.execute('docmanager:open', {
          path: model.path
        });
      }
    });

    // Add the command to the launcher
    if (launcher) {
      launcher.add({
        command: CommandIDs.createNew,
        category: 'glue-jupyterlab',
        rank: 1
      });
    }

    // Add the command to the palette
    if (commandPalette) {
      commandPalette.addItem({
        command: CommandIDs.createNew,
        args: { isPalette: true },
        category: 'glue-jupyterlab'
      });
    }
  }
};
