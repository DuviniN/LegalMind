import pytest

from simple_agent.graph import graph

pytestmark = pytest.mark.anyio

async def test_legalmind_agent_graph_imports() -> None:
    assert hasattr(graph, "ainvoke")
