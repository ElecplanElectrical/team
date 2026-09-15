import SwiftUI

@main
struct RaceEdgeApp: App {
    var body: some Scene {
        WindowGroup {
            TabView {
                HomeView().tabItem { Label("Home", systemImage: "house.fill") }
                Text("Races").tabItem { Label("Races", systemImage: "flag.checkered") }
                Text("Tips").tabItem { Label("Tips", systemImage: "star.fill") }
                Text("Results").tabItem { Label("Results", systemImage: "chart.bar.fill") }
                Text("More").tabItem { Label("More", systemImage: "ellipsis") }
            }.tint(.green).preferredColorScheme(.dark)
        }
    }
}
