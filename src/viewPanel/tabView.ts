import { Widget } from '@lumino/widgets';

import { TabModel } from './tabModel';
import { TabLayout } from './tabLayout';

export class TabView extends Widget {
  constructor(options: TabView.IOptions) {
    super();
    this.addClass('grid-editor');

    this._model = options.model;
    this.title.label = this._model?.tabName ?? '';

    this.layout = new TabLayout();

    this._model?.ready.connect(() => {
      this._initGridItems();
    });
  }

  /**
   * Initialize the `GridstackItemWidget` from Notebook's metadata.
   */
  private async _initGridItems(): Promise<void> {
    const viewWidgets = this._model?.createView();
    if (!viewWidgets) {
      return;
    }
    for await (const view of viewWidgets) {
      if (view) {
        (this.layout as TabLayout).addGridItem(view);
      }
    }
  }

  private _model?: TabModel;
}

export namespace TabView {
  export interface IOptions {
    model?: TabModel;
  }
}
