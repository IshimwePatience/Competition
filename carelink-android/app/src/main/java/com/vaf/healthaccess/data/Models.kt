package com.vaf.healthaccess.data

data class Facility(
    var id: Int,
    var name: String,
    var distanceKm: Double,
    var status: String = "Open",
    var waitTimeMin: Int = 15,
    var stockLevel: String = "Good",
    var verified: Boolean = false,
    var lastUpdatedBy: String = "System"
)

enum class Role { USER, HEALTH_WORKER, ADMIN }

data class PendingWorker(val id: Int, val name: String, val facility: String)
