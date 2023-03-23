import { DocumentWidget } from '@jupyterlab/docregistry';
import { Widget } from '@lumino/widgets';

import { IGlueSessionModel, IGlueCanvasWidget } from '../types';

export class GlueCanvasWidget
  extends DocumentWidget<Widget, IGlueSessionModel>
  implements IGlueCanvasWidget
{
  constructor(options: DocumentWidget.IOptions<Widget, IGlueSessionModel>) {
    super(options);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this.content.dispose();
    super.dispose();
  }

  onResize = (msg: any): void => {
    window.dispatchEvent(new Event('resize'));
  };
}
