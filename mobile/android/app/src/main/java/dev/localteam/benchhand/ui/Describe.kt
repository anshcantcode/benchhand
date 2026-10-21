package dev.localteam.benchhand.ui

import dev.localteam.benchhand.Approval
import org.json.JSONObject

/** Words for an approval, matching how the desktop's Approvals page reads. */
object Describe {
    private fun JSONObject.text(k: String) = opt(k)?.let { if (it is String) it else it.toString() }.orEmpty()

    /** The thing itself: an issue's title, a message's first line, a sentence for a click. */
    fun headline(a: Approval): String {
        val x = a.arguments
        val tool = a.toolName
        return when {
            tool.startsWith("github_create_issue") -> x.text("title")
            tool.startsWith("slack_send") -> x.text("text").lineSequence().firstOrNull().orEmpty()
            tool.startsWith("computer_") -> computer(tool, x)
            else -> a.title
        }.ifBlank { a.title }
    }

    /** Where it goes: "GitHub · owner/repo", "Slack · #channel", "This computer". */
    fun where(a: Approval): String {
        val x = a.arguments
        return when {
            a.toolName.startsWith("github_create_issue") -> "GitHub · ${x.text("repository")}"
            a.toolName.startsWith("slack_send") -> "Slack · ${x.text("channel")}"
            a.toolName.startsWith("computer_") -> "This computer"
            else -> a.target
        }
    }

    /** What the teammate wants to do, for a sentence: "open this issue", "send this message". */
    fun verb(a: Approval) = when {
        a.toolName.startsWith("github_create_issue") -> "open this issue"
        a.toolName.startsWith("slack_send") -> "send this message"
        a.toolName.startsWith("computer_") -> "use this computer"
        else -> "run ${a.toolName.ifBlank { "this tool" }}"
    }

    fun computer(tool: String, x: JSONObject): String {
        val at = "${x.text("x")}, ${x.text("y")}"
        val on = if (x.has("displayId")) " on display ${x.text("displayId")}" else ""
        return when (tool) {
            "computer_click" -> (if (x.optInt("count") == 2) "Double-click" else "Click") +
                (x.optString("button").takeIf { it.isNotBlank() && it != "left" }?.let { " the $it button" } ?: "") + " at $at$on"
            "computer_move" -> "Move the pointer to $at$on"
            "computer_drag" -> "Drag from $at to ${x.text("toX")}, ${x.text("toY")}$on"
            "computer_type" -> "Type “${x.text("text")}” into the focused control"
            "computer_key" -> "Press ${x.text("keys")}"
            "computer_scroll" -> "Scroll ${x.text("direction")} by ${plural(x.optInt("steps"), "step")}"
            else -> "Use this computer"
        }
    }

    /** "repository" → "Repository", "displayId" → "Display id". */
    fun fieldName(k: String) = k.replace(Regex("[_-]+"), " ").replace(Regex("([a-z])([A-Z])"), "$1 $2")
        .lowercase().replaceFirstChar { it.uppercase() }

    fun outcome(a: Approval) = when (a.status) {
        "approved" -> if (a.edited) "Edited, then approved" else "Approved"
        "rejected" -> "Rejected"
        else -> a.status.replaceFirstChar { it.uppercase() }
    }
}
