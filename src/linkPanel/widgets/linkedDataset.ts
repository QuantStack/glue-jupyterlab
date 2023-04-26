import { ReactWidget, Toolbar } from '@jupyterlab/ui-components';
import { ISignal, Signal } from '@lumino/signaling';
import { BoxPanel, Panel, Widget } from '@lumino/widgets';

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

    this._sharedModel.datasetChanged.connect(this.onDatasetChanged, this);
    this._linkEditorModel.relatedLinksChanged.connect(
      this.onLinksChanged,
      this
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
    this.onDatasetChanged();
  }

  onDatasetChanged(): void {
    // Updates the switchers
    this._datasetSwitchers.forEach(switcher => {
      switcher.datasetList = Object.keys(this._sharedModel.dataset);
    });
  }

  onLinksChanged(): void {
    // Remove all the existing widgets.
    while (this._createdLinksView.widgets.length) {
      this._createdLinksView.widgets[0].dispose();
    }

    // Get a set of the linked dataset.
    const datasetLinks = new Set<string>();
    Array.from(this._linkEditorModel.relatedLinks.values()).map(relatedLink => {
      if (relatedLink.src && relatedLink.dest) {
        datasetLinks.add(
          JSON.stringify(
            [relatedLink.src.dataset, relatedLink.dest.dataset].sort()
          )
        );
      }
    });

    // Updates the view with one widget per linked dataset.
    datasetLinks.forEach(datasetLink => {
      const dataset = JSON.parse(datasetLink);
      const widget = new Private.LinkedDataset(dataset);
      widget.node.onclick = () => {
        this._datasetSwitchers[0].value = dataset[0];
        this._datasetSwitchers[1].value = dataset[1];
      };
      this._createdLinksView.addWidget(widget);
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

    const placeholder = new Widget();
    placeholder.node.innerText = 'The current session has no link';
    this._createdLinksView.addWidget(placeholder);
    createdLinks.addWidget(this._createdLinksView);

    BoxPanel.setStretch(datasetSelection, 0);
    BoxPanel.setStretch(this._createdLinksView, 1);
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
  private _createdLinksView = new Panel();
  private _selectionChanged = new Signal<this, [string, string]>(this);
}

namespace Private {
  /**
   * The widget displayed for each dataset linked together.
   */
  export class LinkedDataset extends Widget {
    constructor(dataset: [string, string]) {
      super();
      this.addClass('glue-LinkEditor-createdLinks');
      this.node.innerHTML = `<span>${dataset[0]}</span><span>${dataset[1]}</span>`;
    }
  }
}
