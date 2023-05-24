from typing import Dict
import json
from ypywidgets import Widget
from jupyter_ydoc import ydocs
import y_py as Y
import glue_jupyter as gj
from ipywidgets import Output
from pathlib import Path
import warnings
from IPython.display import display

warnings.filterwarnings("ignore")


class SharedGlueSession:
    def __init__(self, path: str):
        self.app = gj.jglue()
        self._path = path
        self._viewers = {}
        self._data = {}
        self.init_ydoc()

    def create_viewer(
        self, tab_name: str, viewer_id: str, view_type: str, state, render_view=True
    ):
        if tab_name in self._viewers:
            if viewer_id not in self._viewers[tab_name]:
                self._viewers[tab_name][viewer_id] = dict(
                    output=Output(), view_type=view_type, state=state, rendered=False
                )
        else:
            self._viewers[tab_name] = {
                viewer_id: dict(
                    output=Output(), view_type=view_type, state=state, rendered=False
                )
            }

        if render_view:
            display(self._viewers[tab_name][viewer_id]["output"])

    def init_ydoc(self):
        self._sessionYDoc = Y.YDoc()

        self._document = ydocs.get("glu")(self._sessionYDoc)
        self._document.observe(self._on_document_change)
        self._ywidget = Widget(
            comm_metadata=dict(
                ymodel_name="GlueSession", create_ydoc=False, path=self._path
            ),
            ydoc=self._sessionYDoc,
        )

    def load_data(self):
        data_paths = {}
        contents = json.loads(self._document._ycontents.to_json())
        session_path = Path(self._path).parent
        if "LoadLog" in contents:
            path = Path(contents["LoadLog"]["path"])
            data_paths[path.stem] = str(session_path / path)
        idx = 0
        while f"LoadLog_{idx}" in contents:
            path = Path(contents[f"LoadLog_{idx}"]["path"])
            data_paths[path.stem] = str(session_path / path)
            idx += 1

        for data_name, data_path in data_paths.items():
            if data_name not in self._data:
                self._data[data_name] = self.app.load_data(data_path)

    def render_viewer(self):
        all_tab_data = json.loads(self._document._ytabs.to_json())
        for tab_name in self._viewers:
            tab_data: Dict = all_tab_data.get(tab_name, {})
            for viewer_id in tab_data:
                saved_viewer = self._viewers.get(tab_name, {}).get(viewer_id)
                if saved_viewer is not None:
                    if saved_viewer["rendered"]:
                        continue
                    output = saved_viewer["output"]
                    view_type = saved_viewer["view_type"]
                    state = saved_viewer["state"]
                    data = self._data[state["layer"]]
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

    def _on_document_change(self, target, event):
        if target == "contents":
            self.load_data()
        if target == "tabs":
            self.load_data()
            self.render_viewer()
