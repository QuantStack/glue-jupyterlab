import { SubPanelModel } from '../subPanelModel';
import { IDict } from '../../types';

/**
 * Customized model for layers panel
 *
 * @export
 * @class LayersPanelModel
 * @extends {SubPanelModel}
 */
export class LayersPanelModel extends SubPanelModel {
  getCanvas(): Array<IDict> {
    return [{}, {}]; // TODO
  }
}
