import { Panel, Widget } from '@lumino/widgets';
import { IGlueSessionSharedModel } from '../types';

export class LinkEditorWidget extends Panel {
  constructor(options: LinkEditorWidget.IOptions) {
    super();
    this._sharedModel = options.sharedModel;
    this._titleWidget.addClass('glue-LinkEditor-title');
    this._content.addClass('glue-LinkEditor-content');
    this.addWidget(this._titleWidget);
    this.addWidget(this._content);

    this._sharedModel.changed.connect(this.onSharedModelChanged, this);
  }

  set titleValue(value: string) {
    this._titleWidget.node.innerText = value;
  }
  get titleValue(): string {
    return this._titleWidget.node.innerText;
  }

  get content(): Panel {
    return this._content;
  }

  onSharedModelChanged(): void {
    /** no-op */
  }

  protected _sharedModel: IGlueSessionSharedModel;
  private _titleWidget = new Widget();
  private _content = new Panel();
}

export namespace LinkEditorWidget {
  export interface IOptions extends Panel.IOptions {
    sharedModel: IGlueSessionSharedModel;
  }
}
