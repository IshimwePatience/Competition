package com.vaf.healthaccess.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.vaf.healthaccess.data.AppViewModel

@Composable
fun TriageScreen(vm: AppViewModel) {
    var symptoms by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("AI Symptom Triage", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = symptoms,
            onValueChange = { symptoms = it },
            label = { Text("Describe your symptoms") },
            modifier = Modifier.fillMaxWidth().height(120.dp)
        )
        Spacer(Modifier.height(12.dp))
        Button(
            onClick = { vm.runTriage(symptoms) },
            enabled = symptoms.isNotBlank() && !vm.triageLoading.value
        ) {
            Text("Check Symptoms")
        }
        Spacer(Modifier.height(16.dp))

        if (vm.triageLoading.value) {
            CircularProgressIndicator()
        }

        vm.triageResult.value?.let { result ->
            Card(Modifier.fillMaxWidth()) {
                Text(result, modifier = Modifier.padding(12.dp))
            }
        }
    }
}
