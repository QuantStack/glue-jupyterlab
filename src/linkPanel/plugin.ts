import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';
import { GlueSessionSharedModel } from '../document/sharedModel';
import { CommandIDs, IGlueSessionTracker } from '../token';
import { LinkWidget } from './linkWidget';

/**
 * Link editor for the glue-lab extension.
 */
export const glueLinkEditorPlugin: JupyterFrontEndPlugin<void> = {
  id: 'glue-lab:link-editor-plugin',
  autoStart: true,
  requires: [IGlueSessionTracker],
  optional: [ICommandPalette, ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd,
    canvasTracker: IGlueSessionTracker,
    palette: ICommandPalette,
    restorer: ILayoutRestorer | null
  ) => {
    let widget: MainAreaWidget<LinkWidget>;

    // Track the widget state.
    const tracker = new WidgetTracker<MainAreaWidget<LinkWidget>>({
      namespace: 'glue-link-editor'
    });

    // Adds a commands to open the glue link editor.
    app.commands.addCommand(CommandIDs.openLinkEditor, {
      label: 'Open the glue link editor',
      isEnabled: () => canvasTracker.currentSharedModel() !== undefined,
      execute: () => {
        // If there is no opened glue session
        if (!canvasTracker.currentSharedModel()) {
          return;
        }

        if (!widget || widget.isDisposed) {
          const panel = new LinkWidget({
            sharedModel:
              canvasTracker.currentSharedModel() || new GlueSessionSharedModel()
          });
          widget = new MainAreaWidget({ content: panel });
          widget.id = 'glue-link-editor-main';
          widget.addClass('glue-link-editor-main');
          widget.title.label = 'Glue Link Editor';
          widget.title.closable = true;
        }

        if (!tracker.has(widget)) {
          tracker.add(widget);
        }
        if (!widget.isAttached) {
          app.shell.add(widget, 'main');
        }
        widget.content.update();
        app.shell.activateById(widget.id);
      }
    });

    // Adds the command to the palette.
    if (palette) {
      palette.addItem({
        category: 'glue',
        command: CommandIDs.openLinkEditor
      });
    }

    // Restore the widget state.
    if (restorer !== null) {
      restorer.restore(tracker, {
        command: CommandIDs.openLinkEditor,
        name: () => 'glue-link-editor'
      });
    }
  }
};
