import { WidgetTracker } from '@jupyterlab/apputils';
import { IGlueSessionWidget, IGlueSessionSharedModel } from '../types';
import { IGlueSessionTracker } from '../token';
export class GlueSessionTracker
  extends WidgetTracker<IGlueSessionWidget>
  implements IGlueSessionTracker
{
  currentSharedModel(): IGlueSessionSharedModel | undefined {
    return this.currentWidget?.context.model.sharedModel;
  }
}
