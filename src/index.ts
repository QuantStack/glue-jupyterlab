import { controlPanel } from './leftPanel/plugin';
import { gluePlugin, sessionTrackerPlugin } from './document/plugin';
import { yGlueSessionWidgetPlugin } from './yWidget';

export default [
  sessionTrackerPlugin,
  gluePlugin,
  controlPanel,
  yGlueSessionWidgetPlugin
];
