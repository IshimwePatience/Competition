package com.vaf.healthaccess.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.vaf.healthaccess.data.AppViewModel

@Composable
fun AdminScreen(vm: AppViewModel) {
    var newFacility by remember { mutableStateOf("") }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        item {
            Text("Admin Panel", style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(16.dp))
            Text("Analytics", style = MaterialTheme.typography.titleMedium)
            Text("Total facilities: ${vm.facilities.size}")
            Text("Pending worker approvals: ${vm.pendingWorkers.size}")
            Spacer(Modifier.height(20.dp))

            Text("Manage Facilities", style = MaterialTheme.typography.titleMedium)
            Row(Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = newFacility,
                    onValueChange = { newFacility = it },
                    label = { Text("New facility name") },
                    modifier = Modifier.weight(1f)
                )
                Spacer(Modifier.width(8.dp))
                Button(onClick = {
                    if (newFacility.isNotBlank()) {
                        vm.addFacility(newFacility)
                        newFacility = ""
                    }
                }) { Text("Add") }
            }
            Spacer(Modifier.height(12.dp))
        }

        items(vm.facilities) { facility ->
            Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                Row(
                    Modifier.padding(12.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(facility.name)
                    TextButton(onClick = { vm.removeFacility(facility) }) {
                        Text("Remove")
                    }
                }
            }
        }

        item {
            Spacer(Modifier.height(20.dp))
            Text("Pending Health Worker Approvals", style = MaterialTheme.typography.titleMedium)
        }

        items(vm.pendingWorkers) { worker ->
            Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                Row(
                    Modifier.padding(12.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(worker.name)
                        Text(worker.facility, style = MaterialTheme.typography.bodySmall)
                    }
                    Button(onClick = { vm.approveWorker(worker) }) {
                        Text("Approve")
                    }
                }
            }
        }
    }
}
