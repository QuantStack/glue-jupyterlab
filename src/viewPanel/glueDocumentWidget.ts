import { DocumentWidget } from '@jupyterlab/docregistry';
import { IGlueSessionModel, IGlueSessionWidget } from '../types';
import { SessionWidget } from './sessionWidget';

export class GlueDocumentWidget
  extends DocumentWidget<SessionWidget, IGlueSessionModel>
  implements IGlueSessionWidget
{
  constructor(
    options: DocumentWidget.IOptions<SessionWidget, IGlueSessionModel>
  ) {
    super(options);
  }
  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    //TODO Shutdown kernel does not work??
    this.context.sessionContext.shutdown();
    this.content.dispose();
    super.dispose();
  }

  onResize = (msg: any): void => {
    window.dispatchEvent(new Event('resize'));
  };
}
