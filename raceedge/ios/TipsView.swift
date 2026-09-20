import SwiftUI

struct TipsView: View {
    @ObservedObject var api: RaceEdgeAPI

    private var tips: [RaceTip] { api.home?.tips ?? [] }
    private var greyhoundTips: [RaceTip] { tips.filter { ($0.label ?? "").uppercased().contains("GREYHOUND") } }
    private var bestBets: [RaceTip] { tips.filter { !($0.label ?? "").uppercased().contains("GREYHOUND") } }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.raceEdgeNavy.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        header

                        if !bestBets.isEmpty {
                            sectionTitle("Today's Best Bets", subtitle: "RaceEdge selections")
                            ForEach(bestBets) { tipCard($0) }
                        }

                        if !greyhoundTips.isEmpty {
                            sectionTitle("Greyhound Selections", subtitle: "Dedicated greyhound analysis")
                                .padding(.top, 4)
                            ForEach(greyhoundTips) { tipCard($0) }
                        }

                        if tips.isEmpty && api.errorMessage == nil { ProgressView().tint(Color.raceEdgeBlue) }
                        if let message = api.errorMessage { Text(message).foregroundStyle(.secondary) }

                        Text("RaceEdge ratings are analytical estimates and are not guaranteed outcomes.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .padding(.top, 8)
                    }
                    .padding()
                }
            }
            .navigationBarHidden(true)
            .task { if api.home == nil { await api.loadHome() } }
            .refreshable { await api.loadHome() }
        }
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("TIPS").font(.caption.bold()).tracking(2).foregroundStyle(Color.raceEdgeBlue)
            Text("RaceEdge Selections").font(.largeTitle.bold())
            Text("Top picks, dangers and value selections.").foregroundStyle(.secondary)
        }
    }

    private func sectionTitle(_ title: String, subtitle: String) -> some View {
        HStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.title2.bold())
                Text(subtitle).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
        }
    }

    private func tipCard(_ tip: RaceTip) -> some View {
        HStack(spacing: 0) {
            Rectangle().fill(Color.raceEdgeBlue).frame(width: 5)
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text((tip.label ?? "RACEEDGE").uppercased())
                        .font(.caption2.bold())
                        .foregroundStyle(Color.raceEdgeBlue)
                    Spacer()
                    if let score = tip.score {
                        VStack(spacing: 0) {
                            Text("\(String(format: "%.0f", score))").font(.title.bold()).foregroundStyle(Color.raceEdgeBlue)
                            Text("RATING").font(.system(size: 8, weight: .bold)).foregroundStyle(.secondary)
                        }
                    }
                }

                HStack(alignment: .firstTextBaseline) {
                    Text("#\(tip.number ?? 0) \(tip.runner)").font(.title3.bold())
                    Spacer()
                    if let price = tip.price { Text("$\(String(format: "%.2f", price))").font(.title3.bold()) }
                }

                Text("\(tip.meeting) · Race \(tip.race)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                if let reason = tip.reason {
                    Divider().overlay(Color.white.opacity(0.12))
                    Text(reason).font(.footnote).foregroundStyle(.secondary)
                }
            }
            .padding(16)
        }
        .background(Color.white, in: RoundedRectangle(cornerRadius: 16))
        .foregroundStyle(Color.black)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
