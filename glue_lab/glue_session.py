import warnings
from pathlib import Path
from typing import Dict, Optional, Tuple

import glue_jupyter as gj
import y_py as Y
from IPython.display import display
from ipywidgets import Output
from jupyter_ydoc import ydocs
from ypywidgets import Widget
from typing import TYPE_CHECKING

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

    def remove_tab(self, tab_name: str) -> None:
        """Remove a tab and all of its viewers

        Args:
            tab_name (str): Name of the tab
        """
        if tab_name not in self._viewers:
            return

        tab_viewers = self._viewers.pop(tab_name, {})
        for viewer in tab_viewers.values():
            out: Output = viewer.get("output")
            if out is not None:
                out.clear_output()

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
                self._viewers[tab_name][viewer_id] = dict(
                    output=Output(), rendered=False
                )
        else:
            self._viewers[tab_name] = {viewer_id: dict(output=Output(), rendered=False)}

        if display_view:
            display(self._viewers[tab_name][viewer_id]["output"])

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

    def render_viewer(self) -> None:
        """Fill the place holder output with glu-jupyter widgets"""

        for tab_name in self._viewers:
            document_tab_data = self._document.get_tab_data(tab_name)
            if document_tab_data is None:
                # Tab removed from the frontend
                self.remove_tab(tab_name)
                continue

            saved_tab_viewers = list(self._viewers.get(tab_name, {}))
            for saved_viewer_id in saved_tab_viewers:
                if saved_viewer_id not in document_tab_data:
                    # Viewer removed from frontend
                    self.remove_viewer(tab_name, saved_viewer_id)

            for viewer_id in document_tab_data:
                saved_viewer = self._viewers.get(tab_name, {}).get(viewer_id)
                if saved_viewer is not None:
                    if saved_viewer["rendered"]:
                        continue
                    output = saved_viewer["output"]
                    view_type, state = self._read_view_state(tab_name, viewer_id)
                    data_name = state.get("layer", None)
                    if data_name is not None:
                        data = self._data.get(data_name, None)
                    else:
                        data = None
                    if view_type == "glue.viewers.scatter.qt.data_viewer.ScatterViewer":
                        output.clear_output()
                        with output:
                            scatter = self.app.scatter2d(data=data)
                            for key, value in state.items():
                                try:
                                    setattr(scatter.state, key, value)
                                except Exception:
                                    pass
                    elif view_type == "glue.viewers.image.qt.data_viewer.ImageViewer":
                        output.clear_output()
                        with output:
                            self.app.imshow(data=data)
                    elif (
                        view_type
                        == "glue.viewers.histogram.qt.data_viewer.HistogramViewer"
                    ):
                        output.clear_output()
                        with output:
                            hist = self.app.histogram1d(data=data)
                            for key, value in state.items():
                                try:
                                    setattr(hist.state, key, value)
                                except Exception:
                                    pass
                    elif view_type == "glue.viewers.table.qt.data_viewer.TableViewer":
                        output.clear_output()
                        with output:
                            table = self.app.table(data=data)
                            for key, value in state.items():
                                try:
                                    setattr(table.state, key, value)
                                except Exception:
                                    pass
                    saved_viewer["rendered"] = True

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
        # Import `glue_lab.glue_ydoc.YGlue`` class through `jupyter_ydoc``
        self._document: YGlue = ydocs.get("glu")(self._sessionYDoc)
        self._document.observe(self._on_document_change)
        self._ywidget = Widget(
            comm_metadata=dict(
                ymodel_name="GlueSession", create_ydoc=False, path=self._path
            ),
            ydoc=self._sessionYDoc,
        )

    def _load_data(self) -> None:
        """Load data defined in the glue session"""
        data_paths = {}
        contents = self._document.contents
        session_path = Path(self._path).parent
        if "LoadLog" in contents:
            path = Path(contents["LoadLog"]["path"])
            data_paths[path.stem] = str(session_path / path)
        idx = 0
        while True:
            load_log = f"LoadLog_{idx}"
            if load_log not in contents:
                break
            path = Path(contents[load_log]["path"])
            data_paths[path.stem] = str(session_path / path)
            idx += 1

        for data_name, data_path in data_paths.items():
            if data_name not in self._data:
                self._data[data_name] = self.app.load_data(data_path)

    def _on_document_change(self, target, event):
        """Callback on ydoc changed event."""
        if target == "contents":
            self._load_data()
        elif target == "tabs":
            self._load_data()
            self.render_viewer()
