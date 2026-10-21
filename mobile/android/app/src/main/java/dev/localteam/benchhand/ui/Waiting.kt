package dev.localteam.benchhand.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.localteam.benchhand.Approval
import dev.localteam.benchhand.Summary
import kotlin.math.ceil
import kotlin.math.max

/** The next whole hour on the phone's own clock (zones such as India's sit on the half hour). */
private fun hourCeil(t: Long): Long {
    val off = java.time.ZoneId.systemDefault().rules.getOffset(java.time.Instant.ofEpochSecond(t)).totalSeconds
    return Math.floorDiv(t + off + 3599, 3600L) * 3600 - off
}

/** Where the avatar column ends and the shared time axis starts: 36dp disc column + 16dp gap. */
private val AXIS = 52.dp

/**
 * The overnight clock: every waiting action drawn on one time axis that ends at now.
 * A grey block is the teammate working; the accent line after it is the time spent waiting on you.
 */
private class Axis(val start: Long, val end: Long) {
    fun at(t: Long) = ((t - start).toFloat() / max(1L, end - start)).coerceIn(0f, 1f)

    /** Hour marks spaced so about three fit, never crowding the "Now" label on the right. */
    fun marks(): List<Long> {
        val hours = (end - start) / 3600.0
        val step = max(1, ceil(hours / 3.5).toInt()) * 3600L
        val first = hourCeil(start)
        return generateSequence(first) { it + step }.takeWhile { it < end - step * 0.6 }.toList()
    }

    companion object {
        fun of(pending: List<Approval>, now: Long): Axis {
            val earliest = pending.minOfOrNull { minOf(it.taskStartedAt.takeIf { s -> s > 0 } ?: it.createdAt, it.createdAt) } ?: now
            return Axis(hourCeil(minOf(earliest, now - 3 * 3600)) - 3600, now)
        }
    }
}

@Composable
fun WaitingScreen(s: Summary, now: Long, onOpen: (Approval) -> Unit) {
    val pending = s.pending.sortedBy { it.createdAt }
    val oldest = pending.firstOrNull()
    PageHead(
        "Waiting on you",
        if (oldest == null) "Nothing is waiting. Your teammates notify this phone when they need you."
        else "${plural(pending.size, "action")} waiting. The oldest, from ${s.mate(oldest.botId)?.name ?: "a teammate"}, has waited ${waited(now - oldest.createdAt)}.",
    )
    Panel {
        if (pending.isEmpty()) {
            T("Nothing waiting. Decisions you make appear below.", Type.body, C.muted, Modifier.padding(vertical = 26.dp))
        } else {
            val axis = Axis.of(pending, now)
            ClockLabels(axis)
            pending.forEachIndexed { i, a -> QueueRow(s, a, axis, now, last = i == pending.lastIndex) { onOpen(a) } }
            Legend()
        }
    }
    if (s.running.isNotEmpty()) {
        SectionHead("Working now", plural(s.running.size, "run"))
        Panel {
            s.running.forEachIndexed { i, r ->
                val m = s.mate(r.botId)
                Row(Modifier.fillMaxWidth().padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    if (m != null) Initial(m.name, m.color, 28.dp) else Spacer(Modifier.size(28.dp))
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        T(r.title, Type.bodyStrong, maxLines = 1)
                        T("${m?.name ?: "Teammate"} · since ${clock(r.updatedAt)}", Type.small, C.muted)
                    }
                }
                if (i < s.running.lastIndex) Rule()
            }
        }
    }
    SectionHead("Recent decisions", if (s.recent.isEmpty()) null else plural(s.recent.size, "decision"))
    Panel {
        if (s.recent.isEmpty()) T("Approvals you decide, here or on the computer, are listed here.", Type.body, C.muted, Modifier.padding(vertical = 16.dp))
        s.recent.forEachIndexed { i, a ->
            Column(Modifier.fillMaxWidth().padding(vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    T(Describe.headline(a), Type.body, modifier = Modifier.weight(1f), maxLines = 1)
                    T(dayAndTime(a.createdAt).removePrefix("Today "), Type.small, C.muted)
                }
                T("${s.mate(a.botId)?.name ?: "Teammate"} · ${Describe.outcome(a)}", Type.small, if (a.status == "rejected") C.text2 else C.muted)
            }
            if (i < s.recent.lastIndex) Rule()
        }
    }
    Spacer(Modifier.height(24.dp))
}

