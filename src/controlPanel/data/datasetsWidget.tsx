import * as React from 'react';

import { CommandRegistry } from '@lumino/commands';
import { JSONObject } from '@lumino/coreutils';
import { Menu } from '@lumino/widgets';

import { ReactWidget } from '@jupyterlab/ui-components';

import { IControlPanelModel, IGlueSessionSharedModel } from '../../types';
import { CommandIDs } from '../commands';

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
    viewerSubmenu.title.label = 'New Viewer'
    viewerSubmenu.title.iconClass = 'fa fa-caret-right';
    viewerSubmenu.addItem({ command: CommandIDs.new1DHistogram });
    viewerSubmenu.addItem({ command: CommandIDs.new2DScatter });
    viewerSubmenu.addItem({ command: CommandIDs.new2DImage });
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
    this._currentSharedModel.contentsChanged.connect(
      this._updateDataSets,
      this
    );
  }

  private _updateDataSets() {
    if (!this._currentSharedModel) {
      return;
    }

    const mainModel = this._currentSharedModel.contents
      .__main__ as JSONObject | null;

    this._currentSharedModel.changed.connect(this._updateDataSets, this);

    if (!mainModel?.data) {
      return;
    }

    const dataCollection =
      this._currentSharedModel.contents[mainModel.data as string];

    this._dataNames = (dataCollection as JSONObject | null)?.data as string[];
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
      <li id={id} className={className} onClick={this._onClick.bind(this)}>
        {id}
      </li>
    );
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
