import { JSONObject } from '@lumino/coreutils';
import { BoxPanel } from '@lumino/widgets';

import { IGlueSessionSharedModel } from '../types';

/**
 * The link editor widget.
 */
export class LinkWidget extends BoxPanel {
  constructor(options: LinkWidget.IOptions) {
    super({ direction: 'left-to-right' });
    this._sharedModel = options.sharedModel;
    this.addClass('glue-link-editor');
    this.title.label = 'Link Data';
    this.title.className = 'glue-LinkEditor-title';

    this.node.innerText = 'Link editor widget';
    this._sharedModel.changed.connect(this._onSharedModelChanged, this);
  }

  get sharedModel(): IGlueSessionSharedModel {
    return this._sharedModel;
  }

  private _onSharedModelChanged() {
    if (!this._sharedModel.contents.__main__) {
      this.node.innerText = `Link editor widget for ${
        this._sharedModel.state.path || '(no session)'
      }\nNo data`;
      return;
    }

    const dataCollection: string =
      ((this._sharedModel.contents.__main__ as JSONObject).data as string) ||
      '';
    const dataNames: string[] = (
      this._sharedModel.contents[dataCollection] as JSONObject
    ).data as string[];
    this.node.innerText = `Link editor widget for ${
      this._sharedModel.state.path || '(no session)'
    }\nExisting data: ${JSON.stringify(dataNames)}`;
  }

  private _sharedModel: IGlueSessionSharedModel;
}

namespace LinkWidget {
  export interface IOptions extends BoxPanel.IOptions {
    sharedModel: IGlueSessionSharedModel;
  }
}
