import SwiftUI

struct TipsView: View {
    @ObservedObject var api: RaceEdgeAPI

    private var tips: [RaceTip] { api.home?.tips ?? [] }
    private var greyhoundTips: [RaceTip] { tips.filter { ($0.label ?? "").uppercased().contains("GREYHOUND") } }
    private var bestBets: [RaceTip] { tips.filter { !($0.label ?? "").uppercased().contains("GREYHOUND") } }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        if !bestBets.isEmpty {
                            Text("Today's Best Bets").font(.title2.bold())
                            ForEach(bestBets) { tipCard($0) }
                        }

                        if !greyhoundTips.isEmpty {
                            Text("Greyhound Selections").font(.title2.bold()).padding(.top, 4)
                            ForEach(greyhoundTips) { tipCard($0) }
                        }

                        if tips.isEmpty && api.errorMessage == nil {
                            ProgressView()
                        }

                        if let message = api.errorMessage { Text(message).foregroundStyle(.secondary) }
                        Text("RaceEdge ratings are analytical estimates and are not guaranteed outcomes.").font(.caption).foregroundStyle(.secondary).padding(.top,8)
                    }.padding()
                }
            }
            .navigationTitle("Tips")
            .task { if api.home == nil { await api.loadHome() } }
            .refreshable { await api.loadHome() }
        }
        .preferredColorScheme(.dark)
    }

    private func tipCard(_ tip: RaceTip) -> some View {
        VStack(alignment:.leading,spacing:8) {
            Text(tip.label ?? "RACEEDGE").font(.caption.bold()).foregroundStyle(.green)
            HStack {
                Text("#\(tip.number ?? 0) \(tip.runner)").font(.headline)
                Spacer()
                if let score=tip.score { Text("\(score,specifier:"%.0f")").font(.title2.bold()).foregroundStyle(.green) }
            }
            HStack {
                Text("\(tip.meeting) · Race \(tip.race)")
                if let price=tip.price { Text("· $\(price,specifier:"%.2f")") }
            }.foregroundStyle(.secondary)
            if let reason=tip.reason { Text(reason).font(.footnote).foregroundStyle(.secondary) }
        }
        .padding()
        .background(.thinMaterial,in:RoundedRectangle(cornerRadius:16))
    }
}
