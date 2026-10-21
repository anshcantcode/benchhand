package dev.localteam.benchhand.ui

import dev.localteam.benchhand.Routine
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val zone get() = ZoneId.systemDefault()
private val hm = DateTimeFormatter.ofPattern("HH:mm", Locale.UK)
private val dayMonth = DateTimeFormatter.ofPattern("EEE d MMM", Locale.UK)
private val longDate = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.UK)

/** "9 h 26 m", "14 m", "Now", with no-break spaces so a wait never splits across lines. */
fun waited(seconds: Long): String {
    val m = (seconds / 60).coerceAtLeast(0)
    return when {
        m < 1 -> "Now"
        m < 60 -> "$m m"
        m < 60 * 48 -> "${m / 60} h ${m % 60} m"
        else -> "${m / 1440} d"
    }
}

fun clock(at: Long): String = hm.format(Instant.ofEpochSecond(at).atZone(zone))

/** "Today 07:30", "Yesterday 22:41", "Tomorrow 08:00", or "Mon 26 Oct, 09:00". */
fun dayAndTime(at: Long): String {
    val t = Instant.ofEpochSecond(at).atZone(zone)
    val today = LocalDate.now(zone)
    val day = when (t.toLocalDate()) {
        today -> "Today"
        today.minusDays(1) -> "Yesterday"
        today.plusDays(1) -> "Tomorrow"
        else -> return "${dayMonth.format(t)}, ${hm.format(t)}"
    }
    return "$day ${hm.format(t)}"
}

fun date(atMillis: Long): String = longDate.format(Instant.ofEpochMilli(atMillis).atZone(zone))

private val weekdays = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")

/** How a routine repeats, in the desktop's words: "Daily 07:30", "Mon, Thu 09:00", "Every 2 h". */
fun repeatLabel(r: Routine): String {
    val c = r.config
    return when (c.optString("kind")) {
        "daily" -> "Daily ${c.optString("time")}"
        "weekly" -> {
            val days = c.optJSONArray("days")
            val list = (0 until (days?.length() ?: 0)).map { days!!.getInt(it) }.sorted()
            val names = when (list) {
                listOf(1, 2, 3, 4, 5) -> "Weekdays"
                listOf(0, 6) -> "Weekends"
                else -> list.joinToString(", ") { weekdays.getOrElse(it) { "?" } }
            }
            "$names ${c.optString("time")}"
        }
        "interval" -> {
            val s = c.optLong("seconds")
            when {
                s % 86_400 == 0L -> "Every ${s / 86_400} d"
                s % 3_600 == 0L -> if (s == 3_600L) "Hourly" else "Every ${s / 3_600} h"
                else -> "Every ${s / 60} m"
            }
        }
        "once" -> "Once"
        else -> "Custom"
    }
}

fun plural(n: Int, word: String) = "$n $word${if (n == 1) "" else "s"}"
