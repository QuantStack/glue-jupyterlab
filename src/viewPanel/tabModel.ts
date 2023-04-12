import { PromiseDelegate, UUID } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';

import { OutputAreaModel, SimplifiedOutputArea } from '@jupyterlab/outputarea';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { INotebookTracker } from '@jupyterlab/notebook';
import { DocumentRegistry } from '@jupyterlab/docregistry';

import { IGlueSessionViewerTypes } from '../types';
import { GlueSessionModel } from '../document/docModel';
import { GridStackItem } from './gridStackItem';

export class TabModel implements IDisposable {
  constructor(options: TabModel.IOptions) {
    const { tabName, tabData, rendermime } = options;
    this._tabData = tabData;
    this._tabName = tabName;
    this._rendermime = rendermime;
    this._context = options.context;
    this._dataLoaded = options.dataLoaded;
  }

  get tabName(): string {
    return this._tabName;
  }

  get tabData(): IGlueSessionViewerTypes[] {
    return this._tabData;
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  async initialize(): Promise<void> {}

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
  }

  async *createView(): AsyncGenerator<GridStackItem | undefined> {
    const viewList = this.tabData;
    for (const view of viewList) {
      const viewId = UUID.uuid4();
      yield await this._createView(viewId, view);
    }
  }

  async _createView(
    viewId: string,
    viewData: IGlueSessionViewerTypes
  ): Promise<GridStackItem | undefined> {
    let item: GridStackItem | undefined = undefined;

    await this._dataLoaded.promise;

    // Extract plot state
    const state: { [k: string]: any; } = {};
    if (viewData.state.values) {
      for (const prop in viewData.state.values) {
        const value = viewData.state.values[prop];
        // TODO Why do we need to do this??
        if (typeof value === "string" && value.startsWith("st__")) {
          state[prop] = value.slice(4);
          continue;
        }

        state[prop] = value;
      }
    }

    switch (viewData._type) {
      case 'glue.viewers.scatter.qt.data_viewer.ScatterViewer': {
        const outputAreaModel = new OutputAreaModel({ trusted: true });
        const out = new SimplifiedOutputArea({
          model: outputAreaModel,
          rendermime: this._rendermime
        });

        item = new GridStackItem({
          cellIdentity: viewId,
          cell: out,
          itemTitle: '2D Scatter'
        });
        const cellOutput = item.cellOutput as SimplifiedOutputArea;
        if (this._context) {
          SimplifiedOutputArea.execute(
            `
            import json

            scatter = app.scatter2d(data=data)

            state = json.loads('${JSON.stringify(state)}')

            for key, value in state.items():
                try:
                    setattr(scatter.state, key, value)
                except:
                    pass
            `,
            cellOutput,
            this._context.sessionContext
          );
        }
        break;
      }
      case 'glue.viewers.histogram.qt.data_viewer.HistogramViewer': {
        const outputAreaModel = new OutputAreaModel({ trusted: true });
        const out = new SimplifiedOutputArea({
          model: outputAreaModel,
          rendermime: this._rendermime
        });
        item = new GridStackItem({
          cellIdentity: viewId,
          cell: out,
          itemTitle: 'Histogram'
        });
        break;
      }
    }
    return item;
  }

  private _isDisposed = false;
  private _tabData: IGlueSessionViewerTypes[];
  private _tabName: string;
  private _rendermime: IRenderMimeRegistry;
  private _context?: DocumentRegistry.IContext<GlueSessionModel>;
  private _dataLoaded: PromiseDelegate<void>;
}

export namespace TabModel {
  export interface IOptions {
    tabName: string;
    tabData: IGlueSessionViewerTypes[];
    rendermime: IRenderMimeRegistry;
    context: DocumentRegistry.IContext<GlueSessionModel>;
    notebookTracker: INotebookTracker;
    dataLoaded: PromiseDelegate<void>;
  }
}
