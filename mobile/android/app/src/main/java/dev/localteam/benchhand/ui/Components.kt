package dev.localteam.benchhand.ui

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.graphics.vector.path
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.material3.Text as M3Text

/* ---------- text ---------- */

@Composable
fun T(
    text: String, style: TextStyle = Type.body, color: Color = C.text, modifier: Modifier = Modifier,
    maxLines: Int = Int.MAX_VALUE,
) = M3Text(text, modifier, color = color, style = style, maxLines = maxLines, overflow = TextOverflow.Ellipsis)

/* ---------- icons: 24-unit line drawings, 1.5 stroke, from the prototype ---------- */

private fun line(vararg d: String): ImageVector = ImageVector.Builder(
    defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = 24f, viewportHeight = 24f,
).apply {
    d.forEach {
        addPath(
            addPathNodes(it), stroke = SolidColor(Color.Black), strokeLineWidth = 1.5f,
            strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round,
        )
    }
}.build()

object Icons {
    val waiting = line("M4 13l3-8h10l3 8v6H4zM4 13h5l1 2h4l1-2h5")
    val team = line(
        "M9.5 8a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0M19.5 8a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0",
        "M14.5 17a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0M8.8 9.8 11 15M15.2 9.8 13 15",
    )
    val routines = line("M20 12a8 8 0 1 1-16 0a8 8 0 1 1 16 0M12 7.5V12l3 2")
    val settings = line("M4 7h10M18 7h2M4 17h4M12 17h8", "M18 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0M12 17a2 2 0 1 1-4 0a2 2 0 1 1 4 0")
    val back = line("M15 5l-7 7 7 7")
    val finger = line(
        "M7 19c1-2 1.5-4 1.5-7a3.5 3.5 0 0 1 7 0c0 1.2-.1 2.3-.3 3.4M12 12c0 3-.6 5.6-2 8M15 18.5c-.3.7-.6 1.3-1 1.9",
        "M5 15.5c.3-1.2.5-2.3.5-3.5a6.5 6.5 0 0 1 11.4-4.3M18.4 10.2c.1.6.1 1.2.1 1.8 0 .9 0 1.8-.1 2.6",
    )
    val scan = line("M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10")
}

@Composable
fun Icon(v: ImageVector, tint: Color = C.text, size: Dp = 22.dp, modifier: Modifier = Modifier) =
    Image(v, null, modifier.size(size), colorFilter = ColorFilter.tint(tint))

/** Three nodes joined at a hub: the desktop app's mark, hub in the accent. */
@Composable
fun BrandMark(size: Dp = 22.dp, modifier: Modifier = Modifier) {
    val ink = C.text
    val hub = C.accent
    Canvas(modifier.size(size)) {
        val u = this.size.width / 32f
        fun p(x: Float, y: Float) = Offset(x * u, y * u)
        val w = 2f * u
        drawLine(ink, p(8f, 9f), p(16f, 16f), w, StrokeCap.Round)
        drawLine(ink, p(24f, 9f), p(16f, 16f), w, StrokeCap.Round)
        drawLine(ink, p(16f, 16f), p(16f, 24f), w, StrokeCap.Round)
        listOf(p(8f, 9f), p(24f, 9f), p(16f, 24f)).forEach { drawCircle(ink, 3.5f * u, it) }
        drawCircle(hub, 2.2f * u, p(16f, 16f))
    }
}

/* ---------- surfaces ---------- */

/** A full-width band on the surface colour, ruled top and bottom. Content keeps the side gutter. */
@Composable
fun Panel(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    val rule = C.rule
    Column(
        modifier.fillMaxWidth().background(C.surface).drawBehind {
            drawLine(rule, Offset(0f, 0f), Offset(size.width, 0f), 1.dp.toPx())
            drawLine(rule, Offset(0f, size.height), Offset(size.width, size.height), 1.dp.toPx())
        }.padding(horizontal = Space.gutter),
        content = content,
    )
}

@Composable
fun Rule() = Box(Modifier.fillMaxWidth().height(1.dp).background(C.rule))

@Composable
fun SectionHead(title: String, aside: String? = null, top: Dp = 28.dp) {
    Row(
        Modifier.fillMaxWidth().padding(start = Space.gutter, end = Space.gutter, top = top, bottom = 10.dp),
        verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        T(title, Type.section)
        if (aside != null) T(aside, Type.small, C.muted)
    }
}

