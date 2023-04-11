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
            scatter = app.scatter2d(data=data)

            state = {
                "angle_unit": "radians",
                "aspect": "auto",
                "dpi": 71.30820648960312,
                # "layers": "CallbackList",
                "plot_mode": "rectilinear",
                "show_axes": True,
                "x_att": "PRIMARY",
                "x_axislabel": "PRIMARY",
                "x_axislabel_size": 10,
                "x_axislabel_weight": "normal",
                "x_log": False,
                "x_max": 3260.291357421875,
                "x_min": 329.56267700195315,
                "x_ticklabel_size": 8,
                "y_att": "Pixel Axis 0 [y]",
                "y_axislabel": "Pixel Axis 0 [y]",
                "y_axislabel_size": 10,
                "y_axislabel_weight": "normal",
                "y_log": False,
                "y_max": 999.5,
                "y_min": -0.5,
                "y_ticklabel_size": 8
            }

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
