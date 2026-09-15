import SwiftUI

struct RacesView: View {
    @StateObject private var api = RaceEdgeAPI()

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                List {
                    if let meetings = api.home?.meetings {
                        ForEach(meetings) { meeting in
                            Section(meeting.name) {
                                ForEach(1...meeting.races, id: \.self) { raceNo in
                                    NavigationLink("Race \(raceNo)") {
                                        RaceDetailView(meeting: meeting, raceNo: raceNo)
                                    }
                                }
                            }
                        }
                    } else if let message = api.errorMessage {
                        Text(message).foregroundStyle(.secondary)
                    } else {
                        ProgressView()
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Races")
            .task { await api.loadHome() }
        }
        .preferredColorScheme(.dark)
    }
}
