import { Panel } from '@lumino/widgets';
import { IControlPanelModel } from '../../types';
import { SimplifiedOutputArea, OutputAreaModel } from '@jupyterlab/outputarea';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
export class ConfigWidget extends Panel {
  constructor(options: {
    config: 'Layer' | 'Viewer';
    model: IControlPanelModel;
    rendermime: IRenderMimeRegistry;
  }) {
    super();
    this.addClass('glue-LeftPanel-configWidget');
    this._model = options.model;

    const { config } = options;
    const output = new SimplifiedOutputArea({
      model: new OutputAreaModel({ trusted: true }),
      rendermime: options.rendermime
    });
    this.addWidget(output);
    this.title.label = `${config} Options`;
    this._model.displayConfigRequested.connect((_, args) => {
      const context = this._model.currentSessionContext();
      if (context) {
        SimplifiedOutputArea.execute(
          `GLUE_SESSION.render_config("${config}","${args.tabId}","${args.cellId}")`,
          output,
          context
        );
      }
    });
  }

  private _model: IControlPanelModel;
}
