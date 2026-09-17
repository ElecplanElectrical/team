import SwiftUI

extension Color {
    static let raceEdgeBlue = Color(red: 0.08, green: 0.62, blue: 0.96)
    static let raceEdgeNavy = Color(red: 0.015, green: 0.055, blue: 0.09)
    static let raceEdgeCard = Color(red: 0.035, green: 0.10, blue: 0.15)
}

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
            .tint(.raceEdgeBlue)
            .preferredColorScheme(.dark)
            .task { if api.home == nil && api.liveToday == nil { await api.loadHome() } }
        }
    }
}
