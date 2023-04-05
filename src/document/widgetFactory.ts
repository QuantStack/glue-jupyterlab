import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { SessionWidget } from '../viewPanel/sessionWidget';
import { ABCWidgetFactory, DocumentRegistry } from '@jupyterlab/docregistry';

import { CommandRegistry } from '@lumino/commands';

import { GlueSessionModel } from './docModel';

import { GlueDocumentWidget } from '../viewPanel/glueDocumentWidget';

export class GlueCanvasWidgetFactory extends ABCWidgetFactory<
  GlueDocumentWidget,
  GlueSessionModel
> {
  constructor(options: GlueCanvasWidgetFactory.IOptions) {
    const { rendermime, ...rest } = options;
    super(rest);
    this._rendermime = rendermime;
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
      sessionContext: context.sessionContext
    });
    return new GlueDocumentWidget({ context, content });
  }

  private _rendermime: IRenderMimeRegistry;
}

export namespace GlueCanvasWidgetFactory {
  export interface IOptions extends DocumentRegistry.IWidgetFactoryOptions {
    commands: CommandRegistry;
    rendermime: IRenderMimeRegistry;
  }
}
