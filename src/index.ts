import { gluePlugin, sessionTrackerPlugin } from './document/plugin';
import { controlPanel } from './controlPanel/plugin';
import { glueLinkEditorPlugin } from './linkPanel/plugin';

export default [
  sessionTrackerPlugin,
  gluePlugin,
  controlPanel,
  glueLinkEditorPlugin
];
