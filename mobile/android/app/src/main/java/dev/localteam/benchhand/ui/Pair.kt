package dev.localteam.benchhand.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

@Composable
fun PairScreen(
    code: String, onCode: (String) -> Unit, error: String?, busy: Boolean,
    onScan: () -> Unit, onPair: () -> Unit,
) {
    Column(
        Modifier.fillMaxSize().background(C.ground).systemBarsPadding().imePadding().verticalScroll(rememberScrollState()),
    ) {
        Row(Modifier.gutter().height(52.dp), verticalAlignment = Alignment.CenterVertically) {
            BrandMark()
            Spacer(Modifier.width(9.dp))
            T("Benchhand", Type.section)
        }
        Rule()
        PageHead(
            "Approve from anywhere",
            "Your teammates keep running on your computer. This phone shows what they want to do and sends back your answer.",
            top = 28.dp,
        )
        SectionHead("Pair with your computer", top = 4.dp)
        Panel {
            Column(Modifier.padding(vertical = 8.dp)) {
                Step(1, "Install Tailscale here and on the computer", "Sign in to the same account on both. The phone reaches the computer only through it.")
                Rule()
                Step(2, "Open Benchhand on the computer", "Go to Preferences, then Phone, and choose Pair a phone.")
                Rule()
                Step(3, "Scan the code it shows", "Or copy the pairing code and paste it below.")
            }
        }
        Column(Modifier.gutter().padding(top = 20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Btn("Scan the code", onScan, Modifier.fillMaxWidth(), kind = Kind.Primary, enabled = !busy)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Rule2(Modifier.weight(1f))
                T("or paste it", Type.small, C.muted, Modifier.padding(horizontal = 12.dp))
                Rule2(Modifier.weight(1f))
            }
            Field(
                "Pairing code", code, onCode, mono = true, lines = 3, placeholder = "benchhand://pair?h=…",
                keyboard = KeyboardOptions(keyboardType = KeyboardType.Uri),
            )
            if (error != null) T(error, Type.small, C.negative)
            Btn(if (busy) "Checking…" else "Pair", onPair, Modifier.fillMaxWidth(), enabled = !busy && code.isNotBlank())
            T(
                "The code holds a private key. The computer keeps only a fingerprint of it, and answers only devices on your Tailscale network.",
                Type.small, C.muted,
            )
        }
        Spacer(Modifier.height(32.dp))
    }
}

@Composable
private fun Rule2(modifier: Modifier) = Box(modifier.height(1.dp).background(C.rule))

@Composable
private fun Step(n: Int, title: String, detail: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 12.dp)) {
        Box(Modifier.size(24.dp).clip(CircleShape).background(C.raised), contentAlignment = Alignment.Center) {
            T(n.toString(), Type.label.copy(fontFeatureSettings = "tnum"), C.text2)
        }
        Spacer(Modifier.width(14.dp))
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            T(title, Type.bodyStrong)
            T(detail, Type.small, C.muted)
        }
    }
}
