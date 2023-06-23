// import { ToolbarRegistry } from '@jupyterlab/apputils';
// import { ObservableList } from '@jupyterlab/observables';
import {
  Button,
  ReactWidget,
  UseSignal
  // Toolbar,
  // ToolbarButton
} from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
import * as React from 'react';

import { IGlueSessionSharedModel } from '../../types';
import { LinkEditorWidget } from '../linkEditorWidget';
import {
  ComponentLinkType,
  // IAdvLinkCategories,
  // IAdvLinkDescription,
  ILink,
  ILinkEditorModel,
  // IdentityLinkFunction,
  IdentityLinkUsing
} from '../types';
import { ISignal, Signal } from '@lumino/signaling';

export class Linking extends LinkEditorWidget {
  constructor(options: LinkEditorWidget.IOptions) {
    super(options);

    this.addClass('glue-LinkEditor-linking');

    // this._selectedAdvLink = { category: '', linkName: '' };
    this._datasetsPanels = [
      this._emptyDatasetPanel(),
      this._emptyDatasetPanel()
    ];

    this._attributesPanels = [
      this._emptyAttributePanel('firstAttributePanel'),
      this._emptyAttributePanel('secondAttributePanel')
    ];

    this.header = ReactWidget.create(
      <Private.header
        reloadButton={this._reloadGlueButton}
        glueCallback={this.glueIdentity}
      ></Private.header>
    );
    this.content = new Widget({ node: this._linkingContent() });

    this._sharedModel.datasetChanged.connect(this.onDatasetsChange, this);
    this._linkEditorModel.currentDatasetsChanged.connect(
      this.onDatasetChange,
      this
    );

    if (this._linkEditorModel.currentDatasets) {
      this.onDatasetChange(
        this._linkEditorModel,
        this._linkEditorModel.currentDatasets
      );
    }

    this.updateDatasets();
  }

  /**
   * Update the datasets list.
   */
  onDatasetsChange(): void {
    this.updateDatasets();
  }

  /**
   * Reload the panels when the selected datasets changed.
   *
   * @param _sender - the link editor model.
   * @param selection - the selected datasets.
   */
  onDatasetChange = (
    _sender: ILinkEditorModel,
    selection: [string, string]
  ): void => {
    // this.updateAttributes();
    // this.updateAdvancedLink();
  };

  // /**
  //  * Update the advanced link panel when the selected advanced link changed.
  //  *
  //  * @param selectedLink - the selected advanced link.
  //  */
  // onAdvancedLinkChanged = (
  //   selectedLink: Private.IAdvancedLinkSelected
  // ): void => {
  //   this._selectedAdvLink = selectedLink;
  //   this.updateAdvancedLink();
  // };

  updateDatasets(): void {
    const currentDatasets = this._linkEditorModel.currentDatasets;

    [0, 1].forEach(index => {
      const datasetsList = Object.keys(this._sharedModel.dataset);

      // Remove all the existing datasets.
      while (this._datasetsPanels[index].firstChild) {
        this._datasetsPanels[index].lastChild?.remove();
      }

      let selectedDataset: HTMLDivElement | undefined = undefined;

      datasetsList.sort();
      datasetsList.forEach(value => {
        const dataset = document.createElement('div');
        dataset.title = value;
        dataset.classList.add('glue-LinkEditor-linkingItem');
        dataset.innerText = value;
        dataset.onclick = () => {
          this.onDatasetSelected(index, dataset);
        };
        this._datasetsPanels[index].append(dataset);

        // Select the current dataset if exists.
        if (currentDatasets[index] === value) {
          selectedDataset = dataset;
        }
      });

      // Select a default dataset.
      if (selectedDataset) {
        this.onDatasetSelected(index, selectedDataset);
      } else if (this._datasetsPanels[index].childNodes[index]) {
        this.onDatasetSelected(
          index,
          this._datasetsPanels[index].childNodes[index] as HTMLDivElement
        );
      }
    });
  }

  /**
   * Select the dataset and send a signal.
   *
   * @param position - 'first' or 'second', the column where the widget belongs.
   * @param dataset - Element clicked.
   */
  onDatasetSelected(index: number, dataset: HTMLDivElement): void {
    // no-op if the dataset is already selected.
    if (dataset.classList.contains('selected')) {
      return;
    }

    // Remove sibling dataset selected class.
    dataset.parentNode?.querySelectorAll('.selected').forEach(elem => {
      elem.classList.remove('selected');
    });

    // Select the dataset.
    dataset.classList.add('selected');
    this.updateAttributes(index, dataset.title);
    this._linkEditorModel.setCurrentDataset(index, dataset.title);
  }

