import json


async def test_get_advanced_links_list(jp_fetch):
    # When
    response = await jp_fetch("glue-jupyterlab", "advanced-links")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert list(payload["data"].keys()) == ["General", "Astronomy", "Join"]
