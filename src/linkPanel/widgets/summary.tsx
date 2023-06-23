import {
  Button,
  LabIcon,
  ReactWidget,
  caretRightIcon,
  deleteIcon
} from '@jupyterlab/ui-components';
import {
  AccordionLayout,
  AccordionPanel,
  Title,
  Widget
} from '@lumino/widgets';
import * as React from 'react';

import { LinkEditorWidget } from '../linkEditorWidget';
import { ILink } from '../types';

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

    const accordionLayout = Private.createLayout({});
    this._links = new AccordionPanel({ layout: accordionLayout });
    this._links.addClass('glue-LinkEditor-identity');

    this.header = ReactWidget.create(<Private.header />);

    this.content = this._links;

    this._linkEditorModel.currentDatasetsChanged.connect(
      this.onDatasetsChange,
      this
    );
    this._linkEditorModel.linksChanged.connect(this.linksChanged, this);

    if (this._linkEditorModel.currentDatasets) {
      this.updateLinks();
    }
  }

  /**
   * Triggered when links has changed.
   */
  linksChanged(): void {
    this.updateLinks();
  }
  /**
   * Callback when the selected datasets change.
   */
  onDatasetsChange(): void {
    this.updateLinks();
  }

  /**
   * Updates the list of links when the selected dataset changes.
   */
  updateLinks(): void {
    const datasetLinks = new Map<string, Private.ISummaryLink[]>();

    // Remove all the existing widgets.
    while (this._links.widgets.length) {
      this._links.widgets[0].dispose();
    }

    this._linkEditorModel.identityLinks.forEach((link, linkName) => {
      const sortedDatasets = [link.data1, link.data2].sort();
      const datasetsStr = JSON.stringify(sortedDatasets);
      const identityLink: Private.ISummaryLink = {
        type: 'identity',
        name: linkName,
        value: link,
        revert: link.data2 === sortedDatasets[0]
      };
      if (datasetLinks.get(datasetsStr)) {
        datasetLinks.get(datasetsStr)?.push(identityLink);
      } else {
        datasetLinks.set(datasetsStr, [identityLink]);
      }
    });

    // this._linkEditorModel.advancedLinks.forEach((link, linkName) => {
    //   const sortedDatasets = [link.data1, link.data2].sort();
    //   const datasetsStr = JSON.stringify(sortedDatasets);
    //   const advancedLink: Private.ISummaryLink = {
    //     type: 'advanced',
    //     name: linkName,
    //     value: link
    //   };
    //   if (datasetLinks.get(datasetsStr)) {
    //     datasetLinks.get(datasetsStr)?.push(advancedLink);
    //   } else {
    //     datasetLinks.set(datasetsStr, [advancedLink]);
    //   }
    // });

    datasetLinks.forEach((links, datasets) => {
      const widget = ReactWidget.create(
        Private.datasetLinks(links, this.onDeleteLink)
      );

      widget.title.dataset = {
        datasets: datasets,
        count: links.length.toString()
      };

      this._links.addWidget(widget);
    });
  }

  /**
   * Called when clicking on the delete icon panel.
   */
  onDeleteLink = (linkName: string): void => {
    this._sharedModel.removeLink(linkName);
  };

  private _links: AccordionPanel;
}

export namespace Private {
  /**
   * Custom renderer for the SidePanel
   */
  export class Renderer extends AccordionPanel.Renderer {
    /**
     * Render the collapse indicator for a section title.
     *
     * @param data - The data to use for rendering the section title.
     *
     * @returns A element representing the collapse indicator.
     */
    createCollapseIcon(data: Title<Widget>): HTMLElement {
      const iconDiv = document.createElement('div');
      iconDiv.classList.add('glue-LinkEditor-accordionCollapser');
      caretRightIcon.element({
        container: iconDiv
      });
      return iconDiv;
    }

