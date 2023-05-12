import { ToolbarRegistry } from '@jupyterlab/apputils';
import { IObservableList, ObservableList } from '@jupyterlab/observables';
import { Toolbar, ToolbarButton } from '@jupyterlab/ui-components';
import { BoxPanel, Panel, Widget } from '@lumino/widgets';

import { IGlueSessionSharedModel } from '../../types';
import { LinkEditorWidget } from '../linkEditorWidget';
import {
  IAdvLinkCategories,
  IAdvLinkDescription,
  ILinkEditorModel
} from '../types';

export class Linking extends LinkEditorWidget {
  constructor(options: LinkEditorWidget.IOptions) {
    super(options);

    this.addClass('glue-LinkEditor-linking');

    this.titleValue = 'Linking';

    this._selectedAdvLink = { category: '', linkName: '' };

    this.content.addWidget(
      this.mainContent([
        {
          name: 'Identity Linking',
          widget: this._identityLinking(this._linkEditorModel.currentDatasets)
        },
        { name: 'Advanced Linking', widget: this._advancedLinking() }
      ])
    );

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
  }

  onDatasetChange = (
    _sender: ILinkEditorModel,
    selection: [string, string]
  ): void => {
    // this._currentSelection = selection;
    this.updateIdentityAttributes();
    this.updateAdvancedLink();
  };

  onAdvancedLinkChanged = (
    selectedLink: Private.IAdvancedLinkSelected
  ): void => {
    this._selectedAdvLink = selectedLink;
    this.updateAdvancedLink();
  };

  updateIdentityAttributes(): void {
    this._linkEditorModel.currentDatasets.forEach((dataName, index) => {
      // no-op if the dataset did not change.
      const current = this._identityToolbar.get(index).widget.node.innerText;
      if (dataName === current) {
        return;
      }

      // Update identity toolbar item.
      this._identityToolbar.get(index).widget.node.innerText = dataName;

      // Remove all the existing widgets.
      while (this._identityAttributes[index].widgets.length) {
        this._identityAttributes[index].widgets[0].dispose();
      }

      // Add a new widget for each attribute.
      let attributes: string[] =
        this._sharedModel.dataset[dataName].primary_owner;

      attributes = attributes.sort();
      attributes.forEach(value => {
        // Get the actual name of the attribute.
        if (this._sharedModel.attributes[value]) {
          value = this._sharedModel.attributes[value].label;
        }
        const attribute = new Widget();
        attribute.title.label = value;
        attribute.addClass('glue-LinkEditor-attribute');
        attribute.node.innerText = value;
        attribute.node.onclick = () => {
          this.onAttributeClicked(attribute, index);
        };
        this._identityAttributes[index].addWidget(attribute);
      });
    });
  }

  onAttributeClicked(attribute: Widget, index: number): void {
    const isSelected = attribute.hasClass('selected');

    // Remove sibling attribute selected class.
    (attribute.parent as Panel).widgets
      .filter(widget => widget.hasClass('selected'))
      .forEach(widget => widget.removeClass('selected'));

    // Select the attribute.
    if (!isSelected) {
      attribute.addClass('selected');
      this._selectedAttributes[index] = attribute.title.label;
    } else {
      this._selectedAttributes[index] = '';
    }

    // Enable/disable the Glue button.
    (
      this._identityToolbar.get(this._identityToolbar.length - 1)
        .widget as ToolbarButton
    ).enabled = this._selectedAttributes.every(value => value !== '');
  }

  glueIdentity = (): void => {
    console.log(
      `Glue identity: ${this._selectedAttributes[0]} <-> ${this._selectedAttributes[1]}`
    );
  };

  updateAdvancedLink(): void {
    // Remove all the existing widgets in advanced panel.
    while (this._advancedPanel.widgets.length) {
      this._advancedPanel.widgets[0].dispose();
    }

    if (!(this._selectedAdvLink.category && this._selectedAdvLink.linkName)) {
      return;
    }

    // Get advanced link info.
    const info = this._linkEditorModel.advLinkCategories[
      this._selectedAdvLink.category
    ].find(detail => detail.display === this._selectedAdvLink.linkName);

    if (!info) {
      return;
    }

    // Display the link widget.
    this._advancedPanel.addWidget(
      new Widget({
        node: Private.advancedLinkAttributes(
          info,
          this._linkEditorModel.currentDatasets,
          this._sharedModel
        )
      })
    );
  }

  glueAdvanced = (): void => {
    const input: string[] = [];
    const output: string[] = [];

    this._advancedPanel.node
      .querySelectorAll('#advanced-link-input select')
      .forEach(value => {
        input.push((value as HTMLSelectElement).value);
      });

    this._advancedPanel.node
      .querySelectorAll('#advanced-link-output select')
      .forEach(value => {
        output.push((value as HTMLSelectElement).value);
      });
  };