@Composable
private fun ClockLabels(axis: Axis) {
    BoxWithConstraints(Modifier.fillMaxWidth().padding(start = AXIS).height(30.dp)) {
        val w = maxWidth
        axis.marks().forEach { t ->
            val x = w * axis.at(t)
            Box(Modifier.offset(x = x - 18.dp, y = 8.dp).width(36.dp), contentAlignment = Alignment.TopCenter) {
                T(clock(t), Type.label.copy(fontWeight = FontWeight.Normal), C.muted, maxLines = 1)
            }
        }
        T("Now ${clock(axis.end)}", Type.label.copy(fontWeight = FontWeight.Normal), C.text, Modifier.align(Alignment.TopEnd).offset(y = 8.dp), maxLines = 1)
    }
}

@Composable
private fun QueueRow(s: Summary, a: Approval, axis: Axis, now: Long, last: Boolean, onClick: () -> Unit) {
    val p = C
    val m = s.mate(a.botId)
    val started = a.taskStartedAt.takeIf { it in 1..a.createdAt } ?: a.createdAt
    Column(
        Modifier.fillMaxWidth().clickable(role = Role.Button, onClick = onClick)
            .semantics { contentDescription = "${m?.name ?: "Teammate"}: ${Describe.headline(a)}. Worked ${clock(started)} to ${clock(a.createdAt)}, waiting ${waited(now - a.createdAt)}." },
    ) {
        Row(Modifier.fillMaxWidth().padding(top = 14.dp, bottom = 16.dp)) {
            Box(Modifier.width(36.dp)) { if (m != null) Initial(m.name, m.color) }
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    T(Describe.headline(a), Type.bodyStrong, modifier = Modifier.weight(1f), maxLines = 2)
                    T(waited(now - a.createdAt), Type.small.copy(fontSize = Type.body.fontSize.times(14f / 15f)), p.text, maxLines = 1)
                }
                T("${m?.name ?: "Teammate"} · ${Describe.where(a)}", Type.small, p.muted, maxLines = 1)
                Spacer(Modifier.height(8.dp))
                Canvas(Modifier.fillMaxWidth().height(14.dp)) {
                    val w = size.width
                    val dp = 1.dp.toPx()
                    drawLine(p.rule, Offset(0f, 7 * dp), Offset(w, 7 * dp), 2 * dp)
                    val x0 = w * axis.at(started)
                    val x1 = w * axis.at(a.createdAt)
                    drawRoundRect(p.text2, Offset(x0, 3 * dp), Size(max(3 * dp, x1 - x0), 8 * dp), CornerRadius(dp, dp))
                    drawLine(p.accent, Offset(x1, 7 * dp), Offset(w, 7 * dp), 2 * dp)
                }
            }
        }
        if (!last) Box(Modifier.fillMaxWidth().padding(start = AXIS).height(1.dp).background(p.rule))
    }
}

@Composable
private fun Legend() {
    val p = C
    Row(Modifier.padding(top = 12.dp, bottom = 14.dp), horizontalArrangement = Arrangement.spacedBy(18.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(12.dp, 8.dp).background(p.text2))
            Spacer(Modifier.width(7.dp))
            T("Teammate working", Type.label.copy(fontWeight = FontWeight.Normal), p.muted)
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(14.dp, 2.dp).background(p.accent))
            Spacer(Modifier.width(7.dp))
            T("Waiting on you", Type.label.copy(fontWeight = FontWeight.Normal), p.muted)
        }
    }
}
