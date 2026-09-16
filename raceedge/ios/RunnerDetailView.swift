import SwiftUI

struct RunnerDetailView: View {
    let runner: RaceRunner

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text("#\(runner.number)").font(.caption).foregroundStyle(.green)
                        Text(runner.name).font(.largeTitle.bold())
                    }
                    Spacer()
                    if let rating = runner.raceEdgeRating {
                        VStack { Text("\(rating)").font(.largeTitle.bold()).foregroundStyle(.green); Text("RATING").font(.caption2).foregroundStyle(.secondary) }
                    }
                }
                if runner.scratched { Label("SCRATCHED", systemImage: "xmark.circle.fill").foregroundStyle(.red).font(.headline) }
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    metric("Market", runner.price.map { "$\(String(format: "%.2f", $0))" } ?? "—")
                    metric("Fair price", runner.estimatedFairPrice.map { "$\(String(format: "%.2f", $0))" } ?? "—")
                    metric("Est. probability", runner.estimatedProbability.map { "\(String(format: "%.1f", $0))%" } ?? "—")
                    metric("Value edge", runner.valueEdge.map { "\(String(format: "%+.1f", $0))%" } ?? "—")
                    metric("Barrier", runner.barrier.map(String.init) ?? "—")
                    metric("RaceEdge rank", runner.rank.map { "#\($0)" } ?? "—")
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text("RaceEdge analysis").font(.headline)
                    Text("Fair price, probability and value edge are prototype analytical estimates. They are not guaranteed outcomes and remain subject to historical calibration and production validation.").font(.subheadline).foregroundStyle(.secondary)
                }.padding().background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
            }.padding()
        }
        .navigationTitle("Runner")
        .navigationBarTitleDisplayMode(.inline)
        .preferredColorScheme(.dark)
    }

    private func metric(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title3.bold())
        }.frame(maxWidth: .infinity, alignment: .leading).padding().background(.thinMaterial, in: RoundedRectangle(cornerRadius: 14))
    }
}
