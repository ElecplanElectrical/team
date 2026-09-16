import SwiftUI

struct ResultsView: View {
    @ObservedObject var api: RaceEdgeAPI

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        if let p = api.performance {
                            Text("Performance").font(.title2.bold())
                            LazyVGrid(columns:[GridItem(.flexible()),GridItem(.flexible())],spacing:12) {
                                metric("Tips", "\(p.tips)")
                                metric("Wins", "\(p.wins)")
                                metric("Strike rate", p.strikeRate.map { "\($0, specifier: "%.1f")%" } ?? "—")
                                metric("ROI", p.roi.map { "\($0, specifier: "%.1f")%" } ?? "—")
                            }
                            if let note=p.note { Text(note).font(.caption).foregroundStyle(.secondary) }
                        }

                        Text("Recorded Results").font(.title2.bold()).padding(.top,8)
                        if api.results.isEmpty && !api.isLoading {
                            Text("No settled RaceEdge results recorded yet.").foregroundStyle(.secondary)
                        }
                        ForEach(api.results) { result in
                            HStack {
                                VStack(alignment:.leading,spacing:4) {
                                    Text(result.runner).bold()
                                    Text("\(result.meeting) · Race \(result.race_no)").font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                if let position=result.result_position {
                                    Text(position == 1 ? "WIN" : "#\(position)")
                                        .font(.headline).foregroundStyle(position == 1 ? .green : .secondary)
                                }
                            }
                            .padding()
                            .background(.thinMaterial,in:RoundedRectangle(cornerRadius:16))
                        }

                        if let message=api.errorMessage { Text(message).foregroundStyle(.secondary) }
                        Text("Historical results describe recorded performance only and do not guarantee future outcomes.").font(.caption).foregroundStyle(.secondary)
                    }.padding()
                }
            }
            .navigationTitle("Results")
            .task { if api.performance == nil && api.results.isEmpty { await api.loadResultsAndPerformance() } }
            .refreshable { await api.loadResultsAndPerformance() }
        }
        .preferredColorScheme(.dark)
    }

    private func metric(_ title:String,_ value:String) -> some View {
        VStack(alignment:.leading,spacing:5) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title2.bold()).foregroundStyle(.green)
        }
        .frame(maxWidth:.infinity,alignment:.leading)
        .padding()
        .background(.thinMaterial,in:RoundedRectangle(cornerRadius:16))
    }
}
