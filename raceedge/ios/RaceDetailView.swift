import SwiftUI

struct RaceDetailView: View {
    let meeting: RaceMeeting
    let raceNo: Int
    @StateObject private var api = RaceEdgeAPI()
    @State private var detail: RaceDetail?
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("\(meeting.name) · Race \(raceNo)").font(.title.bold())
                    Text("\(meeting.condition) · \(meeting.state)").foregroundStyle(.secondary)
                    if let detail {
                        if detail.scratchingsChecked {
                            Label("Scratchings checked", systemImage: "checkmark.shield.fill").foregroundStyle(.green)
                        }
                        Text("RaceEdge selections").font(.title2.bold()).padding(.top, 4)
                        ForEach(detail.selections) { runner in
                            runnerCard(runner, selection: true)
                        }
                        Text("Field").font(.title2.bold()).padding(.top, 8)
                        ForEach(detail.runners) { runner in
                            runnerCard(runner, selection: false)
                        }
                        Text("Prototype ratings — analytical estimates only.").font(.caption).foregroundStyle(.secondary).padding(.top, 8)
                    } else if let errorMessage {
                        Text(errorMessage).foregroundStyle(.secondary)
                    } else {
                        ProgressView()
                    }
                }.padding()
            }
        }
        .preferredColorScheme(.dark)
        .task {
            do { detail = try await api.loadRace(meetingID: meeting.id, raceNo: raceNo) }
            catch { errorMessage = "Race details are temporarily unavailable." }
        }
    }

    @ViewBuilder
    private func runnerCard(_ runner: RaceRunner, selection: Bool) -> some View {
        HStack(spacing: 12) {
            Text("#\(runner.number)").font(.headline).frame(width: 38)
            VStack(alignment: .leading, spacing: 3) {
                Text(runner.name).bold()
                HStack {
                    if let barrier = runner.barrier { Text("Barrier \(barrier)") }
                    if let price = runner.price { Text("$\(price, specifier: "%.2f")") }
                }.font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            if let rating = runner.raceEdgeRating {
                VStack(alignment: .trailing) {
                    Text("\(rating)").font(.title2.bold()).foregroundStyle(.green)
                    if selection, let rank = runner.rank { Text("#\(rank) pick").font(.caption).foregroundStyle(.secondary) }
                }
            }
        }
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}
