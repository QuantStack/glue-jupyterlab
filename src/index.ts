import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './handler';

/**
 * Initialization data for the glue-lab extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'glue-lab:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension glue-lab is activated!');

    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The glue_lab server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
