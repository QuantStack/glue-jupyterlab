import { BoxPanel, Widget } from '@lumino/widgets';
import { IGlueSessionSharedModel } from '../types';

export class LinkEditorWidget extends BoxPanel {
  constructor(options: LinkEditorWidget.IOptions) {
    super();
    this._sharedModel = options.sharedModel;
    this._titleWidget.addClass('glue-LinkEditor-title');
    this._content.addClass('glue-LinkEditor-content');
    this.addWidget(this._titleWidget);
    this.addWidget(this._content);
    BoxPanel.setStretch(this._titleWidget, 0);
    BoxPanel.setStretch(this._content, 1);
    this._sharedModel.changed.connect(this.onSharedModelChanged, this);
  }

  set titleValue(value: string) {
    this._titleWidget.node.innerText = value;
  }
  get titleValue(): string {
    return this._titleWidget.node.innerText;
  }

  get content(): BoxPanel {
    return this._content;
  }

  onSharedModelChanged(): void {
    /** no-op */
  }

  protected _sharedModel: IGlueSessionSharedModel;
  private _titleWidget = new Widget();
  private _content = new BoxPanel();
}

export namespace LinkEditorWidget {
  export interface IOptions extends BoxPanel.IOptions {
    sharedModel: IGlueSessionSharedModel;
  }
}
