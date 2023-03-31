import { BoxPanel } from '@lumino/widgets';

import { IGlueSessionSharedModel } from '../types';

/**
 * The link editor widget.
 */
export class LinkWidget extends BoxPanel {
  constructor(options: LinkWidget.IOptions) {
    super({ ...options, direction: 'left-to-right' });
    this.id = 'glue-link-editor';
    this.addClass('glue-link-editor');
    this.node.innerText = 'Link editor widget';
    this._sharedModel = options.sharedModel;
    console.log('sharedModel for editor', this.sharedModel);
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