  /**
   * Updates the attributes panels.
   *
   * @param position - 'first' or 'second', the column where the dataset belongs.
   * @param dataset - the name of the dataset.
   */
  updateAttributes(index: number, dataset: string): void {
    // Remove all the existing widgets.
    while (this._attributesPanels[index].firstChild) {
      this._attributesPanels[index].lastChild?.remove();
    }

    if (!dataset) {
      return;
    }

    // Add a new widget for each attribute.
    let attributes: string[] = this._sharedModel.dataset[dataset].primary_owner;

    attributes = attributes.sort();
    attributes.forEach(value => {
      // Get the actual name of the attribute.
      let actualName = undefined;
      if (this._sharedModel.attributes[value]) {
        actualName = this._sharedModel.attributes[value].label;
      }
      const attribute = document.createElement('div');
      attribute.title = value;
      attribute.classList.add('glue-LinkEditor-linkingItem');
      attribute.innerText = actualName || value;
      attribute.onclick = () => {
        this.onIdentityAttributeClicked(attribute, index);
      };
      this._attributesPanels[index].append(attribute);
    });

    this._identityAttributes[index] = undefined;

    // Enable/disable the Glue button if datasets are different and attributes selected.
    this._updateGlueButtonStatus();
  }

  /**
   * Handle the click event on an attribute in identity links panel.
   *
   * @param attribute - the attribute widget clicked.
   * @param index - the index of the panel where the attribute widget has been clicked.
   */
  onIdentityAttributeClicked(attribute: HTMLDivElement, index: number): void {
    const isSelected = attribute.classList.contains('selected');

    // Remove sibling attribute selected class.
    attribute.parentNode?.querySelectorAll('.selected').forEach(elem => {
      elem.classList.remove('selected');
    });

    // Select the attribute.
    if (!isSelected) {
      attribute.classList.add('selected');
      this._identityAttributes[index] = {
        name: attribute.title,
        label: attribute.innerText
      };
    } else {
      this._identityAttributes[index] = undefined;
    }

    // Enable/disable the Glue button if datasets are different and attributes selected.
    this._updateGlueButtonStatus();
  }

  /**
   * Emit a signal with the disabled status of the glue button.
   */
  private _updateGlueButtonStatus(): void {
    const currentDatasets = this._linkEditorModel.currentDatasets;
    const status =
      this._identityAttributes.every(value => !!value) &&
      currentDatasets[0] !== currentDatasets[1];
    this._reloadGlueButton.emit(!status);
  }

  /**
   * Creates identity link.
   */
  glueIdentity = (): void => {
    if (!(this._identityAttributes[0] && this._identityAttributes[1])) {
      return;
    }

    const link: ILink = {
      _type: ComponentLinkType,
      cids1: [this._identityAttributes[0].name],
      cids2: [this._identityAttributes[1].name],
      cids1_labels: [this._identityAttributes[0].label],
      cids2_labels: [this._identityAttributes[1].label],
      data1: this._linkEditorModel.currentDatasets[0],
      data2: this._linkEditorModel.currentDatasets[1],
      inverse: IdentityLinkUsing,
      using: IdentityLinkUsing
    };
    const linkName = Private.newLinkName('ComponentLink', this._sharedModel);
    this._sharedModel.setLink(linkName, link);
  };

  // /**
  //  * Updates the advanced link panel.
  //  */
  // updateAdvancedLink(): void {
  //   // Remove all the existing widgets in advanced panel.
  //   while (this._advancedPanel.widgets.length) {
  //     this._advancedPanel.widgets[0].dispose();
  //   }

  //   if (!(this._selectedAdvLink.category && this._selectedAdvLink.linkName)) {
  //     this.advancedGlueButton.enabled = false;
  //     return;
  //   }

  //   // Get advanced link info.
  //   const info = this._linkEditorModel.advLinkCategories[
  //     this._selectedAdvLink.category
  //   ].find(detail => detail.display === this._selectedAdvLink.linkName);

  //   if (!info) {
  //     return;
  //   }

  //   // Display the link widget.
  //   this._advancedPanel.addWidget(
  //     new Private.AdvancedAttributes(
  //       info,
  //       this._linkEditorModel.currentDatasets,
  //       this._sharedModel,
  //       this.advancedGlueButtonStatus
  //     )
  //   );
  //   this.advancedGlueButtonStatus();
  // }

