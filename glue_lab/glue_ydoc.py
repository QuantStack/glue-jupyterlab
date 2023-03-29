import json
from typing import Any

from jupyter_ydoc.ybasedoc import YBaseDoc


class YGlue(YBaseDoc):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._ysource = self._ydoc.get_text("source")
        self._ysession = self._ydoc.get_map("session")
        
    def get(self) -> str:
        """
        Returns the content of the document.
        :return: Document's content.
        :rtype: Any
        """
        session = self._ysession.to_json()
        return json.dumps(session)

    def set(self, value: str) -> None:
        """
        Sets the content of the document.
        :param value: The content of the document.
        :type value: Any
        """
        session = json.loads(value)
        with self._ydoc.begin_transaction() as t:
            self._ysession.update(t, session.items())

    def observe(self, callback):
        self.unobserve()
        self._subscriptions[self._ystate] = self._ystate.observe(callback)
        self._subscriptions[self._ysource] = self._ysource.observe(callback)
        self._subscriptions[self._ysession] = self._ysession.observe_deep(callback)
