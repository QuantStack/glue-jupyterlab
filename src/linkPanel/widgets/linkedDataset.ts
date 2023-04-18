import { ToolbarRegistry } from '@jupyterlab/apputils';
import { IObservableList, ObservableList } from '@jupyterlab/observables';
import { ReactWidget, Toolbar } from '@jupyterlab/ui-components';
import { JSONObject } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';
import { BoxPanel, StackedPanel, Widget } from '@lumino/widgets';
import { LinkEditorWidget } from '../linkEditorWidget';
import { DatasetSwitcherComponent } from './datasetSwitcher';

export class LinkedDataset extends LinkEditorWidget {
  constructor(options: LinkEditorWidget.IOptions) {
    super(options);
    this.titleValue = 'Linked Dataset';

    this._datasetSwitchers = [
      new DatasetSwitcherComponent({ name: 'First dataset' }),
      new DatasetSwitcherComponent({ name: 'Second dataset' })
    ];

    this._datasetSwitchers.forEach((switcher, index) => {
      this._selections[index] = switcher.value;
      switcher.onChange.connect(this.onSelectionChanged, this);
    });

    this.content.addWidget(this._mainContent());
  }

  get selections(): [string, string] {
    return this._selections;
  }

  get selectionChanged(): ISignal<this, [string, string]> {
    return this._selectionChanged;
  }

  onSelectionChanged(): void {
    this._datasetSwitchers.forEach(
      (switcher, index) => (this._selections[index] = switcher.value)
    );
    this._selectionChanged.emit(this._selections);
  }

  onSharedModelChanged(): void {
    if (!this._sharedModel.contents.__main__) {
      this._datasetSwitchers.forEach(switcher => {
        switcher.datasetList = [];
      });
      return;
    }

    const dataCollection: string =
      ((this._sharedModel.contents.__main__ as JSONObject).data as string) ||
      '';
    const datasetNames: string[] = (
      this._sharedModel.contents[dataCollection] as JSONObject
    ).data as string[];
    this._datasetSwitchers.forEach(switcher => {
      switcher.datasetList = datasetNames;
    });
  }

  _mainContent(): BoxPanel {
    const mainContent = new BoxPanel();

    const linkTypes = new Toolbar();
    linkTypes.addClass('glue-LinkedDataset-type');

    const tabNames = ['Created links', 'Inferred links'];
    const tabs: IObservableList<ToolbarRegistry.IToolbarItem> =
      new ObservableList<ToolbarRegistry.IToolbarItem>();
    tabNames.forEach(type => {
      const linkType = new Widget();
      linkType.addClass('glue-LinkEditor-linkType');
      linkType.node.innerHTML = `<a href="#">${type}</a>`;
      tabs.push({ name: type, widget: linkType });
    });

    mainContent.addWidget(linkTypes);

    BoxPanel.setStretch(linkTypes, 0);
    const mainContentPanels = new StackedPanel();
    const createdLinksContent = this._createdLinksContent();
    const inferredLinksContent = this._inferredLinksContent();

    mainContentPanels.addWidget(createdLinksContent);
    mainContentPanels.addWidget(inferredLinksContent);
    BoxPanel.setStretch(mainContentPanels, 1);
    Array.from(tabs).forEach((item, index) => {
      linkTypes.addItem(item.name, item.widget);
      if (index === 0) {
        item.widget.addClass('selected');
      }

      item.widget.node.onclick = () => {
        mainContentPanels.widgets.forEach(widget => widget.hide());
        Array.from(tabs).forEach(item => item.widget.removeClass('selected'));
        mainContentPanels.widgets[index].show();
        item.widget.addClass('selected');
      };
    });

    mainContent.addWidget(mainContentPanels);

    return mainContent;
  }

  _createdLinksContent(): BoxPanel {
    const createdLinks = new BoxPanel();
    const datasetSelection = new Toolbar();
    datasetSelection.addClass('glue-LinkedDataset-select');
    this._datasetSwitchers.forEach(switcher => {
      datasetSelection.addItem(
        switcher.name,
        ReactWidget.create(switcher.render())
      );
    });
    createdLinks.addWidget(datasetSelection);

    const links = new Widget();
    links.node.innerText = 'The created links';
    createdLinks.addWidget(links);

    BoxPanel.setStretch(datasetSelection, 0);
    BoxPanel.setStretch(links, 1);
    return createdLinks;
  }

  _inferredLinksContent(): Widget {
    const inferredLinks = new Widget();
    inferredLinks.node.innerText = 'The inferred links';
    inferredLinks.hide();
    return inferredLinks;
  }

  private _datasetSwitchers: DatasetSwitcherComponent[];
  private _selections: [string, string] = ['', ''];
  private _selectionChanged = new Signal<this, [string, string]>(this);
}
