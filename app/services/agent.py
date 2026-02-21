import operator
import re
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from app.core.config import settings
from app.services.vision import analyze_brain_scan, classifier_instance

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    tool_call_count: int  # Guards against infinite tool loops

tools = [analyze_brain_scan]

llm = ChatOpenAI(
    model=settings.LLM_MODEL,
    base_url=settings.LLM_BASE_URL,
    api_key=settings.LLM_API_KEY
)

llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = """You are MedBot, an advanced, highly capable medical-grade AI assistant passing the USMLE and specializing in neuro-oncology.
You have access to a vision tool (`analyze_brain_scan`) to classify brain tumors from MRI scans.

CRITICAL INSTRUCTIONS:
1. ALWAYS use the `analyze_brain_scan` tool if an image path is provided.
2. The vision tool provides the primary diagnosis and a probability distribution across categories.
3. Map the tool's probability distribution to the `differential_diagnosis` JSON list.
4. For the "location" field: Look at the brain scan image provided directly. Identify the specific anatomical region where the pathology is visually present. Use precise neuroimaging terminology (e.g. "Left Temporal Lobe", "Parasagittal", "Sellar region", "Fourth Ventricle"). Do NOT use generic class-level references.
5. The vision tool DOES NOT predict tumor grade. You MUST use your neuro-oncology knowledge to provide the most typical WHO grade for the predicted tumor type. Prefix with "Typical: ".
6. Provide actionable, prioritized recommendations.
7. Add a triage urgency level: URGENT / SOON / ROUTINE.
8. Respond ONLY with valid JSON exactly matching the structure below. No explanations outside the JSON block.

JSON SCHEMA:
{
  "primary_diagnosis": "string",
  "confidence": "string (e.g., '98.6%')",
  "grade": "string (e.g., 'Typical: WHO Grade II')",
  "location": "string (specific anatomical region from visual inspection of the scan)",
  "differential_diagnosis": [
    {"condition": "string", "probability": "string"}
  ],
  "recommendations": ["string", "string"],
  "triage_urgency": "URGENT | SOON | ROUTINE"
}
"""

def call_model(state: AgentState):
    """Invokes the MedGemma model on the current conversation state."""
    messages = state["messages"]
    
    # Prepend SystemMessage if not present
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(messages)
        
    response = llm_with_tools.invoke(messages)
    # Only return messages; do NOT touch tool_call_count here — it is managed by tool_node_with_counter
    return {"messages": [response]}

def should_continue(state: AgentState):
    """Determines whether to fire off a tool or end the loop."""
    last_message = state["messages"][-1]
    tool_call_count = state.get("tool_call_count", 0)
    
    # Hard stop: vision tool should only ever be called once
    if tool_call_count >= 1:
        return "end"
    
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "continue"
    return "end"

def tool_node_with_counter(state: AgentState):
    """Wraps ToolNode execution and increments the tool call counter."""
    tool_result = ToolNode(tools).invoke(state)
    new_count = state.get("tool_call_count", 0) + 1
    return {**tool_result, "tool_call_count": new_count}

workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("action", tool_node_with_counter)
workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue, {"continue": "action", "end": END})
workflow.add_edge("action", "agent")
app = workflow.compile()

def clean_medgemma_response(text) -> str:
    """Removes MedGemma's internal <unused94>thought...</unused95> tokens.
    Handles both string and list (multimodal) content types."""
    # Multimodal messages return content as a list of dicts; extract text parts only
    if isinstance(text, list):
        text = " ".join(
            part.get("text", "") for part in text if isinstance(part, dict) and part.get("type") == "text"
        )
    cleaned = re.sub(r'<unused94>.*?(<unused95>|$)', '', text, flags=re.DOTALL)
    return cleaned.strip()

def encode_image_b64(image_path: str) -> tuple[str, str]:
    """Returns (mime_type, base64_data) for a local image file."""
    import base64, mimetypes
    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")
    mime_type = mimetypes.guess_type(image_path)[0] or "image/jpeg"
    return mime_type, image_data

def run_agent(user_query: str, image_path: str = None) -> str:
    if image_path:
        # ── IMAGE PATH: Direct pipeline (no LangGraph overhead) ──────────────
        # Phase 1: Call the vision classifier directly - always reliable
        print(f"[Phase 1] Running vision classifier on {image_path}...")
        tool_result_text = classifier_instance.analyze_scan(image_path)
        print(f"[Phase 1] Result: {tool_result_text[:80]}...")

        # Phase 2: Direct LLM call with image + tool results for JSON synthesis
        mime_type, image_data = encode_image_b64(image_path)
        synthesis_content = [
            {"type": "text", "text": (
                f"The vision classification tool returned the following result:\n\n"
                f"{tool_result_text}\n\n"
                f"Visually inspect the attached brain scan image and produce your structured JSON report."
            )},
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{image_data}"}
            }
        ]

        synthesis_messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=synthesis_content)
        ]

        print("[Phase 2] Calling MedGemma for JSON synthesis...")
        response = llm.invoke(synthesis_messages)
        raw = response.content if response.content else "Error: MedGemma returned empty synthesis."
        print(f"[Phase 2] Raw: {str(raw)[:120]}")
        return clean_medgemma_response(raw)

    else:
        # ── TEXT ONLY: Conversational agent via LangGraph ─────────────────────
        from langchain_core.messages import AIMessage
        inputs = {"messages": [HumanMessage(content=user_query)], "tool_call_count": 0}
        final_response_raw = "Error: No response generated by MedGemma."

        for output in app.stream(inputs, stream_mode="values", config={"recursion_limit": 6}):
            if "messages" in output:
                last_msg = output["messages"][-1]
                if isinstance(last_msg, AIMessage) and last_msg.content:
                    final_response_raw = last_msg.content

        return clean_medgemma_response(final_response_raw)



