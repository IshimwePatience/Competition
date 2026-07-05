package com.vaf.healthaccess.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.vaf.healthaccess.data.AppViewModel
import com.vaf.healthaccess.data.Role

@Composable
fun MainScreen(vm: AppViewModel) {
    val navController = rememberNavController()
    val role = vm.currentRole.value

    Scaffold(
        bottomBar = {
            NavigationBar {
                val backStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = backStackEntry?.destination?.route

                NavigationBarItem(
                    selected = currentRoute == "facilities",
                    onClick = { navController.navigate("facilities") },
                    icon = { Icon(Icons.Default.LocationOn, contentDescription = null) },
                    label = { Text("Facilities") }
                )
                if (role != Role.ADMIN) {
                    NavigationBarItem(
                        selected = currentRoute == "triage",
                        onClick = { navController.navigate("triage") },
                        icon = { Icon(Icons.Default.Favorite, contentDescription = null) },
                        label = { Text("Triage") }
                    )
                    NavigationBarItem(
                        selected = currentRoute == "credits",
                        onClick = { navController.navigate("credits") },
                        icon = { Icon(Icons.Default.Star, contentDescription = null) },
                        label = { Text("Credits") }
                    )
                }
                if (role == Role.ADMIN) {
                    NavigationBarItem(
                        selected = currentRoute == "admin",
                        onClick = { navController.navigate("admin") },
                        icon = { Icon(Icons.Default.Settings, contentDescription = null) },
                        label = { Text("Admin") }
                    )
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = "facilities",
            modifier = Modifier.padding(padding)
        ) {
            composable("facilities") { FacilityListScreen(vm) }
            composable("triage") { TriageScreen(vm) }
            composable("credits") { CreditsScreen(vm) }
            composable("admin") { AdminScreen(vm) }
        }
    }
}
