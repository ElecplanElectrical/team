import SwiftUI

struct RaceDetailView: View {
 let meeting:RaceMeeting; let raceNo:Int
 @StateObject private var api=RaceEdgeAPI(); @State private var detail:RaceDetail?; @State private var errorMessage:String?
 var body:some View { ZStack { Color.black.ignoresSafeArea(); ScrollView { VStack(alignment:.leading,spacing:16) {
  Text("\(meeting.name) · Race \(raceNo)").font(.title.bold()); Text("\(meeting.condition) · \(meeting.state)").foregroundStyle(.secondary)
  if let detail {
   if detail.scratchingsChecked { Label("Scratchings checked",systemImage:"checkmark.shield.fill").foregroundStyle(.green) }
   if let analysis=detail.analysis {
    HStack { VStack(alignment:.leading){Text("RaceEdge confidence").font(.caption).foregroundStyle(.secondary);Text(analysis.confidence ?? "—").font(.title2.bold()).foregroundStyle(.green)};Spacer();if let value=analysis.valueSelection { VStack(alignment:.trailing){Text("Value watch").font(.caption).foregroundStyle(.secondary);Text("#\(value.number) \(value.name)").bold()} } }.padding().background(.thinMaterial,in:RoundedRectangle(cornerRadius:16))
   }
   Text("RaceEdge selections").font(.title2.bold()).padding(.top,4); ForEach(detail.selections){runner in runnerCard(runner,selection:true)}
   Text("Field").font(.title2.bold()).padding(.top,8); ForEach(detail.runners){runner in runnerCard(runner,selection:false)}
   if let note=detail.analysis?.note { Text(note).font(.caption).foregroundStyle(.secondary).padding(.top,8) }
  } else if let errorMessage { Text(errorMessage).foregroundStyle(.secondary) } else { ProgressView() }
 }.padding() } }.preferredColorScheme(.dark).task{do{detail=try await api.loadRace(meetingID:meeting.id,raceNo:raceNo)}catch{errorMessage="Race details are temporarily unavailable."}}
 }
 @ViewBuilder private func runnerCard(_ runner:RaceRunner,selection:Bool)->some View { HStack(spacing:12){Text("#\(runner.number)").font(.headline).frame(width:38);VStack(alignment:.leading,spacing:3){Text(runner.name).bold();HStack{if let barrier=runner.barrier{Text("Barrier \(barrier)")};if let price=runner.price{Text("Market $\(price,specifier:"%.2f")")}}.font(.caption).foregroundStyle(.secondary);HStack{if let fair=runner.estimatedFairPrice{Text("Fair $\(fair,specifier:"%.2f")")};if let edge=runner.valueEdge{Text("Edge \(edge,specifier:"%.1f")%")}}.font(.caption).foregroundStyle(.secondary)};Spacer();if let rating=runner.raceEdgeRating{VStack(alignment:.trailing){Text("\(rating)").font(.title2.bold()).foregroundStyle(.green);if selection,let rank=runner.rank{Text("#\(rank) pick").font(.caption).foregroundStyle(.secondary)}}}}.padding().background(.thinMaterial,in:RoundedRectangle(cornerRadius:16)) }
}
