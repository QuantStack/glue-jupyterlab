import os
import json
import warnings
from pathlib import Path
from typing import TYPE_CHECKING, Dict, Optional, Tuple
from glue.core.link_helpers import LinkSame
from glue.core.state import GlueSerializer
import glue_jupyter as gj
from glue_jupyter.view import IPyWidgetView
from glue_jupyter.widgets.layer_options import LayerOptionsWidget

import y_py as Y

from IPython.display import display

from ipywidgets import Output

from jupyter_ydoc import ydocs
from ypywidgets import Widget

from .glue_utils import ErrorWidget
from .glue_ydoc import COMPONENT_LINK_TYPE, IDENTITY_LINK_FUNCTION

if TYPE_CHECKING:
    # Import `YGlue` just for type checking.
    from .glue_ydoc import YGlue

warnings.filterwarnings("ignore")


class SharedGlueSession:
    """The glue session which lives in the kernel of the
    glue document.
    """

    def __init__(self, path: str):
        self.app = gj.jglue()
        self._path = path
        self._viewers = {}
        self._data = {}
        self._init_ydoc()

    def remove_viewer(self, tab_name: str, viewer_id: str) -> None:
        """Remove a viewer

        Args:
            tab_name (str): Name of the tab
            viewer_id (str): Id of the viewer
        """
        viewer = self._viewers.get(tab_name, {}).pop(viewer_id, {})
        out: Output = viewer.get("output")
        if out is not None:
            out.clear_output()
        widget: IPyWidgetView = viewer.get("widget")
        if widget is not None:
            widget._layout.__del__()
        for key in ["viewer_options", "layer_options"]:
            w = viewer.get(key)
            if w is not None:
                w.__del__()

    def remove_tab(self, tab_name: str) -> None:
        """Remove a tab and all of its viewers

        Args:
            tab_name (str): Name of the tab
        """
        if tab_name not in self._viewers:
            return

        tab_viewers = self._viewers.get(tab_name, {})

        for viewer_id in list(tab_viewers):
            self.remove_viewer(tab_name, viewer_id)

        self._viewers.pop(tab_name, None)

    def create_viewer(self, tab_name: str, viewer_id: str, display_view=True) -> None:
        """Create a new viewer placeholder. This method will create a
        new empty `Output` widget, which will be populated later.

        Args:
            tab_name (str): Name of the tab
            viewer_id (str): Id of the viewer
            display_view (bool, optional): Display the output widget immediately?
            Defaults to True.
        """

        if tab_name in self._viewers:
            if viewer_id not in self._viewers[tab_name]:
                self._viewers[tab_name][viewer_id] = dict(output=Output(), widget=None)
            elif (
                "widget" in self._viewers[tab_name][viewer_id]
                and self._viewers[tab_name][viewer_id]["widget"] is not None
            ):
                output = Output()
                widget = self._viewers[tab_name][viewer_id]["widget"]

                with output:
                    widget.show()
                self._viewers[tab_name][viewer_id]["output"] = output
        else:
            self._viewers[tab_name] = {viewer_id: dict(output=Output(), widget=None)}

        if display_view:
            display(self._viewers[tab_name][viewer_id]["output"])

    def render_viewer(self) -> None:
        """Fill the place holder output with glu-jupyter widgets"""

        all_tabs = self._document.get_tab_names()
        for frontend_tab in list(self._viewers):
            if frontend_tab not in all_tabs:
                # Tab removed from the frontend
                self.remove_tab(frontend_tab)

        for tab_name in all_tabs:
            document_tab_data = self._document.get_tab_data(tab_name)
            if document_tab_data is None:
                continue

            saved_tab_viewers = list(self._viewers.get(tab_name, {}))
            for saved_viewer_id in saved_tab_viewers:
                if saved_viewer_id not in document_tab_data:
                    # Viewer removed from frontend
                    self.remove_viewer(tab_name, saved_viewer_id)

            for viewer_id in document_tab_data:
                saved_viewer = self._viewers.get(tab_name, {}).get(viewer_id)

                view_type, state = self._read_view_state(tab_name, viewer_id)
                data_name = state.get("layer", None)
                if data_name is not None:
                    data = self._data.get(data_name, None)
                else:
                    data = None

                if saved_viewer is not None:
                    if saved_viewer["widget"] is not None:
                        continue
                    output = saved_viewer["output"]
                    output.clear_output()
                    with output:
                        widget = self._viewer_factory(
                            view_type=view_type, viewer_data=data, viewer_state=state
                        )

                    saved_viewer["widget"] = widget

                    # This may be the error widget
                    if widget is None or not hasattr(widget, "viewer_options"):
                        with output:
                            display(widget)
                        return

                    viewer_options = widget.viewer_options
                    try:
                        layer_options = LayerOptionsWidget(widget)
                    except Exception:
                        layer_options = None

                    saved_viewer["viewer_options"] = viewer_options
                    saved_viewer["layer_options"] = layer_options

                else:
                    widget = self._viewer_factory(
                        view_type=view_type,
                        viewer_data=data,
                        viewer_state=state,
                    )

                    # This may be the error widget
                    if widget is None or not hasattr(widget, "viewer_options"):
                        return

                    viewer_options = widget.viewer_options
                    try:
                        layer_options = LayerOptionsWidget(widget)
                    except Exception:
                        layer_options = None
                    # No existing viewer, create widget only.
                    if tab_name in self._viewers:
                        self._viewers[tab_name][viewer_id] = {
                            "widget": widget,
                            "viewer_options": viewer_options,
                            "layer_options": layer_options,
                        }
                    else:
                        self._viewers[tab_name] = {
                            viewer_id: {
                                "widget": widget,
                                "viewer_options": viewer_options,
                                "layer_options": layer_options,
                            }
                        }

    def render_config(self, config: str, tab_id: str, viewer_id: str):
        """Get the config widgets of a viewer and display it in
        the frontend

        Args:
            config (str): Type of the config widget
            tab_id (str): Id of the tab containing viewer
            viewer_id (str): Id of the viewer
        """
        viewer: IPyWidgetView = self._viewers.get(tab_id, {}).get(viewer_id, None)
        if viewer is not None:
            widget = None
            if config == "Viewer":
                widget = viewer.get("viewer_options")
            elif config == "Layer":
                widget = viewer.get("layer_options")
            if widget is not None:
                display(widget)

    def _viewer_factory(
        self, view_type: str, viewer_data: any, viewer_state: dict
    ) -> Optional[Widget]:
        """Create widget for viewer

        Args:
            view_type (str): Type of the widget, it is taken from
            the session file.
            viewer_data (any): The data used to create the glue-jupyter widget
            viewer_state (dict): The state of the widget, it is taken from
            the session file.

        Returns:
            Optional[Widget]: The glue-jupyter widget
        """

        widget = None
        if view_type == "glue.viewers.scatter.qt.data_viewer.ScatterViewer":
            try:
                widget = self.app.scatter2d(data=viewer_data)
                for key, value in viewer_state.items():
                    try:
                        setattr(widget.state, key, value)
                    except Exception:
                        pass
            except Exception as e:
                widget = ErrorWidget(e, __file__)

        elif view_type == "glue.viewers.image.qt.data_viewer.ImageViewer":
            try:
                widget = self.app.imshow(data=viewer_data)
            except Exception as e:
                print(e)
        elif view_type == "glue.viewers.histogram.qt.data_viewer.HistogramViewer":
            try:
                widget = self.app.histogram1d(data=viewer_data)
                for key, value in viewer_state.items():
                    try:
                        setattr(widget.state, key, value)
                    except Exception:
                        pass
            except Exception as e:
                widget = ErrorWidget(e, __file__)
        elif view_type == "glue.viewers.table.qt.data_viewer.TableViewer":
            try:
                widget = self.app.table(data=viewer_data)
                for key, value in viewer_state.items():
                    try:
                        setattr(widget.state, key, value)
                    except Exception:
                        pass
            except Exception as e:
                widget = ErrorWidget(e, __file__)
        elif (
            view_type == "glue_vispy_viewers.scatter.scatter_viewer.VispyScatterViewer"
        ):
            try:
                widget = self.app.scatter3d(data=viewer_data)
                for key, value in viewer_state.items():
                    try:
                        setattr(widget.state, key, value)
                    except Exception:
                        pass
            except Exception as e:
                widget = ErrorWidget(e, __file__)
        elif view_type == "glue.viewers.profile.state.ProfileLayerState":
            try:
                widget = self.app.profile1d(data=viewer_data)
                for key, value in viewer_state.items():
                    try:
                        setattr(widget.state, key, value)
                    except Exception:
                        pass
            except Exception as e:
                widget = ErrorWidget(e, __file__)

        return widget

    def _read_view_state(
        self, tab_name: str, viewer_id: str
    ) -> Tuple[Optional[str], Dict]:
        """Generate the view state from viewer id and tab name

        Args:
            tab_name (str): Name of the tab
            viewer_id (str): Id of the viewer

        Returns:
            Tuple[Optional[str], Dict]: Viewer type and the state of the
            viewer
        """
        state = {}
        tab_data = self._document.get_tab_data(tab_name)
        contents = self._document.contents
        if tab_data is None:
            return state

        viewer_data = tab_data.get(viewer_id, {})
        view_type: str = viewer_data.get("_type")
        state_values = viewer_data.get("state", {}).get("values", {})
        # Extract plot state
        for prop, value in state_values.items():
            if isinstance(value, str) and value.startswith("st__"):
                state[prop] = value[4:]
            else:
                state[prop] = value

        # Merging the state with what's specified in "layers"
        # Only taking the state of the first layer
        # TODO Support multiple layers??
        layers = viewer_data.get("layers", [])
        if len(layers) > 0 and layers[0].get("state") in contents:
            extra_state = contents.get(layers[0].get("state"), {}).get("values", {})
            for prop, value in extra_state.items():
                if isinstance(value, str) and value.startswith("st__"):
                    state[prop] = value[4:]
                else:
                    state[prop] = value
        return view_type, state

    def _init_ydoc(self) -> None:
        """Initialize the `YGlue` document and populate its contents
        by using the `ypywidgets.Widget`
        """

        self._sessionYDoc = Y.YDoc()
        # Import `glue-jupyterlab.glue_ydoc.YGlue`` class through `jupyter_ydoc``
        self._document: YGlue = ydocs.get("glu")(self._sessionYDoc)
        self._document.observe(self._on_document_change)
        self._ywidget = Widget(
            comm_metadata=dict(
                ymodel_name="GlueSession", create_ydoc=False, path=self._path
            ),
            ydoc=self._sessionYDoc,
        )

    def add_viewer_layer(self, tab_name: str, viewer_name: str, data_name: str) -> None:
        """Add a layer with new dataset to a viewer"""
        viewer = (
            self._viewers.get(tab_name, {}).get(viewer_name, {}).get("widget", None)
        )
        if not viewer:
            return
        data = self._data[data_name]
        viewer.add_data(data)

    def add_data(self, file_path: str) -> None:
        """Add a new data file to the session"""
        relative_path = Path(file_path).relative_to(Path(self._path).parent)
        assert os.path.exists(relative_path)

        data = self.app.load_data(str(relative_path))

        # Serialize the data on its own (without other context).
        data_serializer = GlueSerializer(data)
        data_serializer.dumpo()

        # Serialize the previous data without the new one to create a context.
        previous_data_serializer = GlueSerializer(self._data)
        previous_data_serializer.dumpo()

        # We generate the data representation in the previous data context.
        serialized_data = [
            (previous_data_serializer.id(obj), previous_data_serializer.do(obj))
            for oid, obj in list(data_serializer._objs.items())
        ]
        serialized_data = dict(serialized_data)

        contents = self._document.contents

        # Inject all components
        for key, value in serialized_data.items():
            if key != "__main__":
                contents[key] = value

        # Inject the label in the data collection
        data_collection_name: str = contents.get("__main__", {}).get("data", "")
        contents[data_collection_name]["data"].append(data.label)
        contents[data_collection_name]["cids"].extend(
            cid for cid, comp in serialized_data[data.label]["components"]
        )
        contents[data_collection_name]["components"].extend(
            comp for cid, comp in serialized_data[data.label]["components"]
        )

        self._data[data.label] = data
        self._document.set(json.dumps(contents))

    def _load_data(self) -> None:
        """Load data defined in the glue session"""
        data_paths = {}
        contents = self._document.contents
        if "LoadLog" in contents:
            path = Path(contents["LoadLog"]["path"])
            data_paths[path.stem] = str(path)
        idx = 0
        while True:
            load_log = f"LoadLog_{idx}"
            if load_log not in contents:
                break
            path = Path(contents[load_log]["path"])
            data_paths[path.stem] = str(path)
            idx += 1

        for data_name, data_path in data_paths.items():
            if data_name not in self._data:
                self._data[data_name] = self.app.load_data(data_path)

    def _update_links(self, changes: Dict) -> None:
        for change in changes.values():
            if change["action"] == "add":
                link_desc = change["newValue"]
                if (
                    link_desc.get("_type", "") == COMPONENT_LINK_TYPE
                    and link_desc.get("using", {}).get("function", None)
                    == IDENTITY_LINK_FUNCTION
                ):
                    if not self._get_identity_link(link_desc):
                        self._add_identity_link(link_desc)
            if change["action"] == "delete":
                link_desc = change["oldValue"]
                if (
                    link_desc.get("_type", "") == COMPONENT_LINK_TYPE
                    and link_desc.get("using", {}).get("function", None)
                    == IDENTITY_LINK_FUNCTION
                ):
                    link = self._get_identity_link(link_desc)
                    if link:
                        self.app.data_collection.remove_link(link)

    def _get_identity_link(self, link_desc: Dict) -> Optional[LinkSame]:
        # Build a list of elements to compare (datasets names and attributes names).
        # The order of the list allows to easily compare a reversed link, which is
        # the same link in the case of identity links.
        desc_lst = [
            link_desc["data1"],
            link_desc["cids1_labels"],
            link_desc["cids2_labels"],
            link_desc["data2"],
        ]
        links = self.app.data_collection.external_links
        for link in links:
            if not link.display == "identity link":
                continue
            link_lst = [
                link.data1.label,
                [str(id) for id in link.cids1],
                [str(id) for id in link.cids2],
                link.data2.label,
            ]
            if desc_lst == link_lst or desc_lst == link_lst[::-1]:
                return link
        return None

    def _add_identity_link(self, link_desc: Dict) -> None:
        data1 = self._data[link_desc["data1"]]
        data2 = self._data[link_desc["data2"]]
        attributes1 = data1.id[link_desc["cids1_labels"][0]]
        attributes2 = data2.id[link_desc["cids2_labels"][0]]
        link = LinkSame(attributes1, attributes2)
        self.app.data_collection.add_link(link)

    def _on_document_change(self, target, event):
        """Callback on ydoc changed event."""
        if target == "contents":
            self._load_data()
        elif target == "tabs":
            self._load_data()
            self.render_viewer()
        elif target == "links":
            self._load_data()
            self._update_links(event.keys)
            self.render_viewer()
