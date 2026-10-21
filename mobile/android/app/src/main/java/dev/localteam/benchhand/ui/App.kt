package dev.localteam.benchhand.ui

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import dev.localteam.benchhand.Approval
import dev.localteam.benchhand.Mate
import dev.localteam.benchhand.Model
import dev.localteam.benchhand.Summary
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** What the activity does for the UI: things Compose cannot do alone. */
interface Host {
    fun scan(onCode: (String) -> Unit, onError: (String) -> Unit)
    /** Asks for a fingerprint or the screen lock; calls [onOk] only on success. */
    fun confirm(title: String, subtitle: String, onOk: () -> Unit, onError: (String) -> Unit)
}

private sealed interface Sheet {
    data class Reject(val a: Approval) : Sheet
    data class NewTask(val mate: Mate?) : Sheet
    data object Unpair : Sheet
    data object Computer : Sheet
}

@Composable
fun App(model: Model, host: Host, openRequest: String?, onOpened: () -> Unit) {
    BenchhandTheme {
        val pairing = model.pairing
        if (pairing == null) {
            var code by rememberSaveable { mutableStateOf("") }
            var error by remember { mutableStateOf<String?>(null) }
            val scope = rememberCoroutineScope()
            fun pair(c: String) {
                code = c
                scope.launch { error = model.pair(c) }
            }
            LaunchedEffect(openRequest) {
                if (openRequest?.startsWith("benchhand://") == true) { pair(openRequest); onOpened() }
            }
            PairScreen(code, { code = it; error = null }, error, model.busy, onScan = {
                host.scan(::pair) { error = it }
            }, onPair = { pair(code) })
        } else {
            Paired(model, host, openRequest, onOpened)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun Paired(model: Model, host: Host, openRequest: String?, onOpened: () -> Unit) {
    val pairing = model.pairing!!
    val s = model.summary
    val scope = rememberCoroutineScope()
    var tab by rememberSaveable { mutableStateOf("waiting") }
    var openId by rememberSaveable { mutableStateOf<String?>(null) }
    var sheet by remember { mutableStateOf<Sheet?>(null) }
    var refreshing by remember { mutableStateOf(false) }
    var now by remember { mutableLongStateOf(model.nowSeconds()) }
    var settingsTick by remember { mutableStateOf(0) }

    // Waits tick on screen without a network call.
    LaunchedEffect(Unit) { while (true) { now = model.nowSeconds(); delay(15_000) } }
    LaunchedEffect(openRequest) {
        if (openRequest != null && !openRequest.startsWith("benchhand://")) { tab = "waiting"; openId = openRequest }
        if (openRequest != null) onOpened()
    }

    val open = s?.pending?.firstOrNull { it.id == openId }
    // Decided on the computer (or by another refresh) while open here: go back and say so.
    LaunchedEffect(openId, s) {
        if (openId != null && s != null && open == null) {
            if (s.recent.any { it.id == openId }) model.toast = "Already decided on ${pairing.computer}."
            openId = null
        }
    }
    val drafts = remember(open?.id) { open?.let { Drafts(it.arguments) } }
    BackHandler(open != null) { openId = null }

    val bottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

    Box(Modifier.fillMaxSize().background(C.ground)) {
        Column(Modifier.fillMaxSize().statusBarsPadding()) {
            TopBar(pairing.computer, online = !model.offline && s != null) { sheet = Sheet.Computer }
            model.problem?.let { Problem(it) }
            PullToRefreshBox(
                isRefreshing = refreshing,
                onRefresh = { scope.launch { refreshing = true; model.refresh(); refreshing = false } },
                modifier = Modifier.weight(1f).imePadding(),
            ) {
                val scroll = rememberScrollState()
                LaunchedEffect(tab, open?.id) { scroll.scrollTo(0) }
                Column(Modifier.fillMaxSize().verticalScroll(scroll)) {
                    when {
                        s == null -> Loading(model.problem == null)
                        open != null && drafts != null -> DetailScreen(s, open, now, drafts, model::steps) { openId = null }
                        tab == "waiting" -> WaitingScreen(s, now) { openId = it.id }
                        tab == "team" -> TeamScreen(s) { sheet = Sheet.NewTask(it) }
                        tab == "routines" -> RoutinesScreen(
                            s, model.busy,
                            onToggle = { r, on -> scope.launch { model.setRoutine(r, on) } },
                            onRun = { r -> scope.launch { model.runRoutine(r) } },
                        )
                        else -> {
                            settingsTick // re-read store values after a change
                            SettingsScreen(
                                s, pairing, !model.offline, model.lastHeard,
                                SettingsState(
                                    model.store.notifyWaiting, model.store.hideOnLockScreen, model.store.confirmApprovals,
                                    { model.store.notifyWaiting = it; settingsTick++ },
                                    { model.store.hideOnLockScreen = it; settingsTick++ },
                                    { model.store.confirmApprovals = it; settingsTick++ },
                                ),
                            ) { sheet = Sheet.Unpair }
                        }
                    }
                }
            }
            if (open != null && drafts != null) {
                ActionBar(bottom, model.busy, drafts.edited,
                    onReject = { sheet = Sheet.Reject(open) },
                    onApprove = approve@{
                        val args = if (drafts.edited) drafts.build().getOrElse { model.toast = it.message; return@approve } else null
                        val send = { scope.launch { if (model.decide(open, true, args)) openId = null } }
                        if (model.store.confirmApprovals) {
                            host.confirm(
                                if (drafts.edited) "Approve your edited version" else "Approve",
                                "${Describe.headline(open)} · ${Describe.where(open)}",
                                { send() }, { model.toast = it },
                            )
                        } else send()
                    })
            } else {
                BottomBar(
                    listOf(
                        Tab("waiting", "Waiting", Icons.waiting, s?.pending?.size ?: 0),
                        Tab("team", "Team", Icons.team),
                        Tab("routines", "Routines", Icons.routines),
                        Tab("settings", "Settings", Icons.settings),
                    ),
                    tab, bottom,
                ) { tab = it }
            }
        }

        val message = model.toast
        LaunchedEffect(message) { if (message != null) { delay(3_600); model.toast = null } }
        AnimatedVisibility(
            message != null, Modifier.align(Alignment.BottomCenter).padding(bottom = bottom + 84.dp),
            enter = fadeIn() + slideInVertically { it / 3 }, exit = fadeOut() + slideOutVertically { it / 3 },
        ) { Toast(message.orEmpty()) }
    }

    sheet?.let { current ->
        val state = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        val close: () -> Unit = { scope.launch { state.hide(); sheet = null } }
        ModalBottomSheet(
            onDismissRequest = { sheet = null }, sheetState = state, containerColor = C.surface, scrimColor = C.scrim,
            shape = RoundedCornerShape(topStart = 14.dp, topEnd = 14.dp),
            dragHandle = { Box(Modifier.padding(top = 10.dp, bottom = 14.dp).size(36.dp, 4.dp).clip(RoundedCornerShape(2.dp)).background(C.control)) },
        ) {
            Column(Modifier.gutter().padding(bottom = 20.dp).imePadding()) {
                when (current) {
                    is Sheet.Reject -> RejectSheet(s, current.a, model.busy, close) {
                        scope.launch { if (model.decide(current.a, false, null)) { openId = null; close() } }
                    }
                    is Sheet.NewTask -> s?.let { NewTaskSheet(it, current.mate, model.busy, close) { m, title, details ->
                        scope.launch { if (model.newTask(m, title, details)) close() }
                    } }
                    Sheet.Unpair -> {
                        T("Unpair from ${pairing.computer}?", Type.sheetTitle)
                        Spacer(Modifier.height(6.dp))
                        T("This phone stops receiving actions. To pair again, open Preferences, then Phone, in Benchhand on the computer and scan its code.", Type.body, C.muted)
                        Actions("Cancel", close, "Unpair", Kind.Danger) { close(); model.unpair() }
                    }
                    Sheet.Computer -> {
                        T(pairing.computer, Type.sheetTitle)
                        Spacer(Modifier.height(6.dp))
                        T(if (model.offline || s == null) "Offline. Last heard from ${if (model.lastHeard > 0) dayAndTime(model.lastHeard / 1000) else "never"}." else "Online · updated ${clock(model.lastHeard / 1000)}", Type.body, C.muted)
                        if (s != null) KeyValues(listOf(
                            "Benchhand" to s.version,
                            "Teammates" to s.team.size.toString(),
                            "Working now" to s.running.size.toString(),
                            "Waiting on you" to s.pending.size.toString(),
                        ))
                        Spacer(Modifier.height(8.dp))
                        Btn("Done", close, Modifier.fillMaxWidth())
                    }
                }
            }
        }
    }
}

@Composable
private fun TopBar(computer: String, online: Boolean, onScope: () -> Unit) {
    val rule = C.rule
    Row(
        Modifier.fillMaxWidth().height(52.dp).background(C.ground)
            .drawBehind { drawLine(rule, Offset(0f, size.height), Offset(size.width, size.height), 1.dp.toPx()) }
            .padding(start = Space.gutter, end = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BrandMark()
        Spacer(Modifier.width(9.dp))
        T("Benchhand", Type.section, modifier = Modifier.weight(1f))
        Row(
            Modifier.clip(RoundedCornerShape(Space.radius)).clickable(role = Role.Button, onClick = onScope)
                .padding(horizontal = 10.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.size(7.dp).clip(CircleShape).background(if (online) C.accent else C.muted))
            Spacer(Modifier.width(8.dp))
            T(computer, Type.small.copy(fontSize = Type.body.fontSize.times(14f / 15f)), C.text2, maxLines = 1)
        }
    }
}

@Composable
private fun Problem(text: String) {
    Row(Modifier.fillMaxWidth().background(C.raised).padding(horizontal = Space.gutter, vertical = 10.dp)) {
        Box(Modifier.padding(top = 6.dp).size(7.dp).clip(CircleShape).background(C.negative))
        Spacer(Modifier.width(10.dp))
        T(text, Type.small, C.text2)
    }
}

@Composable
private fun Loading(trying: Boolean) {
    PageHead(if (trying) "Connecting…" else "Not connected", if (trying) "Asking your computer for what's waiting." else "Pull down to try again.")
}

@Composable
private fun ActionBar(bottom: androidx.compose.ui.unit.Dp, busy: Boolean, edited: Boolean, onReject: () -> Unit, onApprove: () -> Unit) {
    val rule = C.rule
    Row(
        Modifier.fillMaxWidth().background(C.ground)
            .drawBehind { drawLine(rule, Offset(0f, 0f), Offset(size.width, 0f), 1.dp.toPx()) }
            .padding(start = Space.gutter, end = Space.gutter, top = 12.dp, bottom = 12.dp + bottom),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Btn("Reject", onReject, Modifier.weight(1f), kind = Kind.Danger, enabled = !busy)
        Btn(if (edited) "Approve edited" else "Approve", onApprove, Modifier.weight(1.6f), kind = Kind.Primary, enabled = !busy)
    }
}

@Composable
private fun Actions(cancel: String, onCancel: () -> Unit, ok: String, kind: Kind, enabled: Boolean = true, onOk: () -> Unit) {
    Row(Modifier.padding(top = 18.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Btn(cancel, onCancel, Modifier.weight(1f))
        Btn(ok, onOk, Modifier.weight(1.6f), kind = kind, enabled = enabled)
    }
}

@Composable
private fun RejectSheet(s: Summary?, a: Approval, busy: Boolean, onCancel: () -> Unit, onReject: () -> Unit) {
    val name = s?.mate(a.botId)?.name ?: "The teammate"
    T("Reject this action", Type.sheetTitle)
    Spacer(Modifier.height(6.dp))
    T("Nothing is sent. $name is told you said no and carries on without it.", Type.body, C.muted)
    Spacer(Modifier.height(12.dp))
    ReadOnly(Describe.where(a), Describe.headline(a))
    Actions("Cancel", onCancel, if (busy) "Rejecting…" else "Reject", Kind.Primary, enabled = !busy, onOk = onReject)
}

@Composable
private fun NewTaskSheet(s: Summary, preset: Mate?, busy: Boolean, onCancel: () -> Unit, onSend: (Mate, String, String) -> Unit) {
    var who by remember { mutableStateOf(preset ?: s.team.first()) }
    var title by rememberSaveable { mutableStateOf("") }
    var details by rememberSaveable { mutableStateOf("") }
    T("New task", Type.sheetTitle)
    Spacer(Modifier.height(6.dp))
    T("Runs on ${s.computer} now. Anything that leaves the computer comes back here first.", Type.body, C.muted)
    Spacer(Modifier.height(12.dp))
    Segmented(s.team.map { it to it.name }, who) { who = it }
    Spacer(Modifier.height(16.dp))
    Field("Task", title, { title = it }, placeholder = "Check why routine times drift after sleep")
    Spacer(Modifier.height(14.dp))
    Field("Details", details, { details = it }, lines = 3, placeholder = "Context, files to read, what done looks like")
    Actions("Cancel", onCancel, if (busy) "Sending…" else "Send to ${who.name}", Kind.Primary, enabled = !busy && title.isNotBlank()) {
        onSend(who, title.trim(), details.trim())
    }
}