    /**
     * Render the element for a section title.
     *
     * @param data - The data to use for rendering the section title.
     *
     * @returns A element representing the section title.
     */
    createSectionTitle(data: Title<Widget>): HTMLElement {
      const datasets = JSON.parse(data.dataset.datasets) as string[];
      const handle = document.createElement('div');
      handle.classList.add('glue-LinkEditor-accordionTitle');
      datasets.forEach(dataset => {
        const datasetColumn = document.createElement('div');
        datasetColumn.innerText = dataset;
        handle.append(datasetColumn);
      });
      const count = document.createElement('div');
      count.innerHTML = data.dataset.count;
      handle.append(count);
      handle.append(this.createCollapseIcon(data));
      return handle;
    }
  }

  export const defaultRenderer = new Renderer();

  /**
   * Create an accordion layout for accordion panel with toolbar in the title.
   *
   * @param options Panel options
   * @returns Panel layout
   *
   * #### Note
   *
   * Default titleSpace is 29 px (default var(--jp-private-toolbar-height) - but not styled)
   */
  export function createLayout(
    options: AccordionPanel.IOptions
  ): AccordionLayout {
    return (
      options.layout ||
      new AccordionLayout({
        renderer: options.renderer || defaultRenderer,
        orientation: options.orientation,
        alignment: options.alignment,
        spacing: options.spacing,
        titleSpace: options.titleSpace ?? 29
      })
    );
  }

  /**
   * Create the header content.
   *
   * @returns - The React header.
   */
  export function header(): JSX.Element {
    return (
      <div className={'glue-LinkEditor-summaryHeader'}>
        <div style={{ width: '80%' }}>Linked datasets</div>
        <div>#</div>
      </div>
    );
  }

  /**
   * A React widget with the links.
   *
   * @param links - List of links to display.
   * @param clickCallback - Function to call when clicking on the delete icon.
   */
  export function datasetLinks(
    links: Private.ISummaryLink[],
    clickCallback: (linkName: string) => void
  ): JSX.Element {
    const identity = links.filter(link => link.type === 'identity');
    // const advanced = links.filter(link => link.type === 'advanced');
    return (
      <div>
        {identity.map(link => (
          <div key={link.name} className={'glue-LinkEditor-summaryIdentity'}>
            <div>
              {link.revert
                ? link.value.cids2_labels[0]
                : link.value.cids1_labels[0]}
            </div>
            <div>
              {link.revert
                ? link.value.cids1_labels[0]
                : link.value.cids2_labels[0]}
            </div>
            <div>
              <Button
                className="glue-LinkEditor-deleteButton"
                onClick={() => clickCallback(link.name)}
                minimal
              >
                <LabIcon.resolveReact
                  icon={deleteIcon}
                  height={'24px'}
                  width={'24px'}
                />
              </Button>
            </div>
          </div>
        ))}
        {/* {advanced.map(link => (
          <div key={link.name} className={'glue-LinkEditor-advancedLinkItem'}>
            <div style={{ fontWeight: 'bold' }}>
              {link.name.split('.')[link.name.split('.').length - 1]}
            </div>
            <table>
              <tr key={link.name}>
                <td>
                  <div>{link.value.data1}</div>
                  <div style={{ fontStyle: 'italic' }}>
                    {link.value.cids1_labels.join(', ')}
                  </div>
                </td>
                <td>
                  <div>{link.value.data2}</div>
                  <div style={{ fontStyle: 'italic' }}>
                    {link.value.cids2_labels.join(', ')}
                  </div>
                </td>
                <td>
                  <Button
                    className="glue-LinkEditor-deleteButton"
                    onClick={() => clickCallback(link.name)}
                    minimal
                  >
                    <LabIcon.resolveReact
                      icon={deleteIcon}
                      height={'24px'}
                      width={'24px'}
                    />
                  </Button>
                </td>
              </tr>
            </table>
          </div>
        ))} */}
      </div>
    );
  }

  /**
   * The summary link description.
   */
  export interface ISummaryLink {
    type: 'identity' | 'advanced';
    name: string;
    value: ILink;
    revert?: boolean;
  }
}
