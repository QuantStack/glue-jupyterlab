import { BoxPanel } from '@lumino/widgets';

/**
 * The link editor widget.
 */
export class LinkWidget extends BoxPanel {
  constructor(options: BoxPanel.IOptions) {
    super({ ...options, direction: 'left-to-right' });
    this.id = 'glue-link-editor';
    this.addClass('glue-link-editor');
    this.node.innerText = 'Link editor widget';
  }
}
