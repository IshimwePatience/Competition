package com.vaf.healthaccess

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vaf.healthaccess.data.AppViewModel
import com.vaf.healthaccess.ui.screens.MainScreen
import com.vaf.healthaccess.ui.screens.RoleSelectScreen
import com.vaf.healthaccess.ui.theme.CareLinkTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CareLinkTheme {
                val vm: AppViewModel = viewModel()
                var loggedIn by remember { mutableStateOf(false) }
                if (loggedIn) {
                    MainScreen(vm)
                } else {
                    RoleSelectScreen(vm) { loggedIn = true }
                }
            }
        }
    }
}
