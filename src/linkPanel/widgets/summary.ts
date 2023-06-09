import { ReactWidget } from '@jupyterlab/ui-components';
import { Panel, Widget } from '@lumino/widgets';

import { LinkEditorWidget } from '../linkEditorWidget';
import { IDatasets, ILinkEditorModel } from '../types';
import { advancedLinks, identityLinks, LinksSummary } from './linksSummary';

/**
 * The widget displaying the links for the selected dataset.
 */
export class Summary extends LinkEditorWidget {
  /**
   * The widget constructor.
   */
  constructor(options: LinkEditorWidget.IOptions) {
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

    this._linkEditorModel.currentDatasetsChanged.connect(
      this.onDatasetsChange,
      this
    );

    this._linkEditorModel.linksChanged.connect(this.linksChanged, this);
    if (this._linkEditorModel.currentDatasets) {
      this.updateIdentityLinks(this._linkEditorModel.currentDatasets);
      this.updateAdvancedLinks(this._linkEditorModel.currentDatasets);
    }
  }

  /**
   * Triggered when links has changed.
   */
  linksChanged(): void {
    this.updateIdentityLinks(this._linkEditorModel.currentDatasets);
    this.updateAdvancedLinks(this._linkEditorModel.currentDatasets);
  }
  /**
   * Callback when the selected datasets change.
   */
  onDatasetsChange(_sender: ILinkEditorModel, datasets: IDatasets): void {
    this.updateIdentityLinks(datasets);
    this.updateAdvancedLinks(datasets);
  }

  /**
   * Updates the list of links when the selected dataset changes.
   */
  updateIdentityLinks(dataset: IDatasets): void {
    const links: LinksSummary.IIdentityLink[] = [];

    // Remove all the existing widgets.
    while (this._identityLinks.widgets.length) {
      this._identityLinks.widgets[0].dispose();
    }

    this._linkEditorModel.identityLinks.forEach((link, linkName) => {
      if (
        Object.values(dataset).includes(link.data1) &&
        Object.values(dataset).includes(link.data2)
      ) {
        links.push({
          name: linkName,
          value: link,
          revert: link.data2 === dataset.first
        });
      }
    });

    // Build the widget.
    this._identityLinks.addWidget(
      ReactWidget.create(identityLinks(links, this.onDeleteLink))
    );
  }

  /**
   * Updates the list of advanced links.
   */
  updateAdvancedLinks(dataset: IDatasets): void {
    const links: LinksSummary.IAdvancedLink[] = [];

    // Remove all the existing widgets.
    while (this._advancedLinks.widgets.length) {
      this._advancedLinks.widgets[0].dispose();
    }
    this._linkEditorModel.advancedLinks.forEach((link, linkName) => {
      if (
        Object.values(dataset).includes(link.data1) &&
        Object.values(dataset).includes(link.data2)
      ) {
        links.push({
          name: linkName,
          value: link
        });
      }
    });

    // Build the widget.
    this._advancedLinks.addWidget(
      ReactWidget.create(advancedLinks(links, this.onDeleteLink))
    );
  }

  /**
   * Called when clicking on the delete icon panel.
   */
  onDeleteLink = (linkName: string): void => {
    this._sharedModel.removeLink(linkName);
  };

  private _identityLinks: Panel;
  private _advancedLinks: Panel;
}
