import { BoxPanel } from '@lumino/widgets';

import { IGlueSessionSharedModel } from '../types';
import { LinkedDataset } from './widgets/linkedDataset';

/**
 * The link editor widget.
 */
export class LinkEditor extends BoxPanel {
  constructor(options: LinkWidget.IOptions) {
    super({ direction: 'left-to-right' });
    this._sharedModel = options.sharedModel;
    this.addClass('glue-linkEditor');
    this.title.label = 'Link Data';
    this.title.className = 'glue-LinkEditor-tab';

    const linkedDataset = new LinkedDataset({ sharedModel: this._sharedModel });
    this.addWidget(linkedDataset);
  }

  get sharedModel(): IGlueSessionSharedModel {
    return this._sharedModel;
  }

  private _sharedModel: IGlueSessionSharedModel;
}

namespace LinkWidget {
  export interface IOptions extends BoxPanel.IOptions {
    sharedModel: IGlueSessionSharedModel;
  }
}