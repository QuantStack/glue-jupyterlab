import { Panel } from '@lumino/widgets';
import { IControlPanelModel } from '../../types';
import { SimplifiedOutputArea, OutputAreaModel } from '@jupyterlab/outputarea';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
export class ConfigWidget extends Panel {
  constructor(options: {
    model: IControlPanelModel;
    rendermime: IRenderMimeRegistry;
  }) {
    super();
    this._model = options.model;
    this.node.style.padding = '5px';
    this.node.style.background = 'var(--jp-layout-color1)';

    const output = new SimplifiedOutputArea({
      model: new OutputAreaModel({ trusted: true }),
      rendermime: options.rendermime
    });
    this.addWidget(output);
    this._model.displayConfigRequested.connect((_, args) => {
      this.title.label = `${args.tabId} - ${args.cellId}`;
      const context = this._model.currentSessionContext();
      if (context) {
        SimplifiedOutputArea.execute(
          `GLUE_SESSION.render_config("${args.tabId}","${args.cellId}")`,
          output,
          context
        );
      }
    });
  }

  private _model: IControlPanelModel;
}
