import SwiftUI

struct MoreView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                Color.raceEdgeNavy.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("RACEEDGE").font(.caption.bold()).tracking(2).foregroundStyle(Color.raceEdgeBlue)
                            Text("More").font(.largeTitle.bold())
                            Text("Racing coverage, product information and analysis notes.").foregroundStyle(.secondary)
                        }

                        infoCard(title: "Racing Coverage", icon: "flag.checkered", rows: [
                            "Australian thoroughbred racing",
                            "Greyhound racing",
                            "Harness-ready data architecture"
                        ])

                        infoCard(title: "RaceEdge Analysis", icon: "chart.bar.xaxis", rows: [
                            "Form, speed, class, pace and conditions",
                            "Fair-price and value estimates when data is sufficient",
                            "Scratchings checked before final selections"
                        ])

                        VStack(alignment: .leading, spacing: 8) {
                            Label("About Ratings", systemImage: "info.circle.fill").font(.headline).foregroundStyle(Color.raceEdgeBlue)
                            Text("Current RaceEdge weighting remains a prototype until historical back-testing and calibration are completed.")
                            Text("Selections are analytical estimates, not guaranteed winners.")
                        }
                        .font(.subheadline)
                        .padding()
                        .background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 16))
                    }.padding()
                }
            }
            .navigationBarHidden(true)
        }
        .preferredColorScheme(.dark)
    }

    private func infoCard(title: String, icon: String, rows: [String]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon).font(.headline).foregroundStyle(Color.raceEdgeBlue)
            ForEach(rows, id: \.self) { row in
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: "checkmark.circle.fill").font(.caption).foregroundStyle(Color.raceEdgeBlue).padding(.top, 2)
                    Text(row).font(.subheadline)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 16))
    }
}