  // /**
  //  * Checks if the advanced glue button should be enabled or not.
  //  */
  // advancedGlueButtonStatus = (): void => {
  //   const currentDatasets = this._linkEditorModel.currentDatasets;
  //   const inputs = (
  //     this._advancedPanel.widgets[0] as Private.AdvancedAttributes
  //   ).inputs;

  //   const outputs = (
  //     this._advancedPanel.widgets[0] as Private.AdvancedAttributes
  //   ).outputs;

  //   // Enable the Glue button if datasets and attributes are different.
  //   this.advancedGlueButton.enabled =
  //     currentDatasets.first !== currentDatasets.second &&
  //     new Set(inputs).size === inputs.length &&
  //     new Set(outputs).size === outputs.length;
  // };

  // /**
  //  * Creates advanced link.
  //  */
  // glueAdvanced = (): void => {
  //   const inputs = (
  //     this._advancedPanel.widgets[0] as Private.AdvancedAttributes
  //   ).inputs;

  //   const outputs = (
  //     this._advancedPanel.widgets[0] as Private.AdvancedAttributes
  //   ).outputs;

  //   const info = this._linkEditorModel.advLinkCategories[
  //     this._selectedAdvLink.category
  //   ].find(detail => detail.display === this._selectedAdvLink.linkName);

  //   if (!inputs || !outputs || !info) {
  //     return;
  //   }

  //   const link: ILink = {
  //     _type: info._type,
  //     cids1: inputs.map(input => input.name),
  //     cids2: outputs.map(output => output.name),
  //     cids1_labels: inputs.map(input => input.label),
  //     cids2_labels: outputs.map(output => output.label),
  //     data1: this._linkEditorModel.currentDatasets.first,
  //     data2: this._linkEditorModel.currentDatasets.second
  //   };

  //   let linkName = Private.newLinkName(info.function, this._sharedModel);

  //   // Advanced link in General category are component links.
  //   if (this._selectedAdvLink.category === 'General') {
  //     link._type = ComponentLinkType;
  //     if (info._type !== IdentityLinkFunction) {
  //       link.inverse = null;
  //       link.using = {
  //         _type: 'types.FunctionType',
  //         function: info._type
  //       };
  //     } else {
  //       link.inverse = IdentityLinkUsing;
  //       link.using = IdentityLinkUsing;
  //     }
  //     linkName = Private.newLinkName('ComponentLink', this._sharedModel);
  //   }

  //   this._sharedModel.setLink(linkName, link);
  // };

  // /**
  //  * Build the advanced link panel.
  //  *
  //  * @returns - the panel.
  //  */
  // _advancedLinking(): BoxPanel {
  //   const panel = new BoxPanel();
  //   panel.title.label = 'Advanced linking';

  //   const glueToolbar = new Toolbar();

  //   const advancedSelect = new Widget({
  //     node: Private.advancedLinkSelect(
  //       this._linkEditorModel.advLinksPromise,
  //       this.onAdvancedLinkChanged
  //     )
  //   });
  //   this._advancedToolbar.push({
  //     name: 'Select advanced',
  //     widget: advancedSelect
  //   });

  //   const glueButton = new ToolbarButton({
  //     label: 'GLUE',
  //     tooltip: 'Glue selection',
  //     onClick: this.glueAdvanced
  //   });
  //   this._advancedToolbar.push({ name: 'Glue', widget: glueButton });

  //   Array.from(this._advancedToolbar).forEach(item =>
  //     glueToolbar.addItem(item.name, item.widget)
  //   );

  //   panel.addWidget(glueToolbar);
  //   panel.addWidget(this._advancedPanel);

  //   BoxPanel.setStretch(glueToolbar, 0);
  //   BoxPanel.setStretch(this._advancedPanel, 1);

  //   panel.hide();

  //   return panel;
  // }

  // private get advancedGlueButton(): ToolbarButton {
  //   return this._advancedToolbar.get(this._advancedToolbar.length - 1)
  //     .widget as ToolbarButton;
  // }

  _linkingContent(): HTMLElement {
    // const content = new BoxPanel({ direction: 'left-to-right' });
    const content = document.createElement('div');
    content.classList.add('glue-LinkEditor-linkingContent');
    content.append(this._datasetsPanels[0]);
    content.append(this._attributesPanels[0]);
    content.append(this._attributesPanels[1]);
    content.append(this._datasetsPanels[1]);
    return content;
  }

  private _emptyDatasetPanel(className?: string): HTMLDivElement {
    const panel = document.createElement('div');
    panel.classList.add('glue-LinkEditor-linkingDatasetsPanel');
    return panel;
  }

