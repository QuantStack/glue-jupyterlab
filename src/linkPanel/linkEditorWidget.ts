import { ToolbarRegistry } from '@jupyterlab/apputils';
import { IObservableList, ObservableList } from '@jupyterlab/observables';
import { Panel, Widget } from '@lumino/widgets';
import { IGlueSessionSharedModel } from '../types';
import { ILinkEditorModel } from './types';
import { Message } from '@lumino/messaging';

export class LinkEditorWidget extends Panel {
  constructor(options: LinkEditorWidget.IOptions) {
    super();
    this._linkEditorModel = options.linkEditorModel;
    this._sharedModel = options.sharedModel;
    this.addClass('glue-LinkEditor-widget');
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

  /**
   * Set the header widget to the panel. If a header already exists it will be removed.
   *
   * @param header - widget to add as header.
   */
  protected setHeader(header: Widget): void {
    if (this._headerSet) {
      Private.linkEditorHeaders.splice(
        Private.linkEditorHeaders.indexOf(this.widgets[0])
      );
      this.widgets[0].dispose();
    }

    header.addClass('glue-LinkEditor-header');

    this.insertWidget(0, header);
    Private.linkEditorHeaders.push(header);
    this._headerSet = true;
  }

  protected setContent(content: Widget): void {
    if (this._contentSet) {
      this.widgets[this.widgets.length - 1].dispose();
    }
    content.addClass('glue-LinkEditor-content');
    this.addWidget(content);
    this._contentSet = true;
  }

  /**
   * Set the header height to the maximal, in comparison to the others headers.
   */
  protected onAfterShow(msg: Message): void {
    if (this._headerSet) {
      let heightMax = this.widgets[0].node.offsetHeight;
      Private.linkEditorHeaders.forEach(header => {
        if (header.node.offsetHeight > heightMax) {
          heightMax = header.node.offsetHeight;
        }
      });
      if (heightMax > this.widgets[0].node.offsetHeight) {
        this.widgets[0].node.style.height = `${heightMax}px`;
      }
    }
  }

  // protected onResize(msg: Widget.ResizeMessage): void {
  //   if (this._headerSet) {
  //     let maxHeight = this.widgets[0].node.offsetHeight;
  //     console.log('Start', this.widgets[0], maxHeight);
  //     console.log(this.widgets[0].node.getBoundingClientRect());
  //     Private.linkEditorHeaders.forEach(header => {
  //       if (header.node.offsetHeight > maxHeight) {
  //         maxHeight = header.node.offsetHeight;
  //       }
  //     });
  //     if (maxHeight > this.widgets[0].node.offsetHeight) {
  //       this.widgets[0].node.style.height = `${maxHeight}px`;
  //     }
  //     console.log('End', this.widgets[0], maxHeight);
  //   }
  // }

  onSharedModelChanged(): void {
    /** no-op */
  }

  protected _sharedModel: IGlueSessionSharedModel;
  protected _linkEditorModel: ILinkEditorModel;
  protected _tabToolbar: IObservableList<ToolbarRegistry.IToolbarItem> =
    new ObservableList<ToolbarRegistry.IToolbarItem>();
  private _titleWidget = new Widget();
  private _content = new Panel();
  private _headerSet = false;
  private _contentSet = false;
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

  export const HeaderHeight = {
    headerHeight: 0,
    linkEditorHeaders: [Widget]
  };
}

namespace Private {
  /**
   * Headers widgets list.
   */
  export const linkEditorHeaders: Widget[] = [];
}
