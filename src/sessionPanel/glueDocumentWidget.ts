import { DocumentWidget } from '@jupyterlab/docregistry';
import { Widget } from '@lumino/widgets';

import { IGlueSessionModel, IGlueSessionWidget } from '../types';

export class GlueDocumentWidget
  extends DocumentWidget<Widget, IGlueSessionModel>
  implements IGlueSessionWidget
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
