import { ToolbarRegistry } from '@jupyterlab/apputils';
import { IObservableList, ObservableList } from '@jupyterlab/observables';
import { Toolbar } from '@jupyterlab/ui-components';
import { BoxPanel, Panel, StackedPanel, Widget } from '@lumino/widgets';
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
  protected setHeader(header: Widget | string): void {
    if (this._headerSet) {
      this.widgets[0].dispose();
    }

    // Create a new widget if a string has been provided.
    if (typeof header === 'string') {
      const node = document.createElement('div');
      node.innerText = header;
      header = new Widget({ node });
    }
    header.addClass('glue-LinkEditor-header');

    this.insertWidget(0, header);
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

  protected tabsContent(items: LinkEditorWidget.IMainContentItems[]): BoxPanel {
    const mainContent = new BoxPanel();

    const tabToolbar = new Toolbar();
    tabToolbar.addClass('glue-LinkEditor-tabToolbar');
    const mainContentPanels = new StackedPanel();

    items.forEach(item => {
      const tabWidget = new Widget();
      tabWidget.addClass('glue-LinkEditor-linkType');
      tabWidget.node.innerHTML = `<a href="#">${item.name}</a>`;
      this._tabToolbar.push({ name: item.name, widget: tabWidget });

      mainContentPanels.addWidget(item.widget);
    });

    mainContent.addWidget(tabToolbar);
    mainContent.addWidget(mainContentPanels);
    BoxPanel.setStretch(tabToolbar, 0);
    BoxPanel.setStretch(mainContentPanels, 1);
    Array.from(this._tabToolbar).forEach((item, index) => {
      tabToolbar.addItem(item.name, item.widget);
      if (index === 0) {
        item.widget.addClass('selected');
        mainContentPanels.widgets[index].show();
      }

      item.widget.node.onclick = () => {
        mainContentPanels.widgets.forEach(widget => widget.hide());
        Array.from(this._tabToolbar).forEach(item =>
          item.widget.removeClass('selected')
        );
        mainContentPanels.widgets[index].show();
        item.widget.addClass('selected');
      };
    });

    return mainContent;
  }

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
}
