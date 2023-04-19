import { ToolbarRegistry } from '@jupyterlab/apputils';
import { IObservableList, ObservableList } from '@jupyterlab/observables';
import { Toolbar } from '@jupyterlab/ui-components';
import { BoxPanel, StackedPanel, Widget } from '@lumino/widgets';
import { IGlueSessionSharedModel } from '../types';

export class LinkEditorWidget extends BoxPanel {
  constructor(options: LinkEditorWidget.IOptions) {
    super();
    this._sharedModel = options.sharedModel;
    this.addClass('glue-LinkEditor-widget');
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

  protected mainContent(items: LinkEditorWidget.IMainContentItems[]): BoxPanel {
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
  protected _tabToolbar: IObservableList<ToolbarRegistry.IToolbarItem> =
    new ObservableList<ToolbarRegistry.IToolbarItem>();
  private _titleWidget = new Widget();
  private _content = new BoxPanel();
}

export namespace LinkEditorWidget {
  export interface IOptions {
    sharedModel: IGlueSessionSharedModel;
  }

  export interface IMainContentItems {
    name: string;
    widget: Widget;
  }
}
