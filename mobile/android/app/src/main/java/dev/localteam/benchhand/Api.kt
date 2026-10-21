package dev.localteam.benchhand

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

class ApiError(message: String, val offline: Boolean = false) : Exception(message)

data class Approval(
    val id: String, val taskId: String, val title: String, val target: String, val summary: String,
    val status: String, val createdAt: Long, val toolName: String, val arguments: JSONObject,
    val edited: Boolean, val botId: String, val taskTitle: String, val taskStartedAt: Long,
)

data class Mate(
    val id: String, val name: String, val role: String, val color: String, val model: String,
    val running: Int, val waiting: Int, val lastTask: String, val runsToday: Int,
)

data class Routine(
    val id: String, val name: String, val botId: String, val title: String, val config: JSONObject,
    val enabled: Boolean, val nextRunAt: Long, val lastRunAt: Long, val lastError: String,
)

data class Running(val id: String, val title: String, val botId: String, val updatedAt: Long)

data class Summary(
    val computer: String, val version: String, val now: Long, val timezone: String,
    val pending: List<Approval>, val recent: List<Approval>, val team: List<Mate>,
    val running: List<Running>, val routines: List<Routine>,
) {
    fun mate(id: String) = team.firstOrNull { it.id == id }
}

data class Step(val message: String, val at: Long)

/** The small API the computer serves to its paired phone. Every call is one HTTP request. */
class Api(private val pairing: Pairing) {

    suspend fun summary(): Summary = parseSummary(call("GET", "/v1/summary"))

    suspend fun steps(taskId: String): List<Step> =
        call("GET", "/v1/tasks/$taskId/events").getJSONArray("events").map {
            Step(it.getString("message"), it.getLong("at"))
        }

    suspend fun decide(id: String, approve: Boolean, arguments: JSONObject?) {
        val body = JSONObject().put("decision", if (approve) "approved" else "rejected")
        if (arguments != null) body.put("arguments", arguments)
        call("POST", "/v1/approvals/$id/decision", body)
    }

    suspend fun newTask(botId: String, title: String, description: String): String =
        call("POST", "/v1/tasks", JSONObject().put("botId", botId).put("title", title).put("description", description))
            .getString("taskId")

    suspend fun runRoutine(id: String) {
        call("POST", "/v1/routines/$id/run")
    }

    suspend fun setRoutine(id: String, enabled: Boolean) {
        call("POST", "/v1/routines/$id/enabled", JSONObject().put("enabled", enabled))
    }

    private suspend fun call(method: String, path: String, body: JSONObject? = null): JSONObject =
        withContext(Dispatchers.IO) {
            val conn = (URL(pairing.base + path).openConnection() as HttpURLConnection).apply {
                requestMethod = method
                connectTimeout = 6_000
                readTimeout = 20_000
                setRequestProperty("Authorization", "Bearer ${pairing.token}")
                setRequestProperty("Accept", "application/json")
            }
            try {
                if (body != null || method == "POST") {
                    conn.doOutput = true
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.outputStream.use { it.write((body ?: JSONObject()).toString().toByteArray()) }
                }
                val code = conn.responseCode
                val text = (if (code < 400) conn.inputStream else conn.errorStream)
                    ?.bufferedReader()?.use { it.readText() }.orEmpty()
                val json = runCatching { JSONObject(text) }.getOrDefault(JSONObject())
                when {
                    code < 400 -> json
                    code == 401 -> throw ApiError("${pairing.computer} no longer knows this phone. Pair it again from Benchhand on the computer.")
                    code == 403 -> throw ApiError("${pairing.computer} only answers phones on your Tailscale network. Turn Tailscale on here.")
                    else -> throw ApiError(json.optString("error").ifBlank { "${pairing.computer} answered with error $code." })
                }
            } catch (e: IOException) {
                throw ApiError("Can't reach ${pairing.computer}. Check that it is on and awake, and that Tailscale is on here and there.", offline = true)
            } finally {
                conn.disconnect()
            }
        }
}

private inline fun <T> JSONArray.map(f: (JSONObject) -> T): List<T> = (0 until length()).map { f(getJSONObject(it)) }

private fun parseApproval(o: JSONObject) = Approval(
    o.getString("id"), o.getString("taskId"), o.optString("title"), o.optString("target"), o.optString("summary"),
    o.optString("status"), o.optLong("createdAt"), o.optString("toolName"),
    o.optJSONObject("arguments") ?: JSONObject(), o.optBoolean("edited"), o.optString("botId"),
    o.optString("taskTitle"), o.optLong("taskStartedAt"),
)

fun parseSummary(o: JSONObject) = Summary(
    computer = o.optString("computer"),
    version = o.optString("version"),
    now = o.optLong("now"),
    timezone = o.optString("timezone"),
    pending = o.getJSONArray("pending").map(::parseApproval),
    recent = o.getJSONArray("recent").map(::parseApproval),
    team = o.getJSONArray("team").map {
        Mate(
            it.getString("id"), it.optString("name"), it.optString("role"), it.optString("color"),
            it.optString("model"), it.optInt("running"), it.optInt("waiting"), it.optString("lastTask"),
            it.optInt("runsToday"),
        )
    },
    running = o.getJSONArray("running").map {
        Running(it.getString("id"), it.optString("title"), it.optString("botId"), it.optLong("updatedAt"))
    },
    routines = o.getJSONArray("routines").map {
        Routine(
            it.getString("id"), it.optString("name"), it.optString("botId"), it.optString("title"),
            it.optJSONObject("config") ?: JSONObject(), it.optBoolean("enabled"), it.optLong("nextRunAt"),
            it.optLong("lastRunAt"), it.optString("lastError"),
        )
    },
)
