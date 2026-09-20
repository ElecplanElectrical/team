import SwiftUI

struct RacesView: View {
    @ObservedObject var api: RaceEdgeAPI
    @State private var selectedCode = "All"
    private let filters = ["All", "R", "G"]

    private var filteredEvents: [LiveEvent] {
        let events = (api.liveToday?.events ?? []).filter { ["R", "G"].contains(($0.meeting.code ?? "").uppercased()) }
        guard selectedCode != "All" else { return events }
        return events.filter { ($0.meeting.code ?? "").uppercased() == selectedCode }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.raceEdgeNavy.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("MEETINGS").font(.caption.bold()).tracking(2).foregroundStyle(Color.raceEdgeBlue)
                            Text("Australian Racing").font(.largeTitle.bold())
                            Text("Today's meetings and race fields.").foregroundStyle(.secondary)
                        }

                        HStack(spacing: 8) {
                            ForEach(filters, id: \.self) { code in
                                Button {
                                    selectedCode = code
                                } label: {
                                    Text(label(for: code)).font(.caption.bold()).frame(maxWidth: .infinity).padding(.vertical, 10)
                                        .background(selectedCode == code ? Color.raceEdgeBlue : Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 10))
                                        .foregroundStyle(selectedCode == code ? Color.black : Color.white)
                                }
                            }
                        }

                        if !(api.liveToday?.events ?? []).isEmpty {
                            ForEach(filteredEvents) { event in
                                meetingCard(event)
                            }
                        } else if let meetings = api.home?.meetings {
                            ForEach(meetings) { meeting in
                                demoMeetingCard(meeting)
                            }
                        } else if let message = api.errorMessage {
                            Text(message).foregroundStyle(.secondary)
                        } else {
                            ProgressView().tint(Color.raceEdgeBlue).frame(maxWidth: .infinity).padding(.top, 40)
                        }
                    }
                    .padding()
                }
            }
            .navigationBarHidden(true)
            .task { if api.liveToday == nil && api.home == nil { await api.loadHome() } }
            .refreshable { await api.loadHome() }
        }
        .preferredColorScheme(.dark)
    }

    private func label(for code: String) -> String {
        switch code { case "R": return "Horses"; case "G": return "Greyhounds"; default: return "All" }
    }

    private func meetingCard(_ event: LiveEvent) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                ZStack {
                    RoundedRectangle(cornerRadius: 10).fill(Color.raceEdgeBlue.opacity(0.15))
                    Text(event.meeting.code ?? "R").font(.headline.bold()).foregroundStyle(Color.raceEdgeBlue)
                }.frame(width: 42, height: 42)
                VStack(alignment: .leading, spacing: 2) {
                    Text(event.meeting.name ?? "Meeting").font(.headline)
                    Text([event.meeting.state, event.meeting.condition].compactMap { $0 }.joined(separator: " · ")).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Text("\(event.races.count) races").font(.caption.bold()).foregroundStyle(.secondary)
            }

            ForEach(event.races) { race in
                NavigationLink { LiveRaceDetailView(meeting: event.meeting, race: race) } label: {
                    HStack {
                        Text("R\(race.raceNo ?? 0)").font(.headline.bold()).foregroundStyle(Color.raceEdgeBlue).frame(width: 40, alignment: .leading)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(race.name ?? "Race").foregroundStyle(.white)
                            if let start = raceEdgeTimeText(race.startTime) { Text(start).font(.caption2).foregroundStyle(.secondary).lineLimit(1) }
                        }
                        Spacer()
                        if let distance = race.distance { Text("\(distance)m").font(.caption.bold()).foregroundStyle(.secondary) }
                        Image(systemName: "chevron.right").font(.caption).foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 6)
                }.buttonStyle(.plain)
            }
        }
        .padding()
        .background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 18))
    }

    private func demoMeetingCard(_ meeting: RaceMeeting) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(meeting.code).font(.headline.bold()).foregroundStyle(Color.raceEdgeBlue)
                Text(meeting.name).font(.headline)
                Spacer()
                Text(meeting.state).font(.caption).foregroundStyle(.secondary)
            }
            if meeting.races > 0 {
                ForEach(1...meeting.races, id: \.self) { raceNo in
                    NavigationLink { RaceDetailView(meeting: meeting, raceNo: raceNo) } label: {
                        HStack {
                            Text("R\(raceNo)").fontWeight(.bold).foregroundStyle(Color.raceEdgeBlue)
                            Spacer()
                            Image(systemName: "chevron.right").font(.caption).foregroundStyle(.secondary)
                        }.padding(.vertical, 5)
                    }.buttonStyle(.plain)
                }
            } else {
                Text("Race list unavailable")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }.padding().background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 18))
    }
}

struct LiveRaceDetailView: View {
    let meeting: LiveMeeting
    let race: LiveRace

