import SwiftUI

struct MoreView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("RaceEdge") {
                    Label("Australian thoroughbred racing", systemImage: "flag.checkered")
                    Label("Greyhound racing", systemImage: "hare.fill")
                    Label("Harness-ready data architecture", systemImage: "square.stack.3d.up.fill")
                }
                Section("About ratings") {
                    Text("Current RaceEdge weighting is a prototype until historical back-testing is completed.")
                    Text("Selections are analysis and estimates, not guaranteed winners.")
                }
            }
            .navigationTitle("More")
        }
        .preferredColorScheme(.dark)
    }
}
