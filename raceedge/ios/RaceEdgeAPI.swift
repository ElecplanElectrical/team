import Foundation

struct RaceEdgeHome: Codable {
    let updatedAt: String
    let meetings: [RaceMeeting]
    let tips: [RaceTip]
}

struct RaceMeeting: Codable, Identifiable {
    let id: String
    let code: String
    let name: String
    let state: String
    let condition: String
    let races: Int
    let nextRace: Int
    let nextTime: String
    let status: String
}

struct RaceTip: Codable, Identifiable {
    var id: String { "\(meeting)-\(race)-\(number)" }
    let rank: Int
    let runner: String
    let meeting: String
    let race: Int
    let number: Int
    let score: Int
    let price: Double
    let label: String
    let reason: String
}

@MainActor
final class RaceEdgeAPI: ObservableObject {
    @Published var home: RaceEdgeHome?
    @Published var errorMessage: String?

    // Replace with the Railway public domain after deployment.
    var baseURL = URL(string: "https://REPLACE-WITH-RACEEDGE-DOMAIN")!

    func loadHome() async {
        do {
            let url = baseURL.appending(path: "/api/v1/home")
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }
            home = try JSONDecoder().decode(RaceEdgeHome.self, from: data)
        } catch {
            errorMessage = "RaceEdge data is temporarily unavailable."
        }
    }
}
