import { ReactWidget, Toolbar } from '@jupyterlab/ui-components';
import { JSONObject } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';
import { BoxPanel, Widget } from '@lumino/widgets';

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

    this.content.addWidget(
      this.mainContent([
        { name: 'Created Links', widget: this._createdLinksContent() },
        { name: 'Inferred Links', widget: this._inferredLinksContent() }
      ])
    );
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
    createdLinks.hide();
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
