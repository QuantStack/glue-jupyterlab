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
    this._kernelStarted = options.kernelStarted;
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

    await this._kernelStarted.promise;

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
            'data_catalog = app.load_data("w5_psc.csv")\nscatter_viewer = app.scatter2d(x="[4.5]-[5.8]", y="[8.0]", data=data_catalog)',
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
  private _kernelStarted: PromiseDelegate<void>;
}

export namespace TabModel {
  export interface IOptions {
    tabName: string;
    tabData: IGlueSessionViewerTypes[];
    rendermime: IRenderMimeRegistry;
    context: DocumentRegistry.IContext<GlueSessionModel>;
    notebookTracker: INotebookTracker;
    kernelStarted: PromiseDelegate<void>;
  }
}
