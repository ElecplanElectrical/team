import SwiftUI

struct RunnerDetailView: View {
    let runner: RaceRunner

    var body: some View {
        ZStack {
            Color.raceEdgeNavy.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    runnerHeader
                    if runner.scratched {
                        Label("SCRATCHED", systemImage: "xmark.circle.fill")
                            .foregroundStyle(.red).font(.headline)
                    }

                    Text("FORM & ANALYSIS").font(.caption.bold()).tracking(1.5).foregroundStyle(Color.raceEdgeBlue)
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        metric("Current Odds", runner.price.map { "$\(String(format: "%.2f", $0))" } ?? "—")
                        metric("Fair Price", runner.estimatedFairPrice.map { "$\(String(format: "%.2f", $0))" } ?? "—")
                        metric("Est. Probability", runner.estimatedProbability.map { "\(String(format: "%.1f", $0))%" } ?? "—")
                        metric("Value Edge", runner.valueEdge.map { "\(String(format: "%+.1f", $0))%" } ?? "—")
                        metric("Barrier / Box", runner.barrier.map(String.init) ?? "—")
                        metric("RaceEdge Rank", runner.rank.map { "#\($0)" } ?? "—")
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "chart.bar.xaxis").foregroundStyle(Color.raceEdgeBlue)
                            Text("RaceEdge Analysis").font(.headline)
                        }
                        Text("Fair price, probability and value edge are analytical estimates. Production calibration and historical validation remain part of RaceEdge's performance process.")
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 16))
                }
                .padding()
            }
        }
        .navigationTitle("Runner Form")
        .navigationBarTitleDisplayMode(.inline)
        .preferredColorScheme(.dark)
    }

    private var runnerHeader: some View {
        HStack(alignment: .center, spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 14).fill(Color.raceEdgeBlue.opacity(0.16))
                Text("#\(runner.number)").font(.title.bold()).foregroundStyle(Color.raceEdgeBlue)
            }.frame(width: 64, height: 64)

            VStack(alignment: .leading, spacing: 4) {
                Text(runner.name).font(.title2.bold())
                Text("RUNNER FORM").font(.caption2.bold()).tracking(1.4).foregroundStyle(.secondary)
            }
            Spacer()
            if let rating = runner.raceEdgeRating {
                ZStack {
                    Circle().stroke(Color.raceEdgeBlue.opacity(0.25), lineWidth: 5)
                    Circle().trim(from: 0, to: min(CGFloat(rating) / 100, 1))
                        .stroke(Color.raceEdgeBlue, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: -2) {
                        Text("\(rating)").font(.title3.bold())
                        Text("RATING").font(.system(size: 7, weight: .bold)).foregroundStyle(.secondary)
                    }
                }.frame(width: 64, height: 64)
            }
        }
        .padding()
        .background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 18))
    }

    private func metric(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title3.bold())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.white, in: RoundedRectangle(cornerRadius: 14))
        .foregroundStyle(.black)
    }
}
