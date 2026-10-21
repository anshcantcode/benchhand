package dev.localteam.benchhand

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONObject

class Model(app: Application) : AndroidViewModel(app) {
    val store = Store(app)

    var pairing by mutableStateOf(store.pairing)
        private set
    var summary by mutableStateOf<Summary?>(null)
        private set
    /** Why the last refresh failed, shown above the content while the last good summary stays visible. */
    var problem by mutableStateOf<String?>(null)
        private set
    var offline by mutableStateOf(false)
        private set
    var lastHeard by mutableStateOf(0L)
        private set
    var toast by mutableStateOf<String?>(null)
    var busy by mutableStateOf(false)
        private set

    /** Seconds to add to the phone's clock to get the computer's, so waits read the same on both. */
    private var skew = 0L
    fun nowSeconds() = System.currentTimeMillis() / 1000 + skew

    private var loop: Job? = null

    /** Refreshes every ten seconds while the app is on screen. */
    fun start() {
        if (loop?.isActive == true || pairing == null) return
        loop = viewModelScope.launch {
            while (isActive) {
                refresh()
                delay(10_000)
            }
        }
    }

    fun stop() {
        loop?.cancel()
    }

    suspend fun refresh() {
        val p = pairing ?: return
        try {
            val s = Api(p).summary()
            skew = s.now - System.currentTimeMillis() / 1000
            summary = s
            problem = null
            offline = false
            lastHeard = System.currentTimeMillis()
            Notifier.announce(getApplication(), store, s)
        } catch (e: ApiError) {
            problem = e.message
            offline = e.offline
        }
    }

    /** Checks the code against the computer before keeping it. Returns an error to show, or null. */
    suspend fun pair(code: String): String? {
        val p = Pairing.parse(code)
            ?: return "That isn't a Benchhand pairing code. In Benchhand on the computer, open Preferences, then Phone, and choose Pair a phone."
        busy = true
        return try {
            val s = Api(p).summary()
            store.pairing = p.copy(computer = s.computer.ifBlank { p.computer })
            store.announced = s.pending.map { it.id }.toSet()
            pairing = store.pairing
            summary = s
            skew = s.now - System.currentTimeMillis() / 1000
            lastHeard = System.currentTimeMillis()
            problem = null
            Notifier.schedule(getApplication())
            start()
            null
        } catch (e: ApiError) {
            e.message
        } finally {
            busy = false
        }
    }

    fun unpair() {
        stop()
        store.pairing = null
        Notifier.cancel(getApplication())
        pairing = null
        summary = null
        problem = null
    }

    /** Runs one call to the computer, then refreshes. Returns true when it went through. */
    private suspend fun act(done: String?, call: suspend Api.() -> Unit): Boolean {
        val p = pairing ?: return false
        busy = true
        return try {
            Api(p).call()
            if (done != null) toast = done
            refresh()
            true
        } catch (e: ApiError) {
            toast = e.message
            false
        } finally {
            busy = false
        }
    }

    suspend fun decide(a: Approval, approve: Boolean, edited: JSONObject?): Boolean {
        val name = summary?.mate(a.botId)?.name ?: "The teammate"
        val computer = pairing?.computer ?: "the computer"
        val done = if (approve) "Sent to $computer. $name carries on now." else "Rejected. Nothing was sent; $name carries on without it."
        return act(done) { decide(a.id, approve, edited) }
    }

    suspend fun newTask(m: Mate, title: String, details: String) =
        act("${m.name} started “$title”.") { newTask(m.id, title, details) }

    suspend fun runRoutine(r: Routine) {
        val name = summary?.mate(r.botId)?.name ?: "The teammate"
        act("$name started ${r.name}. This phone tells you if it needs you.") { runRoutine(r.id) }
    }

    suspend fun setRoutine(r: Routine, on: Boolean) {
        act(if (on) "${r.name} is on." else "${r.name} is paused.") { setRoutine(r.id, on) }
    }

    suspend fun steps(taskId: String): List<Step> {
        val p = pairing ?: return emptyList()
        return runCatching { Api(p).steps(taskId) }.getOrDefault(emptyList())
    }
}
