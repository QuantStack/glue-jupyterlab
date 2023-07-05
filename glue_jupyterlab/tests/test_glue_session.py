import y_py as Y
from copy import deepcopy
from pathlib import Path
from ipywidgets import Output
from glue_jupyterlab.glue_session import SharedGlueSession
from glue_jupyterlab.glue_utils import nested_compare


def test_init(session_path):
    glue_session = SharedGlueSession(session_path)
    assert isinstance(glue_session, SharedGlueSession)
    assert glue_session.app is not None
    assert isinstance(glue_session._sessionYDoc, Y.YDoc)


def test__load_data(yglue_session):
    yglue_session._load_data()
    assert "w5" in yglue_session._data
    assert "w5_psc" in yglue_session._data


def test_create_viewer(yglue_session):
    yglue_session.create_viewer("Tab 1", "ScatterViewer")
    assert "Tab 1" in yglue_session._viewers
    assert "ScatterViewer" in yglue_session._viewers["Tab 1"]
    assert yglue_session._viewers["Tab 1"]["ScatterViewer"]["widget"] is None
    assert isinstance(
        yglue_session._viewers["Tab 1"]["ScatterViewer"]["output"], Output
    )


def test_remove_viewer(yglue_session):
    yglue_session.create_viewer("Tab 1", "ScatterViewer")
    yglue_session.remove_viewer("Tab 1", "ScatterViewer")
    assert "Tab 1" in yglue_session._viewers
    assert "ScatterViewer" not in yglue_session._viewers["Tab 1"]


def test_remove_tab(yglue_session):
    yglue_session.create_viewer("Tab 1", "ScatterViewer")
    yglue_session.remove_tab("Tab 1")
    assert "Tab 1" not in yglue_session._viewers


def test_render_viewer(yglue_session):
    yglue_session._load_data()
    yglue_session.create_viewer("Tab 1", "ScatterViewer")
    yglue_session.render_viewer()
    assert yglue_session._viewers["Tab 1"]["ScatterViewer"]["widget"] is not None


def test_render_removed_viewer(yglue_session):
    yglue_session._load_data()
    yglue_session.create_viewer("Tab 1", "ScatterViewer")
    yglue_session._document.remove_tab_viewer("Tab 1", "ScatterViewer")
    yglue_session.render_viewer()
    assert "ScatterViewer" not in yglue_session._viewers["Tab 1"]


def test__read_view_state(yglue_session):
    yglue_session._load_data()
    view_type, state = yglue_session._read_view_state("Tab 1", "ScatterViewer")
    assert view_type == "glue.viewers.scatter.qt.data_viewer.ScatterViewer"
    assert len(state) > 0


def test_add_data(yglue_session):
    yglue_session._load_data()
    file_path = Path(__file__).parents[2] / "examples" / "w6_psc.vot"

    contents = deepcopy(yglue_session._document.contents)
    yglue_session.add_data(file_path)
    updated_contents = yglue_session._document.contents

    assert "w6_psc" in updated_contents.keys()

    # Assert there is no change in previous structure
    for key, value in contents.items():
        if key == "DataCollection":
            continue
        assert key in updated_contents.keys()
        assert nested_compare(value, updated_contents[key])

    # Compare the DataCollection
    for key, value in contents["DataCollection"].items():
        if key == "data" or key == "cids" or key == "components":
            assert not nested_compare(value, updated_contents["DataCollection"][key])
        else:
            assert nested_compare(value, updated_contents["DataCollection"][key])

    assert "w6_psc" in updated_contents["DataCollection"]["data"]


def test_add_identity_link(yglue_session, identity_link):
    yglue_session._load_data()
    change = {"LinkTest": {"action": "add", "newValue": identity_link}}
    yglue_session._update_links(change)

    assert yglue_session._get_identity_link(identity_link) is not None


def test_delete_identity_link(yglue_session, identity_link):
    test_add_identity_link(yglue_session, identity_link)
    change = {"LinkTest": {"action": "delete", "oldValue": identity_link}}
    yglue_session._update_links(change)

    assert yglue_session._get_identity_link(identity_link) is None
