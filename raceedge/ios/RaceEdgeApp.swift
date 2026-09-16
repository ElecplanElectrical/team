import SwiftUI

@main
struct RaceEdgeApp: App {
    @StateObject private var api = RaceEdgeAPI()

    var body: some Scene {
        WindowGroup {
            TabView {
                LiveTodayView(api: api)
                    .tabItem { Label("Home", systemImage: "house.fill") }
                RacesView(api: api)
                    .tabItem { Label("Races", systemImage: "flag.checkered") }
                TipsView()
                    .tabItem { Label("Tips", systemImage: "star.fill") }
                ResultsView()
                    .tabItem { Label("Results", systemImage: "chart.bar.fill") }
                MoreView()
                    .tabItem { Label("More", systemImage: "ellipsis") }
            }
            .tint(.green)
            .preferredColorScheme(.dark)
            .task { await api.loadHome() }
        }
    }
}
