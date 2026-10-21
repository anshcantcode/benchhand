package dev.localteam.benchhand

import android.Manifest
import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

class BenchhandApp : Application() {
    override fun onCreate() {
        super.onCreate()
        val channel = NotificationChannel(Notifier.CHANNEL, "Actions waiting on you", NotificationManager.IMPORTANCE_HIGH)
            .apply { description = "A teammate needs your approval before it acts." }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        if (Store(this).pairing != null) Notifier.schedule(this)
    }
}

object Notifier {
    const val CHANNEL = "waiting"
    const val EXTRA_APPROVAL = "approval"
    private const val WORK = "check-waiting"

    /** Android runs periodic work at most every 15 minutes; that is the longest a notification can lag. */
    fun schedule(context: Context) {
        val request = PeriodicWorkRequestBuilder<CheckWorker>(15, TimeUnit.MINUTES)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(WORK, ExistingPeriodicWorkPolicy.KEEP, request)
    }

    fun cancel(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(WORK)
        NotificationManagerCompat.from(context).cancelAll()
    }

    /** Announces approvals the phone has not announced before. Returns nothing; failures are silent. */
    fun announce(context: Context, store: Store, summary: Summary) {
        val ids = summary.pending.map { it.id }.toSet()
        val before = store.announced
        val fresh = summary.pending.filter { it.id !in before }
        store.announced = ids
        val nm = NotificationManagerCompat.from(context)
        // Withdraw notifications for actions decided elsewhere.
        (before - ids).forEach { nm.cancel(it.hashCode()) }
        if (!store.notifyWaiting || fresh.isEmpty()) return
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return
        for (a in fresh) {
            val name = summary.mate(a.botId)?.name ?: "A teammate"
            val open = PendingIntent.getActivity(
                context, a.id.hashCode(),
                Intent(context, MainActivity::class.java).putExtra(EXTRA_APPROVAL, a.id)
                    .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
            )
            val publicVersion = NotificationCompat.Builder(context, CHANNEL)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("$name needs you")
                .setContentText("${summary.pending.size} waiting on ${summary.computer}")
                .build()
            val n = NotificationCompat.Builder(context, CHANNEL)
                .setSmallIcon(R.drawable.ic_notification)
                .setColor(0xFF54C2A4.toInt())
                .setSubText(summary.computer)
                .setContentTitle("$name: ${a.title.ifBlank { "wants to act" }}")
                .setContentText(a.target.ifBlank { a.taskTitle })
                .setStyle(NotificationCompat.BigTextStyle().bigText(listOf(a.target, a.summary).filter { it.isNotBlank() }.joinToString("\n")))
                .setWhen(a.createdAt * 1000)
                .setShowWhen(true)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setVisibility(if (store.hideOnLockScreen) NotificationCompat.VISIBILITY_PRIVATE else NotificationCompat.VISIBILITY_PUBLIC)
                .setPublicVersion(publicVersion)
                .setContentIntent(open)
                .setAutoCancel(true)
                .build()
            runCatching { nm.notify(a.id.hashCode(), n) }
        }
    }
}

class CheckWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val store = Store(applicationContext)
        val pairing = store.pairing ?: return Result.success()
        return try {
            Notifier.announce(applicationContext, store, Api(pairing).summary())
            Result.success()
        } catch (e: ApiError) {
            // Offline is normal (the computer sleeps); try again on the next period.
            Result.success()
        }
    }
}
