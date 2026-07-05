package com.vaf.healthaccess.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.vaf.healthaccess.data.AppViewModel
import com.vaf.healthaccess.data.Role

@Composable
fun RoleSelectScreen(vm: AppViewModel, onContinue: () -> Unit) {
    var name by remember { mutableStateOf("") }
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("HealthAccess", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(24.dp))
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Your name") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(16.dp))
        Text("Select role for demo:")
        Spacer(Modifier.height(8.dp))
        Role.values().forEach { role ->
            Button(
                onClick = {
                    vm.currentRole.value = role
                    vm.currentUserName.value = if (name.isBlank()) "Guest" else name
                    onContinue()
                },
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
            ) {
                Text(role.name.replace("_", " "))
            }
        }
    }
}
