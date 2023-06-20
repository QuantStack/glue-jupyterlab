import { BoxPanel } from '@lumino/widgets';

import { IGlueSessionSharedModel } from '../types';
import { LinkEditorModel } from './model';
import { LinkedDataset } from './widgets/linkedDataset';
import { Linking } from './widgets/linking';
// import { Summary } from './widgets/summary';

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

    const model = new LinkEditorModel({ sharedModel: this._sharedModel });
    const linking = new Linking({
      linkEditorModel: model,
      sharedModel: this._sharedModel
    });
    const linkedDataset = new LinkedDataset({
      linkEditorModel: model,
      sharedModel: this._sharedModel
    });
    this.addWidget(linking);
    this.addWidget(linkedDataset);

    BoxPanel.setStretch(linking, 2);
    BoxPanel.setStretch(linkedDataset, 1);
    // this.addWidget(
    //   new Summary({
    //     linkEditorModel: model,
    //     sharedModel: this._sharedModel
    //   })
    // );
  }

  get sharedModel(): IGlueSessionSharedModel {
    return this._sharedModel;
  }

  private _sharedModel: IGlueSessionSharedModel;
}

namespace LinkWidget {
  export interface IOptions {
    sharedModel: IGlueSessionSharedModel;
  }
}
