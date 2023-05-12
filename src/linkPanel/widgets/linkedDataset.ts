import { Toolbar } from '@jupyterlab/ui-components';
import { BoxPanel, Panel, Widget } from '@lumino/widgets';

import { LinkEditorWidget } from '../linkEditorWidget';
import { ILinkEditorModel } from '../types';
import { IGlueSessionSharedModel } from '../../types';

export class LinkedDataset extends LinkEditorWidget {
  constructor(options: LinkEditorWidget.IOptions) {
    super(options);
    this.titleValue = 'Linked Dataset';

    this.content.addWidget(
      this.mainContent([
        { name: 'Created Links', widget: this._createdLinksContent() },
        { name: 'Inferred Links', widget: this._inferredLinksContent() }
      ])
    );

    this._linkEditorModel.linksChanged.connect(this.onLinksChanged, this);
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
      const dataset = JSON.parse(datasetLink) as [string, string];
      const widget = new Private.LinkedDataset(dataset);
      widget.node.onclick = () => {
        this._linkEditorModel.currentDatasets = [...dataset];
      };

      this._createdLinksView.addWidget(widget);
    });
  }

  /**
   * Build the contents of the created links panel.
   *
   * @returns - The created links BoxPanel.
   */
  _createdLinksContent(): BoxPanel {
    const createdLinks = new BoxPanel();
    const datasetSelection = new Toolbar();
    datasetSelection.addClass('glue-LinkedDataset-select');

    ([0, 1] as (0 | 1)[]).forEach(index => {
      const widget = new Widget({
        node: Private.datasetSelect(
          index,
          this._linkEditorModel,
          this._sharedModel
        )
      });
      datasetSelection.addItem(`Dataset ${index}`, widget);
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

  /**
   * Build the contents of the inferred links widget.
   *
   * @returns - The inferred link widget.
   */
  _inferredLinksContent(): Widget {
    const inferredLinks = new Widget();
    inferredLinks.node.innerText = 'The inferred links';
    inferredLinks.hide();
    return inferredLinks;
  }

  private _createdLinksView = new Panel();
}

namespace Private {
  /**
   * The widget displayed for each dataset linked together.
   */
  export class LinkedDataset extends Widget {
    constructor(datasets: [string, string]) {
      super();
      this.addClass('glue-LinkEditor-createdLinks');
      this.node.innerHTML = `<span>${datasets[0]}</span><span>${datasets[1]}</span>`;
    }
  }

  /**
   * The dataset select widget.
   */
  export function datasetSelect(
    index: 0 | 1,
    model: ILinkEditorModel,
    sharedModel: IGlueSessionSharedModel
  ): HTMLSelectElement {
    const select = document.createElement('select');

    select.style.width = '50%';

    select.onchange = ev => {
      const value = (ev.target as HTMLSelectElement).value;
      model.setCurrentDataset(index, value);
    };

    const addDatasets = (datasetsList: string[]): void => {
      // Removes previous datasets;
      select.innerHTML = '';

      const value = model.currentDatasets[index]
        ? model.currentDatasets[index]
        : datasetsList[0] || '';

      // Adds new datasets.
      datasetsList?.forEach(dataset => {
        const option = document.createElement('option');
        option.value = dataset;
        option.innerText = dataset;
        option.selected = dataset === value;

        select.appendChild(option);
      });
    };

    // Listen to the current dataset selection to change the value.
    model.currentDatasetsChanged.connect((_, datasets: [string, string]) => {
      select.value = datasets[index];
    });

    // Listen to the datasets list to change the options.
    sharedModel.datasetChanged.connect(
      (sharedModel: IGlueSessionSharedModel, _) => {
        addDatasets(Object.keys(sharedModel.dataset));
      }
    );

    addDatasets(Object.keys(sharedModel.dataset));

    return select;
  }
}