@Composable
fun PageHead(title: String, sub: String? = null, action: (@Composable () -> Unit)? = null, top: Dp = 22.dp) {
    Row(
        Modifier.fillMaxWidth().padding(start = Space.gutter, end = Space.gutter, top = top, bottom = 18.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Column(Modifier.weight(1f)) {
            T(title, Type.title)
            if (sub != null) {
                Spacer(Modifier.height(6.dp))
                T(sub, Type.body.copy(fontSize = Type.small.fontSize.times(14f / 13f)), C.muted)
            }
        }
        action?.invoke()
    }
}

/* ---------- people ---------- */

@Composable
fun Initial(name: String, color: String, size: Dp = 32.dp) {
    val p = C
    val c = mateColor(color, p)
    Box(
        Modifier.size(size).clip(CircleShape).background(wash(c, p)),
        contentAlignment = Alignment.Center,
    ) { T(name.take(1).uppercase(), Type.small.copy(fontWeight = Type.section.fontWeight), c) }
}

/* ---------- controls ---------- */

enum class Kind { Plain, Primary, Danger }

@Composable
fun Btn(
    text: String, onClick: () -> Unit, modifier: Modifier = Modifier, kind: Kind = Kind.Plain,
    small: Boolean = false, enabled: Boolean = true,
) {
    val p = C
    val shape = RoundedCornerShape(999.dp)
    val bg = if (kind == Kind.Primary) p.primary else Color.Transparent
    val fg = when (kind) { Kind.Primary -> p.onPrimary; Kind.Danger -> p.negative; Kind.Plain -> p.text }
    Box(
        modifier.heightIn(min = if (small) 36.dp else 46.dp).clip(shape).background(bg)
            .border(1.dp, if (kind == Kind.Primary) p.primary else p.control, shape)
            .clickable(enabled = enabled, role = Role.Button, onClick = onClick)
            .alpha(if (enabled) 1f else 0.45f)
            .padding(horizontal = if (small) 14.dp else 18.dp),
        contentAlignment = Alignment.Center,
    ) { T(text, (if (small) Type.small else Type.body).copy(fontWeight = Type.section.fontWeight), fg, maxLines = 1) }
}

/** On is the text colour, off is the control grey; the knob is the surface. No accent: colour stays rare. */
@Composable
fun Toggle(on: Boolean, label: String, onChange: (Boolean) -> Unit, enabled: Boolean = true) {
    val p = C
    val x by animateDpAsState(if (on) 19.dp else 3.dp, tween(140), label = "knob")
    Box(
        Modifier.size(40.dp, 24.dp).clip(RoundedCornerShape(12.dp)).background(if (on) p.text else p.control)
            .alpha(if (enabled) 1f else 0.5f)
            .semantics { contentDescription = label }
            .clickable(enabled = enabled, role = Role.Switch) { onChange(!on) },
    ) { Box(Modifier.offset(x = x, y = 3.dp).size(18.dp).clip(CircleShape).background(p.surface)) }
}

/** A link-style action: underlined in the control grey. */
@Composable
fun TextAction(text: String, onClick: () -> Unit) {
    val p = C
    Box(Modifier.clip(RoundedCornerShape(Space.radius)).clickable(role = Role.Button, onClick = onClick).padding(vertical = 8.dp)) {
        T(
            text,
            Type.bodyStrong.copy(textDecoration = androidx.compose.ui.text.style.TextDecoration.Underline),
            p.text,
        )
    }
}

@Composable
fun Field(
    label: String, value: String, onChange: (String) -> Unit, modifier: Modifier = Modifier,
    lines: Int = 1, mono: Boolean = false, changed: Boolean = false, placeholder: String = "",
    keyboard: KeyboardOptions = KeyboardOptions.Default,
) {
    val p = C
    Column(modifier.fillMaxWidth()) {
        Row {
            T(label, Type.small.copy(fontWeight = Type.bodyStrong.fontWeight), p.text2)
            if (changed) T(" · edited", Type.small, p.accentInk)
        }
        Spacer(Modifier.height(7.dp))
        var focused by remember { mutableIntStateOf(0) }
        val style = (if (mono) Type.mono else Type.body).copy(color = p.text)
        BasicTextField(
            // lines = 0: one line of input that wraps instead of scrolling sideways.
            value, onChange, singleLine = lines == 1, minLines = lines.coerceAtLeast(1), textStyle = style,
            cursorBrush = SolidColor(p.accent), keyboardOptions = keyboard,
            modifier = Modifier.fillMaxWidth()
                .onFocusChanged { focused = if (it.isFocused) 1 else 0 }
                .clip(RoundedCornerShape(Space.radius)).background(p.ground)
                .border(1.dp, if (focused == 1) p.accent else p.control, RoundedCornerShape(Space.radius))
                .padding(horizontal = 12.dp, vertical = 10.dp),
            decorationBox = { inner ->
                Box { if (value.isEmpty() && placeholder.isNotEmpty()) T(placeholder, style, p.muted); inner() }
            },
        )
    }
}

/** A read-only value in a raised box, for things the phone shows but cannot change. */
@Composable
fun ReadOnly(label: String, value: String, mono: Boolean = false) {
    Column(Modifier.fillMaxWidth()) {
        T(label, Type.small.copy(fontWeight = Type.bodyStrong.fontWeight), C.text2)
        Spacer(Modifier.height(7.dp))
        Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(Space.radius)).background(C.raised).padding(horizontal = 12.dp, vertical = 10.dp)) {
            T(value, if (mono) Type.mono else Type.body, C.text)
        }
    }
}

