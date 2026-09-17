import SwiftUI

struct HomeView: View {
    @ObservedObject var api: RaceEdgeAPI
    init(api: RaceEdgeAPI = RaceEdgeAPI()) { self.api = api }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.raceEdgeNavy.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("RACEEDGE").font(.largeTitle.bold())
                            Text("Smarter form. Better decisions.").foregroundStyle(.secondary)
                        }

                        if let home = api.home {
                            sectionTitle("Today's Meetings", subtitle: "Next races")
                            ForEach(home.meetings) { meeting in
                                NavigationLink { RaceDetailView(meeting: meeting, raceNo: meeting.nextRace) } label: {
                                    HStack(spacing: 12) {
                                        ZStack {
                                            RoundedRectangle(cornerRadius: 10).fill(Color.raceEdgeBlue.opacity(0.16))
                                            Text(meeting.code).font(.headline.bold()).foregroundStyle(.raceEdgeBlue)
                                        }.frame(width: 42, height: 42)
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text(meeting.name).font(.headline).foregroundStyle(.white)
                                            Text("\(meeting.state) · \(meeting.condition)").font(.caption).foregroundStyle(.secondary)
                                        }
                                        Spacer()
                                        VStack(alignment: .trailing, spacing: 3) {
                                            Text("R\(meeting.nextRace)").bold().foregroundStyle(.raceEdgeBlue)
                                            Text(meeting.nextTime).font(.caption).foregroundStyle(.secondary)
                                        }
                                        Image(systemName: "chevron.right").font(.caption).foregroundStyle(.secondary)
                                    }
                                    .padding()
                                    .background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 16))
                                }.buttonStyle(.plain)
                            }

                            sectionTitle("RaceEdge Top 3", subtitle: "Current selections").padding(.top, 4)
                            ForEach(home.tips) { tip in
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Text((tip.label ?? "RACEEDGE").uppercased()).font(.caption2.bold()).tracking(1).foregroundStyle(.raceEdgeBlue)
                                        Spacer()
                                        if let score = tip.score { Text("\(score, specifier: "%.0f")").font(.title2.bold()).foregroundStyle(.raceEdgeBlue) }
                                    }
                                    HStack {
                                        Text("#\(tip.number ?? 0) \(tip.runner)").font(.headline)
                                        Spacer()
                                        if let price = tip.price { Text("$\(price, specifier: "%.2f")").bold() }
                                    }
                                    Text("\(tip.meeting) · Race \(tip.race)").font(.caption).foregroundStyle(.secondary)
                                    if let reason = tip.reason { Text(reason).font(.footnote).foregroundStyle(.secondary) }
                                }
                                .padding()
                                .background(Color.white, in: RoundedRectangle(cornerRadius: 16))
                                .foregroundStyle(.black)
                            }

                            if let disclaimer = home.disclaimer { Text(disclaimer).font(.caption).foregroundStyle(.secondary).padding(.top, 4) }
                        } else if let message = api.errorMessage {
                            VStack(alignment: .leading, spacing: 12) {
                                Text(message).foregroundStyle(.secondary)
                                Button("Try again") { Task { await api.loadHome() } }.buttonStyle(.borderedProminent).tint(.raceEdgeBlue)
                            }
                        } else {
                            ProgressView().tint(.raceEdgeBlue).frame(maxWidth: .infinity).padding(.top, 40)
                        }
                    }.padding()
                }
            }
            .preferredColorScheme(.dark)
            .task { if api.home == nil { await api.loadHome() } }
            .refreshable { await api.loadHome() }
        }
    }

    private func sectionTitle(_ title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title).font(.title2.bold())
            Text(subtitle).font(.caption).foregroundStyle(.secondary)
        }
    }
}