  private _emptyAttributePanel(className?: string): HTMLDivElement {
    const panel = document.createElement('div');
    panel.classList.add('glue-LinkEditor-linkingAttributesPanel');
    if (className) {
      panel.classList.add(className);
    }
    return panel;
  }

  private _identityAttributes: [
    Private.IAttribute | undefined,
    Private.IAttribute | undefined
  ] = [undefined, undefined];
  // private _selectedAdvLink: Private.IAdvancedLinkSelected;
  private _datasetsPanels: [HTMLDivElement, HTMLDivElement];
  private _attributesPanels: [HTMLDivElement, HTMLDivElement];
  // private _advancedToolbar = new ObservableList<ToolbarRegistry.IToolbarItem>();
  // private _advancedPanel = new BoxPanel();
  private _reloadGlueButton = new Signal<this, boolean>(this);
}

namespace Private {
  /**
   * The selected link interface.
   */
  export interface IAdvancedLinkSelected {
    category: string;
    linkName: string;
  }

  /**
   * The attribute description.
   */
  export interface IAttribute {
    label: string;
    name: string;
  }

  /**
   * The IO types names.
   */
  export type IIOTypes = 'inputs' | 'outputs';

  export interface IHeaderProps {
    reloadButton: ISignal<Linking, boolean>;
    glueCallback: () => void;
  }

  export function header(props: IHeaderProps): JSX.Element {
    return (
      <div className={'glue-LinkEditor-linkingHeader'}>
        <div className={'glue-LinkEditor-linkingHeaderDatasets'}>
          <div
            style={{ fontWeight: 'bold', fontSize: 'var(--jp-ui-font-size1)' }}
          >
            Dataset 1
          </div>
          <div>Select a first dataset</div>
        </div>
        <div className={'glue-LinkEditor-linkingHeaderAttributes'}>
          <div>
            <div style={{ fontWeight: 'bold' }}>Attributes</div>
            <div>Select an attribute from each column</div>
          </div>
          <UseSignal signal={props.reloadButton}>
            {(_, disabledStatus) => {
              return (
                <Button
                  onClick={props.glueCallback}
                  disabled={disabledStatus ?? true}
                  className={'glue-LinkEditor-linkingGlueButton'}
                >
                  GLUE
                </Button>
              );
            }}
          </UseSignal>
        </div>
        <div className={'glue-LinkEditor-linkingHeaderDatasets'}>
          <div style={{ fontWeight: 'bold' }}>Dataset 2</div>
          <div>Select a second dataset</div>
        </div>
      </div>
      // </div>
    );
  }

  // /**
  //  * The widget to select the advanced link attributes.
  //  */
  // export class AdvancedAttributes extends Widget {
  //   constructor(
  //     info: IAdvLinkDescription,
  //     currentDatasets: IDatasets,
  //     sharedModel: IGlueSessionSharedModel,
  //     onAttributeChanged: () => void
  //   ) {
  //     super();
  //     this._onAttributeChanged = onAttributeChanged;
  //     this.node.append(this._description(info));
  //     this.node.append(
  //       this._attributes('inputs', currentDatasets.first, info, sharedModel)
  //     );
  //     this.node.append(
  //       this._attributes('outputs', currentDatasets.second, info, sharedModel)
  //     );
  //   }

  //   get inputs(): IAttribute[] {
  //     return this._io.inputs;
  //   }

  //   get outputs(): IAttribute[] {
  //     return this._io.outputs;
  //   }

  //   /**
  //    * Creates the description DOM element.
  //    * @param info - The description of the advanced link.
  //    * @returns - The DOM element.
  //    */
  //   _description(info: IAdvLinkDescription): HTMLDivElement {
  //     const description = document.createElement('div');
  //     description.classList.add('advanced-link-description');
  //     description.innerText = info.description;
  //     return description;
  //   }

  //   /**
  //    * Creates the inputs or outputs DOM element.
  //    * @param ioType - The type of I/O.
  //    * @param dataset - The dataset of the I/O.
  //    * @param info - The definition of the advanced link.
  //    * @param sharedModel - The glue session model.
  //    * @returns - The DOM element.
  //    */
  //   _attributes(
  //     ioType: IIOTypes,
  //     dataset: string,
  //     info: IAdvLinkDescription,
  //     sharedModel: IGlueSessionSharedModel
  //   ): HTMLDivElement {
  //     const labelName = ioType === 'inputs' ? 'labels1' : 'labels2';
  //     const attributes = sharedModel.dataset[dataset].primary_owner;

