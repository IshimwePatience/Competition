package com.vaf.healthaccess.data

import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import com.vaf.healthaccess.BuildConfig
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class AppViewModel : ViewModel() {

    var currentRole = mutableStateOf(Role.USER)
    var currentUserName = mutableStateOf("Guest")
    var credits = mutableStateOf(0)

    val facilities = mutableStateListOf(
        Facility(1, "Kacyiru Health Center", 1.2),
        Facility(2, "Remera Polyclinic", 2.5, status = "Open", waitTimeMin = 30, stockLevel = "Low"),
        Facility(3, "Kimironko Health Post", 0.8, status = "Closed", waitTimeMin = 0, stockLevel = "OutOfStock"),
        Facility(4, "Nyarugenge District Hospital", 3.4, waitTimeMin = 45, stockLevel = "Good"),
        Facility(5, "Gikondo Community Clinic", 1.9, waitTimeMin = 10, stockLevel = "Good")
    )

    val pendingWorkers = mutableStateListOf(
        PendingWorker(1, "J. Uwase", "Kacyiru Health Center"),
        PendingWorker(2, "E. Niyonzima", "Remera Polyclinic")
    )

    var triageResult = mutableStateOf<String?>(null)
    var triageLoading = mutableStateOf(false)

    fun reportFacility(facility: Facility, newStatus: String, newWait: Int, newStock: String) {
        val index = facilities.indexOfFirst { it.id == facility.id }
        if (index == -1) return
        val isWorker = currentRole.value == Role.HEALTH_WORKER
        facilities[index] = facilities[index].copy(
            status = newStatus,
            waitTimeMin = newWait,
            stockLevel = newStock,
            verified = if (isWorker) true else facilities[index].verified,
            lastUpdatedBy = currentUserName.value
        )
        credits.value += if (isWorker) 10 else 5
    }

    fun approveWorker(worker: PendingWorker) {
        pendingWorkers.remove(worker)
    }

    fun addFacility(name: String) {
        val newId = (facilities.maxOfOrNull { it.id } ?: 0) + 1
        facilities.add(Facility(newId, name, 0.0))
    }

    fun removeFacility(facility: Facility) {
        facilities.remove(facility)
    }

    fun runTriage(symptoms: String) {
        triageLoading.value = true
        triageResult.value = null
        viewModelScope.launch {
            val result = withContext(Dispatchers.IO) {
                try {
                    val url = URL("https://api.mistral.ai/v1/chat/completions")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.setRequestProperty("Authorization", "Bearer " + BuildConfig.MISTRAL_API_KEY)
                    conn.doOutput = true

                    val messages = JSONArray()
                    val sys = JSONObject()
                    sys.put("role", "system")
                    sys.put("content", "You are a medical triage assistant for a Rwandan community health app. Given symptoms, respond with EXACTLY 3 lines: URGENCY: (Emergency/Moderate/Mild), ADVICE: (one short sentence), ACTION: (one short sentence on what to do next). Do not add extra text.")
                    val usr = JSONObject()
                    usr.put("role", "user")
                    usr.put("content", symptoms)
                    messages.put(sys)
                    messages.put(usr)

                    val body = JSONObject()
                    body.put("model", "mistral-small-latest")
                    body.put("messages", messages)
                    body.put("temperature", 0.2)

                    conn.outputStream.use { it.write(body.toString().toByteArray()) }

                    val responseCode = conn.responseCode
                    val stream = if (responseCode in 200..299) conn.inputStream else conn.errorStream
                    val text = stream.bufferedReader().readText()

                    if (responseCode !in 200..299) {
                        "Error ($responseCode): $text"
                    } else {
                        val json = JSONObject(text)
                        json.getJSONArray("choices")
                            .getJSONObject(0)
                            .getJSONObject("message")
                            .getString("content")
                    }
                } catch (e: Exception) {
                    "Error: ${e.message}"
                }
            }
            triageResult.value = result
            triageLoading.value = false
        }
    }
}

