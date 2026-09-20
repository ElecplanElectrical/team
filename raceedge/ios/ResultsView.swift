import SwiftUI

struct ResultsView: View {
    @ObservedObject var api: RaceEdgeAPI

    var body: some View {
        NavigationStack {
            ZStack {
                Color.raceEdgeNavy.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment:.leading,spacing:4) {
                            Text("RESULTS").font(.caption.bold()).tracking(2).foregroundStyle(Color.raceEdgeBlue)
                            Text("Performance").font(.largeTitle.bold())
                            Text("Recorded RaceEdge selection history.").foregroundStyle(.secondary)
                        }

                        if let p = api.performance {
                            LazyVGrid(columns:[GridItem(.flexible()),GridItem(.flexible())],spacing:10) {
                                metric("Tips", "\(p.tips)")
                                metric("Wins", "\(p.wins)")
                                metric("Strike Rate", p.strikeRate.map { "\($0, specifier: "%.1f")%" } ?? "—")
                                metric("ROI", p.roi.map { "\($0, specifier: "%.1f")%" } ?? "—")
                            }
                            if let note=p.note { Text(note).font(.caption).foregroundStyle(.secondary) }
                        }

                        Text("Recorded Results").font(.title2.bold()).padding(.top,4)
                        if api.results.isEmpty && !api.isLoading { Text("No settled RaceEdge results recorded yet.").foregroundStyle(.secondary) }
                        ForEach(api.results) { result in
                            HStack(spacing:12) {
                                ZStack {
                                    RoundedRectangle(cornerRadius:10).fill((result.result_position == 1 ? Color.raceEdgeBlue : Color.white.opacity(0.08)))
                                    Text(result.result_position == 1 ? "W" : result.result_position.map(String.init) ?? "—").font(.headline.bold()).foregroundStyle(result.result_position == 1 ? .black : .white)
                                }.frame(width:42,height:42)
                                VStack(alignment:.leading,spacing:4) {
                                    Text(result.runner).bold()
                                    Text("\(result.meeting) · Race \(result.race_no)").font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                if result.result_position == 1 { Text("WIN").font(.caption.bold()).foregroundStyle(Color.raceEdgeBlue) }
                            }.padding().background(Color.raceEdgeCard,in:RoundedRectangle(cornerRadius:16))
                        }

                        if let message=api.errorMessage { Text(message).foregroundStyle(.secondary) }
                        Text("Historical results describe recorded performance only and do not guarantee future outcomes.").font(.caption).foregroundStyle(.secondary)
                    }.padding()
                }
            }
            .navigationBarHidden(true)
            .task { if api.performance == nil && api.results.isEmpty { await api.loadResultsAndPerformance() } }
            .refreshable { await api.loadResultsAndPerformance() }
        }.preferredColorScheme(.dark)
    }

    private func metric(_ title:String,_ value:String) -> some View {
        VStack(alignment:.leading,spacing:5) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title2.bold()).foregroundStyle(Color.raceEdgeBlue)
        }.frame(maxWidth:.infinity,alignment:.leading).padding().background(Color.raceEdgeCard,in:RoundedRectangle(cornerRadius:16))
    }
}
