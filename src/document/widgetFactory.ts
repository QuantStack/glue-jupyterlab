import { SessionWidget } from '../viewPanel/sessionWidget';
import { ABCWidgetFactory, DocumentRegistry } from '@jupyterlab/docregistry';

import { CommandRegistry } from '@lumino/commands';

import { GlueSessionModel } from './docModel';

import { GlueDocumentWidget } from '../viewPanel/glueDocumentWidget';

interface IOptios extends DocumentRegistry.IWidgetFactoryOptions {
  commands: CommandRegistry;
}

export class GlueCanvasWidgetFactory extends ABCWidgetFactory<
  GlueDocumentWidget,
  GlueSessionModel
> {
  constructor(options: IOptios) {
    const { ...rest } = options;
    super(rest);
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
    const { model } = context;
    const content = new SessionWidget({ model });

    return new GlueDocumentWidget({ context, content });
  }
}
