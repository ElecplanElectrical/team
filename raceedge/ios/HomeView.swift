import SwiftUI

struct HomeView: View {
    @StateObject private var api = RaceEdgeAPI()
    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        Text("RACEEDGE").font(.largeTitle.bold()).foregroundStyle(.green)
                        Text("Smarter form. Better decisions.").foregroundStyle(.secondary)
                        if let home = api.home {
                            Text("Today's Meetings").font(.title2.bold())
                            ForEach(home.meetings) { meeting in
                                NavigationLink { RaceDetailView(meeting: meeting, raceNo: meeting.nextRace) } label: {
                                    HStack { VStack(alignment: .leading) { Text(meeting.name).font(.headline).foregroundStyle(.primary); Text("\(meeting.state) · \(meeting.condition)").foregroundStyle(.secondary) }; Spacer(); VStack(alignment: .trailing) { Text("R\(meeting.nextRace)").bold().foregroundStyle(.primary); Text(meeting.nextTime).foregroundStyle(.secondary) } }.padding().background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
                                }.buttonStyle(.plain)
                            }
                            Text("RaceEdge Top 3").font(.title2.bold()).padding(.top, 8)
                            ForEach(home.tips) { tip in
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(tip.label ?? "RACEEDGE").font(.caption.bold()).foregroundStyle(.green)
                                    HStack { Text("#\(tip.number ?? 0) \(tip.runner)").bold(); Spacer(); if let score=tip.score { Text("\(score, specifier: "%.0f")").font(.title2.bold()).foregroundStyle(.green) } }
                                    HStack { Text("\(tip.meeting) R\(tip.race)"); if let price=tip.price { Text("· $\(price, specifier: "%.2f")") } }.foregroundStyle(.secondary)
                                    if let reason=tip.reason { Text(reason).font(.footnote).foregroundStyle(.secondary) }
                                }.padding().background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
                            }
                            if let disclaimer=home.disclaimer { Text(disclaimer).font(.caption).foregroundStyle(.secondary).padding(.top,4) }
                        } else if let message=api.errorMessage { VStack(alignment:.leading,spacing:12){Text(message).foregroundStyle(.secondary);Button("Try again"){Task{await api.loadHome()}}} } else { ProgressView() }
                    }.padding()
                }
            }.preferredColorScheme(.dark).task{await api.loadHome()}.refreshable{await api.loadHome()}
        }
    }
}
