import { Panel, Widget } from '@lumino/widgets';
import { IGlueSessionSharedModel } from '../types';
import { ILinkEditorModel } from './types';

export class LinkEditorWidget extends Panel {
  constructor(options: LinkEditorWidget.IOptions) {
    super();
    this._linkEditorModel = options.linkEditorModel;
    this._sharedModel = options.sharedModel;
    this.addClass('glue-LinkEditor-widget');
    this._sharedModel.changed.connect(this.onSharedModelChanged, this);
  }

  /**
   * Getter and setter of the header.
   */
  get header(): Widget | undefined {
    return this._header;
  }
  protected set header(header: Widget | undefined) {
    if (this._header) {
      this._header.dispose();
    }
    if (!header) {
      return;
    }

    header.addClass('glue-LinkEditor-header');

    this._header = header;
    this.insertWidget(0, this._header);
  }

  /**
   * Getter and setter of the content.
   */
  get content(): Widget | undefined {
    return this._content;
  }
  protected set content(content: Widget | undefined) {
    if (this._content) {
      this._content.dispose();
    }
    if (!content) {
      return;
    }

    content.addClass('glue-LinkEditor-content');
    this._content = content;
    this.addWidget(this._content);
  }

  onSharedModelChanged(): void {
    /** no-op */
  }

  protected _sharedModel: IGlueSessionSharedModel;
  protected _linkEditorModel: ILinkEditorModel;
  private _header: Widget | undefined = undefined;
  private _content: Widget | undefined = undefined;
}

export namespace LinkEditorWidget {
  export interface IOptions {
    linkEditorModel: ILinkEditorModel;
    sharedModel: IGlueSessionSharedModel;
  }

  export interface IMainContentItems {
    name: string;
    widget: Widget;
  }
}
