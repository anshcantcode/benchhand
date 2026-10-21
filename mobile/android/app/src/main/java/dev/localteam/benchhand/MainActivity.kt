package dev.localteam.benchhand

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_WEAK
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import dev.localteam.benchhand.ui.App
import dev.localteam.benchhand.ui.Host

class MainActivity : FragmentActivity(), Host {
    private val model: Model by viewModels()

    /** A pairing link or an approval id from a notification, waiting for the UI to take it. */
    private var request by mutableStateOf<String?>(null)

    private val askNotifications = registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        take(intent)
        setContent { App(model, this, request) { request = null } }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        take(intent)
    }

    override fun onStart() {
        super.onStart()
        model.start()
        if (model.pairing != null && Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED
        ) askNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
    }

    override fun onStop() {
        super.onStop()
        model.stop()
    }

    private fun take(intent: Intent?) {
        intent ?: return
        intent.getStringExtra(Notifier.EXTRA_APPROVAL)?.let { request = it }
        intent.data?.takeIf { it.scheme == "benchhand" }?.let { request = it.toString() }
    }

    /** Google's code scanner: runs in Play services, so the app needs no camera permission. */
    override fun scan(onCode: (String) -> Unit, onError: (String) -> Unit) {
        val options = GmsBarcodeScannerOptions.Builder().setBarcodeFormats(Barcode.FORMAT_QR_CODE).build()
        GmsBarcodeScanning.getClient(this, options).startScan()
            .addOnSuccessListener { code -> code.rawValue?.let(onCode) ?: onError("That code was empty. Try again.") }
            .addOnFailureListener {
                onError("The scanner isn't available on this phone. Copy the pairing code on the computer and paste it here.")
            }
    }

    override fun confirm(title: String, subtitle: String, onOk: () -> Unit, onError: (String) -> Unit) {
        val allowed = BIOMETRIC_WEAK or DEVICE_CREDENTIAL
        when (BiometricManager.from(this).canAuthenticate(allowed)) {
            BiometricManager.BIOMETRIC_SUCCESS -> Unit
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> {
                // No screen lock to ask for: say so rather than approving silently.
                onError("Set a screen lock on this phone, or turn off Confirm with fingerprint in Settings.")
                return
            }
            else -> { onOk(); return }
        }
        val prompt = BiometricPrompt(this, ContextCompat.getMainExecutor(this), object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) = onOk()
            override fun onAuthenticationError(code: Int, message: CharSequence) {
                if (code != BiometricPrompt.ERROR_USER_CANCELED && code != BiometricPrompt.ERROR_NEGATIVE_BUTTON && code != BiometricPrompt.ERROR_CANCELED) {
                    onError(message.toString())
                }
            }
        })
        prompt.authenticate(
            BiometricPrompt.PromptInfo.Builder()
                .setTitle(title)
                .setSubtitle(subtitle.take(120))
                .setAllowedAuthenticators(allowed)
                .build(),
        )
    }
}
