package dev.localteam.benchhand.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.localteam.benchhand.Mate
import dev.localteam.benchhand.Pairing
import dev.localteam.benchhand.Routine
import dev.localteam.benchhand.Summary

/* ---------- Team ---------- */

@Composable
fun TeamScreen(s: Summary, onTask: (Mate?) -> Unit) {
    val models = s.team.map { it.model }.filter { it.isNotBlank() }.distinct()
    PageHead(
        "Team",
        "${plural(s.team.size, "teammate")} on ${s.computer}" + when (models.size) {
            0 -> ". None has a model yet; choose one on the computer."
            1 -> ", all on ${models[0]}."
            else -> ", on ${models.size} models."
        },
        action = { Btn("New task", { onTask(null) }, kind = Kind.Primary, small = true, enabled = s.team.isNotEmpty()) },
    )
    Panel {
        Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
            Kpi("Waiting", s.pending.size.toString(), first = true)
            Kpi("Working", s.running.size.toString())
            Kpi("Runs, 24 h", s.team.sumOf { it.runsToday }.toString())
        }
    }
    SectionHead("Teammates", if (s.team.isEmpty()) null else "Last 24 hours")
    Panel {
        if (s.team.isEmpty()) T("Add teammates in Benchhand on the computer.", Type.body, C.muted, Modifier.padding(vertical = 16.dp))
        s.team.forEachIndexed { i, m ->
            Row(Modifier.fillMaxWidth().padding(vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                Initial(m.name, m.color)
                Spacer(Modifier.width(16.dp))
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Row(verticalAlignment = Alignment.Bottom) {
                        T(m.name, Type.section)
                        Spacer(Modifier.width(6.dp))
                        T(m.role, Type.small.copy(fontSize = Type.body.fontSize.times(14f / 15f)), C.muted, maxLines = 1)
                    }
                    T(state(m), Type.small.copy(fontSize = Type.body.fontSize.times(14f / 15f)), if (m.waiting > 0) C.accentInk else C.text2, maxLines = 2)
                }
                Spacer(Modifier.width(12.dp))
                TextAction("Give a task") { onTask(m) }
            }
            if (i < s.team.lastIndex) Rule()
        }
    }
    Spacer(Modifier.height(24.dp))
}

private fun state(m: Mate) = when {
    m.model.isBlank() -> "No model chosen"
    m.waiting > 0 -> "Waiting on you · ${plural(m.waiting, "action")}"
    m.running > 0 -> "Working · ${plural(m.running, "run")}"
    m.lastTask.isNotBlank() -> "Idle · last: ${m.lastTask}"
    else -> "Idle · ${m.model}"
}

@Composable
private fun androidx.compose.foundation.layout.RowScope.Kpi(label: String, value: String, first: Boolean = false) {
    Row(Modifier.weight(1f).fillMaxHeight()) {
        if (!first) Box(Modifier.width(1.dp).fillMaxHeight().background(C.rule))
        Column(Modifier.padding(start = if (first) 0.dp else 14.dp, top = 14.dp, bottom = 14.dp)) {
            T(label, Type.small, C.muted, maxLines = 1)
            Spacer(Modifier.height(2.dp))
            T(value, Type.figure.copy(fontFeatureSettings = "tnum"))
        }
    }
}

/* ---------- Routines ---------- */

@Composable
fun RoutinesScreen(s: Summary, busy: Boolean, onToggle: (Routine, Boolean) -> Unit, onRun: (Routine) -> Unit) {
    PageHead(
        "Routines",
        (if (s.timezone.isNotBlank()) "Times are in ${s.timezone}. " else "") +
            "If ${s.computer} is asleep, a missed run happens once when it wakes.",
    )
    Panel {
        if (s.routines.isEmpty()) T("No routines yet. Create them in Benchhand on the computer.", Type.body, C.muted, Modifier.padding(vertical = 16.dp))
        s.routines.forEachIndexed { i, r ->
            val m = s.mate(r.botId)
            Column(Modifier.fillMaxWidth().padding(vertical = 16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        T(r.name, Type.section, if (r.enabled) C.text else C.muted)
                        T(
                            "${m?.name ?: "Teammate"} · ${repeatLabel(r)} · last: ${if (r.lastRunAt > 0) dayAndTime(r.lastRunAt) else "not run yet"}",
                            Type.small, C.muted,
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                    Toggle(r.enabled, "${r.name} on", { onToggle(r, it) }, enabled = !busy)
                }
                if (r.lastError.isNotBlank()) {
                    Spacer(Modifier.height(6.dp))
                    T("Last run failed: ${r.lastError}", Type.small, C.negative, maxLines = 3)
                }
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    T(
                        if (!r.enabled) "Paused" else if (r.nextRunAt > 0) "Next: ${dayAndTime(r.nextRunAt)}" else "No next run",
                        Type.small.copy(fontSize = Type.body.fontSize.times(14f / 15f)),
                        if (r.enabled) C.text2 else C.muted, Modifier.weight(1f),
                    )
                    Btn("Run now", { onRun(r) }, small = true, enabled = !busy)
                }
            }
            if (i < s.routines.lastIndex) Rule()
        }
    }
    Spacer(Modifier.height(24.dp))
}

