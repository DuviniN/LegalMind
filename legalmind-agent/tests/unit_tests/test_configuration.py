from simple_agent.graph import graph, handle_agent_query


def test_graph_compiles() -> None:
    assert hasattr(graph, "ainvoke")


def test_handle_agent_query_is_available() -> None:
    assert callable(handle_agent_query)
