import sys
from importlib import util
from pathlib import Path

LEGALMIND_AGENT_LEAVE_TOOL = Path(__file__).resolve().parents[3] / "legalmind-agent" / "src" / "simple_agent" / "tools" / "leave_tool.py"
if not LEGALMIND_AGENT_LEAVE_TOOL.exists():
    raise ImportError(f"Expected legalmind-agent leave tool at {LEGALMIND_AGENT_LEAVE_TOOL}")

LEGALMIND_AGENT_SRC = LEGALMIND_AGENT_LEAVE_TOOL.parents[1]
if str(LEGALMIND_AGENT_SRC) not in sys.path:
    sys.path.insert(0, str(LEGALMIND_AGENT_SRC))

_spec = util.spec_from_file_location("legalmind_agent_leave_tool", LEGALMIND_AGENT_LEAVE_TOOL)
if _spec is None or _spec.loader is None:
    raise ImportError(f"Unable to load legalmind-agent leave tool from {LEGALMIND_AGENT_LEAVE_TOOL}")

_module = util.module_from_spec(_spec)
_spec.loader.exec_module(_module)

LeaveTool = _module.LeaveTool
leave_tool = _module.leave_tool