  _identityLinking(selections: [string, string]): BoxPanel {
    const panel = new BoxPanel();
    panel.title.label = 'Identity linking';

    const glueToolbar = new Toolbar();
    const attributes = new BoxPanel({ direction: 'left-to-right' });

    selections.forEach((selection, index) => {
      const datasetName = new Widget();
      datasetName.addClass('glue-LinkEditor-linkingDatasetName');
      datasetName.node.innerText = selection;
      this._identityToolbar.push({
        name: `Dataset ${index}`,
        widget: datasetName
      });

      attributes.addWidget(this._identityAttributes[index]);
    });

    const glueButton = new ToolbarButton({
      label: 'GLUE',
      tooltip: 'Glue selection',
      enabled: false,
      onClick: this.glueIdentity
    });
    this._identityToolbar.push({ name: 'Glue', widget: glueButton });

    Array.from(this._identityToolbar).forEach(item =>
      glueToolbar.addItem(item.name, item.widget)
    );

    panel.addWidget(glueToolbar);

    panel.addWidget(attributes);

    BoxPanel.setStretch(glueToolbar, 0);
    BoxPanel.setStretch(attributes, 1);

    panel.hide();

    return panel;
  }

  _advancedLinking(): BoxPanel {
    const panel = new BoxPanel();
    panel.title.label = 'Advanced linking';

    const glueToolbar = new Toolbar();

    const advancedSelect = new Widget({
      node: Private.advancedLinkSelect(
        this._linkEditorModel.advLinksPromise,
        this.onAdvancedLinkChanged
      )
    });
    glueToolbar.addItem('Select advanced', advancedSelect);

    const glueButton = new ToolbarButton({
      label: 'GLUE',
      tooltip: 'Glue selection',
      onClick: this.glueAdvanced
    });
    glueToolbar.addItem('Glue', glueButton);

    panel.addWidget(glueToolbar);
    panel.addWidget(this._advancedPanel);

    BoxPanel.setStretch(glueToolbar, 0);
    BoxPanel.setStretch(this._advancedPanel, 1);

    panel.hide();

    return panel;
  }

  private _selectedAttributes = ['', ''];
  private _selectedAdvLink: Private.IAdvancedLinkSelected;
  private _identityToolbar: IObservableList<ToolbarRegistry.IToolbarItem> =
    new ObservableList<ToolbarRegistry.IToolbarItem>();
  private _identityAttributes = [new Panel(), new Panel()];
  private _advancedPanel = new BoxPanel();
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
   * The advanced link select node.
   * @param promiseCategories - The advanced link categories fetched from the server.
   */
  export function advancedLinkSelect(
    promiseCategories: Promise<IAdvLinkCategories>,
    onLinkChange: (selectedLink: Private.IAdvancedLinkSelected) => void
  ): HTMLSelectElement {
    const select = document.createElement('select');

    select.onchange = ev => {
      const target = ev.target as HTMLSelectElement;
      const value = target.value;
      const optgroup: HTMLOptGroupElement | null | undefined = target
        .querySelector(`option[value='${value}']`)
        ?.closest('optgroup');
      onLinkChange({
        category: optgroup?.label || '',
        linkName: value
      });
    };

    const disabledOption = document.createElement('option');
    disabledOption.value = '';
    disabledOption.selected = true;
    disabledOption.hidden = true;
    disabledOption.innerText = 'Select an advanced link';
    select.append(disabledOption);

    promiseCategories
      .then(categories => {
        Object.entries(categories).forEach(([category, links], _) => {
          const group = document.createElement('optgroup');
          group.label = category;

          links.forEach(link => {
            const option = document.createElement('option');
            option.value = link.display;
            option.innerText = link.display;
            group.append(option);
          });
          select.append(group);
        });
      })
      .catch(error => {
        console.error('Error while getting the advanced links', error);
      });

    return select;
  }

  /**
   * The advanced link select node.
   * @param promiseCategories - The advanced link categories fetched from the server.
   */
  export function advancedLinkAttributes(
    info: IAdvLinkDescription,
    currentDatasets: [string, string],
    sharedModel: IGlueSessionSharedModel
  ): HTMLElement {
    const attrType = ['INPUT', 'OUTPUT'];
    const labels: ('labels1' | 'labels2')[] = ['labels1', 'labels2'];

    const div = document.createElement('div');

    const description = document.createElement('div');
    description.classList.add('advanced-link-description');
    description.innerText = info.description;
    div.append(description);

    currentDatasets.forEach((dataset, index) => {
      const datasetName = document.createElement('div');
      datasetName.style.padding = '1em 0.5em';
      datasetName.innerText = `${attrType[index]} (${dataset})`;
      div.append(datasetName);

      const table = document.createElement('table');
      table.classList.add('advanced-link-attributes');
      info[labels[index]].forEach(label => {
        const row = document.createElement('tr');

        const labelCol = document.createElement('td');
        labelCol.innerText = label;
        row.append(labelCol);

        const selectCol = document.createElement('td');
        const select = document.createElement('select');
        sharedModel.dataset[dataset].primary_owner.forEach(attribute => {
          const option = document.createElement('option');
          option.value = attribute;
          option.innerText = sharedModel.attributes[attribute].label;
          select.append(option);
        });
        selectCol.append(select);
        row.append(selectCol);

        table.append(row);
      });
      div.append(table);
    });
    return div;
  }
}
