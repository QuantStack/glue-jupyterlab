import { LabIcon } from '@jupyterlab/ui-components';

import glueIconStr from '../style/icons/glue-icon.svg';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { Signal } from '@lumino/signaling';

export const glueIcon = new LabIcon({
  name: 'gluelab:glue-icon',
  svgstr: glueIconStr
});

export function mockNotebook(
  rendermime: IRenderMimeRegistry,
  context?: DocumentRegistry.IContext<any>
): any {
  const signal = new Signal<any, void>({});
  const panel = {
    context,
    content: {
      rendermime,
      widgets: [],
      activeCellChanged: signal,
      disposed: signal
    },
    sessionContext: {
      session: null,
      sessionChanged: signal
    },
    disposed: signal,
    node: document.createElement('div')
  };
  return panel;
}
