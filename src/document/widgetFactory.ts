import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { SessionWidget } from '../viewPanel/sessionWidget';
import { ABCWidgetFactory, DocumentRegistry } from '@jupyterlab/docregistry';

import { GlueSessionModel } from './docModel';

import { GlueDocumentWidget } from '../viewPanel/glueDocumentWidget';
import { INotebookTracker } from '@jupyterlab/notebook';
import { CommandRegistry } from '@lumino/commands';
import { IJupyterYWidgetManager } from 'yjs-widgets';

export class GlueCanvasWidgetFactory extends ABCWidgetFactory<
  GlueDocumentWidget,
  GlueSessionModel
> {
  constructor(options: GlueCanvasWidgetFactory.IOptions) {
    const { rendermime, notebookTracker, commands, yWidgetManager, ...rest } =
      options;
    super(rest);
    this._rendermime = rendermime;
    this._notebookTracker = notebookTracker;
    this._commands = commands;
    this._yWidgetManager = yWidgetManager;
  }

  /**
   * Create a new widget given a context.
   *
   * @param context Contains the information of the file
   * @returns The widget
   */
  protected createNewWidget(
    context: DocumentRegistry.IContext<GlueSessionModel>
  ): GlueDocumentWidget {
    const content = new SessionWidget({
      model: context.model.sharedModel,
      rendermime: this._rendermime,
      notebookTracker: this._notebookTracker,
      context,
      commands: this._commands,
      yWidgetManager: this._yWidgetManager
    });
    return new GlueDocumentWidget({ context, content });
  }

  private _rendermime: IRenderMimeRegistry;
  private _notebookTracker: INotebookTracker;
  private _commands: CommandRegistry;
  private _yWidgetManager: IJupyterYWidgetManager;
}

export namespace GlueCanvasWidgetFactory {
  export interface IOptions extends DocumentRegistry.IWidgetFactoryOptions {
    rendermime: IRenderMimeRegistry;
    notebookTracker: INotebookTracker;
    commands: CommandRegistry;
    yWidgetManager: IJupyterYWidgetManager;
  }
}
