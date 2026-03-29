import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:url_launcher/url_launcher.dart';

class AppState extends ChangeNotifier {
  String baseUrl = 'http://10.0.2.2:3000';
  String passcode = '123456';
  String? eventId;
  String? eventName;

  String? bidderId;
  bool adminMode = false;
  bool loading = false;
  String? error;

  List<Map<String, dynamic>> items = [];
  List<Map<String, dynamic>> bidders = [];
  List<Map<String, dynamic>> groups = [];
  List<Map<String, dynamic>> myBids = [];
  List<Map<String, dynamic>> myGroups = [];
  List<Map<String, dynamic>> checkoutItems = [];
  List<Map<String, dynamic>> liveBidFeed = [];

  io.Socket? _socket;

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  String idOf(Map<String, dynamic> obj) => (obj['id'] ?? obj['_id'] ?? '').toString();

  Future<void> joinEvent({
    required String newBaseUrl,
    required String newPasscode,
    required bool asAdmin,
  }) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      baseUrl = newBaseUrl.trim().replaceAll(RegExp(r'/$'), '');
      passcode = newPasscode.trim();
      adminMode = asAdmin;

      final response = await http.post(
        _uri('/api/auth/join'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'passcode': passcode}),
      );

      if (response.statusCode >= 400) {
        throw Exception('Failed to join event: ${response.body}');
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      eventId = data['eventId']?.toString();
      eventName = data['eventName']?.toString() ?? 'BidFlow Event';

      await _connectSocket();
      await refreshAll();
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> registerBidder({
    required String firstName,
    required String lastName,
    required String displayName,
    String anonymityMode = 'nickname',
    String? email,
    String? phone,
  }) async {
    if (eventId == null) return;
    loading = true;
    error = null;
    notifyListeners();
    try {
      final response = await http.post(
        _uri('/api/events/$eventId/bidders'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'firstName': firstName,
          'lastName': lastName,
          'displayName': displayName,
          'anonymityMode': anonymityMode,
          'email': email,
          'phone': phone,
        }),
      );
      if (response.statusCode >= 400) {
        throw Exception('Failed to register bidder: ${response.body}');
      }
      final bidder = jsonDecode(response.body) as Map<String, dynamic>;
      bidderId = idOf(bidder);
      await _connectSocket();
      await refreshAll();
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> refreshAll() async {
    await Future.wait([
      loadItems(),
      loadBidders(),
      loadGroups(),
      loadCheckoutSummary(),
      loadMyViews(),
    ]);
  }

  Future<void> _connectSocket() async {
    if (eventId == null) return;
    _socket?.dispose();
    _socket = io.io(
      baseUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      _socket!.emit('join-auction', {'eventId': eventId, 'bidderId': bidderId});
      if (bidderId != null) {
        _socket!.emit('join:user', {'bidderId': bidderId});
      }
    });

    _socket!.on('bid:new', (data) {
      if (data is Map) {
        liveBidFeed.insert(0, Map<String, dynamic>.from(data));
        if (liveBidFeed.length > 50) liveBidFeed.removeLast();
        loadItems();
        loadGroups();
        loadMyViews();
        notifyListeners();
      }
    });

    _socket!.on('group:updated', (_) {
      loadGroups();
      loadItems();
    });

    _socket!.on('item:opened', (_) {
      loadItems();
    });
    _socket!.on('item:closed', (_) {
      loadItems();
      loadCheckoutSummary();
    });

    _socket!.connect();
  }

  Future<void> loadItems() async {
    if (eventId == null) return;
    final response = await http.get(_uri('/api/events/$eventId/items'));
    if (response.statusCode < 400) {
      final data = jsonDecode(response.body) as List<dynamic>;
      items = data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      notifyListeners();
    }
  }

  Future<void> loadBidders() async {
    if (eventId == null) return;
    final response = await http.get(_uri('/api/events/$eventId/bidders'));
    if (response.statusCode < 400) {
      final data = jsonDecode(response.body) as List<dynamic>;
      bidders = data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      notifyListeners();
    }
  }

  Future<void> loadGroups() async {
    if (eventId == null) return;
    final response = await http.get(_uri('/api/events/$eventId/groups'));
    if (response.statusCode < 400) {
      final data = jsonDecode(response.body) as List<dynamic>;
      groups = data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      notifyListeners();
    }
  }

  Future<void> loadCheckoutSummary() async {
    if (eventId == null) return;
    final response = await http.get(_uri('/api/events/$eventId/checkout/summary'));
    if (response.statusCode < 400) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final list = (data['items'] as List<dynamic>? ?? []);
      checkoutItems = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      notifyListeners();
    }
  }

  Future<void> loadMyViews() async {
    if (eventId == null || bidderId == null) return;
    final bidsResponse = await http.get(_uri('/api/events/$eventId/bidders/$bidderId/bids'));
    if (bidsResponse.statusCode < 400) {
      final payload = jsonDecode(bidsResponse.body) as Map<String, dynamic>;
      final data = payload['bids'] as List<dynamic>? ?? [];
      myBids = data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }

    final groupsResponse = await http.get(_uri('/api/events/$eventId/bidders/$bidderId/groups'));
    if (groupsResponse.statusCode < 400) {
      final payload = jsonDecode(groupsResponse.body) as Map<String, dynamic>;
      final data = payload['groups'] as List<dynamic>? ?? [];
      myGroups = data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    notifyListeners();
  }

  Future<void> placeBid(String itemId, double amount) async {
    if (eventId == null || bidderId == null) return;
    final response = await http.post(
      _uri('/api/events/$eventId/items/$itemId/bids'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'bidderId': bidderId, 'amount': amount}),
    );
    if (response.statusCode >= 400) {
      throw Exception(response.body);
    }
    await loadItems();
    await loadMyViews();
  }

  Future<void> createGroup(String itemId, String groupName, double contribution) async {
    if (eventId == null || bidderId == null) return;
    final response = await http.post(
      _uri('/api/events/$eventId/items/$itemId/groups'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'bidderId': bidderId,
        'groupName': groupName,
        'contribution': contribution,
      }),
    );
    if (response.statusCode >= 400) {
      throw Exception(response.body);
    }
    await loadGroups();
    await loadItems();
    await loadMyViews();
  }

  Future<void> joinGroupByCode(String joinCode, double contribution) async {
    if (eventId == null || bidderId == null) return;
    final response = await http.post(
      _uri('/api/events/$eventId/groups/join-by-code'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'joinCode': joinCode,
        'bidderId': bidderId,
        'contribution': contribution,
      }),
    );
    if (response.statusCode >= 400) {
      throw Exception(response.body);
    }
    await loadGroups();
    await loadItems();
    await loadMyViews();
  }

  Future<void> leaveGroup(String groupId) async {
    if (eventId == null || bidderId == null) return;
    final response = await http.post(
      _uri('/api/events/$eventId/groups/$groupId/leave'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'bidderId': bidderId}),
    );
    if (response.statusCode >= 400) {
      throw Exception(response.body);
    }
    await loadGroups();
    await loadItems();
    await loadMyViews();
  }

  Future<void> createItem({
    required String title,
    required String description,
    required double startingBid,
    String imageUrl = '',
  }) async {
    if (eventId == null) return;
    final response = await http.post(
      _uri('/api/events/$eventId/items'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'title': title,
        'description': description,
        'startingBid': startingBid,
        'imageUrl': imageUrl,
      }),
    );
    if (response.statusCode >= 400) {
      throw Exception(response.body);
    }
    await loadItems();
  }

  Future<void> openItem(String itemId) async {
    if (eventId == null) return;
    final response = await http.post(_uri('/api/events/$eventId/items/$itemId/open'));
    if (response.statusCode >= 400) throw Exception(response.body);
    await loadItems();
  }

  Future<void> closeItem(String itemId) async {
    if (eventId == null) return;
    final response = await http.post(_uri('/api/events/$eventId/items/$itemId/close'));
    if (response.statusCode >= 400) throw Exception(response.body);
    await loadItems();
    await loadCheckoutSummary();
  }

  Future<void> registerWalkIn({
    required String firstName,
    required String lastName,
    required String displayName,
    String? email,
    String? phone,
  }) async {
    if (eventId == null) return;
    final response = await http.post(
      _uri('/api/events/$eventId/bidders'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'firstName': firstName,
        'lastName': lastName,
        'displayName': displayName,
        'anonymityMode': 'real_name',
        'email': email,
        'phone': phone,
      }),
    );
    if (response.statusCode >= 400) throw Exception(response.body);
    await loadBidders();
  }

  Future<void> mergeGroups(String targetGroupId, String sourceGroupId) async {
    if (eventId == null) return;
    final response = await http.post(
      _uri('/api/events/$eventId/groups/$targetGroupId/merge'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'sourceGroupId': sourceGroupId}),
    );
    if (response.statusCode >= 400) throw Exception(response.body);
    await loadGroups();
    await loadItems();
  }

  Future<void> markPaid(String bidderIdToMark) async {
    if (eventId == null) return;
    final response = await http.post(_uri('/api/events/$eventId/checkout/bidder/$bidderIdToMark/pay'));
    if (response.statusCode >= 400) throw Exception(response.body);
    await loadBidders();
  }

  Future<void> openExportCsv() async {
    if (eventId == null) return;
    final url = Uri.parse('$baseUrl/api/events/$eventId/export/csv');
    await launchUrl(url, mode: LaunchMode.externalApplication);
  }
}
