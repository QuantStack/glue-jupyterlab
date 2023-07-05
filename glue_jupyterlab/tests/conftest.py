import os
import pytest
from pathlib import Path
from jupyter_ydoc import ydocs
from glue_jupyterlab.glue_session import SharedGlueSession
from glue_jupyterlab.glue_ydoc import COMPONENT_LINK_TYPE, IDENTITY_LINK_FUNCTION


@pytest.fixture
def session_path():
    return str(Path(__file__).parents[2] / "examples" / "session.glu")


@pytest.fixture
def session_links_path():
    return str(Path(__file__).parents[2] / "examples" / "session3.glu")


@pytest.fixture(scope="function")
def yglue_doc(session_path):
    with open(session_path, "r") as fobj:
        data = fobj.read()

    os.chdir(Path(__file__).parents[2] / "examples")

    glue = ydocs["glu"]()
    glue.set(data)

    return glue


@pytest.fixture(scope="function")
def yglue_session(session_path, yglue_doc):
    glue_session = SharedGlueSession(session_path)
    glue_session._document = yglue_doc

    return glue_session


@pytest.fixture(scope="function")
def yglue_doc_links(session_links_path):
    with open(session_links_path, "r") as fobj:
        data = fobj.read()

    os.chdir(Path(__file__).parents[2] / "examples")

    glue = ydocs["glu"]()
    glue.set(data)

    return glue


@pytest.fixture
def identity_link():
    return {
        "_type": COMPONENT_LINK_TYPE,
        "data1": "w5",
        "data2": "w5_psc",
        "cids1": ["Declination"],
        "cids2": ["DEJ2000"],
        "cids1_labels": ["Declination"],
        "cids2_labels": ["DEJ2000"],
        "using": {"function": IDENTITY_LINK_FUNCTION},
    }