    var body: some View {
        ZStack {
            Color.raceEdgeNavy.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("RACE \(race.raceNo ?? 0)").font(.caption.bold()).tracking(1.5).foregroundStyle(Color.raceEdgeBlue)
                        Text(race.name ?? "Race").font(.largeTitle.bold())
                        HStack {
                            Text(meeting.name ?? "Meeting")
                            if let distance = race.distance { Text("· \(distance)m") }
                            if let condition = meeting.condition { Text("· \(condition)") }
                        }.font(.subheadline).foregroundStyle(.secondary)
                    }.padding().background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 18))

                    if race.analysisReady == true, let analysis = race.analysis, let top = analysis.topPick {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text("RACEEDGE ANALYSIS").font(.caption.bold()).tracking(1.5).foregroundStyle(Color.raceEdgeBlue)
                                Spacer()
                                if let confidence = analysis.confidence {
                                    Text(confidence.uppercased()).font(.caption.bold()).foregroundStyle(Color.raceEdgeBlue)
                                }
                            }
                            HStack {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("TOP PICK").font(.caption2.bold()).foregroundStyle(.secondary)
                                    Text("#\(top.number ?? 0) \(top.name ?? "Runner")").font(.title3.bold())
                                }
                                Spacer()
                                if let rating = top.raceEdgeRating { Text("\(rating)").font(.title.bold()).foregroundStyle(Color.raceEdgeBlue) }
                            }
                            if let value = analysis.valueSelection {
                                Text("Value: #\(value.number ?? 0) \(value.name ?? "Runner")").font(.subheadline).foregroundStyle(.secondary)
                            }
                            if let note = analysis.note { Text(note).font(.caption).foregroundStyle(.secondary) }
                        }
                        .padding()
                        .background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 16))
                    } else if let warning = race.dataWarning {
                        Text(warning).font(.caption).foregroundStyle(.secondary)
                            .padding().frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 16))
                    }

                    Text("FIELD").font(.caption.bold()).tracking(1.5).foregroundStyle(Color.raceEdgeBlue)
                    ForEach(race.runners) { runner in
                        NavigationLink { LiveRunnerDetailView(runner: runner) } label: {
                            HStack(spacing: 12) {
                                Text("#\(runner.number ?? 0)").font(.headline.bold()).frame(width: 40)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(runner.name ?? "Runner").font(.headline)
                                    HStack {
                                        if let barrier = runner.barrier { Text("Barrier / Box \(barrier)") }
                                        if let jockey = runner.jockey { Text(jockey) }
                                    }.font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                if runner.scratched == true { Text("SCR").font(.caption.bold()).foregroundStyle(.red) }
                                else {
                                    VStack(alignment: .trailing, spacing: 2) {
                                        if let price = runner.price { Text("$\(String(format: "%.2f", price))").font(.headline.bold()).foregroundStyle(Color.raceEdgeBlue) }
                                        if race.analysisReady == true, let rating = runner.raceEdgeRating { Text("RE \(rating)").font(.caption2.bold()).foregroundStyle(.secondary) }
                                    }
                                }
                                Image(systemName: "chevron.right").font(.caption).foregroundStyle(.secondary)
                            }
                            .padding()
                            .background(Color.white, in: RoundedRectangle(cornerRadius: 14))
                            .foregroundStyle(.black)
                        }.buttonStyle(.plain).disabled(runner.scratched == true)
                    }

                    Text("Live provider field data. RaceEdge ratings remain analytical estimates and are not guaranteed outcomes.")
                        .font(.caption).foregroundStyle(.secondary).padding(.top, 6)
                }.padding()
            }
        }.navigationTitle("Race \(race.raceNo ?? 0)").navigationBarTitleDisplayMode(.inline)
    }
}

struct LiveRunnerDetailView: View {
    let runner: LiveRunner
    var body: some View {
        ZStack {
            Color.raceEdgeNavy.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        ZStack { RoundedRectangle(cornerRadius: 14).fill(Color.raceEdgeBlue.opacity(0.16)); Text("#\(runner.number ?? 0)").font(.title.bold()).foregroundStyle(Color.raceEdgeBlue) }.frame(width: 64, height: 64)
                        VStack(alignment: .leading, spacing: 3) { Text(runner.name ?? "Runner").font(.title2.bold()); Text(runner.scratched == true ? "SCRATCHED" : "ACTIVE").font(.caption.bold()).foregroundStyle(runner.scratched == true ? .red : .raceEdgeBlue) }
                    }.padding().background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 18))

                    LazyVGrid(columns:[GridItem(.flexible()),GridItem(.flexible())],spacing:10) {
                        if let barrier = runner.barrier { liveMetric("Barrier / Box", "\(barrier)") }
                        if let weight = runner.weight { liveMetric("Weight", "\(String(format: "%.1f", weight))") }
                        if let price = runner.price { liveMetric("Market", "$\(String(format: "%.2f", price))") }
                        if let jockey = runner.jockey { liveMetric("Jockey / Driver", jockey) }
                        if runner.analysisReady == true, let rating = runner.raceEdgeRating { liveMetric("RaceEdge Rating", "\(rating)") }
                        if runner.analysisReady == true, let fair = runner.estimatedFairPrice { liveMetric("Fair Price", "$\(String(format: "%.2f", fair))") }
                        if runner.analysisReady == true, let probability = runner.estimatedProbability { liveMetric("Est. Probability", "\(String(format: "%.1f", probability))%") }
                        if runner.analysisReady == true, let edge = runner.valueEdge { liveMetric("Value Edge", "\(String(format: "%+.1f", edge))%") }
                    }
                    if let trainer = runner.trainer { liveMetric("Trainer", trainer) }
                }.padding()
            }
        }.navigationTitle("Runner Form").navigationBarTitleDisplayMode(.inline)
    }

    private func liveMetric(_ title:String,_ value:String) -> some View {
        VStack(alignment:.leading,spacing:5) { Text(title).font(.caption).foregroundStyle(.secondary); Text(value).font(.headline.bold()) }
            .frame(maxWidth:.infinity,alignment:.leading).padding().background(Color.white,in:RoundedRectangle(cornerRadius:14)).foregroundStyle(.black)
    }
}