/** Choices in a row; the chosen one carries a 1px accent line exactly as wide as its label. */
@Composable
fun <K> Segmented(options: List<Pair<K, String>>, chosen: K, onChoose: (K) -> Unit) {
    val p = C
    Row(
        Modifier.fillMaxWidth().drawBehind {
            drawLine(p.rule, Offset(0f, size.height - 0.5f), Offset(size.width, size.height - 0.5f), 1.dp.toPx())
        },
        horizontalArrangement = Arrangement.spacedBy(22.dp),
    ) {
        options.forEach { (key, label) ->
            val on = key == chosen
            Box(
                Modifier.clickable(role = Role.Tab) { onChoose(key) }
                    .drawBehind { if (on) drawLine(p.accent, Offset(0f, size.height - 0.5f), Offset(size.width, size.height - 0.5f), 1.dp.toPx()) }
                    .padding(top = 10.dp, bottom = 11.dp),
            ) { T(label, Type.bodyStrong, if (on) p.text else p.muted) }
        }
    }
}

/** Label on the left, value on the right; used for the paired computer's facts. */
@Composable
fun KeyValues(rows: List<Pair<String, String>>) {
    Column(Modifier.padding(vertical = 14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        rows.forEach { (k, v) ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                T(k, Type.small.copy(fontSize = Type.body.fontSize.times(14f / 15f)), C.muted)
                T(v, Type.small.copy(fontSize = Type.body.fontSize.times(14f / 15f), textAlign = androidx.compose.ui.text.style.TextAlign.End), C.text, Modifier.weight(1f))
            }
        }
    }
}

/** A setting: title, a line of explanation, and its switch. */
@Composable
fun SettingRow(title: String, detail: String, on: Boolean, last: Boolean = false, onChange: (Boolean) -> Unit) {
    Column {
        Row(Modifier.fillMaxWidth().padding(vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                T(title, Type.bodyStrong)
                T(detail, Type.small, C.muted)
            }
            Spacer(Modifier.width(16.dp))
            Toggle(on, title, onChange)
        }
        if (!last) Rule()
    }
}

/* ---------- bottom bar ---------- */

data class Tab(val key: String, val label: String, val icon: ImageVector, val count: Int = 0)

@Composable
fun BottomBar(tabs: List<Tab>, current: String, bottomInset: Dp, onSelect: (String) -> Unit) {
    val p = C
    Row(
        Modifier.fillMaxWidth().background(p.ground).drawBehind {
            drawLine(p.rule, Offset(0f, 0f), Offset(size.width, 0f), 1.dp.toPx())
        }.padding(bottom = bottomInset),
    ) {
        tabs.forEach { tab ->
            val on = tab.key == current
            var labelWidth by remember { mutableIntStateOf(0) }
            Box(
                Modifier.weight(1f).clickable(role = Role.Tab) { onSelect(tab.key) }
                    .semantics { contentDescription = tab.label + if (tab.count > 0) ", ${tab.count} waiting" else "" }
                    .drawBehind {
                        if (on && labelWidth > 0) {
                            val w = labelWidth.toFloat()
                            drawLine(p.accent, Offset((size.width - w) / 2, 0.5f), Offset((size.width + w) / 2, 0.5f), 1.dp.toPx())
                        }
                    }
                    .padding(top = 10.dp, bottom = 12.dp),
                contentAlignment = Alignment.TopCenter,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(tab.icon, if (on) p.text else p.muted)
                    T(tab.label, Type.label, if (on) p.text else p.muted, Modifier.onSizeChanged { labelWidth = it.width })
                }
                if (tab.count > 0) {
                    Box(
                        Modifier.offset(x = 14.dp, y = (-4).dp).heightIn(min = 18.dp)
                            .clip(RoundedCornerShape(9.dp)).background(p.text).padding(horizontal = 5.dp),
                        contentAlignment = Alignment.Center,
                    ) { T(tab.count.toString(), Type.label.copy(fontSize = Type.label.fontSize.times(11f / 12f), fontWeight = Type.section.fontWeight), p.ground) }
                }
            }
        }
    }
}

/* ---------- toast ---------- */

@Composable
fun Toast(text: String, modifier: Modifier = Modifier) {
    Box(
        modifier.fillMaxWidth().padding(horizontal = Space.gutter)
            .clip(RoundedCornerShape(10.dp)).background(C.primary).padding(horizontal = 14.dp, vertical = 12.dp),
    ) { T(text, Type.small.copy(fontSize = Type.body.fontSize.times(14f / 15f)), C.onPrimary) }
}

fun Modifier.gutter() = this.padding(horizontal = Space.gutter)

val NoPad = PaddingValues(0.dp)

@Composable
fun RowScope.Grow() = Spacer(Modifier.weight(1f))
