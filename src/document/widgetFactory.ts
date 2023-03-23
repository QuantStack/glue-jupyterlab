import { ABCWidgetFactory, DocumentRegistry } from '@jupyterlab/docregistry';

import { CommandRegistry } from '@lumino/commands';

import { GlueSessionModel } from './docModel';

import { Widget } from '@lumino/widgets';
import { GlueCanvasWidget } from '../view/glueView';

interface IOptios extends DocumentRegistry.IWidgetFactoryOptions {
  commands: CommandRegistry;
}

export class GlueCanvasWidgetFactory extends ABCWidgetFactory<
  GlueCanvasWidget,
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
  ): GlueCanvasWidget {
    const content = new Widget();

    return new GlueCanvasWidget({ context, content });
  }
}
