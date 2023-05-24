from pathlib import Path
import json

# Loading glue_lab.glue_ydoc.YGlue class through jupyter_ydoc
from jupyter_ydoc import ydocs



def test_set():
    with open(Path(__file__).parent / "assets" / "session.glu", "r") as fobj:
        data = fobj.read()

    glue = ydocs["glu"]()

    glue.set(data)

    assert "Tab 1" in glue._ytabs
    assert "Tab 2" in glue._ytabs

    assert "HistogramViewer" in glue._ycontents

    assert "DEJ2000" in glue._yattributes

    assert "w5_psc" in glue._ydataset


def test_get():
    with open(Path(__file__).parent / "assets" / "session.glu", "r") as fobj:
        data = fobj.read()

    glue = ydocs["glu"]()

    glue.set(data)

    content = glue.get()

    # Test that reading and saving does not change the content
    assert json.loads(data) == json.loads(content)

    ## Fake editing of the y structure
    with glue._ydoc.begin_transaction() as t:
        # Create a new tab
        old_tabs = json.loads(glue._ytabs.to_json())
        old_tabs["Tab 3"] = {
            "NewScatter": {
                "_type": "glue.viewers.scatter.qt.data_viewer.ScatterViewer",
                "pos": [0, 0],
                "session": "Session",
                "size": [600, 400],
                "state": {"values": {"layer": "w5"}},
            }
        }

        glue._ytabs.update(t, old_tabs.items())

    updated_content = json.loads(glue.get())

    assert "Tab 3" in updated_content["__main__"]["tab_names"]
    assert len(updated_content["__main__"]["viewers"]) == 3
    assert "NewScatter" in updated_content["__main__"]["viewers"][2]
