import SwiftUI

struct RaceDetailView: View {
    let meeting: RaceMeeting
    let raceNo: Int
    @StateObject private var api = RaceEdgeAPI()
    @State private var detail: RaceDetail?
    @State private var errorMessage: String?
    @State private var selectedTab = "Tips"
    private let tabs = ["Tips", "Form", "Analysis", "Pace Map"]

    var body: some View {
        ZStack {
            Color.raceEdgeNavy.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    raceHeader
                    tabBar
                    if let detail {
                        if detail.scratchingsChecked {
                            Label("Scratchings checked", systemImage: "checkmark.shield.fill")
                                .font(.caption.bold()).foregroundStyle(.raceEdgeBlue)
                        }
                        switch selectedTab {
                        case "Pace Map": PaceMapView(runners: detail.runners)
                        case "Form": fieldSection(detail.runners)
                        case "Analysis": analysisSection(detail)
                        default: tipsSection(detail)
                        }
                        if let note = detail.analysis?.note {
                            Text(note).font(.caption).foregroundStyle(.secondary).padding(.top, 6)
                        }
                    } else if let errorMessage {
                        Text(errorMessage).foregroundStyle(.secondary)
                    } else {
                        ProgressView().tint(.raceEdgeBlue).frame(maxWidth: .infinity).padding(.top, 40)
                    }
                }.padding()
            }
        }
        .navigationTitle("Race \(raceNo) · \(meeting.name)")
        .navigationBarTitleDisplayMode(.inline)
        .preferredColorScheme(.dark)
        .task { do { detail = try await api.loadRace(meetingID: meeting.id, raceNo: raceNo) } catch { errorMessage = "Race details are temporarily unavailable." } }
    }

    private var raceHeader: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack {
                Text("RACE \(raceNo)").font(.caption.bold()).tracking(1.5).foregroundStyle(.raceEdgeBlue)
                Spacer()
                Text(meeting.condition).font(.caption.bold()).foregroundStyle(.secondary)
            }
            Text(meeting.name).font(.largeTitle.bold())
            Text("\(meeting.state) · RaceEdge race analysis").font(.subheadline).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 18))
    }

    private var tabBar: some View {
        HStack(spacing: 6) {
            ForEach(tabs, id: \.self) { tab in
                Button {
                    withAnimation(.easeInOut(duration: 0.15)) { selectedTab = tab }
                } label: {
                    Text(tab).font(.caption.bold()).frame(maxWidth: .infinity).padding(.vertical, 10)
                        .background(selectedTab == tab ? Color.raceEdgeBlue : Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 10))
                        .foregroundStyle(selectedTab == tab ? Color.black : Color.white)
                }
            }
        }
    }

    @ViewBuilder private func tipsSection(_ detail: RaceDetail) -> some View {
        if let analysis = detail.analysis {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text("CONFIDENCE").font(.caption2.bold()).foregroundStyle(.secondary)
                    Text(analysis.confidence ?? "—").font(.title2.bold()).foregroundStyle(.raceEdgeBlue)
                }
                Spacer()
                if let value = analysis.valueSelection {
                    VStack(alignment: .trailing, spacing: 3) {
                        Text("VALUE WATCH").font(.caption2.bold()).foregroundStyle(.secondary)
                        Text("#\(value.number) \(value.name)").bold()
                    }
                }
            }.padding().background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 16))
        }

        Text("RaceEdge Selections").font(.title2.bold()).padding(.top, 2)
        if let analysis = detail.analysis, let top = analysis.topPick {
            selectionLink(top, label: "TOP PICK")
            ForEach(analysis.dangers) { runner in selectionLink(runner, label: "DANGER") }
            if let value = analysis.valueSelection,
               value.number != top.number,
               !analysis.dangers.contains(where: { $0.number == value.number }) {
                selectionLink(value, label: "VALUE")
            }
        } else {
            ForEach(Array(detail.selections.enumerated()), id: \.element.id) { index, runner in
                selectionLink(runner, label: "SELECTION \(index + 1)")
            }
        }
    }

    private func selectionLink(_ runner: RaceRunner, label: String) -> some View {
        NavigationLink(destination: RunnerDetailView(runner: runner)) {
            selectionCard(runner, label: label)
        }.buttonStyle(.plain)
    }

    private func fieldSection(_ runners: [RaceRunner]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Full Field").font(.title2.bold())
            ForEach(runners) { runner in
                NavigationLink(destination: RunnerDetailView(runner: runner)) { runnerCard(runner) }.buttonStyle(.plain)
            }
        }
    }

    private func analysisSection(_ detail: RaceDetail) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("RaceEdge Analysis", systemImage: "chart.bar.xaxis").font(.title2.bold()).foregroundStyle(.raceEdgeBlue)
            if let analysis = detail.analysis {
                metricRow("Confidence", analysis.confidence ?? "—")
                if let top = analysis.topPick { metricRow("Top Pick", "#\(top.number) \(top.name)") }
                if let value = analysis.valueSelection { metricRow("Value Selection", "#\(value.number) \(value.name)") }
                if let note = analysis.note { Text(note).font(.subheadline).foregroundStyle(.secondary) }
            } else {
                Text("Analysis is waiting for sufficient race data.").foregroundStyle(.secondary)
            }
        }.padding().background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 16))
    }

    private func selectionCard(_ runner: RaceRunner, label: String) -> some View {
        HStack(spacing: 12) {
            VStack(spacing: 2) {
                Text(label).font(.system(size: 8, weight: .black)).foregroundStyle(.raceEdgeBlue)
                Text("#\(runner.number)").font(.title.bold())
            }.frame(width: 70)
            VStack(alignment: .leading, spacing: 4) {
                Text(runner.name).font(.headline)
                HStack {
                    if let price = runner.price { Text("$\(price, specifier: "%.2f")").bold() }
                    if let barrier = runner.barrier { Text("Barrier \(barrier)") }
                }.font(.caption).foregroundStyle(.secondary)
                if let edge = runner.valueEdge { Text("Value edge \(edge, specifier: "%+.1f")%").font(.caption).foregroundStyle(.secondary) }
            }
            Spacer()
            if let rating = runner.raceEdgeRating {
                VStack(spacing: 0) { Text("\(rating)").font(.title.bold()).foregroundStyle(.raceEdgeBlue); Text("RATING").font(.system(size: 7, weight: .bold)).foregroundStyle(.secondary) }
            }
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.white, in: RoundedRectangle(cornerRadius: 16))
        .foregroundStyle(.black)
    }

    private func runnerCard(_ runner: RaceRunner) -> some View {
        HStack(spacing: 12) {
            Text("\(runner.number)").font(.headline).frame(width: 30)
            VStack(alignment: .leading, spacing: 3) {
                Text(runner.name).bold()
                HStack {
                    if let barrier = runner.barrier { Text("Barrier \(barrier)") }
                    if let price = runner.price { Text("$\(price, specifier: "%.2f")") }
                }.font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            if runner.scratched { Text("SCR").font(.caption.bold()).foregroundStyle(.red) }
            else if let rating = runner.raceEdgeRating { Text("\(rating)").font(.title3.bold()).foregroundStyle(.raceEdgeBlue) }
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(.secondary)
        }.padding().background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 14))
    }

    private func metricRow(_ title: String, _ value: String) -> some View {
        HStack { Text(title).foregroundStyle(.secondary); Spacer(); Text(value).bold() }
    }
}

