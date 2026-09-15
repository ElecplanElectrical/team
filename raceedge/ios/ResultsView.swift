import SwiftUI

struct ResultsView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                VStack(spacing: 14) {
                    Image(systemName: "chart.bar.fill").font(.system(size: 44)).foregroundStyle(.green)
                    Text("Results & Performance").font(.title2.bold())
                    Text("RaceEdge will track published selections, finishing positions and historical strike rate here as settled results are recorded.")
                        .multilineTextAlignment(.center).foregroundStyle(.secondary)
                    Text("Performance statistics will be based on recorded results — not simulated claims.")
                        .font(.caption).multilineTextAlignment(.center).foregroundStyle(.secondary)
                }.padding(28)
            }
            .navigationTitle("Results")
        }
        .preferredColorScheme(.dark)
    }
}
