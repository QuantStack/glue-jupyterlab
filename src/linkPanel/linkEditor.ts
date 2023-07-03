import { SplitPanel, Widget } from '@lumino/widgets';

import { IGlueSessionSharedModel } from '../types';
import { LinkEditorModel } from './model';
import { Linking } from './widgets/linking';
import { Summary } from './widgets/summary';
import { LinkEditorWidget } from './linkEditorWidget';
import { Message } from '@lumino/messaging';

/**
 * The link editor widget.
 */
export class LinkEditor extends SplitPanel {
  constructor(options: LinkWidget.IOptions) {
    super({});
    this._sharedModel = options.sharedModel;
    this.addClass('glue-linkEditor');
    this.title.label = 'Link Data';
    this.title.className = 'glue-LinkEditor-tab';

    const model = new LinkEditorModel({ sharedModel: this._sharedModel });
    const linking = new Linking({
      linkEditorModel: model,
      sharedModel: this._sharedModel
    });
    const summary = new Summary({
      linkEditorModel: model,
      sharedModel: this._sharedModel
    });

    this.addWidget(linking);
    this.addWidget(summary);

    SplitPanel.setStretch(linking, 3);
    SplitPanel.setStretch(summary, 2);
  }

  get sharedModel(): IGlueSessionSharedModel {
    return this._sharedModel;
  }

  /**
   * Set the header height to the maximal, in comparison to the others headers.
   */
  protected onAfterShow(msg: Message): void {
    this._computeHeaderHeight();
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    this._computeHeaderHeight();
  }

  /**
   * Compute and homogeneize the most height header.
   */
  private _computeHeaderHeight() {
    let maxHeight = 0;
    const headers = this.widgets.map(
      widget => (widget as LinkEditorWidget).header
    );
    maxHeight = Math.max(
      ...headers.map(
        header => (header?.node.firstChild as HTMLElement)?.offsetHeight || 0
      )
    );
    headers.forEach(header => {
      if (header) {
        header.node.style.minHeight = `${maxHeight}px`;
      }
    });
  }

  private _sharedModel: IGlueSessionSharedModel;
}

namespace LinkWidget {
  export interface IOptions {
    sharedModel: IGlueSessionSharedModel;
  }
}
