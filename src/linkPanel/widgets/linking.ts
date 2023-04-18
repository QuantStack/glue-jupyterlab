import { ToolbarRegistry } from '@jupyterlab/apputils';
import { IObservableList, ObservableList } from '@jupyterlab/observables';
import { ReactWidget, Toolbar, ToolbarButton } from '@jupyterlab/ui-components';
import { BoxPanel, Widget } from '@lumino/widgets';

import { LinkEditorWidget } from '../linkEditorWidget';
import { AdvancedLinking } from './advancedLinkinkChoices';
import { LinkedDataset } from './linkedDataset';

export class Linking extends LinkEditorWidget {
  constructor(options: Linking.IOptions) {
    super(options);
    const { linkedDataset } = options;
    this.addClass('glue-LinkEditor-linking');

    this.titleValue = 'Linking';

    this.content.addWidget(
      this.mainContent([
        {
          name: 'Identity Linking',
          widget: this._identityLinking(linkedDataset.selections)
        },
        { name: 'Advanced Linking', widget: this._advancedLinking() }
      ])
    );

    // this.content.addWidget(this._mainContent(linkedDataset.selections));
    linkedDataset.selectionChanged.connect(this.updateDataset, this);

    if (linkedDataset.selections) {
      this.updateDataset(linkedDataset, linkedDataset.selections);
    }
  }

  updateDataset(_sender: LinkedDataset, dataset: string[]): void {
    console.log('Update Identity');
    // Update identity toolbar items
    this._identityToolbar.get(0).widget.node.innerText = dataset[0];
    this._identityToolbar.get(1).widget.node.innerText = dataset[1];
    console.log(dataset);

    // Update identity variables list
    this._identityVariables[0].node.innerText = `Variables of ${dataset[0]}`;
    this._identityVariables[1].node.innerText = `Variables of ${dataset[1]}`;
  }

  onSharedModelChanged(): void {
    return;
  }

  glueIdentity = (): void => {
    console.log('Glue identity clicked');
  };

  advancedLinkChanged = (sender: AdvancedLinking, linkType: string): void => {
    console.log(`Advanced link selected: '${linkType}'`);
  };

  glueAdvanced = (): void => {
    console.log('Glue advanced clicked');
  };

  _identityLinking(selections: [string, string]): BoxPanel {
    const panel = new BoxPanel();
    panel.title.label = 'Identity linking';

    const glueToolbar = new Toolbar();
    const variables = new BoxPanel({ direction: 'left-to-right' });

    selections.forEach((selection, index) => {
      const datasetName = new Widget();
      datasetName.addClass('glue-LinkEditor-linkingDatasetName');
      datasetName.node.innerText = selection;
      this._identityToolbar.push({
        name: `Dataset ${index}`,
        widget: datasetName
      });

      this._identityVariables[
        index
      ].node.innerText = `Variables of ${selection}`;
      variables.addWidget(this._identityVariables[index]);
    });

    const glueButton = new ToolbarButton({
      label: 'GLUE',
      tooltip: 'Glue selection',
      onClick: this.glueIdentity
    });
    this._identityToolbar.push({ name: 'Glue', widget: glueButton });

    Array.from(this._identityToolbar).forEach(item =>
      glueToolbar.addItem(item.name, item.widget)
    );

    panel.addWidget(glueToolbar);

    panel.addWidget(variables);

    BoxPanel.setStretch(glueToolbar, 0);
    BoxPanel.setStretch(variables, 1);

    panel.hide();

    return panel;
  }

  _advancedLinking(): BoxPanel {
    const panel = new BoxPanel();
    panel.title.label = 'Advanced linking';

    const glueToolbar = new Toolbar();
    const variables = new BoxPanel({ direction: 'left-to-right' });

    const advancedSelect = new AdvancedLinking({});
    this._advancedToolbar.push({
      name: 'Select advanced',
      widget: ReactWidget.create(advancedSelect.render())
    });

    const glueButton = new ToolbarButton({
      label: 'GLUE',
      tooltip: 'Glue selection',
      onClick: this.glueAdvanced
    });
    this._advancedToolbar.push({ name: 'Glue', widget: glueButton });

    Array.from(this._advancedToolbar).forEach(item =>
      glueToolbar.addItem(item.name, item.widget)
    );

    advancedSelect.onChange.connect(this.advancedLinkChanged, this);
    panel.addWidget(glueToolbar);
    panel.addWidget(variables);

    BoxPanel.setStretch(glueToolbar, 0);
    BoxPanel.setStretch(variables, 1);

    panel.hide();

    return panel;
  }

  private _identityToolbar: IObservableList<ToolbarRegistry.IToolbarItem> =
    new ObservableList<ToolbarRegistry.IToolbarItem>();
  private _identityVariables = [new BoxPanel(), new BoxPanel()];
  private _advancedToolbar: IObservableList<ToolbarRegistry.IToolbarItem> =
    new ObservableList<ToolbarRegistry.IToolbarItem>();
  // private _advancedVariables = [new BoxPanel(), new BoxPanel()];
}

namespace Linking {
  export interface IOptions extends LinkEditorWidget.IOptions {
    linkedDataset: LinkedDataset;
  }
}
