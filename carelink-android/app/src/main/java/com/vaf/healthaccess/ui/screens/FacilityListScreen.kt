package com.vaf.healthaccess.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.vaf.healthaccess.data.AppViewModel
import com.vaf.healthaccess.data.Facility
import com.vaf.healthaccess.data.Role

@Composable
fun FacilityListScreen(vm: AppViewModel) {
    var editingFacility by remember { mutableStateOf<Facility?>(null) }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(12.dp)) {
        items(vm.facilities) { facility ->
            Card(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                Column(Modifier.padding(12.dp)) {
                    Text(facility.name, style = MaterialTheme.typography.titleMedium)
                    Text("${facility.distanceKm} km away")
                    Text("Status: ${facility.status} | Wait: ${facility.waitTimeMin} min")
                    Text("Stock: ${facility.stockLevel}")
                    if (facility.verified) {
                        Text("Verified by Health Worker", color = MaterialTheme.colorScheme.primary)
                    }
                    Text("Last updated by: ${facility.lastUpdatedBy}", style = MaterialTheme.typography.bodySmall)

                    if (vm.currentRole.value == Role.USER || vm.currentRole.value == Role.HEALTH_WORKER) {
                        Spacer(Modifier.height(8.dp))
                        Button(onClick = { editingFacility = facility }) {
                            Text(if (vm.currentRole.value == Role.HEALTH_WORKER) "Verify / Update" else "Report Status")
                        }
                    }
                }
            }
        }
    }

    editingFacility?.let { facility ->
        ReportDialog(
            facility = facility,
            onDismiss = { editingFacility = null },
            onSubmit = { status, wait, stock ->
                vm.reportFacility(facility, status, wait, stock)
                editingFacility = null
            }
        )
    }
}

@Composable
fun ReportDialog(
    facility: Facility,
    onDismiss: () -> Unit,
    onSubmit: (String, Int, String) -> Unit
) {
    var status by remember { mutableStateOf(facility.status) }
    var wait by remember { mutableStateOf(facility.waitTimeMin.toString()) }
    var stock by remember { mutableStateOf(facility.stockLevel) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Update ${facility.name}") },
        text = {
            Column {
                Text("Status")
                Row {
                    listOf("Open", "Closed").forEach { s ->
                        FilterChip(selected = status == s, onClick = { status = s }, label = { Text(s) })
                        Spacer(Modifier.width(6.dp))
                    }
                }
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(value = wait, onValueChange = { wait = it }, label = { Text("Wait time (min)") })
                Spacer(Modifier.height(8.dp))
                Text("Stock")
                Row {
                    listOf("Good", "Low", "OutOfStock").forEach { s ->
                        FilterChip(selected = stock == s, onClick = { stock = s }, label = { Text(s) })
                        Spacer(Modifier.width(6.dp))
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(status, wait.toIntOrNull() ?: 0, stock) }) {
                Text("Submit")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
