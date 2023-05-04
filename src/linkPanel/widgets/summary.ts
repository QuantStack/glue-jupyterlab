import { ReactWidget } from '@jupyterlab/ui-components';
import { Panel, Widget } from '@lumino/widgets';

import { LinkEditorWidget } from '../linkEditorWidget';
import { IAdvancedLinkInfo, IComponentLinkInfo } from '../types';
import { LinkedDataset } from './linkedDataset';
import { advancedLinks, identityLinks } from './linksSummary';

/**
 * The widget displaying the links for the selected dataset.
 */
export class Summary extends LinkEditorWidget {
  constructor(options: Summary.IOptions) {
    const { linkedDataset } = options;
    super(options);

    this.addClass('glue-LinkEditor-summary');

    this._identityLinks = new Panel();
    this._identityLinks.addClass('glue-LinkEditor-identity');
    this._advancedLinks = new Panel();
    this._advancedLinks.addClass('glue-LinkEditor-advanced');

    this.titleValue = 'Summary';

    const placeholder = new Widget();
    placeholder.node.innerText = 'There is no dataset selected';
    this._identityLinks.addWidget(placeholder);
    this._identityLinks.hide();

    this._advancedLinks.addWidget(placeholder);
    this._advancedLinks.hide();

    this.content.addWidget(
      this.mainContent([
        { name: 'Identity Links', widget: this._identityLinks },
        { name: 'Advanced Links', widget: this._advancedLinks }
      ])
    );

    linkedDataset.selectionChanged.connect(this.onDatasetsChange, this);

    if (linkedDataset.selections) {
      this.updateIdentityLinks(linkedDataset.selections);
      this.updateAdvancedLinks(linkedDataset.selections);
    }
  }

  /**
   * Callback when the selected datasets change.
   */
  onDatasetsChange(_sender: LinkedDataset, datasets: [string, string]): void {
    this.updateIdentityLinks(datasets);
    this.updateAdvancedLinks(datasets);
  }

  /**
   * Updates the list of links when the selected dataset changes.
   */
  updateIdentityLinks(dataset: [string, string]): void {
    const links: [IComponentLinkInfo, boolean][] = [];

    // Remove all the existing widgets.
    while (this._identityLinks.widgets.length) {
      this._identityLinks.widgets[0].dispose();
    }

    // Keep only the links components for this dataset.
    this._linkEditorModel.relatedLinks.forEach(link => {
      if (
        dataset.includes(link.src.dataset) &&
        dataset.includes(link.dest.dataset)
      ) {
        const revert = link.dest.dataset === dataset[0];
        links.push([link, revert]);
      }
    });

    // Build the widget.
    this._identityLinks.addWidget(
      ReactWidget.create(identityLinks(links, this.onDeleteIdentity))
    );
  }

  /**
   *
   */
  updateAdvancedLinks(dataset: [string, string]): void {
    const links: IAdvancedLinkInfo[] = [];

    // Remove all the existing widgets.
    while (this._advancedLinks.widgets.length) {
      this._advancedLinks.widgets[0].dispose();
    }
    this._linkEditorModel.advancedLinks.forEach(link => {
      if (dataset.includes(link.data1) && dataset.includes(link.data2)) {
        links.push(link);
      }
    });
    // Build the widget.
    this._advancedLinks.addWidget(
      ReactWidget.create(advancedLinks(links, this.onDeleteAdvanced))
    );
  }

  /**
   * Called when clicking on the delete icon of the identity panel.
   */
  onDeleteIdentity = (link: IComponentLinkInfo): void => {
    console.log('Deleting', link);
  };

  /**
   * Called when clicking on the delete icon of the identity panel.
   */
  onDeleteAdvanced = (link: IAdvancedLinkInfo): void => {
    console.log('Deleting', link);
  };

  private _identityLinks: Panel;
  private _advancedLinks: Panel;
}

/**
 * The namespace of the Summary.
 */
namespace Summary {
  /**
   * The constructor options of the Summary.
   */
  export interface IOptions extends LinkEditorWidget.IOptions {
    linkedDataset: LinkedDataset;
  }
}
