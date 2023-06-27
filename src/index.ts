import { controlPanel } from './leftPanel/plugin';
import {
  gluePlugin,
  sessionTrackerPlugin,
  newFilePlugin
} from './document/plugin';
import { yGlueSessionWidgetPlugin } from './yWidget';

export default [
  sessionTrackerPlugin,
  gluePlugin,
  controlPanel,
  yGlueSessionWidgetPlugin,
  newFilePlugin
];
