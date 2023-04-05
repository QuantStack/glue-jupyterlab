import { IDisposable } from '@lumino/disposable';
import { IGlueSessionViewerTypes } from '../types';
import { GridStackItem } from './gridStackItem';
import { OutputAreaModel, SimplifiedOutputArea } from '@jupyterlab/outputarea';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { UUID } from '@lumino/coreutils';
import { ISessionContext } from '@jupyterlab/apputils';
export class TabModel implements IDisposable {
  constructor(options: TabModel.IOptions) {
    const { tabName, tabData, rendermime } = options;
    this._tabData = tabData;
    this._tabName = tabName;
    this._rendermime = rendermime;
    this._sessionContext = options.sessionContext;
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

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
  }

  *createView(): Generator<GridStackItem | undefined> {
    const viewList = this.tabData;
    for (const view of viewList) {
      const viewId = UUID.uuid4();
      yield this._createView(viewId, view);
    }
  }

  _createView(
    viewId: string,
    viewData: IGlueSessionViewerTypes
  ): GridStackItem | undefined {
    let item: GridStackItem | undefined = undefined;
    switch (viewData._type) {
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
        const cellOutput = item.cellOutput as SimplifiedOutputArea;
        if (this._sessionContext) {
          this._sessionContext.initialize().then(() => {
            SimplifiedOutputArea.execute(
              'import ipywidgets\nipywidgets.IntSlider()',
              cellOutput,
              this._sessionContext!
            )
              .then(e => {
                console.log('Computed', e);
              })
              .catch(console.error);
          });
        }
        break;
      }
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
        break;
      }
    }
    return item;
  }
  private _isDisposed = false;
  private _tabData: IGlueSessionViewerTypes[];
  private _tabName: string;
  private _rendermime: IRenderMimeRegistry;
  private _sessionContext?: ISessionContext;
}

export namespace TabModel {
  export interface IOptions {
    tabName: string;
    tabData: IGlueSessionViewerTypes[];
    rendermime: IRenderMimeRegistry;
    sessionContext: ISessionContext;
  }
}
