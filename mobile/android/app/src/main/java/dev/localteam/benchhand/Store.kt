package dev.localteam.benchhand

import android.content.Context
import android.net.Uri
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** One paired computer: where it is and the key the phone presents. */
data class Pairing(val host: String, val port: Int, val token: String, val computer: String, val pairedAt: Long) {
    val base get() = "http://$host:$port"

    companion object {
        /** Reads `benchhand://pair?h=…&p=…&t=…&n=…`, the code the computer shows. */
        fun parse(code: String): Pairing? {
            val uri = runCatching { Uri.parse(code.trim()) }.getOrNull() ?: return null
            if (uri.scheme != "benchhand" || uri.host != "pair") return null
            val host = uri.getQueryParameter("h")?.takeIf { it.matches(Regex("[0-9a-fA-F.:]+")) } ?: return null
            val port = uri.getQueryParameter("p")?.toIntOrNull()?.takeIf { it in 1..65535 } ?: return null
            val token = uri.getQueryParameter("t")?.takeIf { it.length >= 32 } ?: return null
            val name = uri.getQueryParameter("n").orEmpty().ifBlank { "Your computer" }
            return Pairing(host, port, token, name, System.currentTimeMillis())
        }
    }
}

/**
 * Keeps the pairing and a few phone-side choices. The key the computer accepts is
 * encrypted with an AES key that never leaves the Android Keystore.
 */
class Store(context: Context) {
    private val prefs = context.getSharedPreferences("benchhand", Context.MODE_PRIVATE)

    var pairing: Pairing?
        get() {
            val token = prefs.getString("token", null)?.let(::decrypt) ?: return null
            return Pairing(
                prefs.getString("host", "")!!, prefs.getInt("port", 0), token,
                prefs.getString("computer", "")!!, prefs.getLong("pairedAt", 0),
            )
        }
        set(value) {
            if (value == null) {
                prefs.edit().clear().apply()
                return
            }
            prefs.edit()
                .putString("host", value.host).putInt("port", value.port)
                .putString("token", encrypt(value.token))
                .putString("computer", value.computer).putLong("pairedAt", value.pairedAt)
                .apply()
        }

    var notifyWaiting: Boolean
        get() = prefs.getBoolean("notifyWaiting", true)
        set(v) = prefs.edit().putBoolean("notifyWaiting", v).apply()
    var hideOnLockScreen: Boolean
        get() = prefs.getBoolean("hideOnLockScreen", true)
        set(v) = prefs.edit().putBoolean("hideOnLockScreen", v).apply()
    var confirmApprovals: Boolean
        get() = prefs.getBoolean("confirmApprovals", true)
        set(v) = prefs.edit().putBoolean("confirmApprovals", v).apply()

    /** Approvals the phone has already announced, so each one notifies once. */
    var announced: Set<String>
        get() = prefs.getStringSet("announced", emptySet())!!
        set(v) = prefs.edit().putStringSet("announced", v).apply()

    private fun key(): SecretKey {
        val ks = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (ks.getEntry(ALIAS, null) as? KeyStore.SecretKeyEntry)?.let { return it.secretKey }
        val gen = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        gen.init(
            KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .build(),
        )
        return gen.generateKey()
    }

    private fun encrypt(plain: String): String {
        val c = Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE, key()) }
        return Base64.encodeToString(c.iv + c.doFinal(plain.toByteArray()), Base64.NO_WRAP)
    }

    private fun decrypt(stored: String): String? = runCatching {
        val bytes = Base64.decode(stored, Base64.NO_WRAP)
        val c = Cipher.getInstance("AES/GCM/NoPadding")
        c.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, bytes, 0, 12))
        String(c.doFinal(bytes, 12, bytes.size - 12))
    }.getOrNull()

    private companion object {
        const val ALIAS = "benchhand-pairing"
    }
}
