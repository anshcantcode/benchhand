package dev.localteam.benchhand.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import dev.localteam.benchhand.Approval
import dev.localteam.benchhand.Step
import dev.localteam.benchhand.Summary
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener

/** The drafts of an approval's inputs. Each control follows the original value's type, as on the desktop. */
class Drafts(private val original: JSONObject) {
    val values = mutableStateMapOf<String, String>().apply {
        original.keys().forEach { k -> put(k, text(original.get(k))) }
    }
    /** Where it goes, then what it says, then everything else; JSON key order is not meaningful. */
    val keys: List<String> = original.keys().asSequence().toList()
        .sortedBy { listOf("repository", "channel", "path", "title", "text", "body").indexOf(it).let { i -> if (i < 0) 99 else i } }

    fun kind(k: String) = when (val v = original.get(k)) {
        is Boolean -> "boolean"
        is Number -> "number"
        is String -> if (v.length < 70 && '\n' !in v) "line" else "text"
        else -> "json"
    }

    fun changed(k: String) = values[k] != text(original.get(k))
    val edited get() = keys.any(::changed)

    /** The inputs to send, or an error naming the field that cannot be read. */
    fun build(): Result<JSONObject> = runCatching {
        val out = JSONObject(original.toString())
        for (k in keys) {
            val v = values[k].orEmpty()
            out.put(k, when (kind(k)) {
                "boolean" -> v == "true"
                "number" -> v.trim().toDoubleOrNull()?.let { if (it % 1.0 == 0.0 && original.get(k) is Int) it.toInt() else it }
                    ?: error("${Describe.fieldName(k)} must be a number.")
                "json" -> runCatching { JSONTokener(v).nextValue() }.getOrNull()?.takeIf { it is JSONObject || it is JSONArray || it == JSONObject.NULL }
                    ?: error("${Describe.fieldName(k)} must be valid JSON.")
                else -> v
            })
        }
        out
    }

    private fun text(v: Any?): String = when (v) {
        is String -> v
        is JSONObject -> v.toString(2)
        is JSONArray -> v.toString(2)
        else -> v.toString()
    }
}

@Composable
fun DetailScreen(
    s: Summary, a: Approval, now: Long, drafts: Drafts, loadSteps: suspend (String) -> List<Step>, onBack: () -> Unit,
) {
    val name = s.mate(a.botId)?.name ?: "The teammate"
    var steps by remember(a.taskId) { mutableStateOf<List<Step>?>(null) }
    LaunchedEffect(a.taskId) { steps = loadSteps(a.taskId) }

    Box(Modifier.padding(start = 8.dp, top = 8.dp)) {
        Row(
            Modifier.clip(RoundedCornerShape(Space.radius)).clickable(role = Role.Button, onClick = onBack)
                .padding(horizontal = 8.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.back, C.text2, 18.dp)
            Spacer(Modifier.width(6.dp))
            T("Waiting", Type.body, C.text2)
        }
    }
    PageHead(a.title, "$name wants to ${Describe.verb(a)}. Waiting ${waited(now - a.createdAt)}.", top = 8.dp)

    SectionHead("What will be sent", if (drafts.keys.isEmpty()) null else "You can edit this", top = 4.dp)
    Panel {
        Column(Modifier.padding(vertical = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            if (a.toolName.startsWith("computer_")) {
                ReadOnly("Action", Describe.computer(a.toolName, a.arguments))
            }
            if (drafts.keys.isEmpty()) T("This action has no inputs.", Type.body, C.muted)
            drafts.keys.forEach { k ->
                val label = Describe.fieldName(k)
                val value = drafts.values[k].orEmpty()
                when (drafts.kind(k)) {
                    "boolean" -> Row(verticalAlignment = Alignment.CenterVertically) {
                        T(label + if (drafts.changed(k)) " · edited" else "", Type.bodyStrong, modifier = Modifier.weight(1f))
                        Toggle(value == "true", label, { drafts.values[k] = it.toString() })
                    }
                    "number" -> Field(label, value, { drafts.values[k] = it }, changed = drafts.changed(k), keyboard = KeyboardOptions(keyboardType = KeyboardType.Decimal))
                    "line" -> Field(label, value, { drafts.values[k] = it.replace('\n', ' ') }, lines = 0, changed = drafts.changed(k))
                    "text" -> Field(label, value, { drafts.values[k] = it }, lines = 8, changed = drafts.changed(k))
                    else -> Field("$label (JSON)", value, { drafts.values[k] = it }, lines = 5, mono = true, changed = drafts.changed(k))
                }
            }
            T(
                "You can change values, not add or remove them. $name is told exactly what ran.",
                Type.small, C.muted,
            )
        }
    }

    val list = steps
    SectionHead("How $name got here", list?.let { "${plural(it.size, "step")} · ${waited((a.createdAt - (list.firstOrNull()?.at ?: a.createdAt)).coerceAtLeast(0)).let { w -> if (w == "Now") "under a minute" else w }}" })
    Panel {
        Column(Modifier.padding(vertical = 6.dp)) {
            when {
                list == null -> T("Loading the run…", Type.body, C.muted, Modifier.padding(vertical = 9.dp))
                list.isEmpty() -> T("No steps recorded for this run.", Type.body, C.muted, Modifier.padding(vertical = 9.dp))
                else -> list.takeLast(40).forEachIndexed { i, step ->
                    val here = i == minOf(list.size, 40) - 1
                    Row(Modifier.fillMaxWidth().padding(vertical = 9.dp)) {
                        T(clock(step.at), Type.small, C.muted, Modifier.width(48.dp))
                        Spacer(Modifier.width(12.dp))
                        T(step.message, if (here) Type.bodyStrong else Type.body, if (here) C.text else C.text2, Modifier.weight(1f), maxLines = 6)
                    }
                }
            }
        }
    }
    Spacer(Modifier.height(24.dp))
}