struct PaceMapView: View {
    let runners: [RaceRunner]
    private var active: [RaceRunner] { runners.filter { !$0.scratched } }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text("PACE MAP").font(.caption.bold()).tracking(1.5).foregroundStyle(.raceEdgeBlue)
                    Text("Visual race shape").font(.title2.bold())
                }
                Spacer()
                Image(systemName: "flag.checkered").foregroundStyle(.raceEdgeBlue)
            }

            VStack(spacing: 0) {
                emptyLane("LEAD")
                Divider().overlay(Color.white.opacity(0.10))
                emptyLane("ON SPEED")
                Divider().overlay(Color.white.opacity(0.10))
                emptyLane("MIDFIELD / BACK")
            }
            .padding(12)
            .frame(height: 310)
            .background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 22))
            .overlay(RoundedRectangle(cornerRadius: 22).stroke(Color.white.opacity(0.12), lineWidth: 1))

            VStack(alignment: .leading, spacing: 8) {
                Text("Field").font(.headline)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(active) { runner in
                            Text("#\(runner.number) \(runner.name)")
                                .font(.caption.bold()).padding(.horizontal, 10).padding(.vertical, 7)
                                .background(Color.raceEdgeCard, in: Capsule())
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: 7) {
                Text("Pace Analysis").font(.headline)
                Text("Awaiting validated pace-position data. RaceEdge will only place runners into Lead, On Speed or Midfield/Back lanes when sufficient provider and form inputs support those positions.")
                    .font(.subheadline).foregroundStyle(.secondary)
            }.padding().background(Color.raceEdgeCard, in: RoundedRectangle(cornerRadius: 16))
        }
    }

    private func emptyLane(_ title: String) -> some View {
        VStack(spacing: 10) {
            Text(title).font(.caption2.bold()).foregroundStyle(.secondary)
            HStack(spacing: 8) {
                Image(systemName: "ellipsis.circle").foregroundStyle(.raceEdgeBlue)
                Text("Awaiting validated data").font(.caption).foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
        }.frame(maxHeight: .infinity)
    }
}
