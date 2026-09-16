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
                TipsView(api: api)
                    .tabItem { Label("Tips", systemImage: "star.fill") }
                ResultsView(api: api)
                    .tabItem { Label("Results", systemImage: "chart.bar.fill") }
                MoreView()
                    .tabItem { Label("More", systemImage: "ellipsis") }
            }
            .tint(.green)
            .preferredColorScheme(.dark)
            .task { if api.home == nil && api.liveToday == nil { await api.loadHome() } }
        }
    }
}
