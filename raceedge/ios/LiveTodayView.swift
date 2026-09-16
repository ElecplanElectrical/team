import SwiftUI

struct LiveTodayView: View {
    @ObservedObject var api: RaceEdgeAPI

    var body: some View {
        Group {
            if let live = api.liveToday, live.live, let events = live.events {
                ScrollView {
                    LazyVStack(spacing: 14) {
                        HStack {
                            Circle().fill(.green).frame(width: 8, height: 8)
                            Text("LIVE RACING DATA").font(.caption.bold()).foregroundStyle(.green)
                            Spacer()
                        }
                        ForEach(events) { event in
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    Text(event.meeting.code ?? "R").font(.caption.bold()).foregroundStyle(.green)
                                    Text(event.meeting.name ?? "Meeting").font(.headline)
                                    Spacer()
                                    Text(event.meeting.state ?? "").foregroundStyle(.secondary)
                                }
                                if let condition = event.meeting.condition { Text(condition).font(.caption).foregroundStyle(.secondary) }
                                ForEach(event.races) { race in
                                    HStack {
                                        Text("R\(race.raceNo ?? 0)").fontWeight(.bold)
                                        Text(race.name ?? "Race")
                                        Spacer()
                                        if let distance = race.distance { Text("\(distance)m").foregroundStyle(.secondary) }
                                    }
                                    .padding(.vertical, 5)
                                }
                            }
                            .padding()
                            .background(Color.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 16))
                        }
                        if let changes = live.changes, !changes.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("LATEST CHANGES").font(.caption.bold()).foregroundStyle(.green)
                                ForEach(changes.prefix(8)) { change in
                                    HStack {
                                        Text(change.scratched ? "SCR" : (change.type ?? "CHANGE")).font(.caption.bold())
                                        Text(change.runnerName ?? "Runner")
                                        Spacer()
                                        if let raceNo = change.raceNo { Text("R\(raceNo)").foregroundStyle(.secondary) }
                                    }
                                }
                            }.padding().background(Color.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 16))
                        }
                        Text(live.disclaimer ?? "RaceEdge ratings are analytical estimates, not guaranteed outcomes.").font(.caption).foregroundStyle(.secondary)
                    }.padding()
                }
            } else {
                HomeView(api: api)
            }
        }
        .background(Color.black.ignoresSafeArea())
    }
}
