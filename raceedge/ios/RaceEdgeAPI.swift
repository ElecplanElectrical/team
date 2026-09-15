import Foundation

struct RaceEdgeHome: Codable { let updatedAt:String; let source:String?; let meetings:[RaceMeeting]; let tips:[RaceTip]; let disclaimer:String? }
struct RaceMeeting: Codable, Identifiable { let id:String; let code:String; let name:String; let state:String; let condition:String; let races:Int; let nextRace:Int; let nextTime:String; let status:String }
struct RaceTip: Codable, Identifiable { var id:String{"\(meeting)-\(race)-\(number)"}; let rank:Int?; let runner:String; let meeting:String; let race:Int; let number:Int?; let score:Double?; let price:Double?; let label:String?; let reason:String? }
struct RaceRunner: Codable, Identifiable { var id:Int{number}; let number:Int; let name:String; let barrier:Int?; let price:Double?; let scratched:Bool; let raceEdgeRating:Int?; let rank:Int?; let estimatedProbability:Double?; let estimatedFairPrice:Double?; let valueEdge:Double? }
struct RaceAnalysis: Codable { let topPick:RaceRunner?; let dangers:[RaceRunner]; let valueSelection:RaceRunner?; let confidence:String?; let note:String? }
struct RaceDetail: Codable { let meeting:RaceMeeting; let raceNo:Int; let scratchingsChecked:Bool; let runners:[RaceRunner]; let selections:[RaceRunner]; let prototype:Bool; let analysis:RaceAnalysis? }
struct PerformanceSummary: Codable { let tips:Int; let wins:Int; let places:Int; let strikeRate:Double?; let placeRate:Double?; let totalStake:Double; let totalReturn:Double; let profit:Double?; let roi:Double?; let averageRecordedPrice:Double?; let note:String? }
struct TipResult: Codable, Identifiable { let id:Int; let meeting:String; let race_no:Int; let runner:String; let score:Double?; let price:Double?; let result_position:Int?; let stake:Double?; let settled_return:Double?; let code:String?; let created_at:String? }
enum RaceEdgeAPIError: Error { case invalidResponse; case server(Int) }

@MainActor final class RaceEdgeAPI: ObservableObject {
 @Published var home:RaceEdgeHome?; @Published var errorMessage:String?; @Published var isLoading=false
 var baseURL=URL(string:"https://REPLACE-WITH-RACEEDGE-DOMAIN")!
 private func fetchJSON<T:Decodable>(_ path:String,as type:T.Type) async throws -> T { let url=baseURL.appending(path:path);let(data,response)=try await URLSession.shared.data(from:url);guard let http=response as? HTTPURLResponse else{throw RaceEdgeAPIError.invalidResponse};guard(200...299).contains(http.statusCode)else{throw RaceEdgeAPIError.server(http.statusCode)};return try JSONDecoder().decode(T.self,from:data) }
 func loadHome() async {isLoading=true;errorMessage=nil;defer{isLoading=false};do{home=try await fetchJSON("/api/v1/home",as:RaceEdgeHome.self)}catch{errorMessage="RaceEdge data is temporarily unavailable."}}
 func loadRace(meetingID:String,raceNo:Int) async throws -> RaceDetail {try await fetchJSON("/api/v1/races/\(meetingID)/\(raceNo)",as:RaceDetail.self)}
 func loadPerformance() async throws -> PerformanceSummary {try await fetchJSON("/api/v1/performance",as:PerformanceSummary.self)}
 func loadResults() async throws -> [TipResult] {try await fetchJSON("/api/v1/results",as:[TipResult].self)}
}
