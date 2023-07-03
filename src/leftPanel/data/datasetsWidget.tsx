import * as React from 'react';

import { CommandRegistry } from '@lumino/commands';
import { Menu } from '@lumino/widgets';

import { ReactWidget } from '@jupyterlab/ui-components';

import {
  DATASET_MIME,
  IControlPanelModel,
  IGlueSessionSharedModel
} from '../../types';
import { CommandIDs } from '../../commands';

export class DatasetsWidget extends ReactWidget {
  constructor(options: {
    model: IControlPanelModel;
    commands: CommandRegistry;
  }) {
    super();
    const { model, commands } = options;

    this._model = model;
    this.title.label = 'Datasets';

    this._model.glueSessionChanged.connect(this._sessionChanged, this);

    // Construct the context menu.
    this._menu = new Menu({ commands });
    const viewerSubmenu = new Menu({ commands });
    viewerSubmenu.title.label = 'New Viewer';
    viewerSubmenu.title.iconClass = 'fa fa-caret-right';
    viewerSubmenu.addItem({ command: CommandIDs.new1DHistogram });
    viewerSubmenu.addItem({ command: CommandIDs.new1DProfile });
    viewerSubmenu.addItem({ command: CommandIDs.new2DScatter });
    viewerSubmenu.addItem({ command: CommandIDs.new3DScatter });
    viewerSubmenu.addItem({ command: CommandIDs.new2DImage });
    viewerSubmenu.addItem({ command: CommandIDs.newTable });
    this._menu.addItem({ type: 'submenu', submenu: viewerSubmenu });

    this._model.selectedDatasetChanged.connect(this.update, this);
  }

  private _contextMenu(event: React.MouseEvent) {
    const target = event.target as HTMLElement;
    if (this._dataNames.includes(target.id)) {
      this._model.selectedDataset = target.id;
    }

    event.preventDefault();
    const x = event.clientX;
    const y = event.clientY;
    this._menu.open(x, y);
  }

  private _sessionChanged() {
    if (this._currentSharedModel) {
      this._currentSharedModel.contentsChanged.disconnect(
        this._updateDataSets,
        this
      );
    }

    if (!this._model.sharedModel) {
      this._currentSharedModel = null;
      return;
    }

    this._currentSharedModel = this._model.sharedModel;
    this._updateDataSets();
    this._currentSharedModel.datasetChanged.connect(this._updateDataSets, this);
  }

  private _updateDataSets() {
    if (!this._currentSharedModel) {
      return;
    }

    this._currentSharedModel.changed.connect(this._updateDataSets, this);

    this._dataNames = Object.keys(this._currentSharedModel.dataset);
    this.update();
  }

  private _onClick(event: React.MouseEvent) {
    const target = event.target as HTMLElement;
    if (this._dataNames.includes(target.id)) {
      this._model.selectedDataset = target.id;
    }
  }

  private _getDatasetItem(id: string): JSX.Element {
    const className = `glue-Control-datasets-item ${
      id === this._model.selectedDataset
        ? 'glue-Control-datasets-item-selected'
        : ''
    }`;
    return (
      <li
        id={id}
        className={className}
        onClick={this._onClick.bind(this)}
        draggable="true"
        onDragStart={this._onDragStart(id)}
      >
        {id}
      </li>
    );
  }

  private _onDragStart(id: string): (event: React.DragEvent) => void {
    return (event: React.DragEvent) => {
      event.dataTransfer.setData(DATASET_MIME, id);
    };
  }

  render(): JSX.Element {
    return (
      <ul
        className="glue-Control-datasets-container"
        onContextMenu={this._contextMenu.bind(this)}
      >
        {this._dataNames.map(this._getDatasetItem.bind(this))}
      </ul>
    );
  }

  private _menu: Menu;
  private _dataNames: string[] = [];
  private _currentSharedModel: IGlueSessionSharedModel | null = null;
  private _model: IControlPanelModel;
}
