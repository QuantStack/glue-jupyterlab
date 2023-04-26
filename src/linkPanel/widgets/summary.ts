import { ReactWidget } from '@jupyterlab/ui-components';
import { Panel, Widget } from '@lumino/widgets';

import { LinkEditorWidget } from '../linkEditorWidget';
import { LinkedDataset } from './linkedDataset';
import { identityLinks } from './identityLinks';
import { IRelatedLink } from '../types';

/**
 * The widget displaying the links for the selected dataset.
 */
export class Summary extends LinkEditorWidget {
  constructor(options: Summary.IOptions) {
    const { linkedDataset } = options;
    super(options);

    this.addClass('glue-LinkEditor-summary');

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

    linkedDataset.selectionChanged.connect(this.updateIdentityLinks, this);

    if (linkedDataset.selections) {
      this.updateIdentityLinks(linkedDataset, linkedDataset.selections);
    }
  }

  /**
   * Updates the list of links when the selected dataset changes.
   */
  updateIdentityLinks(_sender: LinkedDataset, dataset: [string, string]): void {
    const links: IRelatedLink[] = [];

    // Remove all the existing widgets.
    while (this._identityLinks.widgets.length) {
      this._identityLinks.widgets[0].dispose();
    }

    // Keep only the links components for this dataset.
    this._linkEditorModel.relatedLinks.forEach(link => {
      if (!link.src || !link.dest) {
        return;
      }
      if (
        dataset.includes(link.src?.dataset) &&
        dataset.includes(link.dest?.dataset)
      ) {
        links.push(link);
      }
    });

    // Build the widget.
    this._identityLinks.addWidget(
      ReactWidget.create(identityLinks(links, this.onDeleteIdentity))
    );
  }

  /**
   * Called when clicking on the delete icon of the identity panel.
   */
  onDeleteIdentity = (link: IRelatedLink): void => {
    console.log('Deleting', link);
  };

  private _identityLinks = new Panel();
  private _advancedLinks = new Panel();
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
