// import { ToolbarRegistry } from '@jupyterlab/apputils';
// import { ObservableList } from '@jupyterlab/observables';
import {
  Button,
  ReactWidget,
  UseSignal
  // Toolbar,
  // ToolbarButton
} from '@jupyterlab/ui-components';
import { BoxPanel, Panel, Widget } from '@lumino/widgets';
import * as React from 'react';

import { IGlueSessionSharedModel } from '../../types';
import { LinkEditorWidget } from '../linkEditorWidget';
import {
  ComponentLinkType,
  // IAdvLinkCategories,
  // IAdvLinkDescription,
  ILink,
  ILinkEditorModel,
  IDatasets,
  IDatasetsKeys,
  // IdentityLinkFunction,
  IdentityLinkUsing
} from '../types';
import { ISignal, Signal } from '@lumino/signaling';

export class Linking extends LinkEditorWidget {
  constructor(options: LinkEditorWidget.IOptions) {
    super(options);

    this.addClass('glue-LinkEditor-linking');

    this.titleValue = 'Linking';

    // this._selectedAdvLink = { category: '', linkName: '' };

    this._headerWidget = ReactWidget.create(
      <Private.header
        reloadButton={this._reloadGlueButton}
        glueCallback={this.glueIdentity}
      ></Private.header>
    );
    this.setHeader(this._headerWidget);
    this.setContent(this._linkingContent());

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

    this._identityAttributes = {
      first: undefined,
      second: undefined
    };

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
  onDatasetChange = (_sender: ILinkEditorModel, selection: IDatasets): void => {
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

  /**
   * Update the datasets lists.
   */
  updateDatasets(): void {
    const currentDatasets = this._linkEditorModel.currentDatasets;

    IDatasetsKeys.forEach((position, index) => {
      const datasetsList = Object.keys(this._sharedModel.dataset);

      // Remove all the existing widgets.
      while (this._datasetsPanels[index].widgets.length) {
        this._datasetsPanels[index].widgets[0].dispose();
      }

      let selectedDataset: Widget | undefined = undefined;

      datasetsList.sort();
      datasetsList.forEach(value => {
        const dataset = new Widget();
        dataset.title.label = value;
        dataset.addClass('glue-LinkEditor-attribute');
        dataset.node.innerText = value;
        dataset.node.onclick = () => {
          this.onDatasetSelected(position, dataset);
        };
        this._datasetsPanels[index].addWidget(dataset);

        // Select the current dataset if exists.
        if (currentDatasets[position] === value) {
          selectedDataset = dataset;
        }
      });

      // Select a default dataset.
      if (selectedDataset) {
        this.onDatasetSelected(position, selectedDataset);
      } else if (this._datasetsPanels[index].widgets[index]) {
        this.onDatasetSelected(
          position,
          this._datasetsPanels[index].widgets[index]
        );
      }
    });
  }

  /**
   * Select the dataset and send a signal.
   *
   * @param position - 'first' or 'second', the column where the widget belongs.
   * @param dataset - Widget clicked.
   */
  onDatasetSelected(position: keyof IDatasets, dataset: Widget): void {
    // no-op if the dataset is already selected.
    if (dataset.hasClass('selected')) {
      return;
    }

    // Remove sibling dataset selected class.
    (dataset.parent as Panel).widgets
      .filter(widget => widget.hasClass('selected'))
      .forEach(widget => widget.removeClass('selected'));

    // Select the dataset.
    dataset.addClass('selected');
    this.updateAttributes(IDatasetsKeys.indexOf(position), dataset.title.label);
    this._linkEditorModel.setCurrentDataset(position, dataset.title.label);
  }

  /**
   * Updates the attributes panels.
   *
   * @param position - 'first' or 'second', the column where the dataset belongs.
   * @param dataset - the name of the dataset.
   */
  updateAttributes(index: number, dataset: string): void {
    // Remove all the existing widgets.
    while (this._attributesPanels[index].widgets.length) {
      this._attributesPanels[index].widgets[0].dispose();
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
      const attribute = new Widget();
      attribute.title.label = value;
      attribute.addClass('glue-LinkEditor-attribute');
      attribute.node.innerText = actualName || value;
      attribute.node.onclick = () => {
        this.onIdentityAttributeClicked(attribute, index);
      };
      this._attributesPanels[index].addWidget(attribute);
    });

    this._identityAttributes[IDatasetsKeys[index]] = undefined;

    // Enable/disable the Glue button if datasets are different and attributes selected.
    this._updateGlueButtonStatus();
  }

  /**
   * Handle the click event on an attribute in identity links panel.
   *
   * @param attribute - the attribute widget clicked.
   * @param index - the index of the panel where the attribute widget has been clicked.
   */
  onIdentityAttributeClicked(attribute: Widget, index: number): void {
    const isSelected = attribute.hasClass('selected');

    // Remove sibling attribute selected class.
    (attribute.parent as Panel).widgets
      .filter(widget => widget.hasClass('selected'))
      .forEach(widget => widget.removeClass('selected'));

    // Select the attribute.
    if (!isSelected) {
      attribute.addClass('selected');
      this._identityAttributes[IDatasetsKeys[index]] = {
        name: attribute.title.label,
        label: attribute.node.innerText
      };
    } else {
      this._identityAttributes[IDatasetsKeys[index]] = undefined;
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
      Object.values(this._identityAttributes).every(value => !!value) &&
      currentDatasets.first !== currentDatasets.second;
    this._reloadGlueButton.emit(!status);
  }

  /**
   * Creates identity link.
   */
  glueIdentity = (): void => {
    if (!(this._identityAttributes.first && this._identityAttributes.second)) {
      return;
    }

    const link: ILink = {
      _type: ComponentLinkType,
      cids1: [this._identityAttributes.first.name],
      cids2: [this._identityAttributes.second.name],
      cids1_labels: [this._identityAttributes.first.label],
      cids2_labels: [this._identityAttributes.second.label],
      data1: this._linkEditorModel.currentDatasets.first,
      data2: this._linkEditorModel.currentDatasets.second,
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

  _linkingContent(): BoxPanel {
    const content = new BoxPanel({ direction: 'left-to-right' });

    content.addWidget(this._datasetsPanels[0]);
    content.addWidget(this._attributesPanels[0]);
    content.addWidget(this._attributesPanels[1]);
    content.addWidget(this._datasetsPanels[1]);

    BoxPanel.setStretch(this._datasetsPanels[0], 3);
    BoxPanel.setStretch(this._attributesPanels[0], 2);
    BoxPanel.setStretch(this._attributesPanels[1], 2);
    BoxPanel.setStretch(this._datasetsPanels[1], 3);
    return content;
  }

  private _identityAttributes: Private.ISelectedIdentityAttributes;
  // private _selectedAdvLink: Private.IAdvancedLinkSelected;
  private _datasetsPanels = [new Panel(), new Panel()];
  private _attributesPanels = [new Panel(), new Panel()];
  // private _advancedToolbar = new ObservableList<ToolbarRegistry.IToolbarItem>();
  // private _advancedPanel = new BoxPanel();
  private _headerWidget: Widget;
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
   * The selected identity attributes.
   */
  export interface ISelectedIdentityAttributes {
    first?: IAttribute;
    second?: IAttribute;
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
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ width: '30%', padding: '0.5em' }}>
          <div style={{ fontWeight: 'bold' }}>Dataset 1</div>
          <div>Select a first dataset</div>
        </div>
        <div
          style={{
            width: '40%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: '0.5em'
          }}
        >
          <div>
            <div style={{ fontWeight: 'bold' }}>Attributes</div>
            <div>Select an attribute from each column</div>
          </div>
          <UseSignal signal={props.reloadButton}>
            {(_, disabledStatus) => {
              return (
                <Button
                  onClick={props.glueCallback}
                  minimal
                  disabled={disabledStatus ?? true}
                  className={'glue-LinkEditor-glueButton'}
                >
                  GLUE
                </Button>
              );
            }}
          </UseSignal>
        </div>
        <div style={{ width: '30%', padding: '0.5em' }}>
          <div style={{ fontWeight: 'bold' }}>Dataset 2</div>
          <div>Select a second dataset</div>
        </div>
      </div>
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
        if (!match[1] && !maxNum) {
          maxNum = -1;
        } else {
          maxNum = Math.max(maxNum || -1, parseInt(match[1]));
        }
      }
    });
    const suffix = maxNum ? `_${maxNum + 1}` : '';
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
