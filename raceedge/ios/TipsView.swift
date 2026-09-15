import SwiftUI

struct TipsView: View {
    @StateObject private var api = RaceEdgeAPI()

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        if let tips = api.home?.tips {
                            ForEach(tips) { tip in
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(tip.label).font(.caption.bold()).foregroundStyle(.green)
                                    HStack {
                                        Text("#\(tip.number) \(tip.runner)").font(.headline)
                                        Spacer()
                                        Text("\(tip.score)").font(.title2.bold()).foregroundStyle(.green)
                                    }
                                    Text("\(tip.meeting) · Race \(tip.race) · $\(tip.price, specifier: "%.2f")").foregroundStyle(.secondary)
                                    Text(tip.reason).font(.footnote).foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
                            }
                            Text("RaceEdge ratings are analytical estimates and are not guaranteed outcomes.")
                                .font(.caption).foregroundStyle(.secondary).padding(.top, 8)
                        } else if let message = api.errorMessage {
                            Text(message).foregroundStyle(.secondary)
                        } else { ProgressView() }
                    }.padding()
                }
            }
            .navigationTitle("Tips")
            .task { await api.loadHome() }
            .refreshable { await api.loadHome() }
        }
        .preferredColorScheme(.dark)
    }
}
