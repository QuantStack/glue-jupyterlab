import pytest
from pathlib import Path
from jupyter_ydoc import ydocs
from glue_lab.glue_session import SharedGlueSession


@pytest.fixture
def session_path():
    return str(Path(__file__).parents[2] / "examples" / "session.glu")


@pytest.fixture(scope="function")
def yglue_doc(session_path):
    with open(session_path, "r") as fobj:
        data = fobj.read()

    glue = ydocs["glu"]()
    glue.set(data)

    return glue


@pytest.fixture(scope="function")
def yglue_session(session_path, yglue_doc):
    glue_session = SharedGlueSession(session_path)
    glue_session._document = yglue_doc

    return glue_session
