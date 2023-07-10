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


def test_get_remove_tab(yglue_doc):
    ## Fake editing of the y structure
    with yglue_doc._ydoc.begin_transaction() as t:
        # Remove a tab
        yglue_doc._ytabs.pop(t, "Tab 1", None)

    updated_content = json.loads(yglue_doc.get())

    assert "Tab 1" not in updated_content["__main__"]["tab_names"]
    assert len(updated_content["__main__"]["viewers"]) == 1


def test_links(yglue_doc_links, identity_link):
    yglue_doc_links.get()
    links = yglue_doc_links.links
    required = [
        "_type",
        "data1",
        "data2",
        "cids1",
        "cids2",
        "cids1_labels",
        "cids2_labels",
    ]
    types = [str, str, str, list, list, list, list]

    # Links should have been populated according to the session file, and all links
    # should have the same schema.
    assert len(links) == 3
    for link in links.values():
        assert all(item in link.keys() for item in required)
        assert type(link["cids1"]) == list
        assert all(
            [type(link[key]) == value_type for key, value_type in zip(required, types)]
        )

    ## Fake editing of the y structure
    with yglue_doc_links._ydoc.begin_transaction() as t:
        links["TestLink"] = identity_link

        yglue_doc_links._ylinks.update(t, links.items())

    # The new link should be in the glue session content.
    updated_content = json.loads(yglue_doc_links.get())
    _data_collection_name: str = updated_content.get("__main__", {}).get("data", "")
    link_names = updated_content.get(_data_collection_name, {}).get("links", [])

    assert "TestLink" in link_names