  //     const div = document.createElement('div');

  //     // The title of the inputs / outputs.
  //     const datasetName = document.createElement('div');
  //     datasetName.style.padding = '1em 0.5em';
  //     datasetName.innerText = `${ioType.toUpperCase()} (${dataset})`;
  //     div.append(datasetName);

  //     // The select elements.
  //     const table = document.createElement('table');
  //     table.classList.add('advanced-link-attributes');
  //     table.classList.add(`advanced-link-${ioType}`);

  //     info[labelName].forEach((label, index) => {
  //       const row = document.createElement('tr');

  //       const labelCol = document.createElement('td');
  //       labelCol.innerText = label;
  //       row.append(labelCol);

  //       const selectCol = document.createElement('td');
  //       const select = document.createElement('select');
  //       attributes.forEach(attribute => {
  //         const option = document.createElement('option');
  //         option.value = attribute;
  //         option.label = sharedModel.attributes[attribute].label;
  //         option.innerText = sharedModel.attributes[attribute].label;
  //         select.append(option);
  //       });

  //       select.onchange = (event: Event) => {
  //         const element = event.target as HTMLSelectElement;
  //         this._io[ioType][index] = {
  //           name: element.value,
  //           label: element.selectedOptions.item(0)?.label || ''
  //         };
  //         this._onAttributeChanged();
  //       };

  //       let init_select = index;
  //       if (!attributes[index]) {
  //         init_select = 0;
  //       }
  //       select.value = attributes[init_select];

  //       this._io[ioType].push({
  //         name: attributes[init_select],
  //         label: sharedModel.attributes[attributes[init_select]].label
  //       });

  //       selectCol.append(select);
  //       row.append(selectCol);

  //       table.append(row);
  //     });

  //     div.append(table);

  //     return div;
  //   }

  //   // private _parentPanel: Linking;
  //   private _onAttributeChanged: () => void;
  //   private _io = {
  //     inputs: [] as IAttribute[],
  //     outputs: [] as IAttribute[]
  //   };
  // }

  /**
   * Creates a unique name for the link.
   *
   * @param basename - base name of the link.
   * @param sharedModel - Glue session model.
   * @returns
   */
  export function newLinkName(
    basename: string,
    sharedModel: IGlueSessionSharedModel
  ): string {
    let maxNum: number | undefined = undefined;
    const re = RegExp(`^${basename}(?:_([0-9]+))?$`);
    Object.keys(sharedModel.links).forEach(linkName => {
      const match = re.exec(linkName);
      if (match) {
        if (!match[1]) {
          if (maxNum === undefined) {
            maxNum = -1;
          }
        } else {
          maxNum = Math.max(maxNum || -1, parseInt(match[1]));
        }
      }
    });
    const suffix = maxNum !== undefined ? `_${maxNum + 1}` : '';
    return `${basename}${suffix}`;
  }

  // /**
  //  * The advanced link select node.
  //  * @param promiseCategories - The advanced link categories fetched from the server.
  //  */
  // export function advancedLinkSelect(
  //   promiseCategories: Promise<IAdvLinkCategories>,
  //   onLinkChange: (selectedLink: Private.IAdvancedLinkSelected) => void
  // ): HTMLSelectElement {
  //   const select = document.createElement('select');

  //   select.onchange = ev => {
  //     const target = ev.target as HTMLSelectElement;
  //     const value = target.value;
  //     const optgroup: HTMLOptGroupElement | null | undefined = target
  //       .querySelector(`option[value='${value}']`)
  //       ?.closest('optgroup');
  //     onLinkChange({
  //       category: optgroup?.label || '',
  //       linkName: value
  //     });
  //   };

  //   const disabledOption = document.createElement('option');
  //   disabledOption.value = '';
  //   disabledOption.selected = true;
  //   disabledOption.hidden = true;
  //   disabledOption.innerText = 'Select an advanced link';
  //   select.append(disabledOption);

  //   promiseCategories
  //     .then(categories => {
  //       Object.entries(categories).forEach(([category, links], _) => {
  //         const group = document.createElement('optgroup');
  //         group.label = category;

  //         links.forEach(link => {
  //           const option = document.createElement('option');
  //           option.value = link.display;
  //           option.innerText = link.display;
  //           group.append(option);
  //         });
  //         select.append(group);
  //       });
  //     })
  //     .catch(error => {
  //       console.error('Error while getting the advanced links', error);
  //     });

  //   return select;
  // }
}
