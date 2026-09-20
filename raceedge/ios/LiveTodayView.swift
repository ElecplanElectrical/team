import SwiftUI

struct LiveTodayView: View {
    @ObservedObject var api: RaceEdgeAPI

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(colors: [.raceEdgeNavy, .black], startPoint: .top, endPoint: .bottom).ignoresSafeArea()
                Group {
                    if let live = api.liveToday, let events = live.events, !events.isEmpty {
                        let supportedEvents = events.filter { ["R", "G"].contains(($0.meeting.code ?? "").uppercased()) }
                        ScrollView {
                            LazyVStack(alignment: .leading, spacing: 14) {
                                HStack(spacing: 8) {
                                    Circle().fill(live.live ? Color.raceEdgeBlue : Color.orange).frame(width: 8, height: 8)
                                    Text(live.live ? "LIVE RACING DATA" : "LAST KNOWN RACING DATA").font(.caption.bold()).foregroundStyle(live.live ? Color.raceEdgeBlue : Color.orange)
                                    Spacer()
                                    Text("Smarter Form. Better Tips.").font(.caption2).foregroundStyle(.secondary)
                                }
                                Text("Today's Meetings").font(.title2.bold())
                                ForEach(supportedEvents) { event in
                                    VStack(alignment: .leading, spacing: 10) {
                                        HStack {
                                            Text(event.meeting.code ?? "R").font(.caption.bold()).foregroundStyle(Color.raceEdgeBlue)
                                            Text(event.meeting.name ?? "Meeting").font(.headline)
                                            Spacer()
                                            Text(event.meeting.state ?? "").font(.caption).foregroundStyle(.secondary)
                                        }
                                        if let condition = event.meeting.condition { Text(condition).font(.caption).foregroundStyle(.secondary) }
                                        ForEach(event.races) { race in
                                            NavigationLink { LiveRaceDetailView(meeting: event.meeting, race: race) } label: {
                                                HStack {
                                                    Text("R\(race.raceNo ?? 0)").fontWeight(.bold).foregroundStyle(Color.raceEdgeBlue)
                                                    VStack(alignment: .leading, spacing: 2) {
                                                        Text(race.name ?? "Race").foregroundStyle(.white)
                                                        if let distance = race.distance { Text("\(distance)m").font(.caption).foregroundStyle(.secondary) }
                                                    }
                                                    Spacer()
                                                    if let time = raceEdgeTimeText(race.startTime) { Text(time).font(.caption.bold()).foregroundStyle(.secondary) }
                                                    Image(systemName: "chevron.right").font(.caption).foregroundStyle(.secondary)
                                                }.padding(.vertical, 5)
                                            }
                                        }
                                    }
                                    .padding()
                                    .background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 16))
                                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.08)))
                                }
                                if !live.live {
                                    Label("Showing the latest stored RaceEdge snapshot while the live provider is unavailable.", systemImage: "clock.arrow.circlepath")
                                        .font(.caption).foregroundStyle(.orange)
                                        .padding().frame(maxWidth: .infinity, alignment: .leading)
                                        .background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 14))
                                }
                                if let changes = live.changes, !changes.isEmpty {
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("LATEST CHANGES & SCRATCHINGS").font(.caption.bold()).foregroundStyle(Color.raceEdgeBlue)
                                        ForEach(changes.prefix(8)) { change in
                                            HStack {
                                                Text(change.scratched ? "SCR" : (change.type ?? "CHANGE")).font(.caption.bold()).foregroundStyle(change.scratched ? .red : Color.raceEdgeBlue)
                                                Text(change.runnerName ?? "Runner")
                                                Spacer()
                                                if let raceNo = change.raceNo { Text("R\(raceNo)").foregroundStyle(.secondary) }
                                            }
                                        }
                                    }.padding().background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 16))
                                }
                                Text(live.disclaimer ?? "RaceEdge ratings are analytical estimates, not guaranteed outcomes.").font(.caption).foregroundStyle(.secondary)
                            }.padding()
                        }.refreshable { await api.loadHome() }
                    } else { HomeView(api: api) }
                }
            }
            .navigationTitle("RACEEDGE")
        }
    }
}
