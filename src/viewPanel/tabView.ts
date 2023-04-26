import { InputDialog } from '@jupyterlab/apputils';
import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { ContextMenu, Widget } from '@lumino/widgets';
import { ArrayExt } from '@lumino/algorithm';

import { TabModel } from './tabModel';
import { TabLayout } from './tabLayout';
import { GridStackItem } from './gridStackItem';
import { IDict, IGlueSessionSharedModel } from '../types';

export class TabView extends Widget {
  constructor(options: TabView.IOptions) {
    super();
    this.addClass('grid-editor');

    this._model = options.model;
    this.title.label = this._model?.tabName ?? '';

    this.layout = new TabLayout();

    this._commands = new CommandRegistry();
    this._contextMenu = new ContextMenu({ commands: this._commands });

    this._addCommands();

    this._model?.ready.connect(() => {
      this._initGridItems();
    });

    this._model?.sharedModel.tabChanged.connect(this._onTabChanged, this);
  }

  dispose(): void {
    super.dispose();
    this._model?.sharedModel.tabChanged.disconnect(this._onTabChanged, this);
  }

  /**
   * Handle the DOM events for the widget.
   *
   * @param event - The DOM event sent to the widget.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the notebook panel's node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'contextmenu':
        if (event.eventPhase === Event.CAPTURING_PHASE) {
          this._evtContextMenu(event as PointerEvent);
        }
        break;
      default:
        break;
    }
  }

  /**
   * Handle `after-attach` messages for the widget.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    const node = this.node;
    node.addEventListener('contextmenu', this, true);
  }

  /**
   * Handle `before-detach` messages for the widget.
   */
  protected onBeforeDetach(msg: Message): void {
    const node = this.node;
    node.removeEventListener('contextmenu', this, true);
    super.onBeforeAttach(msg);
  }

  /**
   * Initialize the `GridstackItemWidget` from Notebook's metadata.
   */
  private async _initGridItems(): Promise<void> {
    const viewWidgets = this._model?.createView();
    if (!viewWidgets) {
      return;
    }
    for await (const view of viewWidgets) {
      if (view) {
        (this.layout as TabLayout).addGridItem(view);
      }
    }
  }

  private _addCommands(): void {
    this._commands.addCommand('moveItem', {
      label: 'Move item.',
      isEnabled: () => true,
      execute: async () => {
        if (this._model && this._selectedItem) {
          const res = await InputDialog.getItem({
            title: 'Select the destination tab.',
            items: this._model.sharedModel
              .getTabNames()
              .filter(name => name !== this._model?.tabName)
          });

          if (res.button.accept && res.value) {
            this._model.sharedModel.moveTabItem(
              this._selectedItem.cellIdentity,
              this._model.tabName,
              res.value
            );
          }
        }
      }
    });
    this._contextMenu.addItem({
      command: 'moveItem',
      selector: '.glue-item',
      rank: 0
    });
  }

  /**
   * Handle `contextmenu` event.
   */
  private _evtContextMenu(event: PointerEvent): void {
    if (event.shiftKey) {
      return;
    }

    const opened = this._contextMenu.open(event);
    if (opened) {
      const target = event.target as HTMLElement;
      const pos = this._findItem(target);
      this._selectedItem = (this.layout as TabLayout).gridWidgets[pos];

      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Find the index of the item containing the target html element.
   *
   * #### Notes
   * Returns -1 if the cell is not found.
   */
  private _findItem(elem: HTMLElement): number {
    let el: HTMLElement | null = elem;
    while (el && el !== this.node) {
      if (el.classList.contains('glue-item')) {
        const i = ArrayExt.findFirstIndex(
          (this.layout as TabLayout).gridWidgets,
          widget => widget.node === el
        );
        if (i !== -1) {
          return i;
        }
        break;
      }
      el = el.parentElement;
    }
    return -1;
  }

  private _onTabChanged(
    sender: IGlueSessionSharedModel,
    args: IDict<any>
  ): void {
    if (args.tab && args.tab === this._model?.tabName) {
      (this.layout as TabLayout).cleanGrid();
      this._initGridItems();
    }
  }

  private _selectedItem: GridStackItem | null = null;
  private _model?: TabModel;
  private _contextMenu: ContextMenu;
  private _commands: CommandRegistry;
}

export namespace TabView {
  export interface IOptions {
    model?: TabModel;
  }
}
