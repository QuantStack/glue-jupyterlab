import { BoxPanel, Widget } from '@lumino/widgets';

import { LinkEditorWidget } from '../linkEditorWidget';

export class Summary extends LinkEditorWidget {
  constructor(options: LinkEditorWidget.IOptions) {
    super(options);
    this.titleValue = 'Summary';

    this.content.addWidget(
      this.mainContent([
        { name: 'Identity Links', widget: this._identityLinksContent() },
        { name: 'Advanced Links', widget: this._advancedLinksContent() }
      ])
    );
  }

  onSharedModelChanged(): void {
    return;
  }

  _identityLinksContent(): BoxPanel {
    const identityLinks = new BoxPanel();
    const links = new Widget();
    links.node.innerText = 'The identity links';
    identityLinks.addWidget(links);
    identityLinks.hide();
    return identityLinks;
  }

  _advancedLinksContent(): Widget {
    const advancedLinks = new Widget();
    advancedLinks.node.innerText = 'The advanced links';
    advancedLinks.hide();
    return advancedLinks;
  }
}
