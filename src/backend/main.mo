import OutCall "http-outcalls/outcall";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Error "mo:core/Error";

actor {
  public type ChatSessionInput = {
    title : Text;
    sourceUrl : Text;
    parsedChatJson : Text;
  };

  type ChatSession = {
    id : Nat;
    timestamp : Time.Time;
    title : Text;
    sourceUrl : Text;
    parsedChatJson : Text;
  };

  module ChatSession {
    public func compare(session1 : ChatSession, session2 : ChatSession) : Order.Order {
      Nat.compare(session1.id, session2.id);
    };
  };

  let chatSessions = Map.empty<Nat, ChatSession>();
  var nextId = 0;
  var totalExports = 0;

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func fetchUrlContent(url : Text) : async Text {
    try {
      await OutCall.httpGetRequest(url, [], transform);
    } catch (e) {
      "Failed to fetch content: " # url # ". Error: " # e.message();
    };
  };

  public shared ({ caller }) func saveChatSession(input : ChatSessionInput) : async Nat {
    let id = nextId;
    let session : ChatSession = {
      id;
      timestamp = Time.now();
      title = input.title;
      sourceUrl = input.sourceUrl;
      parsedChatJson = input.parsedChatJson;
    };
    chatSessions.add(id, session);
    nextId += 1;
    totalExports += 1;
    id;
  };

  public query ({ caller }) func getChatSession(id : Nat) : async ChatSession {
    switch (chatSessions.get(id)) {
      case (null) { Runtime.trap("Chat session not found for id: " # id.toText()) };
      case (?session) { session };
    };
  };

  public query ({ caller }) func listChatSessions() : async [ChatSession] {
    chatSessions.values().toArray().sort();
  };

  public query ({ caller }) func getTotalExports() : async Nat {
    totalExports;
  };
};
