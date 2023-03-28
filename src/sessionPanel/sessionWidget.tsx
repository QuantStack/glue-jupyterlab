import { BoxPanel, Widget } from '@lumino/widgets';
import { HTabPanel } from '../common/tabPanel';
export class SessionWidget extends BoxPanel {
  constructor(options: BoxPanel.IOptions) {
    super({ ...options, direction: 'top-to-bottom' });
    const tabBarClassList = ['glue-Session-tabBar'];
    this._tabPanel = new HTabPanel({
      tabBarPosition: 'bottom',
      tabBarClassList,
      tabBarOption: {
        addButtonEnabled: true
      }
    });
    const canvas = new Widget();
    canvas.node.innerText = 'canvas 1';
    canvas.title.label = 'Canvas 1';
    const canvas2 = new Widget();
    canvas2.title.label = 'Canvas 2';
    canvas2.node.innerText = 'canvas 2';
    this._tabPanel.addTab(canvas, 0);
    this._tabPanel.addTab(canvas2, 1);
    this._tabPanel.activateTab(0);
    this.addWidget(this._tabPanel);
    BoxPanel.setStretch(this._tabPanel, 1);
  }
  private _tabPanel: HTabPanel;
}
