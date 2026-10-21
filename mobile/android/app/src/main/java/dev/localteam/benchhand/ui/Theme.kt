package dev.localteam.benchhand.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.lerp
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.localteam.benchhand.R

/** The desktop app's tokens, so the phone reads as the same product. */
@Immutable
data class Palette(
    val ground: Color, val surface: Color, val raised: Color, val border: Color, val rule: Color, val control: Color,
    val text: Color, val text2: Color, val muted: Color,
    val accent: Color, val accentInk: Color, val primary: Color, val onPrimary: Color, val negative: Color,
    val scrim: Color, val dark: Boolean,
)

private val Dark = Palette(
    ground = Color(0xFF171719), surface = Color(0xFF131217), raised = Color(0xFF212023), border = Color(0xFF2A2A2D),
    rule = Color(0xFF1F1E23), control = Color(0xFF3A3A3E),
    text = Color.White, text2 = Color(0xFFC9CACF), muted = Color(0xFF8F9197),
    accent = Color(0xFF54C2A4), accentInk = Color(0xFF54C2A4), primary = Color.White, onPrimary = Color(0xFF0D0D0F),
    negative = Color(0xFFE5566F), scrim = Color(0x9E050507), dark = true,
)

private val Light = Palette(
    ground = Color(0xFFF7F7F8), surface = Color.White, raised = Color(0xFFF0F0F2), border = Color(0xFFE3E3E6),
    rule = Color(0xFFEDEDF0), control = Color(0xFFCFD1D6),
    text = Color(0xFF111113), text2 = Color(0xFF34353A), muted = Color(0xFF5F6168),
    accent = Color(0xFF54C2A4), accentInk = Color(0xFF2F7D68), primary = Color(0xFF111113), onPrimary = Color.White,
    negative = Color(0xFFC4242A), scrim = Color(0x5C111113), dark = false,
)

@OptIn(ExperimentalTextApi::class)
private fun publicSans(weight: Int) = Font(
    R.font.public_sans, FontWeight(weight),
    variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
)

val PublicSans = FontFamily(publicSans(400), publicSans(500), publicSans(600), publicSans(700))

private val trim = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.None)
private fun style(size: Int, line: Int, weight: Int = 400, tracking: Float = 0f) = TextStyle(
    fontFamily = PublicSans, fontSize = size.sp, lineHeight = line.sp, fontWeight = FontWeight(weight),
    letterSpacing = tracking.sp, lineHeightStyle = trim,
)

/** One scale, used everywhere: title, section, body, small, label. */
object Type {
    val title = style(24, 29, 600, -0.24f)
    val sheetTitle = style(18, 24, 600)
    val section = style(16, 22, 600)
    val body = style(15, 22)
    val bodyStrong = style(15, 21, 500)
    val small = style(13, 18)
    val label = style(12, 16, 500)
    val figure = style(20, 26, 500)
    val mono = TextStyle(fontFamily = FontFamily.Monospace, fontSize = 13.sp, lineHeight = 19.sp)
}

object Space {
    val gutter = 16.dp
    val radius = 6.dp
}

val LocalPalette = staticCompositionLocalOf { Dark }
val C: Palette @Composable get() = LocalPalette.current

@Composable
fun BenchhandTheme(content: @Composable () -> Unit) {
    val p = if (isSystemInDarkTheme()) Dark else Light
    // Material only supplies the sheet and press feedback; every colour it touches is a brand token.
    val scheme = (if (p.dark) darkColorScheme() else lightColorScheme()).copy(
        primary = p.primary, onPrimary = p.onPrimary, background = p.ground, onBackground = p.text,
        surface = p.surface, onSurface = p.text, surfaceContainerLow = p.surface, outline = p.control,
        error = p.negative, scrim = p.scrim,
    )
    CompositionLocalProvider(LocalPalette provides p) {
        MaterialTheme(colorScheme = scheme, content = content)
    }
}

/** A teammate's colour as the desktop draws it (deepened on light ground so it stays legible). */
fun mateColor(hex: String, p: Palette): Color {
    val c = runCatching { Color(android.graphics.Color.parseColor(hex)) }.getOrDefault(p.text2)
    return if (p.dark) c else lerp(c, Color.Black, 0.38f)
}

fun wash(c: Color, p: Palette) = Color(
    red = c.red * 0.2f + p.surface.red * 0.8f,
    green = c.green * 0.2f + p.surface.green * 0.8f,
    blue = c.blue * 0.2f + p.surface.blue * 0.8f,
)
