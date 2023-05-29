import json


def test_set(yglue_doc):
    assert "Tab 1" in yglue_doc._ytabs
    assert "Tab 2" in yglue_doc._ytabs

    assert "HistogramViewer" in yglue_doc._ycontents

    assert "DEJ2000" in yglue_doc._yattributes

    assert "w5_psc" in yglue_doc._ydataset


def test_get(session_path, yglue_doc):
    with open(session_path, "r") as fobj:
        data = fobj.read()

    content = yglue_doc.get()

    # Test that reading and saving does not change the content
    assert json.loads(data) == json.loads(content)

    ## Fake editing of the y structure
    with yglue_doc._ydoc.begin_transaction() as t:
        # Create a new tab
        old_tabs = json.loads(yglue_doc._ytabs.to_json())
        old_tabs["Tab 3"] = {
            "NewScatter": {
                "_type": "glue.viewers.scatter.qt.data_viewer.ScatterViewer",
                "pos": [0, 0],
                "session": "Session",
                "size": [600, 400],
                "state": {"values": {"layer": "w5"}},
            }
        }

        yglue_doc._ytabs.update(t, old_tabs.items())

    updated_content = json.loads(yglue_doc.get())

    assert "Tab 3" in updated_content["__main__"]["tab_names"]
    assert len(updated_content["__main__"]["viewers"]) == 3
    assert "NewScatter" in updated_content["__main__"]["viewers"][2]
