import SwiftUI

struct RacesView: View {
    @ObservedObject var api: RaceEdgeAPI

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                List {
                    if let events = api.liveToday?.events, api.liveToday?.live == true {
                        ForEach(events) { event in
                            Section(event.meeting.name ?? "Meeting") {
                                ForEach(event.races) { race in
                                    NavigationLink {
                                        LiveRaceDetailView(meeting: event.meeting, race: race)
                                    } label: {
                                        HStack {
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text("Race \(race.raceNo ?? 0)").fontWeight(.semibold)
                                                Text(race.name ?? "Race").font(.caption).foregroundStyle(.secondary)
                                            }
                                            Spacer()
                                            if let distance = race.distance { Text("\(distance)m").foregroundStyle(.secondary) }
                                        }
                                    }
                                }
                            }
                        }
                    } else if let meetings = api.home?.meetings {
                        ForEach(meetings) { meeting in
                            Section(meeting.name) {
                                ForEach(1...meeting.races, id: \.self) { raceNo in
                                    NavigationLink("Race \(raceNo)") { RaceDetailView(meeting: meeting, raceNo: raceNo) }
                                }
                            }
                        }
                    } else if let message = api.errorMessage {
                        Text(message).foregroundStyle(.secondary)
                    } else { ProgressView() }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Races")
            .task { if api.liveToday == nil && api.home == nil { await api.loadHome() } }
            .refreshable { await api.loadHome() }
        }
        .preferredColorScheme(.dark)
    }
}

struct LiveRaceDetailView: View {
    let meeting: LiveMeeting
    let race: LiveRace

    var body: some View {
        List {
            Section {
                LabeledContent("Meeting", value: meeting.name ?? "Meeting")
                LabeledContent("Race", value: "\(race.raceNo ?? 0)")
                if let distance = race.distance { LabeledContent("Distance", value: "\(distance)m") }
                if let condition = meeting.condition { LabeledContent("Track", value: condition) }
            }
            Section("Field") {
                ForEach(race.runners) { runner in
                    NavigationLink { LiveRunnerDetailView(runner: runner) } label: {
                        HStack {
                            Text("#\(runner.number ?? 0)").fontWeight(.bold).frame(width: 36, alignment: .leading)
                            VStack(alignment: .leading) {
                                Text(runner.name ?? "Runner")
                                if runner.scratched == true { Text("SCRATCHED").font(.caption.bold()).foregroundStyle(.red) }
                            }
                            Spacer()
                            if let price = runner.price { Text("$\(price, specifier: "%.2f")").foregroundStyle(.green) }
                        }
                    }.disabled(runner.scratched == true)
                }
            }
            Section { Text("Live provider field data. RaceEdge ratings remain analytical estimates and are not guaranteed outcomes.").font(.caption).foregroundStyle(.secondary) }
        }
        .navigationTitle(race.name ?? "Race \(race.raceNo ?? 0)")
    }
}

struct LiveRunnerDetailView: View {
    let runner: LiveRunner
    var body: some View {
        List {
            Section {
                LabeledContent("Number", value: "\(runner.number ?? 0)")
                LabeledContent("Runner", value: runner.name ?? "Runner")
                if let barrier = runner.barrier { LabeledContent("Barrier / Box", value: "\(barrier)") }
                if let weight = runner.weight { LabeledContent("Weight", value: "\(weight, specifier: "%.1f")") }
                if let jockey = runner.jockey { LabeledContent("Jockey / Driver", value: jockey) }
                if let trainer = runner.trainer { LabeledContent("Trainer", value: trainer) }
                if let price = runner.price { LabeledContent("Market", value: "$\(price, specifier: "%.2f")") }
                LabeledContent("Status", value: runner.scratched == true ? "Scratched" : "Active")
            }
        }.navigationTitle(runner.name ?? "Runner")
    }
}