/* ---------- Settings ---------- */

class SettingsState(
    val notify: Boolean, val hide: Boolean, val confirm: Boolean,
    val setNotify: (Boolean) -> Unit, val setHide: (Boolean) -> Unit, val setConfirm: (Boolean) -> Unit,
)

@Composable
fun SettingsScreen(s: Summary?, pairing: Pairing, online: Boolean, lastHeard: Long, st: SettingsState, onUnpair: () -> Unit) {
    PageHead("Settings", "This phone, the computer it controls, and what reaches your lock screen.")
    SectionHead("Paired computer", if (online) "Online" else "Offline", top = 4.dp)
    Panel {
        KeyValues(
            listOfNotNull(
                "Computer" to pairing.computer,
                s?.version?.let { "Benchhand" to it },
                "Address" to "${pairing.host}:${pairing.port} · Tailscale",
                "Paired" to date(pairing.pairedAt),
                "Last heard from" to if (lastHeard > 0) dayAndTime(lastHeard / 1000) else "Not yet",
            ),
        )
    }
    SectionHead("Notifications")
    Panel {
        SettingRow("An action is waiting", "Checked about every 15 minutes while the app is closed", st.notify) { st.setNotify(it) }
        SettingRow("Hide details on the lock screen", "Shows who needs you, not what they want to send", st.hide, last = true) { st.setHide(it) }
        val name = s?.pending?.firstOrNull()?.let { s.mate(it.botId)?.name } ?: s?.team?.firstOrNull()?.name ?: "Forge"
        Column(
            Modifier.padding(top = 2.dp, bottom = 16.dp).fillMaxWidth().clip(RoundedCornerShape(Space.radius))
                .background(C.raised).padding(horizontal = 14.dp, vertical = 12.dp),
        ) {
            Row {
                T("Benchhand · ${pairing.computer}", Type.label.copy(fontWeight = FontWeight.Normal), C.muted, Modifier.weight(1f))
                T("Lock screen", Type.label.copy(fontWeight = FontWeight.Normal), C.muted)
            }
            Spacer(Modifier.height(4.dp))
            if (st.hide) {
                T("$name needs you", Type.bodyStrong.copy(fontWeight = FontWeight.SemiBold))
                T("1 waiting on ${pairing.computer}", Type.body, C.text2)
            } else {
                val a = s?.pending?.firstOrNull()
                T("$name: ${a?.title ?: "Create a GitHub issue"}", Type.bodyStrong.copy(fontWeight = FontWeight.SemiBold))
                T(a?.let(Describe::headline) ?: "The issue title shows here", Type.body, C.text2, maxLines = 2)
            }
        }
    }
    SectionHead("Approvals")
    Panel {
        SettingRow("Confirm with fingerprint", "Or your screen lock, before anything is approved", st.confirm, last = true) { st.setConfirm(it) }
    }
    SectionHead("Unpair")
    Panel {
        Column(Modifier.padding(top = 20.dp, bottom = 28.dp)) {
            T(
                "This phone stops receiving actions from ${pairing.computer}. Anything waiting stays on the computer, where you can still approve it.",
                Type.small.copy(fontSize = Type.body.fontSize.times(14f / 15f)), C.muted,
            )
            Spacer(Modifier.height(12.dp))
            Btn("Unpair this phone", onUnpair, kind = Kind.Danger, small = true)
        }
    }
    Spacer(Modifier.height(24.dp))
}
